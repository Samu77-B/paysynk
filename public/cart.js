/**
 * PaySynk shop cart — one snippet per shop, works on any page.
 *
 *   <script
 *     src="https://paysynk.com/cart.js"
 *     data-store="slf"
 *     data-merchant-id="MERCHANT_ID"
 *     async></script>
 *
 * Product embeds (embed.js) write to the same cart key: paysynk-cart:{store}
 */
(function () {
  var EVENT = "paysynk:cart-updated";

  function scriptEl() {
    return (
      document.currentScript ||
      (function () {
        var scripts = document.getElementsByTagName("script");
        for (var i = scripts.length - 1; i >= 0; i--) {
          if ((scripts[i].src || "").indexOf("cart.js") !== -1) return scripts[i];
        }
        return null;
      })()
    );
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
  var storeSlug =
    (script && script.getAttribute("data-store")) ||
    (script && script.getAttribute("data-store-slug")) ||
    "";
  var merchantId = (script && script.getAttribute("data-merchant-id")) || "";

  // Back-compat: merchant-only snippets still open the demo/default store.
  if (!storeSlug) storeSlug = "slf";

  function storageKey(slug) {
    return "paysynk-cart:" + slug;
  }

  function readCart(slug) {
    try {
      var raw = localStorage.getItem(storageKey(slug));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(slug, items) {
    localStorage.setItem(storageKey(slug), JSON.stringify(items));
    try {
      window.dispatchEvent(
        new CustomEvent(EVENT, { detail: { store: slug, items: items } }),
      );
    } catch (e) {
      /* ignore */
    }
  }

  function itemCount(items) {
    var n = 0;
    for (var i = 0; i < items.length; i++) n += items[i].quantity || 0;
    return n;
  }

  function formatMoney(minor, currency) {
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: (currency || "gbp").toUpperCase(),
      }).format(minor / 100);
    } catch (e) {
      return "£" + (minor / 100).toFixed(2);
    }
  }

  var storeMeta = {
    slug: storeSlug,
    name: storeSlug,
    currency: "gbp",
    shippingFlatMinor: 525,
  };
  var open = false;
  var busy = false;
  var root = null;
  var button = null;

  function ensureUi() {
    if (root) return;

    button = document.createElement("button");
    button.id = "paysynk-cart-launcher";
    button.type = "button";
    button.setAttribute("aria-label", "Open PaySynk cart");
    button.style.cssText =
      "position:fixed;right:16px;bottom:16px;z-index:2147483000;background:#9FE870;color:#141414;border:0;border-radius:999px;padding:12px 18px;font:600 14px Outfit,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25);cursor:pointer";
    button.onclick = function () {
      open = !open;
      render();
    };

    root = document.createElement("div");
    root.id = "paysynk-cart-root";
    root.setAttribute("data-store", storeSlug);
    if (merchantId) root.setAttribute("data-merchant-id", merchantId);

    document.body.appendChild(button);
    document.body.appendChild(root);
  }

  function setQuantity(variantId, quantity) {
    var items = readCart(storeSlug)
      .map(function (item) {
        if (item.variantId !== variantId) return item;
        return Object.assign({}, item, {
          quantity: Math.min(item.maxStock || 99, Math.max(0, quantity)),
        });
      })
      .filter(function (item) {
        return item.quantity > 0;
      });
    writeCart(storeSlug, items);
    render();
  }

  function removeItem(variantId) {
    writeCart(
      storeSlug,
      readCart(storeSlug).filter(function (item) {
        return item.variantId !== variantId;
      }),
    );
    render();
  }

  function checkout() {
    var items = readCart(storeSlug);
    if (!items.length || busy) return;
    busy = true;
    render();
    fetch(origin + "/api/stores/" + encodeURIComponent(storeSlug) + "/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map(function (item) {
          return { variantId: item.variantId, quantity: item.quantity };
        }),
      }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || "Checkout failed");
          return data;
        });
      })
      .then(function (data) {
        writeCart(storeSlug, []);
        window.location.href = data.redirectUrl;
      })
      .catch(function (err) {
        busy = false;
        render(err.message || "Checkout failed");
      });
  }

  function render(errorMessage) {
    ensureUi();
    var items = readCart(storeSlug);
    var count = itemCount(items);
    button.textContent = count ? "Cart (" + count + ")" : "Cart";

    if (!open) {
      root.innerHTML = "";
      root.style.display = "none";
      return;
    }

    var subtotal = 0;
    for (var i = 0; i < items.length; i++) {
      subtotal += (items[i].priceMinor || 0) * (items[i].quantity || 0);
    }
    var shipping = items.length ? storeMeta.shippingFlatMinor || 0 : 0;
    var total = subtotal + shipping;

    var lines = "";
    if (!items.length) {
      lines =
        '<p style="margin:1rem 0;color:#71717a;font-size:0.9rem">Your cart is empty.</p>';
    } else {
      for (var li = 0; li < items.length; li++) {
        var item = items[li];
        lines +=
          '<div style="display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #f4f4f5">' +
          '<div style="min-width:0">' +
          '<div style="font-weight:600;font-size:0.9rem">' +
          escapeHtml(item.title) +
          "</div>" +
          (item.optionsLabel
            ? '<div style="color:#71717a;font-size:0.78rem;margin-top:2px">' +
              escapeHtml(item.optionsLabel) +
              "</div>"
            : "") +
          '<div style="color:#71717a;font-size:0.78rem;margin-top:2px">' +
          formatMoney(item.priceMinor, storeMeta.currency) +
          " each</div>" +
          '<button type="button" data-ps-remove="' +
          escapeAttr(item.variantId) +
          '" style="margin-top:6px;border:0;background:none;color:#71717a;padding:0;font-size:0.78rem;cursor:pointer;text-decoration:underline">Remove</button>' +
          "</div>" +
          '<input data-ps-qty="' +
          escapeAttr(item.variantId) +
          '" type="number" min="1" max="' +
          (item.maxStock || 99) +
          '" value="' +
          item.quantity +
          '" style="width:64px;height:36px;border:1px solid #e4e4e7;border-radius:8px;padding:0 8px" />' +
          "</div>";
      }
    }

    root.style.cssText =
      "display:block;position:fixed;inset:0;z-index:2147483001;font-family:Outfit,system-ui,sans-serif";
    root.innerHTML =
      '<div data-ps-backdrop style="position:absolute;inset:0;background:rgba(0,0,0,.35)"></div>' +
      '<aside style="position:absolute;top:0;right:0;height:100%;width:min(100%,380px);background:#fff;color:#18181b;box-shadow:0 25px 50px rgba(0,0,0,.25);display:flex;flex-direction:column">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid #f4f4f5">' +
      "<div><div style=\"font-weight:700\">" +
      escapeHtml(storeMeta.name || "Your cart") +
      '</div><div style="font-size:0.75rem;color:#a1a1aa">Powered by PaySynk</div></div>' +
      '<button type="button" data-ps-close style="border:0;background:none;color:#71717a;cursor:pointer;font-size:0.9rem">Close</button>' +
      "</div>" +
      '<div style="flex:1;overflow:auto;padding:0 18px">' +
      lines +
      "</div>" +
      (items.length
        ? '<div style="padding:16px 18px;border-top:1px solid #f4f4f5">' +
          '<div style="display:flex;justify-content:space-between;font-size:0.9rem;color:#52525b;margin-bottom:6px"><span>Items</span><span>' +
          formatMoney(subtotal, storeMeta.currency) +
          "</span></div>" +
          '<div style="display:flex;justify-content:space-between;font-size:0.9rem;color:#52525b;margin-bottom:6px"><span>UK shipping</span><span>' +
          formatMoney(shipping, storeMeta.currency) +
          "</span></div>" +
          '<div style="display:flex;justify-content:space-between;font-weight:700;margin-bottom:12px"><span>Total</span><span>' +
          formatMoney(total, storeMeta.currency) +
          "</span></div>" +
          (errorMessage
            ? '<p style="color:#b91c1c;font-size:0.85rem;margin:0 0 10px">' +
              escapeHtml(errorMessage) +
              "</p>"
            : "") +
          '<button type="button" data-ps-checkout ' +
          (busy ? "disabled " : "") +
          'style="width:100%;border:0;border-radius:999px;padding:0.75rem 1rem;font-weight:600;cursor:pointer;background:#9FE870;color:#141414">' +
          (busy ? "Redirecting…" : "Checkout with Stripe") +
          "</button></div>"
        : "") +
      "</aside>";

    var backdrop = root.querySelector("[data-ps-backdrop]");
    var closeBtn = root.querySelector("[data-ps-close]");
    function close() {
      open = false;
      render();
    }
    if (backdrop) backdrop.onclick = close;
    if (closeBtn) closeBtn.onclick = close;

    var qtyInputs = root.querySelectorAll("[data-ps-qty]");
    for (var qi = 0; qi < qtyInputs.length; qi++) {
      (function (input) {
        input.onchange = function () {
          setQuantity(input.getAttribute("data-ps-qty"), Number(input.value));
        };
      })(qtyInputs[qi]);
    }

    var removeBtns = root.querySelectorAll("[data-ps-remove]");
    for (var ri = 0; ri < removeBtns.length; ri++) {
      (function (btn) {
        btn.onclick = function () {
          removeItem(btn.getAttribute("data-ps-remove"));
        };
      })(removeBtns[ri]);
    }

    var checkoutBtn = root.querySelector("[data-ps-checkout]");
    if (checkoutBtn) checkoutBtn.onclick = checkout;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }

  function loadStoreMeta() {
    return fetch(
      origin + "/api/stores/" + encodeURIComponent(storeSlug) + "/products",
    )
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data && data.store) {
          storeMeta = data.store;
        }
      })
      .catch(function () {
        /* keep defaults */
      });
  }

  window.PaySynkCart = {
    open: function (slug) {
      if (slug && slug !== storeSlug) return;
      open = true;
      render();
    },
    close: function () {
      open = false;
      render();
    },
    refresh: function () {
      render();
    },
  };

  function boot() {
    ensureUi();
    render();
    loadStoreMeta().then(function () {
      if (open) render();
    });
  }

  window.addEventListener(EVENT, function (ev) {
    if (!ev.detail || ev.detail.store === storeSlug) render();
  });
  window.addEventListener("storage", function (ev) {
    if (ev.key === storageKey(storeSlug)) render();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
