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
    var logo = origin + "/brand/PaySynk-Wht-Logo-2.png";

    el.className = (el.className ? el.className + " " : "") + "paysynk-embed";
    el.innerHTML =
      '<div style="font-family:Outfit,system-ui,sans-serif;border:1px solid #2e2e2e;border-radius:12px;padding:1.25rem;background:linear-gradient(160deg,#1a1a1a,#141414);color:#f4f4f4">' +
      '<img src="' +
      logo +
      '" alt="PaySynk" style="height:28px;width:auto;display:block;margin-bottom:0.85rem" />' +
      '<div style="font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;color:#9FE870">Store</div>' +
      '<div style="font-family:Syne,system-ui,sans-serif;font-size:1.35rem;margin:0.35rem 0 0.75rem;font-weight:700">' +
      slug +
      "</div>" +
      '<a href="' +
      href +
      '" style="display:inline-block;background:#9FE870;color:#141414;text-decoration:none;padding:0.65rem 1rem;border-radius:999px;font-weight:600">Open shop</a>' +
      '<p style="margin:0.75rem 0 0;font-size:0.85rem;color:#a3a3a3">Embed launcher · hosted storefront at /s/' +
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
