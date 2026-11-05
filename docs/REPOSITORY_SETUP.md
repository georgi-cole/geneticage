# Repository readiness

Reviewed 5 November 2026 for `georgi-cole/geneticage`. PR #1 was already merged before this maintenance branch was created. The repository remains public; the hosted Sites application retains its separate owner-private audience.

## Applied GitHub settings

- `main` requires a PR, a successful up-to-date `validate` check and resolved conversations. Administrative bypass, force pushes and branch deletion are disabled. Approvals remain at zero for a single-maintainer project.
- Squash merging is enabled; merge/rebase alternatives are disabled. Merged branches are deleted automatically, and branch updating is available.
- Actions default to read-only repository permissions and cannot approve PRs. CI also declares read-only access and does not persist checkout credentials. Checkout/setup-node actions are pinned to verified commit SHAs.
- Dependabot alerts and security updates are enabled. Secret scanning and push protection were already enabled and remain so. CodeQL default setup is enabled for JavaScript/TypeScript and Actions, with its weekly schedule.
- The repository has a project description, Issues enabled, and unused Wiki/Projects features disabled.

The settings above live in GitHub, not in a workflow that can silently alter repository administration. The Dependabot schedule, CI, contributor instructions and PR/bug templates are version-controlled. Changes to those files take effect when this PR is merged.

## Maintained verification

`npm run check` runs the same copy, lint, type and behavior checks as CI. `npm run build` produces the application separately. CI also checks npm advisories at the high/critical threshold. Replaced workflow runs are cancelled automatically, and maintainers can start a run manually.

The suite covers scientific formulae and eligibility, unit conversion, collection checks, authenticated storage, ownership, consent/CSRF, encryption and tampering, saved snapshots, mocked payments/refunds/disputes, navigation, themes, readout motion and translated copy. New DOM integration tests exercise language switching without form replacement, canonical values, dynamic content/attributes, preference events and validation timing; consultation tests exercise inline errors, help-text association, focus, step navigation and retained fields. Connector schema tests cover the Zod upgrade. Inline-script serialization tests cover closing tags, quotes, separators and Bulgarian text.

The four old browser scripts were not a runnable portable suite: they used an undeclared dependency, a local Windows Chrome path, stale selectors and one destructive account-cleanup flow. They remain as `.txt` reference files under `design/test-archive/`. Automated DOM tests do not replace real-browser layout, printing, hosted identity or View Transition checks.

## Dependency review

The imported lockfile initially reported 34 affected packages: 1 critical, 15 high, 17 moderate and 1 low. Compatible framework/runtime/tool updates and a patch-only fflate override remove the high/critical findings. Versions and the lockfile are committed together; no forced audit downgrade was used. The existing sharp override is updated to its patched 0.35.5 release.

Remaining moderate findings are tracked rather than hidden:

| Dependency family | Exposure and next step |
| --- | --- |
| Drizzle Kit → old esbuild loader | Development/migration tooling. The advisory concerns esbuild's development server. Monitor upstream loader replacement; do not run this tooling as a shared public server. npm's suggested downgrade to Drizzle Kit 0.18.1 is not an appropriate automatic fix for this schema/tooling version. |
| eslint-config-next → TypeScript ESLint → minimatch | Development lint tooling. The installed parent range does not accept the patched minimatch 11 major. Monitor upstream support rather than force an untested major override or downgrade the Next lint configuration. |

The CI threshold deliberately blocks high/critical advisories while these moderate development-tool findings remain visible in npm/Dependabot. This dependency report is not a full application security audit or clinical validation.

After the lockfile refresh, npm reports 0 critical, 0 high and 12 moderate affected development packages across those two dependency families. The production-only audit reports zero findings. Local verification passed all 20 test cases/suite entries, zero-warning lint, TypeScript, read-only copy verification and the production build. The updated Vinext/Vite build emits upstream source-map/chunk warnings; the build succeeds, but these warnings should not be mistaken for a warning-free toolchain.

The initial CodeQL run also reported a weak host assertion in a payment test and JSON embedding in the active/archived theme bootstrap. The test now compares a parsed URL origin exactly. Both bootstraps use script-safe serialization, with regression tests. Theme metadata is authored constant data; this is a defense against unsafe future metadata, not a demonstrated user-controlled injection in the current themes. Default-branch alerts update after the fixes merge.

## Release decisions still owned by the project

The project has no chosen distribution license. Clinical/medical approval, final privacy/payment terms, native-app identity, real merchant/webhook verification and beta/production wording remain product release decisions recorded in `PRODUCT_RELEASE_NOTES.md`. No runtime keys, merchant settings, account records or deployment audience are changed by repository maintenance.
