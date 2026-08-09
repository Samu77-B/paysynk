/**
 * PaySynk basic embed bootstrap.
 *
 * Usage:
 *   <div id="paysynk-shop" data-store="slf"></div>
 *   <script src="https://paysynk.com/embed.js" defer></script>
 *
 * MVP behaviour: mounts a lightweight launcher that links to the hosted
 * storefront at /s/:slug (same origin as this script). A full in-page cart
 * widget can replace the iframe/launcher later without changing the snippet.
 */
(function () {
  function appOrigin() {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || "";
      if (src.indexOf("embed.js") !== -1) {
        try {
          return new URL(src).origin;
        } catch (e) {
          /* ignore */
        }
      }
    }
    return window.location.origin;
  }

  function mount(el) {
    var slug = el.getAttribute("data-store");
    if (!slug) {
      el.textContent = "PaySynk: missing data-store attribute";
      return;
    }

    var origin = appOrigin();
    var href = origin + "/s/" + encodeURIComponent(slug);

    el.className = (el.className ? el.className + " " : "") + "paysynk-embed";
    el.innerHTML =
      '<div style="font-family:Georgia,serif;border:1px solid #1c2a24;padding:1.25rem;background:linear-gradient(160deg,#f4f7f5,#e7eee9);color:#14201b">' +
      '<div style="font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase;opacity:0.7">PaySynk</div>' +
      '<div style="font-size:1.35rem;margin:0.35rem 0 0.75rem">Store: ' +
      slug +
      "</div>" +
      '<a href="' +
      href +
      '" style="display:inline-block;background:#1f6b4a;color:#fff;text-decoration:none;padding:0.65rem 1rem;border-radius:2px">Open shop</a>' +
      '<p style="margin:0.75rem 0 0;font-size:0.85rem;opacity:0.75">Embed launcher · hosted storefront at /s/' +
      slug +
      "</p></div>";
  }

  function run() {
    var nodes = document.querySelectorAll("[data-store]");
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
