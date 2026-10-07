# That Pixel Guy — Project Documentation

This folder holds the product brief and working project notes for the That Pixel Guy MVP.

- `reference/` contains source material supplied for the project.
- `dependencies/` records approved packages, external services, and the reason each is needed.
- `tasks/` contains the implementation checklist and items that need the project owner's input.

The current business name is **That Pixel Guy**. It remains centralized in application configuration for future brand changes.

## MVP boundary

The first release is a polished client-demo vertical slice for one photographer serving multiple clients. It deliberately has **no production database, Prisma, SQL, migrations, payment gateway, production media storage, or external CMS**. These decisions remain deferred until a separate architecture session.

## Approved gallery architecture

```text
Client -> Shoot -> Photo
                 -> Gallery -> GalleryPhoto -> Photo
```

Photos belong to shoots. Galleries curate and reference shoot photos through `GalleryPhoto`, which carries gallery-specific ordering and avoids duplicating a photo when it is used by multiple galleries. Photo domain records store metadata and a current image reference, not image bytes.

The eventual production design will place actual image files in dedicated image/object storage. Database persistence and storage-provider selection are intentionally deferred; the current implementation is mock repository data backed by authorized local project assets.

See [the supplied development brief](reference/Photography_Webpage_MVP_Codex_Dev_Doc.docx) and the [MVP task checklist](tasks/MVP_TASKS.md).
