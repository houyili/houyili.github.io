import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const init = html.match(/<script id="theme-init">([\s\S]*?)<\/script>/)[1];
const source = readFileSync(new URL("../assets/appearance.js", import.meta.url), "utf8");

function browser(saved = null, storageBlocked = false) {
    const data = new Map(saved ? [["houyi-color-theme", saved]] : []);
    let change;
    const picker = { value: "system", disabled: true, addEventListener: (_, cb) => { change = cb; } };
    const metas = [
        { media: "(prefers-color-scheme: light)", content: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", content: "#171b22" }
    ];
    const document = { documentElement: { dataset: {} }, getElementById: () => picker, querySelectorAll: () => metas };
    const localStorage = {
        getItem: key => { if (storageBlocked) throw Error("blocked"); return data.get(key) || null; },
        setItem: (key, value) => { if (storageBlocked) throw Error("blocked"); data.set(key, value); },
        removeItem: key => { if (storageBlocked) throw Error("blocked"); data.delete(key); }
    };
    const context = vm.createContext({ document, localStorage });
    vm.runInContext(init, context);
    vm.runInContext(source, context);
    return { picker, data, metas, root: document.documentElement, choose: value => { picker.value = value; change(); } };
}

test("first visit leaves the theme to system CSS", () => {
    const app = browser();
    assert.equal(app.root.dataset.theme, undefined);
    assert.equal(app.picker.value, "system");
    assert.equal(app.picker.disabled, false);
});

test("saved light and dark overrides are applied before display and selected", () => {
    for (const theme of ["light", "dark"]) {
        const app = browser(theme);
        assert.equal(app.root.dataset.theme, theme);
        assert.equal(app.picker.value, theme);
        assert.ok(app.metas.every(meta => meta.content === (theme === "dark" ? "#171b22" : "#ffffff")));
    }
});

test("returning to System clears the override and saved preference", () => {
    const app = browser("dark");
    app.choose("light");
    assert.equal(app.root.dataset.theme, "light");
    assert.equal(app.data.get("houyi-color-theme"), "light");
    app.choose("system");
    assert.equal(app.root.dataset.theme, undefined);
    assert.equal(app.data.has("houyi-color-theme"), false);
    assert.deepEqual(app.metas.map(meta => meta.content), ["#ffffff", "#171b22"]);
});

test("blocked storage still allows theme changes for the current visit", () => {
    const app = browser(null, true);
    app.choose("dark");
    assert.equal(app.root.dataset.theme, "dark");
    app.choose("system");
    assert.equal(app.root.dataset.theme, undefined);
});

test("unknown stored values cannot override the system theme", () => {
    const app = browser("unknown-value");
    assert.equal(app.root.dataset.theme, undefined);
    assert.equal(app.picker.value, "system");
});
