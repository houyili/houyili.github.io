# Repository Guidelines

## Project Structure & Module Organization

This repository is a small static personal homepage intended for GitHub Pages-style hosting.

- `index.html` contains the full page content, layout, external CDN includes, and script tags.
- `assets/style-2.css` holds typography, colors, local CSS overrides, and responsive behavior. Keep presentation in CSS so the static page renders without JavaScript.
- `assets/fonts/` contains the bundled Font Awesome font files used by `assets/font-awesome.min.css`.
- `images/` stores profile, logo, favicon, and news indicator assets referenced by `index.html`.
- `slides/` currently has no tracked content; use it only for presentation assets that should be published with the site.

## Build, Test, and Development Commands

There is no package manager, bundler, or generated build output. Edit the static files directly.

- `python3 -m http.server 8000` starts a local static server from the repository root.
- `git diff --check` checks for trailing whitespace and whitespace errors before committing.
- `node --test tests/visitor-analytics.test.mjs` exercises analytics failure, retry, privacy, and duplicate-load behavior.
- `node scripts/check-analytics.mjs` checks the production integration; append `--live` after deployment to compare the public files.
- `python3 scripts/check-seo.py` validates search visibility and sitemap consistency; append `--live` after deployment to compare public files.
- `find . -maxdepth 2 -type f` gives a quick inventory of tracked-style site files when adding assets.

Preview the site at `http://localhost:8000/` after starting the server.

## Coding Style & Naming Conventions

Match the existing plain HTML/CSS/JavaScript style. Use 4-space indentation in HTML and CSS. Keep HTML attributes readable and prefer semantic `alt` text for images. Use existing class names and Bootstrap 4 utility classes before adding new CSS.

For new assets, prefer lowercase, hyphen-separated filenames such as `stepfun-logo.png`. Keep image paths relative, for example `images/profile.png` or `assets/style-2.css`.

## Testing Guidelines

Analytics tests use Node.js's built-in test runner without additional dependencies. Validate changes manually in a browser at desktop and mobile widths. Check that image paths load, external links open in a new tab when appropriate, and the responsive sidebar behavior still works around the existing `768px` and `900px` breakpoints.

When changing JavaScript, open the browser console and confirm there are no runtime errors.

For analytics changes, run the analytics tests and integration check. Follow `docs/analytics.md` for authenticated backend acceptance. A loaded script is not proof of a stored visitor record; keep that check pending until verified. Keep raw visitor exports outside this public repository.

## Commit & Pull Request Guidelines

The current history uses short messages such as `minor` and `initial homepage`; prefer a concise but more descriptive imperative subject, for example `Update publication links` or `Refresh profile copy`.

Pull requests should include a short summary, screenshots for visual changes, and the manual validation performed. Mention any changed external links, CDN dependencies, or newly added media files.

## SEO Maintenance

- Keep the page title, description, social previews, and `ProfilePage` / `Person` JSON-LD consistent with the visible biography.
- Use `Person.sameAs` only for the author's own identity/profile pages, not papers, models, or team repositories. Research belongs in the profile page's `hasPart` entries.
- Update `sitemap.xml` lastmod and the profile's `dateModified` when making significant content or structured-data changes; use the actual edit date.
- Preserve the H1/H2 hierarchy, canonical URL, and crawlable static content when editing layout.
- Keep XML and text sitemaps synchronized. A submitted sitemap is not necessarily processed successfully; inspect the Search Console report before claiming success.
- Run the search visibility check for changes to HTML, crawl configuration, structured data, or referenced assets. This test does not establish Google indexing or ranking.

## Security & Configuration Tips

Do not commit private contact details, unpublished credentials, or large unoptimized media. Keep third-party CDN URLs and integrity attributes together when updating external dependencies.
