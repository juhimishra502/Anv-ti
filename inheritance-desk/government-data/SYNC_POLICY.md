# Maintaining the procedure catalogue

This package is a dated snapshot. It installs no recurring job and guarantees neither government website availability nor perpetual legal accuracy.

## Publication process

1. Maintain a source registry of official service pages, rules, circulars, gazettes and forms. Directories identify candidate sources; a directory link does not certify a complete procedure.
2. Retrieve through authorized public access or approved APIs. Use bounded requests, verified TLS and per-host limits. Do not bypass CAPTCHA, logins or certificate validation. If a source cannot be fetched, keep the last snapshot and record the failure.
3. Save the original bytes, URL, retrieval time and SHA-256. Extract/OCR into a separate candidate record. Each claim needs a page/section reference. Extracted HTML must not be rendered as trusted application HTML.
4. Compare substantive content. A page footer date, layout change or successful HTTP response is not proof that the legal procedure changed or remains correct.
5. Resolve new amendments, effective dates, scope and conflicts. A reviewer approves the change; an LLM never publishes legal requirements on its own. Directory, source-summary and complete-procedure review states remain separate.
6. Validate all references, states, matching conditions and tests. Build an immutable version and publish the entire catalogue atomically. Retain the previous version for rollback. Never rewrite source files in place during requests.
7. Find affected active cases, show what changed and request any genuinely new information. Preserve previously submitted documents, actions and evidence.

## Proposed operating schedule

- Check notices/change feeds daily where available and permitted.
- Recheck registered service pages weekly; refresh a route before its configured review due date.
- The starter uses a 30-day review interval as an operational choice, not a government-mandated interval.
- Revalidate a case-specific checklist before accepting payment or submitting a claim, even if a general source review is current.
- Do not silently move review dates forward when a fetch fails or a human review has not happened.

## Failure handling

Login-time queries read local/published data and must not wait on live government websites. On a source outage, show available source summaries with access/freshness labels. After review expiry, withhold action steps and document examples until reviewed. Keep directory links and clearly labelled background references available.

If the catalogue itself fails validation, return `catalog_unavailable` with retry/help; never invent guidance or show an empty page as success. Publication failures must leave the previous valid catalogue intact.

Never accept arbitrary fetch URLs from users. A future source-fetch service needs an explicit allowlist, redirect/destination validation, private-network protection, size limits and controlled storage. It must not crawl the directory's unverified external targets automatically.

## Known conflicts to preserve

- SEBI's January 2026 FAQ contains an older probate answer referring to section 213; the 2025 amending Act omitted that provision. The seeded securities record uses transmission routing only.
- MCD's policy has certificate terminology that needs authority/legal clarification in certain death-case branches.
- India Post's service text contains inconsistent document wording. No threshold or complete checklist is extracted into an executable rule.
- South Delhi's brief mutation page uses residence-based office wording. Confirm the property and office jurisdiction before execution.
- The DoLR directory contains missing and malformed/non-standard URLs. Their original values are preserved, but unsafe/unvalidated targets are not promoted to an application URL.
