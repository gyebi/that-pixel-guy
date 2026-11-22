# Homepage image fields migration

`20261122110000_add_homepage_image_fields` adds twelve nullable columns to
`HomepageContent`: a URL and alt-text field for the hero, three selected-work
cards, services image, and contact image.

## Production procedure

1. Take the normal production database backup and confirm the application
   release contains this migration.
2. In the approved production deployment job, run `npx prisma migrate deploy`.
   Do not use `migrate dev`, `db push`, or `migrate reset` against production.
3. Confirm `npx prisma migrate status` reports the migration as applied.
4. Deploy the application release and verify the existing homepage still uses
   its static fallback images until an administrator saves a replacement.

The migration is additive and nullable. It does not update, delete, or
overwrite `HomepageContent` records or Cloudinary assets.

## Rollback

First roll back the application release so it no longer reads the image fields.
Only if removal is necessary, take a backup of any saved homepage image URLs
and alt text, then apply a reviewed SQL migration that drops the twelve added
columns. Dropping columns discards only those replacement-image references; it
does not delete Cloudinary assets automatically.
