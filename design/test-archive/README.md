# Superseded browser scripts

These files are retained as historical reference, with a `.txt` suffix so neither Node test discovery nor normal development commands can execute them. They depend on an undeclared Playwright installation, an absolute Windows Chrome path, stale screen selectors and (in one script) destructive account cleanup. They are not the current test suite and must not be run against a hosted or shared database.

`npm test` runs the maintained pure/model/API/controller suites and DOM integration tests. Layout, artwork, printing and actual browser behavior need the separate visual checks documented in `design/MOBILE_APP_QA.md`; a DOM implementation does not render pixels or validate View Transitions.
