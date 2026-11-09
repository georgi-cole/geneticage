# GeneticAge store beta

The iOS and Android builds bundle the assessment screens and report calculations. A connection is needed for sign-in, saving, export and account deletion. This release includes automated reports and omits consultations, specialist report reviews and purchases.

## Build and sign

- Install Node 24.15 or newer in the Node 24 line, run `npm ci` and `npm ci --prefix native`, then run `npm run build:native`. In `native`, run `npx --no-install cap sync`. Both stores use `xyz.kolequant.geneticage`.
- For Android, use JDK 21 and Android SDK 36. In `native/android`, build with `gradlew :app:assembleDebug` or `gradlew :app:bundleRelease`. For a signed release, set `GENETICAGE_UPLOAD_STORE` and `GENETICAGE_UPLOAD_PASSWORD` in the build environment. The key alias is `geneticage-upload`. Increment `GENETICAGE_BUILD_NUMBER` after each uploaded bundle. On Windows, build from a short ASCII checkout path if Gradle cannot read the project path.
- The Native builds workflow compiles an unsigned iOS release using the macOS 26 runner. For an installable or uploadable build, archive and distribute the App scheme with Xcode 26 or newer using the team's Apple Distribution signing and the GeneticAge App Store Connect profile. The Apple sign-in key is for server authentication. Use separate distribution and upload credentials. [Apple upload requirements](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds)

## Account service

The store beta has its own EU D1 database and HTTPS origin. Apply the `drizzle/` migrations to that database before releasing. Run `npm run build:store-worker` before deploying with `native/wrangler.jsonc`. Keep the web preview and store beta bindings separate.

Configure the account encryption key and reviewer code as Worker secrets. Configure the Google web client, Apple Services ID and email delivery secrets documented in `.env.example` to enable each sign-in method. Register the HTTPS callback for each enabled provider on the store origin. The app opens Apple and Google sign-in in the system browser. It returns using a single-use ticket bound to the originating app session and then opens account registration and the health profile. On a cold app launch, users sign in again to retrieve saved records.

Account deletion first removes live account and health records. The server uses the encrypted Apple refresh token to revoke access for Apple accounts. Accounts created before token storage obtain a grant on their next Apple sign-in. If Apple revocation cannot complete, the app confirms deletion and gives the user Apple’s instructions to remove the app from their Apple Account. [Apple token revocation guidance](https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple)

## Review and test

- Use Account → Sign in / Create account → Store review access. Give reviewers the code privately in the store console. Review access opens a separate demo account after the reviewer confirms age eligibility and consent. Use the sample report or fictional entries. Verify age, height and weight are required and BMI is derived. Use Account → Manage saved data to export and delete the test account.
- Test Apple, Google and email separately on installed builds. Verify that new users reach the health profile, returning users open the correct account, saved data stays private, and deleted sessions lose access. Test account deletion in the app and through the public page on a browser without the app.
- Use the privacy policy and deletion pages on the store origin. The web deletion page supports the original sign-in method and a support email fallback. [Privacy policy](https://geneticage.kolequant.xyz/privacy/) · [Delete a GeneticAge account](https://geneticage.kolequant.xyz/delete-account/)
- For App Store privacy, review nickname, email address, account identifiers, stored health and fitness data, and consent records. These serve account access and the saved-assessment feature. Review linked status and purposes from the final build and enabled services. [App Privacy details](https://developer.apple.com/app-store/app-privacy-details/)
- For Google Play, review the corresponding personal and health/fitness data in Data safety. Saved assessments are optional and encrypted in transit. Describe the app's educational assessments in the Health declaration. Use the deletion page for the account-deletion URL and the private reviewer instructions for App access. [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469) · [Account deletion](https://support.google.com/googleplay/android-developer/answer/13327111) · [Health declaration](https://support.google.com/googleplay/android-developer/answer/14738291)
