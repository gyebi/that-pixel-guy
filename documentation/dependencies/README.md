# Dependencies and Integrations

Record every proposed or approved dependency here before it is added to the application. Include its purpose, version, licence/cost considerations, and whether it runs in the browser or server.

## Current application dependencies

| Dependency | Current version/range | Purpose | Status |
| --- | --- | --- | --- |
| Next.js | 16.3.7 | Application framework | Present |
| React / React DOM | 19.2.8 | User interface | Present |
| Tailwind CSS | 4.x | Styling system | Present |
| TypeScript | 5.x | Type safety | Present |
| ESLint | 9.x | Code quality checks | Present |

## Deferred integrations

Do not add these during the MVP unless the project owner explicitly approves a separate decision:

- Production database, ORM, schema, migrations, or seed process
- Production authentication provider
- Production image/object storage or signed-media service
- Payments (Paystack, mobile money, cards)
- Transactional email, WhatsApp automation, or print-lab integration

The MVP must use mock/service-layer data and in-session demo state behind repository interfaces.

## Planned delivery platform

| Platform | Intended role | Status |
| --- | --- | --- |
| Firebase App Hosting | Host the Next.js application | Planned; configure after a Firebase project and GitHub repository are chosen |
| GitHub | Source repository and continuous-deployment connection | Planned; no remote is connected locally yet |

Firebase App Hosting is the intended deployment target because it supports Next.js and can connect to a GitHub repository for deployments. Firebase Hosting&apos;s legacy Next.js framework experiment is not the recommended onboarding path. This hosting choice does **not** authorize Firestore, Firebase Authentication, or any production persistence work during this MVP.
