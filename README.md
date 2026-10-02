# That Pixel Guy — Photography MVP

A premium photography client-experience MVP for **That Pixel Guy**. The app includes a public portfolio, integrated photographer Admin area, and a simulated client-gallery access layer.

## Run locally

Requires Node.js 22+ and npm.

```bash
npm install
npm run dev -- --webpack
```

Open the local URL printed by Next.js. Use the webpack flag in this environment because Turbopack cannot start its CSS worker under the managed sandbox.

## Quality checks

```bash
npm run lint
npm run build -- --webpack
```

## Demo routes

- `/` — public website
- `/portfolio`, `/services`, `/about`, `/journal`, `/contact` — public content routes
- `/admin` — integrated photographer dashboard
- `/admin/site` — session-only homepage editor demonstration
- `/client-login` — choose a demo client
- `/client` — restricted client area

The client demo uses a short-lived HttpOnly cookie. It is only an MVP authorization simulation; it is not production authentication.

## Assets

Brand files are stored in [`public/brand`](public/brand). Curated, approved That Pixel Guy photography is stored in [`public/images`](public/images). Unsplash placeholders remain only for content types not represented by the approved export; do not add unapproved stock images as replacements.

When the approved source export arrives, organize images as follows:

```text
public/images/
  portfolio/
    graduations/
    portraits/
    events/
  journal/
  demo-galleries/
    client-a/
    client-b/
  frame-studio/rooms/
```

See [`documentation/tasks/MVP_TASKS.md`](documentation/tasks/MVP_TASKS.md) for curation and owner tasks.

## Firebase and GitHub delivery

The intended deployment path is **Firebase App Hosting** connected to this GitHub repository. Do not commit Firebase credentials, service-account keys, or `.env` files. The Firebase project, billing/region choice, and App Hosting connection remain owner tasks.

## MVP boundary

This MVP intentionally uses TypeScript domain types, repository interfaces, and mock/session state only.

Do **not** introduce a production database, Prisma, SQL, migrations, Firestore, Firebase Authentication, payment gateway, production media storage, or external CMS without a separate approved architecture decision.

## Repository workflow

1. Keep changes focused and run the quality checks above.
2. Commit clear, small changes to `main` or a feature branch.
3. Push to GitHub.
4. After Firebase App Hosting is connected, GitHub pushes to the chosen live branch can trigger deployment.
