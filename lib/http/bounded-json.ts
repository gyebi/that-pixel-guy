export class JsonRequestError extends Error {
  constructor(
    readonly status: 400 | 413 | 415,
    message: string,
  ) {
    super(message);
  }
}

export async function readBoundedJson(
  request: Request,
  maximumBytes: number,
): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new JsonRequestError(415, "Request must use JSON.");
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const size = Number(contentLength);
    if (!Number.isSafeInteger(size) || size < 0) {
      throw new JsonRequestError(400, "Invalid request size.");
    }
    if (size > maximumBytes) {
      throw new JsonRequestError(413, "Request is too large.");
    }
  }

  if (!request.body) {
    throw new JsonRequestError(400, "Request body is required.");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      total += value.byteLength;
      if (total > maximumBytes) {
        await reader.cancel();
        throw new JsonRequestError(413, "Request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new JsonRequestError(400, "Invalid JSON request body.");
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new JsonRequestError(400, "Invalid JSON request body.");
  }
}

export async function readBoundedJsonObject(
  request: Request,
  maximumBytes: number,
): Promise<Record<string, unknown>> {
  const value = await readBoundedJson(request, maximumBytes);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new JsonRequestError(400, "Invalid request body.");
  }
  return value as Record<string, unknown>;
}
