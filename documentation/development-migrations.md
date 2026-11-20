# Development Prisma migrations

Application queries use `DATABASE_URL`, which remains the pooled runtime connection. Prisma migration commands use `MIGRATION_DATABASE_URL` only; they never fall back to `DATABASE_URL`.

Before running a migration, configure both values in protected development or CI configuration:

- `MIGRATION_DATABASE_URL`: a direct (non-pooled) PostgreSQL URL for the `pixel-guy` database on the Neon development branch.
- `MIGRATION_DEVELOPMENT_HOST`: the exact, lowercase direct Neon hostname for that already verified development endpoint.

The hostname must be obtained independently from the Neon branch configuration and stored as trusted configuration. Do not copy it from, or construct it alongside, an arbitrary migration URL. The preflight rejects missing settings, pooled URLs, unexpected database names, hosts that are not exact matches, and the known production endpoint. Production migrations remain outside this workflow and require separate approval.

Do not add credentials, connection strings, or management API keys to version control. The placeholders in [`.env.example`](../.env.example) are documentation only.
