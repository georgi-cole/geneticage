// Only the static Pages export sets this attribute. The hosted app keeps its
// normal authenticated services and server-owned entitlements.
export const PAGES_PREVIEW=globalThis.document?.documentElement?.dataset.hosting==='pages';
export const HOSTED_APP_URL='https://kolequant-age-prototype.quartzpaddock.chatgpt.site/';
