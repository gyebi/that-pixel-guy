# That Pixel Guy — Photography Website

That Pixel Guy is a Next.js 16 application for a photographer's public site and protected studio administration. It uses Prisma 7 with Neon PostgreSQL, Firebase Authentication/Firebase Admin for photographer identity, persisted admin sessions, and authenticated Cloudinary media delivery.

## Current capabilities

- Public marketing pages use persisted site settings and homepage copy, with safe built-in fallbacks before their additive database migrations are available.
- `/admin` is a Firebase-protected photographer workspace with a server-enforced persisted session: 15-minute idle timeout and 8-hour absolute lifetime.
- The administrator can manage real clients, shoots, galleries, authenticated photo uploads, gallery membership, and gallery display order.
- `/admin/site` manages public business/contact/social settings and homepage text with revision-based conflict detection.
- Admin thumbnails are delivered by a protected proxy; Cloudinary originals and reusable delivery URLs are not exposed to the browser.

The simulated client-gallery demo remains a development-only visual aid. It is disabled in production, cannot authorize persisted client data, and is not a client authentication system.

## Local development

Requires Node.js 22 and npm.

```bash
npm ci
npm run dev -- --webpack
```

Create local runtime configuration from the documented variable names in [the production/release guide](documentation/production-release.md); never commit secret values. Use the webpack flag in this environment because Turbopack cannot start its CSS worker under the managed sandbox.

## Quality checks

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build -- --webpack
git diff --check
```

## Data model

```text
Client -> Shoot -> Photo
                 -> Gallery -> GalleryPhoto -> Photo
```

Photos belong to shoots and retain upload metadata. `GalleryPhoto` assigns eligible shoot photos to a gallery and maintains a gallery-specific display position. `SiteSettings` and `HomepageContent` are revisioned singleton records for public CMS content; neither relates to client galleries.

## Migration safety

Application queries use the pooled `DATABASE_URL`. The repository's Prisma migration configuration refuses to fall back to it: development migration commands require a separate direct `MIGRATION_DATABASE_URL` and an exact independently configured `MIGRATION_DEVELOPMENT_HOST`. The current workflow explicitly rejects the known production endpoint. See [development migration safety](documentation/development-migrations.md) and [production release prerequisites](documentation/production-release.md).

## Assets and media

Brand files live in [`public/brand`](public/brand), while approved public site imagery lives in [`public/images`](public/images). Private shoot and gallery images remain in authenticated Cloudinary delivery paths and must never be substituted into public marketing pages.

## Release process

GitHub Actions checks pull requests and `release/**` branches without database, Firebase, or Cloudinary credentials. It does not migrate databases or deploy. Production deployment and production migrations require the separately approved procedure in [documentation/production-release.md](documentation/production-release.md).
