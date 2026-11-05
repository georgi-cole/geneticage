# KoleQuant Age

Read `README.md` and `CONTRIBUTING.md` before making changes. For visual work also read `DESIGN_SYSTEM.md`; the three active themes share one layout and Black Metal is the default. Edit Bulgarian copy in `design/localization/*.tsv` and regenerate with `npm run locale:build`.

Preserve the scientific formula, unit conversions, collection/eligibility gates, consent, authenticated ownership, encryption and payment entitlements unless the task explicitly requires changing them. Saved assessments are immutable snapshots; do not silently recalculate old records. Use fictional data and isolated test stores.

Run `npm run check` and `npm run build` for applicable source changes. Stop an owned Windows preview before building. DOM tests do not prove visual layout, printing, View Transitions or hosted sign-in; use a real-browser check when those paths change. Do not execute the historical browser scripts under `design/test-archive/`.

Keep runtime secrets, local databases, dependencies and build output out of Git. Append migrations rather than modifying applied migrations. GitHub PRs do not automatically deploy the Sites application; keep the hosting project identity and audience unchanged. Use a feature branch and PR; merge only when the user requests it.
