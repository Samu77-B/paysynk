/**
 * PaySynk cart embed
 *
 * <script src="https://paysynk.com/cart.js" data-merchant-id="MERCHANT_ID" async></script>
 *
 * Also supports legacy: data-store="slug" on a host element + embed.js behaviour.
 */
(function () {
  function scriptEl() {
    return document.currentScript || (function () {
      var scripts = document.getElementsByTagName("script");
      for (var i = scripts.length - 1; i >= 0; i--) {
        if ((scripts[i].src || "").indexOf("cart.js") !== -1) return scripts[i];
      }
      return null;
    })();
  }

  function originFrom(script) {
    if (!script || !script.src) return window.location.origin;
    try {
      return new URL(script.src).origin;
    } catch (e) {
      return window.location.origin;
    }
  }

  var script = scriptEl();
  var origin = originFrom(script);
  var merchantId = script && script.getAttribute("data-merchant-id");

  function openStore() {
    var href = merchantId
      ? origin + "/s/slf?merchant=" + encodeURIComponent(merchantId)
      : origin + "/s/slf";
    window.location.href = href;
  }

  // Floating launcher when merchant id is present
  if (merchantId && !document.getElementById("paysynk-cart-launcher")) {
    var btn = document.createElement("button");
    btn.id = "paysynk-cart-launcher";
    btn.type = "button";
    btn.setAttribute("aria-label", "Open PaySynk cart");
    btn.textContent = "Cart";
    btn.style.cssText =
      "position:fixed;right:16px;bottom:16px;z-index:2147483000;background:#9FE870;color:#141414;border:0;border-radius:999px;padding:12px 18px;font:600 14px Outfit,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25);cursor:pointer";
    btn.onclick = openStore;
    document.addEventListener("DOMContentLoaded", function () {
      document.body.appendChild(btn);
    });
    if (document.body) document.body.appendChild(btn);
  }

  // Mount any [data-store] hosts (compat with embed.js)
  function mountHosts() {
    var nodes = document.querySelectorAll("[data-store]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.getAttribute("data-paysynk-mounted")) continue;
      el.setAttribute("data-paysynk-mounted", "1");
      var slug = el.getAttribute("data-store");
      var href = origin + "/s/" + encodeURIComponent(slug || "slf");
      var logo = origin + "/brand/PaySynk-Wht-Logo-2.png";
      el.innerHTML =
        '<div style="font-family:Outfit,system-ui,sans-serif;border:1px solid #2e2e2e;border-radius:12px;padding:1.25rem;background:linear-gradient(160deg,#1a1a1a,#141414);color:#f4f4f4">' +
        '<img src="' +
        logo +
        '" alt="PaySynk" style="height:28px;width:auto;display:block;margin-bottom:0.85rem" />' +
        '<div style="font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;color:#9FE870">Store</div>' +
        '<div style="font-size:1.25rem;font-weight:700;margin:0.35rem 0 0.75rem">' +
        (slug || "shop") +
        "</div>" +
        '<a href="' +
        href +
        '" style="display:inline-block;background:#9FE870;color:#141414;text-decoration:none;padding:0.65rem 1rem;border-radius:999px;font-weight:600">Open shop</a></div>';
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountHosts);
  } else {
    mountHosts();
  }
})();
