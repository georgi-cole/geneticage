# GitHub development

This repository contains the KoleQuant Age source and original artwork. The initial `main` snapshot corresponds to Sites commit `11936e6542d216175f64299314515b7dbae666ab`. The first pull request imports the subsequent bilingual interface revision through Sites commit `f9e03ef5b96f0eb54fda5941ec81190d73bf9a94`.

Use Node.js 24 and `npm ci`, then `npm run dev` for local development. The App checks workflow verifies copy generation, model/account/payment behavior, navigation and theme behavior, TypeScript, and a production build. Browser verification is separate; see `design/MOBILE_APP_QA.md`.

Edit Bulgarian copy in `design/localization/*.tsv`, then run `node scripts/build-locale.mjs`. The generated dictionary is checked in and must match its sources.

Runtime secrets, account records, local databases, installed dependencies and build output are excluded. `.env.example` documents configuration without credentials. Do not commit `.dev.vars`, environment files or exported health records. GitHub Actions needs no production secrets for its checks.

The existing application remains hosted through Sites. GitHub pushes and PR merges do not publish or change the Site audience. Hosting changes use the Sites workflow and preserve `.openai/hosting.json`. See `README.md` for scientific and storage behavior and `PRODUCT_RELEASE_NOTES.md` for the beta/production review requirements.
