# Resumable Offline Downloads

- Successful files commit independently. A failure no longer discards other
  completed files in the same group or restarts the entire package on retry.
- The current release's cached manifest, verified responses and progress survive
  reloads and browser restarts. Reconnection resumes an incomplete download.
- Resource SHA-256 values bind complete files to the exported release. Wrong
  bodies and partial HTTP responses cannot count as completed downloads. Another
  release's cache is not used to satisfy the current manifest.
- A complete older package remains available until the replacement installs
  successfully. Verified offline files are not overwritten by ordinary online
  requests while a new version is downloading.
- Four concurrent requests bound memory usage. The UI exposes saved-file counts,
  a Continue Download action and automatic recovery when connectivity returns.

This is file-level resume, not HTTP byte-range resume. An interrupted individual
file is downloaded again, but previously completed files are not. Closing the
browser does not promise background downloading; reopening online resumes the
saved work. Clearing site data removes the saved progress as well.

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
