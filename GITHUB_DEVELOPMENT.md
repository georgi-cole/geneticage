# GitHub development

This repository contains the KoleQuant Age source and original artwork. The initial `main` snapshot corresponds to Sites commit `11936e6542d216175f64299314515b7dbae666ab`. The first pull request imports the subsequent bilingual interface revision through Sites commit `f9e03ef5b96f0eb54fda5941ec81190d73bf9a94`.

Use Node.js 24.15+ in the 24.x line (`.nvmrc` selects 24), or Node.js 26+, and `npm ci`, then `npm run dev` for local development. Run `npm run check` and `npm run build` before a PR. The App checks workflow verifies copy generation, lint, types, model/API/controller/DOM behavior, dependency advisories and a production build. Browser verification is separate; see `design/MOBILE_APP_QA.md`.

Edit Bulgarian copy in `design/localization/*.tsv`, then run `npm run locale:build`. The generated dictionary is checked in and must match its sources; `npm run locale:check` verifies this without changing source. See [CONTRIBUTING.md](CONTRIBUTING.md) and [repository setup](docs/REPOSITORY_SETUP.md) for checks, branch rules and remaining dependency findings.

Runtime secrets, account records, local databases, installed dependencies and build output are excluded. `.env.example` documents configuration without credentials. Do not commit `.dev.vars`, environment files or exported health records. GitHub Actions needs no production secrets for its checks.

The existing application remains hosted through Sites. GitHub pushes and PR merges do not publish or change the Site audience. Hosting changes use the Sites workflow and preserve `.openai/hosting.json`. See `README.md` for scientific and storage behavior and `PRODUCT_RELEASE_NOTES.md` for the beta/production review requirements.
