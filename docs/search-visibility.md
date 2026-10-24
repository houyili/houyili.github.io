# Search visibility maintenance

The canonical homepage is `https://houyili.github.io/`. The English and Chinese names identify one person; this is not a pair of translated pages, so it does not need artificial `hreflang` alternatives.

## Search Console

Use the existing URL-prefix property for the HTTPS homepage. The Google verification meta tag in `index.html` must remain in place after redesigns. Public verification tags are not account credentials.

When checking the homepage, enter its canonical URL in **URL inspection** to request fresh data. An old live-test URL can display an earlier result even after Google has indexed the page.

Distinguish these states:

- **URL is on Google / Page is indexed**: indexing is confirmed. Expand Page indexing to check Google's canonical, last crawl, and referring pages.
- **URL is available to Google**: a live fetch succeeded, but this does not establish indexing.
- **Indexing requested**: a request was accepted; it is not a guarantee of inclusion or ranking. Repeated requests do not improve queue priority.
- **Sitemap submitted successfully**: submission was accepted. The Sitemaps report must show **Success** and the expected URL count to confirm processing.

The current homepage sitemap contains one canonical HTML page. Both `sitemap.xml` and `sitemap.txt` list the same page and are advertised in `robots.txt`. The text version is an officially supported alternative for this small URL list. Keep the files synchronized; do not include previews, query-string variants, or another site's URLs.

For sitemap fetch errors, check HTTP status, robots access, XML syntax, and Google's live inspection before resubmitting. A valid public file alone does not prove Google's sitemap processor accepted it. If no site-side fault can be reproduced, record the report as pending rather than repeatedly submitting or claiming a fix.

## Identity and page content

The `WebSite`, `ProfilePage`, and `Person` nodes share stable IDs. `Person.sameAs` links to verified personal profiles: Google Scholar, ORCID, DBLP, GitHub, LinkedIn, X, and the personal blog. Keep paper/model project URLs under the research entries, not in `sameAs`.

The ORCID record links back to this homepage and the DBLP bibliography; the bibliography includes the research shown here. Only add identity links after checking that they refer to this person. Do not copy unrelated people with the same name, invent credentials, or expose internal work details for keywords.

Keep titles, descriptions, headings, and structured data consistent with visible content. Update the profile's `dateModified` and sitemap `lastmod` for actual significant changes, not every deployment or analytics update. Optional article fields should only be added when sourced accurately; a portrait must not be presented as a paper illustration.

## Verification

```sh
python3 scripts/check-seo.py
python3 scripts/check-seo.py --live
python3 scripts/sync-styles.py --check
```

The first command checks canonical URLs, verification, crawl access, identity references, paper coverage, sitemaps and local assets. The second also checks the deployed file hashes and public HTTP responses. GitHub Actions runs the local checks for relevant changes.

The page embeds its four original stylesheets, preserving order and rebasing font URLs. This removes four render-blocking fetches from the first visit; the tradeoff is a larger HTML response and no separate CSS cache for that page. Keep editing the source CSS under `assets/`, then run `python3 scripts/sync-styles.py`. CI checks that the embedded block matches the sources. Compare desktop/mobile rendering and a fresh PageSpeed run after delivery changes.

The preloaded Roboto font uses `font-display: optional`. A cold or slow connection may keep the system sans-serif font for that visit rather than replacing visible text late and shifting paragraphs. Fast and cached visits retain Roboto. Do not change this to `swap` without checking layout shift in a cold-load test.

After changing structured data, validate with Google's Rich Results Test or the Search Console live test. Keep authenticated reports/screenshots outside this public repository. Use the Performance report for clicks, impressions and query positions once it has enough data; a Lighthouse SEO score is a technical check, not a Google ranking.

Official references: [ProfilePage markup](https://developers.google.com/search/docs/appearance/structured-data/profile-page), [sitemap formats](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [sitemap troubleshooting](https://support.google.com/webmasters/answer/7451001), [recrawl requests](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).
