# Deployment

## Current setup

- **Live site:** [https://blom-academy.vercel.app](https://blom-academy.vercel.app)
- **Repository:** [github.com/streamline-autmations/Blom-Academy](https://github.com/streamline-autmations/Blom-Academy)
- **Hosting:** Vercel, auto-deploying from the `main` branch on GitHub

## Deploying a change

1. Make your changes and test locally with `pnpm dev`.
2. Commit and push to `main` (or open a PR — Vercel will build a preview deployment for it).
3. Vercel picks up the push automatically, builds, and deploys. Production updates within
   1-2 minutes of a push to `main`.

```bash
git add <files>
git commit -m "Describe the change"
git push origin main
```

## Local development

```bash
pnpm install
pnpm dev        # start dev server
pnpm build      # production build
pnpm preview    # preview the production build locally
```

## Mobile (Capacitor)

The repo includes Capacitor scaffolding for a native Android/iOS shell, but no app has
been published to either store yet. Before doing a native build, sync the web build into
the native projects:

```bash
pnpm build
npx cap sync
```

## Troubleshooting

- **Build fails on Vercel:** check the build logs first; reproduce locally with `pnpm build`.
- **Changes not showing:** hard-refresh / clear the PWA's cached service worker, or wait
  for the deployment to finish (Vercel dashboard shows status).
- **Env vars:** required variables are listed in `.env.example`; missing ones will surface
  as Supabase client errors at runtime, not build time.
