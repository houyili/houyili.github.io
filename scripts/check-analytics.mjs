import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");
const code = await readFile(new URL("assets/visitor-analytics.js", root), "utf8");
const version = code.match(/const VERSION = "([^"]+)";/)?.[1];
const loaderPath = `assets/visitor-analytics.js?v=${version}`;

function checkMarkup(markup) {
    const loaders = [...markup.matchAll(/<script\b[^>]*\bsrc=["']([^"']*visitor-analytics\.js[^"']*)["'][^>]*>/gi)];
    assert.equal(loaders.length, 1, "Include the analytics loader exactly once.");
    assert.equal(loaders[0][1], loaderPath, "The deployed loader version does not match this revision.");
    assert.match(loaders[0][0], /\bdefer\b/, "Analytics must not block page rendering.");
    assert.doesNotMatch(markup, /(?:www\.|c\.)statcounter\.com\/(?:counter\/|\d+\/)/i,
        "Remove direct scripts and pixels that bypass origin/privacy/duplicate guards.");
    assert.match(markup, /https:\/\/statcounter\.com\/about\/legal\/#privacy/,
        "Retain the visitor analytics privacy link.");
}

assert.ok(version, "Analytics version is missing.");
assert.match(code, /const ORIGIN = "https:\/\/houyili\.github\.io";/);
assert.match(code, /const PROJECT = 13362025;/);
assert.match(code, /const SECURITY = "d2d5336d";/);
checkMarkup(html);
console.log("PASS: one deferred loader; project, origin, version and privacy link are consistent.");

if (process.argv.includes("--live")) {
    const marker = `verification-${Date.now()}`;
    const get = async url => {
        const response = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: "error" });
        assert.equal(response.status, 200, `HTTP ${response.status}: ${url}`);
        return response.text();
    };
    const [liveHtml, liveCode] = await Promise.all([
        get(`https://houyili.github.io/?analytics=off&check=${marker}`),
        get(`https://houyili.github.io/${loaderPath}&check=${marker}`)
    ]);
    checkMarkup(liveHtml);
    const hash = value => createHash("sha256").update(value).digest("hex");
    assert.equal(hash(liveCode), hash(code), "Live analytics code differs from the checked revision.");
    console.log("PASS: the live page and loader match this revision (HTTP 200, exact asset hash).");
    console.log("NOT CHECKED: script execution and backend visitor records. Complete the browser/backend acceptance in docs/analytics.md.");
}
