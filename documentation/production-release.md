# Production release prerequisites

This document describes the required review and hand-off steps for Firebase App Hosting production releases. It contains variable names only; do not put values, connection strings, service-account documents, or Cloudinary credentials in the repository.

## Runtime configuration

Configure these server-only values in the Firebase App Hosting production environment:

- `DATABASE_URL`: pooled Neon PostgreSQL runtime connection for the production `pixel-guy` database.
- `FIREBASE_PROJECT_ID`: Firebase project that owns the approved photographer account.
- `FIREBASE_ADMIN_UID`: the single approved photographer Firebase UID.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: service-account JSON only when the App Hosting runtime does not provide a suitable application-default service identity. Prefer the platform service identity where possible.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`: server-only Cloudinary authenticated-delivery and upload credentials.
- `ADMIN_TRUSTED_ORIGINS`: required in production; a comma-separated allowlist of exact canonical HTTPS browser origins for cookie-authenticated admin mutations. Use the public Firebase App Hosting `hosted.app` origin(s), not the internal Cloud Run `run.app` origin. Entries must have no whitespace, trailing slash, path, query, fragment, credentials, wildcard, duplicate, or non-HTTPS value. A malformed or duplicate configuration fails closed for every admin mutation.

The temporary `ADMIN_ORIGIN_DIAGNOSTICS` setting and associated logging were removed after the App Hosting origin mismatch was verified. Do not reintroduce request-origin logging that could expose headers, URLs, tokens, or cookies.

Set these client Firebase configuration values at build time, as `NEXT_PUBLIC_` variables are inlined by Next.js:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

`MIGRATION_DATABASE_URL` and `MIGRATION_DEVELOPMENT_HOST` are development-only migration controls. They must not be supplied to the production application runtime.

## Firebase App Hosting and GitHub

Before enabling a production trigger, identify and review the Firebase project, App Hosting backend, region, service identity, and the exact GitHub deployment branch in Firebase. No App Hosting configuration is committed in this repository, so the branch trigger cannot be inferred from source control alone. Require a protected production branch, required GitHub quality checks, and review approval before enabling automatic deployment.

The repository workflow at `.github/workflows/quality.yml` runs on pull requests and `release/**` pushes. It intentionally has read-only `contents` permission and passes no database, Firebase, or Cloudinary credentials. It does not deploy or migrate.

### Public-origin policy and domain changes

App Hosting proxies public browser requests to Cloud Run. Cloud Run can record the internal `run.app` hostname even when the browser sent the request to the App Hosting `hosted.app` hostname. Admin origin validation therefore uses `ADMIN_TRUSTED_ORIGINS` and deliberately does not use request URL, `Host`, `X-Forwarded-Host`, or `X-Forwarded-Proto` to authorize a request.

Before adding a custom domain, verify its HTTPS redirect and the exact browser origin. Add the existing App Hosting origin and the new custom-domain origin together, deploy the configuration, and test login plus every admin mutation from both origins. After DNS and user migration are complete, remove the retired origin in a separate configuration change. Do not use wildcards or a broad parent domain.

Do not treat the allowlist as complete CSRF protection: it complements `SameSite=Lax`, `Secure`, `HttpOnly` cookies, Firebase token verification, the approved Firebase UID check, and the revocable server-side session. Browsers can access a direct Cloud Run URL, but host-only cookies issued on the public App Hosting host are not sent to a different `run.app` host; direct Cloud Run requests also cannot pass this policy unless that origin is explicitly allowlisted. Keep Cloud Run ingress restricted to App Hosting where the platform supports it, avoid adding a `run.app` origin to the allowlist, and continue to require authentication and authorization for every mutation. Origin checks do not protect against XSS, compromised trusted origins, malicious browser extensions, same-origin request forgery, or non-browser clients that can supply headers; those risks require their own controls.

## Database migration procedure

The checked-in `prisma7.config.ts` is a development migration workflow. It accepts only a separately configured direct Neon development endpoint and explicitly rejects the known production endpoint. Do not use it to run production migrations and do not use `prisma db push`, `migrate reset`, or a pooled runtime URL for migrations.

For each production release that contains Prisma migrations:

1. Review the exact migration SQL and verify it is additive or otherwise explicitly approved.
2. Confirm a current restorable production backup and record the target database/branch through trusted platform configuration, without printing its credentials.
3. Use a separately approved production migration process with a direct production connection, an independently verified production target allowlist, least-privilege credentials, and an audit trail.
4. Run the approved migration before deploying code that depends on its tables.
5. Check migration status and application health after deployment.

The currently introduced migration set includes `AdminSession`, `SiteSettings`, and `HomepageContent`. `AdminSession` must exist before admin sign-in can create a persisted session. The public site has a missing-table fallback for the two CMS tables, but the admin CMS requires them; deploy the migrations first to avoid unavailable admin functionality and cached fallback content.

## Backup, rollback, and smoke tests

Before release, record the verified Neon backup/point-in-time-recovery procedure and Cloudinary retention/cleanup policy. A code rollback does not reverse an applied database migration; schema rollback needs its own reviewed, data-safe plan.

After deployment, verify with a real photographer account:

1. Public homepage and contact details render without exposing private media.
2. Firebase admin sign-in, 15-minute idle warning/expiry, explicit renewal, and logout work.
3. Client, shoot, gallery, upload, assignment, ordering, and protected thumbnail workflows work for authorized admin traffic.
4. Public production requests to `/client-login`, `/client`, and `/api/demo-auth` are blocked.
5. A CMS save appears on a subsequent public request and stale editor revisions return a conflict rather than overwriting content.

Keep Cloudinary credentials, Firebase Admin credentials, Neon URLs, session cookies, signed delivery URLs, and client media identifiers out of application logs, CI output, and support tickets.
