# Homepage operations

Canonical site: https://houyili.github.io/. Local checks and editing conventions are in `AGENTS.md`. Keep operational evidence outside the public repository and retain only the latest useful summary.

## Portrait assets

Generate portraits from the original 3840×3072 photograph, not an existing thumbnail. The current crop is `(left: 1034, top: 300, width: 2215, height: 2560)`. Keep `images/profile-full.jpg` at that full cropped resolution for the clickable portrait. The homepage uses 1208×1396 and 360×416 WebP candidates for high-density screens; `profile.png` is the 604×698 identity image. Keep the displayed portrait size and crop unchanged when refreshing image quality, update the `srcset` width descriptors to match the actual files, and bump image URL versions to invalidate cached assets.

## Search visibility

Preserve the Google verification tag and use the existing HTTPS URL-prefix property in Search Console. Inspect the canonical URL for fresh results:

- **URL is on Google / Page is indexed** confirms indexing; check Google's canonical and crawl time.
- **URL is available to Google** confirms a live fetch, not indexing.
- **Indexing requested** and a sitemap submission confirm receipt only. Sitemaps must show **Success** and the expected URL count to establish processing. Do not repeatedly resubmit an unchanged request.

`robots.txt`, `sitemap.xml` and `sitemap.txt` describe the same single canonical homepage. Exclude previews, query variants and the error page. For sitemap errors, check HTTP status, crawl access and syntax; retain unresolved Google processing as pending when site-side checks pass. The 404 page must return HTTP 404 and link back to useful sections.

After a successful Pages build, the SEO workflow checks the deployed revision automatically. It rejects redirects, incorrect content types, indexing-blocking headers and different responses to a Googlebot user agent. A user-agent check detects filtering only; use Search Console's live test to verify Google's actual fetch and inspect its response body and headers. Also check the cached robots.txt, manual actions and security reports. A generic sitemap error without further detail does not establish a website bug or a specific Google-side cause.

Keep English/Chinese names attached to one identity; this page does not need invented language alternatives. Validate schema changes with Google's Rich Results Test or Search Console. Use Search Console's Performance report for impressions, clicks and rankings; Lighthouse scores alone establish none of these.

## Visitor analytics

Statcounter project `13362025` provides collection and the authenticated dashboard. Its public installation token is not an account credential; no private backend data belongs in this repository.

After every successful Pages build, the analytics workflow checks the deployed revision's page and loader against that build's commit. It runs the theme and analytics tests, then compares the public loader's version and content. This detects stale or missing deployed code; backend ingestion still requires the acceptance below.

The loader accepts only the exact HTTPS production origin, respects GPC/DNT and skips `?analytics=off`, local and file previews. It waits for connectivity/prerender activation, prevents duplicate initialization and retries a definite download failure once. A timeout does not trigger another hit because the first request may still complete. Keep these guards and avoid fallback pixels or tracking proxies. JavaScript-disabled or blocked visits are not recorded; collection failures must leave the page usable.

To verify backend ingestion:

1. In the authenticated dashboard, select the correct project, Asia/Shanghai timezone and date range. Review report filters and Ignore Visits without adding broad IP exclusions.
2. Visit the homepage once from an unblocked browser with a non-sensitive marker such as `?analytics_check=YYYYMMDD-HHMMSS`. Do not use `analytics=off` or repeatedly refresh.
3. Match the URL/time in Page View Activity or Visitor Activity; verify IP, reported region and absence of a duplicate hit. IP-derived location can reflect a VPN/network exit.
4. Record only the outcome privately. Check current retention/quota before relying on historical logs. Do not buy upgrades or expose public statistics as a workaround.

A logged-out dashboard or missing marked visit remains unverified. Script/network success alone does not establish storage. Check the account, filters, exclusions, browser protection and network before attributing an absent record to collection failure. Dashboard login state is separate from the public counter. API access is unnecessary for this integration.

References: [Google ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [recrawl requests](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl), [Statcounter manual](https://secure.statcounter.com/support/manual/).
