# Contributing

Use Node.js 24.15 or later in the 24.x line (`.nvmrc` selects 24); Node.js 26+ is also supported. Install the locked dependencies with `npm ci`.

## Development and checks

1. Run `npm run dev` to start the local preview on port 5173.
2. Run `npm run check` for generated-copy verification, zero-warning lint, TypeScript and the full automated suite.
3. Stop the preview before running `npm run build` on Windows.
4. For UI changes, check an actual browser at a small phone size and a wider viewport, both languages, all active themes and reduced motion where relevant. Record the result in the PR. DOM tests do not check visual rendering, browser printing or View Transitions.

`npm test` discovers root `test-*.mjs` suites and `tests/*.test.mjs`. It uses in-memory SQLite, a mocked payment provider and a DOM implementation; it needs no running server, external credentials, real health records or payment account. The old Windows-specific browser scripts are inactive reference files in `design/test-archive/`.

Edit translations in `design/localization/*.tsv`, run `npm run locale:build`, and commit both the source and generated dictionary. `npm run locale:check` is read-only and fails on a stale generated dictionary.

## Pull requests

Use a feature branch and a PR into `main`. The required `validate` check must pass on an up-to-date branch, and review conversations must be resolved. No external approval is required while this is a single-maintainer repository. Squash merging and automatic deletion of merged branches keep the history compact. Direct/force pushes and branch deletion are blocked on `main`, including for administrators.

Keep dependency updates and their lockfile together. Dependabot PRs are queued for squash auto-merge after the required App checks pass on the current `main` base; stale branches are updated automatically. Failed checks and merge conflicts remain open for a maintainer fix. See `docs/REPOSITORY_SETUP.md` for repository settings and remaining dependency findings.

## Runtime and release configuration

Use fictional data for examples, screenshots and public bug reports. `.env.example` documents runtime configuration. Local secrets belong in ignored `.dev.vars`; hosted secrets remain in Sites. Do not replace a key used by stored records without a migration plan.

GitHub checks do not deploy the app or change its audience. Sites publication remains a separate operation. Scientific/clinical, privacy and beta/production wording reviews are tracked in `PRODUCT_RELEASE_NOTES.md`.

For the separate static phone preview, run `npm run build:pages` and `npm run serve:pages`. Check it at `/geneticage/`, including first use, language/theme changes, assessment entry, local reports and the cloud-feature explanation. A manual **App checks** run with `publish_pages` enabled deploys only after validation succeeds. Pages deployment does not publish the Sites app or enable its account/payment services.
