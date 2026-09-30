# That Pixel Guy MVP — Development Checklist

Source: `documentation/reference/Photography_Webpage_MVP_Codex_Dev_Doc.docx`.

## Project-owner decisions

- [ ] Confirm brand assets: final company name, logo, colours, typography, social links, WhatsApp number, contact details.
- [ ] Provide or approve photography and prepared room-scene assets suitable for a client demo.
- [ ] Provide representative service/package pricing, testimonials, FAQs, and portfolio copy.
- [ ] Confirm the demo photographer identity and the two demo-client names/shoot details.
- [ ] Schedule the separate decision session for production database, authentication, private media storage, payments, and messaging.
- [ ] Create the Firebase project and choose its billing plan/region for Firebase App Hosting.
- [ ] Create the GitHub repository, then provide its URL so it can be connected to Firebase App Hosting from the Firebase console.

## Foundation

- [x] Create the That Pixel Guy design system, responsive application shell, and navigation. Loading/error/empty states will be added with the interactive Admin and client flows.
- [ ] Add central brand and business-content configuration so the temporary name can be changed easily.
- [x] Establish initial TypeScript domain types, repository interface, and mock implementation for site content, clients, galleries, activity, and orders; do not add a database layer.
- [ ] Add fixture data: three portfolio categories, two journal posts, two separate demo clients/galleries, frame products, room scenes, one album draft, and one submitted frame request.
- [ ] Implement a simulated, centralized authorization layer that denies ambiguous or cross-client gallery access.

## Public site

- [x] Build Home, Portfolio/category, Services, About, Journal/post, Contact, and Client Login routes.
- [ ] Make public content and portfolio categories editable through the integrated Admin area.
- [ ] Add mobile-first responsive images, useful alt text, keyboard access, focus states, and reduced-motion support.

## Admin experience

- [x] Build the single-photographer Admin shell and dashboard overview.
- [ ] Add Website editor controls for hero, featured work, about, services/packages, testimonials, FAQs, contacts, social links, and CTA.
- [ ] Add portfolio and Journal management interfaces, including Journal title, cover, excerpt, body, gallery images, publishing, preview, and generated SEO defaults.
- [ ] Add demo UI flows for clients, shoots, galleries, products, orders, and settings.

## Client experience

- [x] Add a centralized simulated demo-session guard for client routes and reject cross-client gallery requests in the MVP layer.
- [ ] Build the client dashboard, gallery list, restricted gallery, and client order/history routes.
- [ ] Add responsive grid, fullscreen lightbox, gallery status/expiry, download-control UI, and selection actions.
- [ ] Add favorites, Album/Frame/Retouch selections, photo-specific comments/retouch requests, and optional comparison UI.
- [ ] Verify Client A cannot access Client B's gallery, including by directly entering its route.

## Sales workflows

- [ ] Build Album Creator: selection, title, size/style, cover image, page templates, reordering, preview, in-session save, and submit.
- [ ] Build Frame Studio: photo selection, frame/size/mat options, price updates, portrait/landscape handling, room previews, and request submission.
- [ ] Surface submitted album and frame-order activity in the Admin dashboard and client history.

## Quality and handoff

- [ ] Validate form inputs and demo-upload file type/size; treat file names and metadata as untrusted.
- [ ] Protect private media architecture from public-static-path assumptions; defer actual storage integration.
- [ ] Optimize gallery thumbnails, lazy loading, aspect-ratio reservation, and progressive loading.
- [ ] Run lint, type checking, production build, and core route/access tests.
- [ ] Replace the starter README with setup instructions, demo credentials/flows, and explicit production-integration deferrals.
