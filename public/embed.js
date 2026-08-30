/**
 * PaySynk product / store embeds
 *
 * Product widget (one snippet per product):
 *   <div data-paysynk-product="acme-hoodie" data-store="slf"></div>
 *   <script src="https://paysynk.com/embed.js" defer></script>
 *
 * Whole-store launcher:
 *   <div data-store="slf"></div>
 *   <script src="https://paysynk.com/embed.js" defer></script>
 *
 * Pair with cart.js on any page for a shared slide-out basket.
 *
 * Dark cards (optional):
 *   <script src="https://www.paysynk.com/embed.js" data-theme="dark" defer></script>
 *
 * Match the host site (Settings, or CSS / data attrs):
 *   :root { --paysynk-accent:#c4a37a; --paysynk-accent-text:#141414; --paysynk-font:inherit; }
 *   <script src="…/embed.js" data-accent="#c4a37a" data-font="inherit" defer></script>
 */
(function () {
  var EVENT = "paysynk:cart-updated";

  function cartShoppingOn(store) {
    if (store && store.paymentsActive) return true;
    var slug = (store && store.slug) || "";
    try {
      var q = new URLSearchParams(window.location.search);
      var flag = q.get("paysynk-preview") || q.get("paysynk-cart") || "";
      if (flag === "1") {
        if (slug) localStorage.setItem("paysynk-preview-cart:" + slug, "1");
        return true;
      }
      if (flag === "0") {
        if (slug) localStorage.removeItem("paysynk-preview-cart:" + slug);
        return false;
      }
      return Boolean(
        slug && localStorage.getItem("paysynk-preview-cart:" + slug) === "1",
      );
    } catch (e) {
      return false;
    }
  }

  function renderOpeningSoon(el, store) {
    var t = palette(readTheme(el, store), readBrand(el, store));
    el.innerHTML =
      '<div style="font-family:' +
      t.font +
      ";border:1px dashed " +
      t.line +
      ";border-radius:12px;padding:1.1rem;background:" +
      t.card +
      ";color:" +
      t.muted +
      ';text-align:center">' +
      '<div style="font-size:0.7rem;letter-spacing:0.12em;text-transform:uppercase;color:' +
      t.label +
      ';margin-bottom:0.35rem">PaySynk</div>' +
      '<p style="margin:0;font-size:0.9rem">Shop opening soon</p>' +
      "</div>";
  }

  function appOrigin() {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || "";
      if (src.indexOf("embed.js") !== -1) {
        try {
          return canonicalPaysynkOrigin(new URL(src).origin);
        } catch (e) {
          /* ignore */
        }
      }
    }
    return canonicalPaysynkOrigin(window.location.origin);
  }

  function canonicalPaysynkOrigin(origin) {
    try {
      var url = new URL(origin);
      if (url.hostname === "paysynk.com") url.hostname = "www.paysynk.com";
      return url.origin;
    } catch (e) {
      return origin;
    }
  }

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

  function embedScriptEl() {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      if ((scripts[i].src || "").indexOf("embed.js") !== -1) return scripts[i];
    }
    return null;
  }

  function readTheme(el, store) {
    var node = el;
    while (node && node.getAttribute) {
      var value =
        node.getAttribute("data-paysynk-theme") || node.getAttribute("data-theme");
      if (value === "dark" || value === "light") return value;
      node = node.parentElement;
    }
    var script = embedScriptEl();
    var fromScript =
      script &&
      (script.getAttribute("data-paysynk-theme") ||
        script.getAttribute("data-theme"));
    if (fromScript === "dark" || fromScript === "light") return fromScript;
    if (store && store.embedTheme === "dark") return "dark";
    return "light";
  }

  function cssVar(name, node) {
    try {
      if (node) {
        var local = (
          window.getComputedStyle(node).getPropertyValue(name) || ""
        ).trim();
        if (local) return local;
      }
      return (
        window.getComputedStyle(document.documentElement).getPropertyValue(name) ||
        ""
      ).trim();
    } catch (e) {
      return "";
    }
  }

  function normalizeHex(value) {
    var v = String(value || "").trim();
    if (!v) return "";
    if (v.charAt(0) !== "#") v = "#" + v;
    if (/^#[0-9a-f]{3}$/i.test(v)) {
      return (
        "#" +
        v.charAt(1) +
        v.charAt(1) +
        v.charAt(2) +
        v.charAt(2) +
        v.charAt(3) +
        v.charAt(3)
      ).toLowerCase();
    }
    if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
    return "";
  }

  function contrastText(hex) {
    var n = parseInt(String(hex).slice(1), 16);
    if (isNaN(n)) return "#141414";
    var r = (n >> 16) & 255;
    var g = (n >> 8) & 255;
    var b = n & 255;
    var y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return y > 0.55 ? "#141414" : "#fafafa";
  }

  function safeFontFamily(font) {
    var v = String(font || "")
      .replace(/[<>;]/g, "")
      .trim();
    if (v === "inherit") return "inherit";
    if (v === "serif") return 'Georgia,"Times New Roman",Times,serif';
    if (!v || v === "paysynk") return "Outfit,system-ui,sans-serif";
    if (v.length > 120) v = v.slice(0, 120);
    return v;
  }

  function takeBrand(from, into) {
    if (!from) return;
    if (!into.accent) {
      into.accent = normalizeHex(from.accent || from.embedAccent || "");
    }
    if (!into.accentText) {
      into.accentText = normalizeHex(from.accentText || from.embedAccentText || "");
    }
    if (!into.font) {
      into.font = String(from.font || from.embedFont || "").trim();
    }
  }

  function readBrand(el, store) {
    var into = { accent: "", accentText: "", font: "" };
    if (el && el.getAttribute) {
      takeBrand(
        {
          accent: el.getAttribute("data-accent") || el.getAttribute("data-paysynk-accent"),
          accentText:
            el.getAttribute("data-accent-text") ||
            el.getAttribute("data-paysynk-accent-text"),
          font: el.getAttribute("data-font") || el.getAttribute("data-paysynk-font"),
        },
        into,
      );
    }
    var script = embedScriptEl();
    if (script) {
      takeBrand(
        {
          accent:
            script.getAttribute("data-accent") ||
            script.getAttribute("data-paysynk-accent"),
          accentText:
            script.getAttribute("data-accent-text") ||
            script.getAttribute("data-paysynk-accent-text"),
          font: script.getAttribute("data-font") || script.getAttribute("data-paysynk-font"),
        },
        into,
      );
    }
    takeBrand(
      {
        accent: cssVar("--paysynk-accent", el),
        accentText: cssVar("--paysynk-accent-text", el),
        font: cssVar("--paysynk-font", el),
      },
      into,
    );
    takeBrand(store, into);
    var accent = into.accent || "#9FE870";
    return {
      accent: accent,
      accentText: into.accentText || contrastText(accent),
      fontFamily: safeFontFamily(into.font || "paysynk"),
    };
  }

  function palette(mode, brand) {
    brand = brand || readBrand();
    if (mode === "dark") {
      return {
        card: "#171717",
        text: "#f4f4f4",
        muted: "#a1a1aa",
        label: "#d4d4d8",
        line: "#3f3f46",
        inputBg: "#0c0c0c",
        inputBorder: "#52525b",
        photoBg: "#0c0c0c",
        btn: brand.accent,
        btnText: brand.accentText,
        btnOff: "#3f3f46",
        flash: brand.accent,
        font: brand.fontFamily,
      };
    }
    return {
      card: "#fff",
      text: "#18181b",
      muted: "#71717a",
      label: "#52525b",
      line: "#e4e4e7",
      inputBg: "#fff",
      inputBorder: "#d4d4d8",
      photoBg: "#fff",
      btn: brand.accent,
      btnText: brand.accentText,
      btnOff: "#d4d4d8",
      flash: brand.accent,
      font: brand.fontFamily,
    };
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

  function optionLabel(options) {
    var parts = [];
    for (var key in options) {
      if (Object.prototype.hasOwnProperty.call(options, key) && options[key]) {
        parts.push(key + ": " + options[key]);
      }
    }
    return parts.join(" · ");
  }

  function slugKey(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function imageSrc(origin, photo) {
    if (!photo) return "";
    try {
      if (/^https:\/\//i.test(photo)) {
        var host = new URL(photo).hostname;
        if (
          host.endsWith(".public.blob.vercel-storage.com") ||
          host.endsWith(".blob.vercel-storage.com")
        ) {
          return photo;
        }
        return "";
      }
    } catch (e) {
      return "";
    }
    if (photo.charAt(0) !== "/" || photo.indexOf("//") !== -1 || photo.indexOf("..") !== -1) {
      return "";
    }
    return origin + encodeURI(photo);
  }

  function openPhotoZoom(src, alt) {
    if (!src) return;
    var existing = document.getElementById("paysynk-photo-zoom");
    if (existing) existing.remove();
    var overlay = document.createElement("div");
    overlay.id = "paysynk-photo-zoom";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.88);display:grid;place-items:center;padding:24px;cursor:zoom-out";
    overlay.innerHTML =
      '<img src="' +
      src.replace(/"/g, "&quot;") +
      '" alt="' +
      escapeAttr(alt || "") +
      '" style="max-width:min(960px,100%);max-height:90vh;object-fit:contain">';
    overlay.onclick = function () {
      overlay.remove();
    };
    document.body.appendChild(overlay);
  }

  function imageForSelection(product, colour, selected) {
    if (selected && selected.imageUrl) return selected.imageUrl;
    var variants = product.variants || [];
    if (colour) {
      for (var i = 0; i < variants.length; i++) {
        var v = variants[i];
        if (v.options && v.options.colour === colour && v.imageUrl) {
          return v.imageUrl;
        }
      }
      return imageForColour(product, colour);
    }
    for (var j = 0; j < variants.length; j++) {
      if (variants[j].imageUrl) return variants[j].imageUrl;
    }
    return imageForColour(product, colour);
  }

  function imageForColour(product, colour) {
    var title = (product.title || "").toLowerCase();
    var key = slugKey(colour);
    var hoodie = {
      offwhite: "/products/Acme Hoodie Off White.png",
      charcoalblack: "/products/acme-minimalist-heavyweight-hoodie.png",
      forestgreen: "/products/Acme Hoodie Forrest Green.png",
      forrestgreen: "/products/Acme Hoodie Forrest Green.png",
    };
    var bottle = {
      matteblack: "/products/acme-insulated-steel-water-bottle.png",
      rawsilver: "/products/Acme Water Bottle Raw Silver.png",
      sagegreen: "/products/Acme Water Bottle Sage Green.png",
    };
    if (title.indexOf("hoodie") !== -1 && hoodie[key]) return hoodie[key];
    if (title.indexOf("bottle") !== -1 && bottle[key]) return bottle[key];
    return (product.images && product.images[0]) || "";
  }

  function addToCart(slug, item) {
    var items = readCart(slug);
    var existing = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].variantId === item.variantId) {
        existing = items[i];
        break;
      }
    }
    if (existing) {
      existing.quantity = Math.min(
        item.maxStock,
        (existing.quantity || 0) + 1,
      );
      existing.maxStock = item.maxStock;
    } else {
      items.push({
        variantId: item.variantId,
        productId: item.productId,
        title: item.title,
        optionsLabel: item.optionsLabel,
        kind: item.kind || "other",
        priceMinor: item.priceMinor,
        quantity: 1,
        maxStock: item.maxStock,
      });
    }
    writeCart(slug, items);
  }

  function reservedQty(slug, variantId) {
    var items = readCart(slug);
    for (var i = 0; i < items.length; i++) {
      if (items[i].variantId === variantId) return items[i].quantity || 0;
    }
    return 0;
  }

  function mountStoreLauncher(el, origin) {
    var slug = el.getAttribute("data-store");
    if (!slug) {
      el.textContent = "PaySynk: missing data-store attribute";
      return;
    }
    var href = origin + "/s/" + encodeURIComponent(slug);
    var logo = origin + "/brand/PaySynk-Grey-Logo-3.png";
    el.className = (el.className ? el.className + " " : "") + "paysynk-embed";
    el.innerHTML =
      '<div style="font-family:Outfit,system-ui,sans-serif;border:1px solid #2e2e2e;border-radius:12px;padding:1.25rem;background:linear-gradient(160deg,#1a1a1a,#141414);color:#f4f4f4">' +
      '<img src="' +
      logo +
      '" alt="PaySynk" style="height:28px;width:auto;display:block;margin-bottom:0.85rem" />' +
      '<div style="font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;color:#9FE870">Store</div>' +
      '<div style="font-family:Syne,system-ui,sans-serif;font-size:1.35rem;margin:0.35rem 0 0.75rem;font-weight:700">' +
      escapeHtml(slug) +
      "</div>" +
      '<a href="' +
      href +
      '" style="display:inline-block;background:#9FE870;color:#141414;text-decoration:none;padding:0.65rem 1rem;border-radius:999px;font-weight:600">Open shop</a>' +
      '<p style="margin:0.75rem 0 0;font-size:0.85rem;color:#a3a3a3">Shop cart: include cart.js with data-store=&quot;' +
      escapeHtml(slug) +
      '&quot; on any page</p></div>';
  }

  function mountProduct(el, origin) {
    var slug = el.getAttribute("data-store");
    var productKey =
      el.getAttribute("data-paysynk-product") ||
      el.getAttribute("data-product");
    if (!slug || !productKey) {
      el.textContent = "PaySynk: product embeds need data-store and data-paysynk-product";
      return;
    }

    el.className = (el.className ? el.className + " " : "") + "paysynk-product-embed";
    var mode = readTheme(el);
    el.setAttribute("data-ps-theme", mode);
    var t = palette(mode, readBrand(el));
    el.innerHTML =
      '<div style="font-family:' +
      t.font +
      ";border:1px solid " +
      t.line +
      ";border-radius:12px;padding:1.25rem;background:" +
      t.card +
      ";color:" +
      t.text +
      '">' +
      '<p style="margin:0;color:' +
      t.muted +
      ';font-size:0.9rem">Loading product…</p></div>';

    fetch(
      origin +
        "/api/stores/" +
        encodeURIComponent(slug) +
        "/products?product=" +
        encodeURIComponent(productKey),
    )
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || "Failed to load product");
          return data;
        });
      })
      .then(function (data) {
        var product = data.products && data.products[0];
        if (!product) throw new Error("Product not found");
        el.setAttribute("data-ps-theme", readTheme(el, data.store));
        if (!cartShoppingOn(data.store)) {
          renderOpeningSoon(el, data.store);
          return;
        }
        renderProductWidget(el, origin, data.store, product);
      })
      .catch(function (err) {
        console.warn(
          "PaySynk: product embed not found",
          productKey,
          err && err.message,
        );
        el.setAttribute("data-paysynk-missing", "1");
        el.style.display = "none";
        el.innerHTML = "";
      });
  }

  function renderProductWidget(el, origin, store, product) {
    var colours = [];
    var colourSet = {};
    for (var i = 0; i < product.variants.length; i++) {
      var c = product.variants[i].options && product.variants[i].options.colour;
      if (c && !colourSet[c]) {
        colourSet[c] = true;
        colours.push(c);
      }
    }

    var state = {
      colour: colours[0] || "",
      variantId: product.variants[0] ? product.variants[0].id : "",
      flash: "",
    };

    function variantsForColour() {
      if (!state.colour) return product.variants;
      var list = [];
      for (var i = 0; i < product.variants.length; i++) {
        var v = product.variants[i];
        if (!v.options.colour || v.options.colour === state.colour) list.push(v);
      }
      return list;
    }

    function selected() {
      for (var i = 0; i < product.variants.length; i++) {
        if (product.variants[i].id === state.variantId) return product.variants[i];
      }
      return variantsForColour()[0] || product.variants[0];
    }

    function available(v) {
      if (!v) return 0;
      return Math.max(0, v.stockQty - reservedQty(store.slug, v.id));
    }

    function paint() {
      var list = variantsForColour();
      var sel = selected();
      if (sel && list.indexOf(sel) === -1) {
        state.variantId = list[0] ? list[0].id : "";
        sel = selected();
      }
      var left = available(sel);
      var hasSizes = false;
      for (var i = 0; i < list.length; i++) {
        if (list[i].options && list[i].options.size) {
          hasSizes = true;
          break;
        }
      }

      var photo = imageForSelection(product, state.colour, sel);
      var mode = el.getAttribute("data-ps-theme") || readTheme(el, store);
      var t = palette(mode, readBrand(el, store));
      var html =
        '<div style="font-family:' +
        t.font +
        ";border:1px solid " +
        t.line +
        ";border-radius:12px;padding:1.25rem;background:" +
        t.card +
        ";color:" +
        t.text +
        ";color-scheme:" +
        mode +
        ';max-width:420px">';
      if (photo) {
        html +=
          '<img src="' +
          imageSrc(origin, photo) +
          '" alt="' +
          escapeAttr(product.title) +
          '" data-ps-zoom style="width:100%;aspect-ratio:4/3;object-fit:contain;background:' +
          t.photoBg +
          ';border-radius:8px;margin:0 0 0.85rem;cursor:zoom-in">';
      }
      html +=
        '<h3 style="margin:0 0 0.35rem;font-size:1.15rem;line-height:1.3">' +
        escapeHtml(product.title) +
        "</h3>" +
        '<p style="margin:0 0 0.75rem;color:' +
        t.muted +
        ';font-size:0.9rem;line-height:1.45">' +
        escapeHtml(product.description || "") +
        "</p>" +
        '<p style="margin:0 0 1rem;font-size:1.25rem;font-weight:700">' +
        (sel && sel.priceMinor > 0
          ? formatMoney(sel.priceMinor, store.currency)
          : "Price to follow") +
        "</p>";

      if (colours.length) {
        html +=
          '<label style="display:block;margin-bottom:0.75rem;font-size:0.85rem">' +
          '<span style="display:block;margin-bottom:0.25rem;color:' +
          t.label +
          '">Colour</span>' +
          '<select data-ps-colour style="width:100%;padding:0.55rem 0.65rem;border:1px solid ' +
          t.inputBorder +
          ";border-radius:8px;background:" +
          t.inputBg +
          ";color:" +
          t.text +
          '">';
        for (var ci = 0; ci < colours.length; ci++) {
          var colourLeft = 0;
          for (var vi = 0; vi < product.variants.length; vi++) {
            var pv = product.variants[vi];
            if (pv.options.colour === colours[ci]) colourLeft += available(pv);
          }
          html +=
            '<option value="' +
            escapeAttr(colours[ci]) +
            '"' +
            (colours[ci] === state.colour ? " selected" : "") +
            ">" +
            escapeHtml(colours[ci]) +
            (hasSizes ? "" : " — " + colourLeft + " left") +
            "</option>";
        }
        html += "</select></label>";
      }

      if (hasSizes) {
        html +=
          '<label style="display:block;margin-bottom:0.75rem;font-size:0.85rem">' +
          '<span style="display:block;margin-bottom:0.25rem;color:' +
          t.label +
          '">Size</span>' +
          '<select data-ps-size style="width:100%;padding:0.55rem 0.65rem;border:1px solid ' +
          t.inputBorder +
          ";border-radius:8px;background:" +
          t.inputBg +
          ";color:" +
          t.text +
          '">';
        for (var si = 0; si < list.length; si++) {
          var sv = list[si];
          html +=
            '<option value="' +
            escapeAttr(sv.id) +
            '"' +
            (sv.id === (sel && sel.id) ? " selected" : "") +
            ">" +
            escapeHtml(sv.options.size || sv.sku) +
            " — " +
            available(sv) +
            " left</option>";
        }
        html += "</select></label>";
      } else {
        html +=
          '<p style="margin:0 0 0.85rem;color:' +
          t.muted +
          ';font-size:0.85rem">' +
          (left === 0 ? "Out of stock" : left + " left") +
          "</p>";
      }

      var shoppingOn = cartShoppingOn(store);
      var addDisabled = !shoppingOn || left <= 0;
      var addLabel = !shoppingOn
        ? "Coming soon"
        : left <= 0
          ? "Out of stock"
          : "Add to cart";

      html +=
        '<button type="button" data-ps-add ' +
        (addDisabled ? "disabled " : "") +
        'style="width:100%;border:0;border-radius:999px;padding:0.7rem 1rem;font-weight:600;font-family:inherit;cursor:' +
        (addDisabled ? "not-allowed" : "pointer") +
        ";appearance:none;-webkit-appearance:none;background:" +
        (addDisabled ? t.btnOff : t.btn) +
        " !important;color:" +
        (addDisabled ? t.text : t.btnText) +
        " !important\">" +
        addLabel +
        "</button>" +
        '<p data-ps-status style="margin:0.65rem 0 0;min-height:1.2em;font-size:0.8rem;color:' +
        t.flash +
        '">' +
        escapeHtml(state.flash || "") +
        "</p>" +
        "</div>";

      el.innerHTML = html;

      var zoomImg = el.querySelector("[data-ps-zoom]");
      if (zoomImg) {
        zoomImg.onclick = function () {
          openPhotoZoom(zoomImg.src, zoomImg.alt);
        };
      }

      var colourSelect = el.querySelector("[data-ps-colour]");
      if (colourSelect) {
        colourSelect.onchange = function () {
          state.colour = colourSelect.value;
          var next = variantsForColour()[0];
          state.variantId = next ? next.id : "";
          paint();
        };
      }
      var sizeSelect = el.querySelector("[data-ps-size]");
      if (sizeSelect) {
        sizeSelect.onchange = function () {
          state.variantId = sizeSelect.value;
          paint();
        };
      }
      var addBtn = el.querySelector("[data-ps-add]");
      if (addBtn) {
        addBtn.onclick = function () {
          if (!cartShoppingOn(store)) return;
          var current = selected();
          if (!current || available(current) <= 0) return;
          addToCart(store.slug, {
            variantId: current.id,
            productId: product.id,
            title: product.title,
            optionsLabel: optionLabel(current.options || {}),
            kind: product.kind || "other",
            priceMinor: current.priceMinor,
            maxStock: current.stockQty,
          });
          state.flash = "Added to cart";
          paint();
          if (window.PaySynkCart && typeof window.PaySynkCart.open === "function") {
            window.PaySynkCart.open(store.slug);
          }
          setTimeout(function () {
            if (state.flash === "Added to cart") {
              state.flash = "";
              paint();
            }
          }, 2000);
        };
      }
    }

    window.addEventListener(EVENT, function (ev) {
      if (ev.detail && ev.detail.store === store.slug) paint();
    });
    window.addEventListener("storage", function (ev) {
      if (ev.key === storageKey(store.slug)) paint();
    });

    paint();
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

  function run() {
    var origin = appOrigin();
    var productNodes = document.querySelectorAll(
      "[data-paysynk-product], [data-product]",
    );
    for (var i = 0; i < productNodes.length; i++) {
      var node = productNodes[i];
      if (node.getAttribute("data-paysynk-mounted")) continue;
      node.setAttribute("data-paysynk-mounted", "1");
      mountProduct(node, origin);
    }

    var storeNodes = document.querySelectorAll(
      "[data-store]:not([data-paysynk-product]):not([data-product])",
    );
    for (var j = 0; j < storeNodes.length; j++) {
      var storeEl = storeNodes[j];
      if (storeEl.getAttribute("data-paysynk-mounted")) continue;
      storeEl.setAttribute("data-paysynk-mounted", "1");
      mountStoreLauncher(storeEl, origin);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
