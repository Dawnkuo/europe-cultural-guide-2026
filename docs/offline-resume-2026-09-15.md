# Resumable Offline Downloads

- Successful files commit independently. A failure no longer discards other
  completed files in the same group or restarts the entire package on retry.
- The current release's cached manifest, verified responses and progress survive
  reloads and browser restarts. Reconnection resumes an incomplete download.
- Resource SHA-256 values bind complete files to the exported release. Wrong
  bodies and partial HTTP responses cannot count as completed downloads. Another
  release's files can now satisfy the current manifest only after their actual
  bytes pass its SHA-256 check (cross-release increment added on 2026-09-16).
- A complete older package remains available until the replacement installs
  successfully. Verified offline files are not overwritten by ordinary online
  requests while a new version is downloading.
- Four concurrent requests bound memory usage. The UI exposes saved-file counts,
  a Continue Download action and automatic recovery when connectivity returns.

This is file-level resume, not HTTP byte-range resume. An interrupted individual
file is downloaded again, but previously completed files are not. Closing the
browser does not promise background downloading; reopening online resumes the
saved work. Clearing site data removes the saved progress as well.

## Cross-Release Incremental Updates

The worker reads only this guide's older caches with a scoped, valid manifest.
It reuses exact-URL responses whose bytes match the new release's expected hash;
different content, missing entries, partial responses and damaged files are fetched.
Legacy caches without checksum headers are also eligible after body verification.
No trust is placed in a matching URL or an old checksum header alone.

Reused and downloaded counters persist with each verified response and survive
restart. The offline panel shows both counts. The current package is complete
only when every target resource has committed; older packages remain available
until then. Removed resources are not copied, and old packages are removed on
successful activation. Incremental downloads still need temporary storage for the
replacement cache; they do not promise background downloading or byte-range resume.

Run `node scripts/qa-offline-incremental.mjs <previous-production-export>` to
install an actual prior build, switch the same server to the new export, inject
a failed module and a corrupt cached photo, restart the browser, retry, inspect
request counts and open previously unvisited photos and maps offline.

The 2026-09-16 local A-to-B browser test reused 888 entries and downloaded 189
entries (10,281,774 payload bytes), including one intentionally corrupted photo.
It verified 294 cold map/model/photo assets made no network request during the
update. Ordinary online page navigation remains network-first and may request
its visible resources separately. The counts describe this tested pair of builds,
not a fixed size or a promise for future releases.

The updated suite passed 1,283 tests. All 81 exported routes passed offline checks;
the existing interruption/browser-restart test also passed for the new revision.
Evidence: `work/offline-incremental/report.json`,
`work/offline-resume/report.json`, and `work/offline-resume-all-routes/report.json`.

## Verification

The production build passed 1,256 automated tests and all 80 route-level offline
checks. The persistent-browser experiment retained 751 completed files after an
injected server failure, 754 after a reload, 757 after closing and reopening the
browser, and 773 after a real network disconnect during downloading. Reconnection
automatically completed all 971 resources. Five previously saved route resources
were each requested only once across all retries. Mobile screenshots and the raw
experiment report are under `work/offline-resume/`.

Run `node scripts/qa-offline-resume.mjs` after `npm run build:github`. This uses an
isolated production preview and disposable browser profile; it does not change
the user's browser storage or publish the website.

The shared map review is carried forward only after verifying all non-worker
runtime files, source digests and model digests are unchanged, and every map has
fresh offline evidence. Existing geometric and touch reviews are retained as
prior evidence rather than represented as newly performed reviews.
