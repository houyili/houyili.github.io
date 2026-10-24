# Visitor analytics operations

The homepage uses Statcounter project `13362025`. Statcounter runs the collection backend and the authenticated visitor dashboard; GitHub Pages only serves the public frontend. There is no account password, API password, visitor IP list, or private dashboard in this repository. The installation token in the loader is public by design.

## Frontend behavior

- `assets/visitor-analytics.js` runs once per document, asynchronously loading the official counter after checking the exact HTTPS production origin.
- Localhost, file previews, other domains, and production URLs with `?analytics=off` do not contact Statcounter.
- Global Privacy Control and Do Not Track preferences disable loading. No proxy or alternative tracking endpoint circumvents blocking.
- Offline visits wait for the browser's online event. Prerendered documents wait for activation.
- A definite script download failure gets one retry after 1.5 seconds. Two failures stop loading. A 12-second timeout is diagnostic only: a slow script can still execute, so retrying on timeout could double-count a visit.
- Refreshing or opening a new document is a legitimate page view. The guard prevents duplicate initialization within a document; Statcounter determines unique visitors.
- There is no fallback pixel. It would bypass the host/privacy checks on previews or double-count after an uncertain timeout. JavaScript-disabled visitors are not recorded.
- Analytics failures do not prevent the homepage, paper links, or images from working.

## Frontend checks

Run with Node.js 22 or newer; no dependency installation is required:

```sh
node --test tests/visitor-analytics.test.mjs
node scripts/check-analytics.mjs
node scripts/check-analytics.mjs --live
```

The GitHub Actions workflow runs the fault-injection tests and markup checks on relevant pushes and pull requests. Its manual option can also compare live public files with the checked-out revision. It does not read private visitor data.

In a browser, inspect the HTML root's `data-analytics-state`, `data-analytics-attempts`, and `data-analytics-version`. These contain operational status only, never IP addresses or account credentials.

| State | Meaning / action |
| --- | --- |
| `disabled-origin` / `disabled-preview` | Preview isolation is working. |
| `disabled-preference` | The visitor requested not to be tracked. |
| `waiting-network` / `waiting-activation` | No request yet; waiting for network or activation. |
| `loading` / `retry-wait` | Official script loading or one bounded retry. |
| `script-loaded` | The script finished loading. **This is not proof that a backend visit was stored.** |
| `load-timeout` | Slow request; late completion is allowed, no second hit is sent. |
| `load-failed` / `setup-failed` | Collection unavailable; inspect browser network errors/policy. The page remains usable. |
| `existing-script` | Another counter include was found. Remove the duplicate integration and re-test. |

## Backend acceptance (authenticated)

Do not declare end-to-end success until the last step is verified in the account. A logged-out dashboard is a pending check, not a successful test and not proof that collection failed.

1. Log in at [Statcounter](https://statcounter.com/) and select project `13362025`. Confirm the site is `https://houyili.github.io/`. Keep visitor reports private and use the project's Asia/Shanghai timezone when comparing timestamps.
2. Review **Project Config → Ignore Visits** before testing. A blocking cookie or excluded IP can intentionally suppress the tester. Do not add broad ISP/IP exclusions to solve a test failure. Use an ordinary unblocked browser for the test.
3. Open the real homepage once with a unique, non-sensitive marker, e.g. `?analytics_check=YYYYMMDD-HHMMSS`. Keep it open for a few seconds, then leave or close it. Do not also set `analytics=off`.
4. In **Recent Activity → Page View Activity / Visitor Activity**, find that page URL and timestamp. Confirm an IP address, the reported country/region, and the page view. Location is IP-derived and may describe a network/VPN exit rather than a person's physical location.
5. Confirm the marked page view is not duplicated by the loader. Record the observed status and timestamp privately. Avoid interpreting page views, unique visitors, and sessions as interchangeable counts.
6. Check the account's current log retention and usage quota in the dashboard. If historical raw data is needed, download logs before they expire. Keep exports outside this public checkout. Do not purchase a plan or enable public statistics as a workaround.

The authenticated dashboard and its session are separate from collection: logging out of Statcounter does not remove the public site's counter.

## Backend limitations and recovery

- Script loading, a completed network request, and a stored visitor record are different signals. Never report the first as proof of the third.
- If a marked visit is absent, check account/project selection, date/timezone, active report filters, Ignore Visits, browser tracking protection, and then network errors. Do not repeatedly refresh the homepage and inflate counts.
- Statcounter's authenticated API/MCP access depends on the project's plan. This integration requires neither API credentials nor a paid upgrade; verification uses the existing dashboard.
- Backend outages, retention/quota limits and browser blocking cannot be fixed by a GitHub Pages retry loop. Keep these cases visible as pending or unavailable rather than sending unbounded duplicate events.

Official references: [project configuration](https://secure.statcounter.com/support/manual/), [ignoring visits](https://secure.statcounter.com/support/using-statcounter/ignore-your-own-visits/), [API/MCP availability](https://api.statcounter.com/docs/mcp).
