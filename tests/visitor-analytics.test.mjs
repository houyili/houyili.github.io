import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/visitor-analytics.js", import.meta.url), "utf8");
const counterURL = "https://www.statcounter.com/counter/counter.js";

function environment(options = {}) {
    let now = 0;
    let nextTimer = 0;
    const timers = new Map();
    const listeners = new Map();
    const scripts = [];
    const inserted = [];
    const url = new URL(options.url || "https://houyili.github.io/");
    const navigator = { onLine: true, ...options.navigator };

    function addEventListener(name, callback, settings = {}) {
        const entries = listeners.get(name) || [];
        entries.push({ callback, once: settings.once });
        listeners.set(name, entries);
    }

    function emit(name) {
        const entries = listeners.get(name) || [];
        listeners.set(name, entries.filter(entry => !entry.once));
        entries.forEach(entry => entry.callback());
    }

    const document = {
        documentElement: { dataset: {} },
        scripts,
        prerendering: Boolean(options.prerendering),
        addEventListener,
        head: {
            appendChild(script) {
                if (options.appendFails) {
                    throw new Error("Simulated browser policy failure");
                }
                scripts.push(script);
                inserted.push(script);
            }
        },
        createElement(tag) {
            assert.equal(tag, "script");
            const script = {
                remove() {
                    const index = scripts.indexOf(script);
                    if (index !== -1) scripts.splice(index, 1);
                }
            };
            return script;
        }
    };
    const window = {
        location: { origin: url.origin, href: url.href, search: url.search },
        addEventListener,
        setTimeout(callback, delay) {
            const id = ++nextTimer;
            timers.set(id, { callback, at: now + delay });
            return id;
        },
        clearTimeout(id) { timers.delete(id); }
    };
    const context = vm.createContext({ window, document, navigator, URL, URLSearchParams });
    const run = () => vm.runInContext(source, context);
    const advance = milliseconds => {
        const target = now + milliseconds;
        while (true) {
            const next = [...timers].filter(([, t]) => t.at <= target)
                .sort((a, b) => a[1].at - b[1].at)[0];
            if (!next) break;
            now = next[1].at;
            timers.delete(next[0]);
            next[1].callback();
        }
        now = target;
    };
    return { window, document, navigator, scripts, inserted, timers, run, advance, emit,
        state: () => document.documentElement.dataset.analyticsState };
}

test("one asynchronous official script per document, even if the loader is included twice", () => {
    const e = environment();
    e.run();
    e.run();
    assert.equal(e.inserted.length, 1);
    assert.equal(e.inserted[0].src, counterURL);
    assert.equal(e.inserted[0].async, true);
    assert.equal(e.window.sc_project, 13362025);
    assert.equal(e.window.sc_security, "d2d5336d");
    assert.equal(e.window.sc_invisible, 1);
    e.inserted[0].onload();
    assert.equal(e.state(), "script-loaded");
    assert.equal(e.timers.size, 0);
    e.run();
    assert.equal(e.inserted.length, 1);
});

for (const url of ["http://localhost:8766/", "http://127.0.0.1:8767/", "file:///tmp/index.html",
    "http://houyili.github.io/", "https://houyili.github.io.example.com/", "https://example.com/"]) {
    test(`no third-party request from ${url}`, () => {
        const e = environment({ url });
        e.run();
        assert.equal(e.state(), "disabled-origin");
        assert.equal(e.inserted.length, 0);
        assert.equal(e.window.sc_project, undefined);
    });
}

test("explicit preview URL does not send analytics", () => {
    const e = environment({ url: "https://houyili.github.io/?analytics=off" });
    e.run();
    assert.equal(e.state(), "disabled-preview");
    assert.equal(e.inserted.length, 0);
});

for (const preference of [{ globalPrivacyControl: true }, { doNotTrack: "1" }, { doNotTrack: "yes" }]) {
    test(`respects visitor preference ${JSON.stringify(preference)}`, () => {
        const e = environment({ navigator: preference });
        e.run();
        e.advance(60000);
        assert.equal(e.state(), "disabled-preference");
        assert.equal(e.inserted.length, 0);
    });
}

test("offline arrival recovers once after connectivity returns", () => {
    const e = environment({ navigator: { onLine: false } });
    e.run();
    e.run();
    assert.equal(e.state(), "waiting-network");
    assert.equal(e.inserted.length, 0);
    e.navigator.onLine = true;
    e.emit("online");
    e.emit("online");
    assert.equal(e.inserted.length, 1);
});

test("a failed download gets one delayed retry and can recover", () => {
    const e = environment();
    e.run();
    const failed = e.inserted[0];
    failed.onerror();
    assert.equal(e.state(), "retry-wait");
    assert.equal(e.scripts.length, 0);
    e.advance(1499);
    assert.equal(e.inserted.length, 1);
    e.advance(1);
    assert.equal(e.inserted.length, 2);
    // Stale callbacks cannot change the second attempt's state.
    failed.onerror();
    failed.onload();
    assert.equal(e.state(), "loading");
    e.inserted[1].onload();
    assert.equal(e.state(), "script-loaded");
    assert.equal(e.timers.size, 0);
});

test("persistent failure stops after two attempts", () => {
    const e = environment();
    e.run();
    e.inserted[0].onerror();
    e.advance(1500);
    e.inserted[1].onerror();
    e.advance(60000);
    e.emit("online");
    assert.equal(e.state(), "load-failed");
    assert.equal(e.inserted.length, 2);
    assert.equal(e.timers.size, 0);
});

test("timeout does not create another hit; a late successful load remains valid", () => {
    const e = environment();
    e.run();
    e.advance(60000);
    assert.equal(e.state(), "load-timeout");
    assert.equal(e.inserted.length, 1);
    e.inserted[0].onload();
    assert.equal(e.state(), "script-loaded");
    assert.equal(e.inserted.length, 1);
});

test("a retry waits for the network if connectivity was lost", () => {
    const e = environment();
    e.run();
    e.navigator.onLine = false;
    e.inserted[0].onerror();
    e.advance(1500);
    assert.equal(e.state(), "waiting-network");
    e.navigator.onLine = true;
    e.emit("online");
    assert.equal(e.inserted.length, 2);
    e.inserted[1].onload();
    assert.equal(e.state(), "script-loaded");
});

test("legacy or duplicate official code is not loaded again", () => {
    const e = environment();
    e.scripts.push({ src: counterURL + "?cached=1" });
    e.run();
    assert.equal(e.state(), "existing-script");
    assert.equal(e.inserted.length, 0);
});

test("prerendered pages wait for activation", () => {
    const e = environment({ prerendering: true });
    e.run();
    assert.equal(e.state(), "waiting-activation");
    assert.equal(e.inserted.length, 0);
    e.document.prerendering = false;
    e.emit("prerenderingchange");
    e.emit("prerenderingchange");
    assert.equal(e.inserted.length, 1);
});

test("browser insertion failures do not break the homepage", () => {
    const e = environment({ appendFails: true });
    assert.doesNotThrow(e.run);
    assert.equal(e.state(), "setup-failed");
    assert.equal(e.timers.size, 0);
});

test("a new document may record a legitimate new page view", () => {
    const first = environment();
    const second = environment();
    first.run();
    second.run();
    assert.equal(first.inserted.length, 1);
    assert.equal(second.inserted.length, 1);
});
