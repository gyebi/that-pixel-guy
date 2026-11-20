import type { GalleryPhotoStore } from "@/lib/repositories/gallery-photo-repository";

const MAX_POSITION = 1_000_000;

export type PhotoAssignment = {
  photoId: string;
  position: number;
};

export class GalleryPhotoOperationError extends Error {
  constructor(
    readonly status: 400 | 404 | 409 | 503,
    message: string,
  ) {
    super(message);
  }
}

function failure(status: 400 | 404 | 409 | 503, message: string): never {
  throw new GalleryPhotoOperationError(status, message);
}

function isDatabaseConflict(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;

  return code === "P2002" || code === "P2034";
}

function rethrowDatabaseError(error: unknown): never {
  if (error instanceof GalleryPhotoOperationError) {
    throw error;
  }

  if (isDatabaseConflict(error)) {
    failure(409, "The gallery changed while saving. Refresh and try again.");
  }

  failure(503, "Gallery photographs are temporarily unavailable.");
}

function assertAssignments(assignments: PhotoAssignment[]) {
  if (assignments.length === 0) {
    failure(400, "Select at least one photograph.");
  }

  const photoIds = new Set<string>();
  const positions = new Set<number>();

  for (const assignment of assignments) {
    if (
      !Number.isSafeInteger(assignment.position) ||
      assignment.position < 0 ||
      assignment.position > MAX_POSITION
    ) {
      failure(400, "Each gallery position must be a valid non-negative integer.");
    }
    if (photoIds.has(assignment.photoId)) {
      failure(400, "Each photograph can only be selected once.");
    }
    if (positions.has(assignment.position)) {
      failure(400, "Each photograph needs a unique gallery position.");
    }
    photoIds.add(assignment.photoId);
    positions.add(assignment.position);
  }
}

function assertVisiblePhotos(
  photos: Array<{ id: string; shootId: string; status: string }>,
  assignments: PhotoAssignment[],
  shootId: string,
) {
  if (photos.length !== assignments.length) {
    failure(404, "One or more photographs were not found.");
  }

  for (const photo of photos) {
    if (photo.shootId !== shootId) {
      failure(409, "Photographs must belong to this gallery's shoot.");
    }
    if (photo.status !== "Visible") {
      failure(409, "Only visible photographs can be assigned to a gallery.");
    }
  }
}

export function createGalleryPhotoService(store: GalleryPhotoStore) {
  return {
    async assign(galleryId: string, assignments: PhotoAssignment[]) {
      assertAssignments(assignments);

      try {
        return await store.transaction(async (tx) => {
          const gallery = await tx.getGallery(galleryId);
          if (!gallery) failure(404, "Gallery not found.");

          const photoIds = assignments.map(({ photoId }) => photoId);
          const positions = assignments.map(({ position }) => position);
          const [photos, existingPhotos, existingPositions] = await Promise.all([
            tx.getPhotos(photoIds),
            tx.getMembershipsForPhotos(gallery.id, photoIds),
            tx.getMembershipsForPositions(gallery.id, positions),
          ]);

          assertVisiblePhotos(photos, assignments, gallery.shootId);
          if (existingPhotos.length > 0) {
            failure(409, "One or more photographs are already in this gallery.");
          }
          if (existingPositions.length > 0) {
            failure(409, "One or more gallery positions are already in use.");
          }

          await tx.createMemberships(
            assignments.map(({ photoId, position }) => ({
              galleryId: gallery.id,
              photoId,
              position,
            })),
          );

          return {
            memberships: assignments
              .map(({ photoId, position }) => ({ photoId, position }))
              .sort((first, second) => first.position - second.position),
          };
        });
      } catch (error) {
        rethrowDatabaseError(error);
      }
    },

    async reorder(galleryId: string, photoIds: string[]) {
      if (photoIds.length === 0) {
        failure(400, "A gallery order must include at least one photograph.");
      }
      if (new Set(photoIds).size !== photoIds.length) {
        failure(400, "Each gallery photograph can only appear once in the order.");
      }

      try {
        return await store.transaction(async (tx) => {
          const gallery = await tx.getGallery(galleryId);
          if (!gallery) failure(404, "Gallery not found.");

          const memberships = await tx.getGalleryMemberships(gallery.id);
          if (memberships.length !== photoIds.length) {
            failure(409, "The gallery changed while reordering. Refresh and try again.");
          }

          const membershipsByPhotoId = new Map(
            memberships.map((membership) => [membership.photoId, membership]),
          );
          if (photoIds.some((photoId) => !membershipsByPhotoId.has(photoId))) {
            failure(409, "The gallery changed while reordering. Refresh and try again.");
          }
          if (
            memberships.some(
              (membership) =>
                membership.position < 0 ||
                membership.position > MAX_POSITION ||
                membership.photo.status !== "Visible",
            )
          ) {
            failure(409, "The gallery contains an ineligible photograph.");
          }

          const highestPosition = Math.max(
            ...memberships.map((membership) => membership.position),
          );
          const temporaryOffset = highestPosition + memberships.length + 1;

          await tx.shiftMembershipPositions(gallery.id, temporaryOffset);
          for (const [position, photoId] of photoIds.entries()) {
            await tx.updateMembershipPosition(
              membershipsByPhotoId.get(photoId)!.id,
              position,
            );
          }

          return {
            memberships: photoIds.map((photoId, position) => ({
              photoId,
              position,
            })),
          };
        });
      } catch (error) {
        rethrowDatabaseError(error);
      }
    },
  };
}
