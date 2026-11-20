import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { invalidatePublishedHomepageContent } from "./homepage-content-publisher-core";

export {
  homepageContentPublicPaths,
  invalidatePublishedHomepageContent,
} from "./homepage-content-publisher-core";

export function publishHomepageContent() {
  invalidatePublishedHomepageContent({ revalidateTag, revalidatePath });
}
