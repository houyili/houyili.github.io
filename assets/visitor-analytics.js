/* Statcounter's project identifier and installation token are public, not account credentials. */
(function () {
    "use strict";

    if (window.__houyiVisitorAnalytics) {
        return;
    }
    window.__houyiVisitorAnalytics = true;

    const VERSION = "2026-10-24.1";
    const ORIGIN = "https://houyili.github.io";
    const PROJECT = 13362025;
    const SECURITY = "d2d5336d";
    const SCRIPT_URL = "https://www.statcounter.com/counter/counter.js";
    const MAX_ATTEMPTS = 2;
    const LOAD_TIMEOUT_MS = 12000;
    const RETRY_DELAY_MS = 1500;
    const root = document.documentElement;
    let attempts = 0;

    function status(value) {
        root.dataset.analyticsVersion = VERSION;
        root.dataset.analyticsState = value;
        root.dataset.analyticsAttempts = String(attempts);
    }

    status("initializing");

    if (window.location.origin !== ORIGIN) {
        status("disabled-origin");
        return;
    }
    if (new URLSearchParams(window.location.search).get("analytics") === "off") {
        status("disabled-preview");
        return;
    }

    const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    if (navigator.globalPrivacyControl === true || dnt === "1" || dnt === "yes") {
        status("disabled-preference");
        return;
    }

    function existingCounter() {
        return Array.from(document.scripts).some(function (script) {
            if (!script.src) {
                return false;
            }
            const url = new URL(script.src, window.location.href);
            return url.origin === "https://www.statcounter.com" &&
                url.pathname === "/counter/counter.js";
        });
    }

    function load() {
        // Re-check before each attempt, including after an offline interval.
        if (existingCounter()) {
            status("existing-script");
            return;
        }
        if (navigator.onLine === false) {
            status("waiting-network");
            window.addEventListener("online", load, { once: true });
            return;
        }

        attempts += 1;
        status("loading");
        window.sc_project = PROJECT;
        window.sc_invisible = 1;
        window.sc_security = SECURITY;

        const script = document.createElement("script");
        script.id = "statcounter-runtime";
        script.async = true;
        script.src = SCRIPT_URL;
        let settled = false;

        // A slow script may still execute. Never send a fallback hit or retry on timeout.
        const timer = window.setTimeout(function () {
            if (!settled) {
                status("load-timeout");
            }
        }, LOAD_TIMEOUT_MS);

        script.onload = function () {
            if (settled) {
                return;
            }
            settled = true;
            window.clearTimeout(timer);
            // This confirms script loading only; backend ingestion is verified separately.
            status("script-loaded");
        };

        script.onerror = function () {
            if (settled) {
                return;
            }
            settled = true;
            window.clearTimeout(timer);
            script.remove();
            if (attempts < MAX_ATTEMPTS) {
                status("retry-wait");
                window.setTimeout(load, RETRY_DELAY_MS);
            } else {
                status("load-failed");
            }
        };

        try {
            document.head.appendChild(script);
        } catch (_) {
            settled = true;
            window.clearTimeout(timer);
            script.remove();
            status("setup-failed");
        }
    }

    if (document.prerendering) {
        status("waiting-activation");
        document.addEventListener("prerenderingchange", load, { once: true });
    } else {
        load();
    }
}());
