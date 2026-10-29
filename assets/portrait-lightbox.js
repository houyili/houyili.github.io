(() => {
    "use strict";
    const link = document.querySelector(".portrait-link");
    const dialog = document.getElementById("portrait-lightbox");
    if (!link || !dialog || typeof dialog.showModal !== "function") return;

    const image = dialog.querySelector(".portrait-lightbox-image");
    const closeButton = dialog.querySelector(".portrait-lightbox-close");
    link.addEventListener("click", event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (!image.getAttribute("src")) image.src = link.href;
        dialog.showModal();
        document.documentElement.classList.add("portrait-modal-open");
    });
    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
        if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
        document.documentElement.classList.remove("portrait-modal-open");
        link.focus({ preventScroll: true });
    });
})();
