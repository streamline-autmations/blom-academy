# BLOM Academy

The learning platform for BLOM Cosmetics' nail art courses — video lessons, progress
tracking, and invite-based enrollment, built as an installable PWA with an optional
native app shell.

## Overview

BLOM Academy is where customers who buy a course on the main BLOM Cosmetics store go to
actually learn it. A purchase on the storefront triggers an invite (email + WhatsApp);
the customer follows the link, creates an account, and gets access to that course's
lessons here. See `INTEGRATION_CONTEXT.md` for the full purchase → invite → enrollment
flow shared with the storefront repo.

## The problem

BLOM Cosmetics sells nail-art courses through its main storefront, but a shop is the
wrong place to actually deliver video lessons, track progress, or gate content by
purchase. Customers needed a dedicated learning environment, and enrollment needed to be
automatic — no manual account creation after every sale.

## The solution

Academy is a standalone learning platform that a customer only ever reaches after buying
a course. A purchase on the storefront creates an invite token; the customer follows a
link, signs up, and is enrolled automatically. From there they get a course library,
a video player with progress tracking, bookmarks, and a certificate on completion —
installable as a PWA on desktop or mobile.

## Features

- Course lessons with a video player, progress tracking, and bookmarks
- Invite-token based enrollment: a course purchase elsewhere becomes real access here,
  with no manual account setup
- Course-completion certificates
- Supabase-backed auth (email/password, password reset)
- A lightweight internal admin screen for creating/revoking course invites
- Installable PWA (offline-capable shell, add-to-homescreen)
- Dark/light theme
- Optional native app shell via Capacitor (Android/iOS scaffolding present, not yet published)

## Live site

[blom-academy.vercel.app](https://blom-academy.vercel.app)

## Tech stack

- **Frontend:** React 18, TypeScript, Vite
- **UI:** Radix UI primitives + shadcn/ui, Tailwind CSS
- **Auth & data:** Supabase (Postgres, Row Level Security, Auth, Edge Functions)
- **Automation:** n8n (invite emails/WhatsApp — see `N8N_COURSE_INVITES.md`)
- **Deployment:** Vercel
- **Mobile shell:** Capacitor (Android/iOS)

## Architecture

```
src/
  pages/        route-level screens (Home, Explore, CourseDetail, LessonPlayer,
                 AcceptInvite/SimpleInvite, admin screens, auth screens, ...)
  components/   shared UI, including a shadcn/ui-based component set in components/ui/
  hooks/        data-fetching and auth hooks (useAuth, useCourseAccess,
                 useEnrolledCourses, useCourseInvites, ...)
  contexts/     AuthProvider — session/profile state for the whole app
  integrations/supabase  generated Supabase client + types
  lib/          Supabase client setup, invite-claim helper
supabase/
  functions/    Edge Functions (course-purchase, setup-user)
  migrations/   applied SQL migrations
```

Course access is enforced at the database layer with Row Level Security, not just in the
UI — `ProtectedRoute` / `CourseProtectedRoute` / `LessonProtectedRoute` components gate
navigation, but the real authorization boundary is Postgres RLS policies plus a small set
of `SECURITY DEFINER` RPCs (`claim_course_invite`, `enroll_user_by_id`, ...) that mediate
enrollment. See `INTEGRATION_CONTEXT.md` for how this repo talks to the separate
storefront repo.

## Engineering highlights

- **Invite-based enrollment flow**: course purchase → signed token → email/WhatsApp via
  n8n → claim → enrollment, spanning two separate codebases and two separate Supabase
  projects (documented in `INTEGRATION_CONTEXT.md`, `N8N_COURSE_INVITES.md`,
  `N8N_PURCHASE_TO_INVITE.md`).
- **Row Level Security as the actual access boundary**, not just client-side route
  guards — course content, invites, and profile data are scoped by Postgres policies.
- **PWA**: offline-capable app shell, install prompts, app shortcuts, generated via
  `vite-plugin-pwa`.
- **Supabase Edge Functions** for server-side logic that must run with elevated
  privileges (`course-purchase`, `setup-user`) rather than trusting the client.

## Screenshots

_Add screenshots of the course library, lesson player, and admin invite screen here
(e.g. `docs/screenshots/`), then reference them below:_

```markdown
![Course library](docs/screenshots/explore.png)
![Lesson player](docs/screenshots/lesson-player.png)
```

## Running locally

```bash
pnpm install
cp .env.example .env   # then fill in your own Supabase project values
pnpm dev
```

Required environment variables are documented in `.env.example`. You'll need your own
Supabase project (or access to the shared one) for auth and data to work.

## Quality checks

```bash
pnpm lint          # ESLint
pnpm exec tsc --noEmit -p tsconfig.app.json   # TypeScript
pnpm build         # production build
```

There is currently no automated test suite — the auth and invite-claim flows in
particular would benefit from integration tests, since they're the most-patched parts of
the codebase (see git history).

## Deployment

Vercel builds and deploys automatically from the `main` branch. See `DEPLOYMENT.md` for
the details.

## What I built

This is a production app for a real client (BLOM Cosmetics), covering the frontend,
Supabase schema/RLS policies, Edge Functions, and the n8n automation that ties course
purchases on a separate storefront to enrollment here. Some scaffolding (shadcn/ui
components, the Vite/Capacitor setup) came from standard generators; the auth flow,
invite-redemption logic, RLS policies, and the Shop↔Academy integration contract were
built and iterated on to fix real production issues (see commit history and
`INTEGRATION_CONTEXT.md`).

## Repo docs

- `DEPLOYMENT.md` — how changes get to production
- `INTEGRATION_CONTEXT.md` — the Shop ↔ Academy purchase/invite/enrollment contract
- `N8N_COURSE_INVITES.md`, `N8N_PURCHASE_TO_INVITE.md` — the invite-delivery automation
- `SUPABASE_MIGRATION_GUIDE.md`, `MIGRATION_CHECKLIST.md` — database migration history/process
