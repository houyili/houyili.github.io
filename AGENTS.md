# Homepage maintenance

This is a static GitHub Pages homepage. Keep `main` as the only local and remote branch, and maintain only the current academic layout.

## Sources and scope

- `index.html` contains the biography, news, papers, metadata and generated inline CSS.
- `assets/homepage.css` is the single stylesheet source. Run `python3 scripts/sync-styles.py` after editing it; never edit the generated block independently.
- `assets/appearance.js` handles theme preferences; `assets/visitor-analytics.js` loads Statcounter. Keep content usable without JavaScript and analytics failures harmless.
- Preserve referenced images, responsive image candidates, the Roboto font, SVG icons and licenses, plus all linked PDFs in `slides/`. The PNG portrait belongs to the identity graph; the landscape card is for social previews. Neither is an unused duplicate.
- `_config.yml` excludes maintenance files from publication. Do not add `.nojekyll`, which bypasses those exclusions.

Use plain HTML/CSS/JavaScript, four-space HTML/CSS indentation, semantic headings and image alt text. Prefer lowercase hyphenated asset names and relative paths. There are no framework, package-manager or installation dependencies.

## Verification

```sh
python3 scripts/sync-styles.py --check
python3 scripts/check-seo.py
node --test tests/*.test.mjs
node scripts/check-analytics.mjs
git diff --check
```

For local preview, run `python3 -m http.server 8000 --bind 127.0.0.1`. After deployment, append `--live` to the SEO and analytics checks to compare public files. For layout changes, verify desktop/mobile, both themes and the 380/700/1020px breakpoints. Keep the optional font loading policy unless cold-load layout shift is rechecked. Check browser errors after JavaScript changes. Use concise imperative commit subjects; describe changed behavior, checks and visual evidence in PRs.

## Content, SEO and analytics

Preserve approved biography wording, paper links, the H1/H2 hierarchy, canonical URL and Google verification tag. Keep visible content, social metadata and the Person/ProfilePage graph consistent. `sameAs` contains verified personal identities; papers belong in `hasPart`. Update `dateModified` and sitemap `lastmod` only for significant content/schema changes, using the actual edit date. Keep both sitemaps synchronized.

Follow `docs/maintenance.md` for authenticated acceptance. A loaded analytics script is not proof of a stored visitor record, and a submitted sitemap is not proof of successful processing. Never present technical SEO scores as search rankings.

## Cleanup and privacy

Keep only final site assets and necessary maintenance files. Store verification output outside this public repository; retain a compact latest summary instead of repeated snapshots, template copies or raw operation logs. Preserve third-party license notices.

Never commit credentials, private contacts, visitor IP exports, authenticated screenshots, `.env` files or unoptimized large media. GitHub Pages exclusions do not make files private in the public Git repository.
