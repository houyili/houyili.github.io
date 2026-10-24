/* CSS handles automatic system changes; this is only the optional override. */
(() => {
    "use strict";
    const picker = document.getElementById("color-theme");
    if (!picker) return;
    const root = document.documentElement;
    picker.value = root.dataset.theme || "system";
    picker.disabled = false;
    picker.addEventListener("change", () => {
        const theme = picker.value;
        if (theme === "light" || theme === "dark") {
            root.dataset.theme = theme;
        } else {
            delete root.dataset.theme;
        }
        document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
            const dark = root.dataset.theme === "dark" ||
                (!root.dataset.theme && meta.media.includes("dark"));
            meta.content = dark ? "#171b22" : "#ffffff";
        });
        try {
            if (root.dataset.theme) localStorage.setItem("houyi-color-theme", theme);
            else localStorage.removeItem("houyi-color-theme");
        } catch (_) {
            // The selection still works when storage is unavailable or full.
        }
    });
})();
