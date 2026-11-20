# That Pixel Guy — Project Documentation

This directory contains implementation, operational, and product-reference notes for the That Pixel Guy photography website.

- [Development migration safety](development-migrations.md) explains the deliberately development-only Prisma migration guard.
- [Production release prerequisites](production-release.md) documents the required environment configuration, migration separation, backup, rollback, and smoke-test procedure.
- `reference/` contains source material supplied for the project.
- `dependencies/` records approved packages and external services.
- `tasks/` contains historical planning material and owner follow-ups; it is not the current implementation contract.

## Current architecture

The application uses Next.js 16, TypeScript, Prisma 7, Neon PostgreSQL, Firebase Authentication/Firebase Admin, and Cloudinary. The protected photographer dashboard manages persisted client, shoot, gallery, and photo metadata. `GalleryPhoto` provides gallery membership and per-gallery ordering. Public business/contact/social settings and homepage copy are revisioned singleton records.

```text
Client -> Shoot -> Photo
                 -> Gallery -> GalleryPhoto -> Photo
```

Private shoot and gallery media are authenticated Cloudinary assets. Public marketing pages must use approved public assets only; they must not fetch or display private client-gallery media. The simulated client demo is development-only and not production client authentication.

See [the supplied development brief](reference/Photography_Webpage_MVP_Codex_Dev_Doc.docx) for original product context.
