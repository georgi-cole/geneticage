# Repository readiness

Reviewed 5 November 2026 for `georgi-cole/geneticage`. PR #1 was already merged before this maintenance branch was created. The repository remains public; the hosted Sites application retains its separate owner-private audience.

## Applied GitHub settings

- `main` requires a PR, a successful up-to-date `validate` check and resolved conversations. Administrative bypass, force pushes and branch deletion are disabled. Approvals remain at zero for a single-maintainer project.
- Squash merging, automatic deletion of merged branches, branch updating and GitHub auto-merge are enabled; merge/rebase alternatives are disabled. The Dependabot workflow queues eligible same-repository PRs to `main` for squash auto-merge after CI succeeds.
- Actions default to read-only repository permissions and cannot approve PRs. CI also declares read-only access and does not persist checkout credentials. Checkout/setup-node actions are pinned to verified commit SHAs.
- Dependabot alerts and security updates are enabled. Secret scanning and push protection were already enabled and remain so. CodeQL default setup is enabled for JavaScript/TypeScript and Actions, with its weekly schedule.
- The repository has a project description, Issues enabled, and unused Wiki/Projects features disabled.

GitHub auto-merge is enabled explicitly in repository settings. The version-controlled `Dependabot auto-merge` workflow only reacts after the `App checks` workflow succeeds: it updates a Dependabot branch that is behind and queues squash auto-merge. It does not check out or run pull request code and does not change repository settings. Failed checks and merge conflicts stay open for maintainer action.

## Maintained verification

`npm run check` runs the same copy, lint, type and behavior checks as CI. `npm run build` produces the server application; `npm run build:pages` produces the separate static preview. CI blocks moderate, high and critical npm advisories. Replaced workflow runs are cancelled automatically, and maintainers can start a run manually.

The suite covers scientific formulae and eligibility, unit conversion, collection checks, authenticated storage, ownership, consent/CSRF, encryption and tampering, saved snapshots, mocked payments/refunds/disputes, navigation, themes, readout motion and translated copy. New DOM integration tests exercise language switching without form replacement, canonical values, dynamic content/attributes, preference events and validation timing; consultation tests exercise inline errors, help-text association, focus, step navigation and retained fields. Connector schema tests cover the Zod upgrade. Inline-script serialization tests cover closing tags, quotes, separators and Bulgarian text.

The four old browser scripts were not a runnable portable suite: they used an undeclared dependency, a local Windows Chrome path, stale selectors and one destructive account-cleanup flow. They remain as `.txt` reference files under `design/test-archive/`. Automated DOM tests do not replace real-browser layout, printing, hosted identity or View Transition checks.

## Dependency review

The imported lockfile initially reported 34 affected packages: 1 critical, 15 high, 17 moderate and 1 low. Compatible framework/runtime/tool updates and a patch-only fflate override remove the high/critical findings. Versions and the lockfile are committed together; no forced audit downgrade was used. The existing sharp override is updated to its patched 0.35.5 release.

The follow-up dependency patch removes the remaining 12 moderate affected packages through two scoped overrides, without downgrading the parent tools:

| Dependency family | Exposure and next step |
| --- | --- |
| Drizzle Kit → old esbuild loader | `@esbuild-kit/core-utils` resolves to esbuild 0.28.2. The unrelated-origin response no longer grants CORS access; normal file serving and loader transforms remain functional. The actual Drizzle config/schema export is byte-for-byte unchanged. Drizzle's independent esbuild 0.25.12 is already patched. |
| eslint-config-next → TypeScript ESLint → minimatch | Only `@typescript-eslint/typescript-estree@8.72.1` resolves to minimatch 11.0.4. Bounded adversarial expansion, ordinary globs, dotfiles, Windows paths and the actual parser's default-project allow/deny behavior are checked. Other callers retain their existing compatible minimatch versions. |

Focused regression tests live in `tests/dependency-compat.test.mjs`. A fresh read-only compatibility investigation and candidate review accompany the patch. Stable parent releases do not yet remove these transitive versions; re-evaluate and remove each override when upstream adopts a patched compatible range. Keep the lockfile and compatibility checks together. This dependency report is not a full application security audit or clinical validation.

The full npm audit now reports zero findings at every severity, as does the production-only audit. GitHub's default-branch alerts update after the dependency PR is merged. The Vinext/Vite server build can emit upstream source-map/chunk warnings; these are separate from npm security advisories.

The initial CodeQL run also reported a weak host assertion in a payment test and JSON embedding in the active/archived theme bootstrap. The test now compares a parsed URL origin exactly. Both bootstraps use script-safe serialization, with regression tests. Theme metadata is authored constant data; this is a defense against unsafe future metadata, not a demonstrated user-controlled injection in the current themes. Default-branch alerts update after the fixes merge.

## Release decisions still owned by the project

The project has no chosen distribution license. Clinical/medical approval, final privacy/payment terms, native-app identity, real merchant/webhook verification and beta/production wording remain product release decisions recorded in `PRODUCT_RELEASE_NOTES.md`. No runtime keys, merchant settings, account records or deployment audience are changed by repository maintenance.
