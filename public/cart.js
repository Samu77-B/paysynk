/**
 * PaySynk shop cart — one snippet per shop, works on any page.
 *
 *   <script
 *     src="https://paysynk.com/cart.js"
 *     data-store="slf"
 *     data-merchant-id="MERCHANT_ID"
 *     data-theme="dark"
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
    if (!script || !script.src) return canonicalPaysynkOrigin(window.location.origin);
    try {
      return canonicalPaysynkOrigin(new URL(script.src).origin);
    } catch (e) {
      return canonicalPaysynkOrigin(window.location.origin);
    }
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

  var script = scriptEl();
  var origin = originFrom(script);
  var storeSlug =
    (script && script.getAttribute("data-store")) ||
    (script && script.getAttribute("data-store-slug")) ||
    "";
  var merchantId = (script && script.getAttribute("data-merchant-id")) || "";

  // Back-compat: merchant-only snippets still open the demo/default store.
  if (!storeSlug) storeSlug = "slf";

  function isDarkTheme() {
    var fromScript =
      (script &&
        (script.getAttribute("data-paysynk-theme") ||
          script.getAttribute("data-theme"))) ||
      "";
    if (fromScript === "dark") return true;
    if (fromScript === "light") return false;
    if (storeMeta.embedTheme === "dark") return true;
    var rootTheme =
      document.documentElement.getAttribute("data-paysynk-theme") ||
      document.documentElement.getAttribute("data-theme") ||
      "";
    return rootTheme === "dark";
  }

  function palette() {
    if (isDarkTheme()) {
      return {
        bg: "#141414",
        text: "#f4f4f4",
        muted: "#a1a1aa",
        label: "#d4d4d8",
        line: "#3f3f46",
        lineSoft: "#27272a",
        inputBg: "#0c0c0c",
        destOn: "#f4f4f4",
        gift: "#86efac",
        error: "#f87171",
        errorBg: "rgba(220,38,38,0.16)",
        totals: "#d4d4d8",
      };
    }
    return {
      bg: "#fff",
      text: "#18181b",
      muted: "#71717a",
      label: "#52525b",
      line: "#e4e4e7",
      lineSoft: "#f4f4f5",
      inputBg: "#fff",
      destOn: "#141414",
      gift: "#3f6212",
      error: "#b91c1c",
      errorBg: "#fef2f2",
      totals: "#52525b",
    };
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

  function codeKey() {
    return "paysynk-code:" + storeSlug;
  }

  function shipKey() {
    return "paysynk-ship:" + storeSlug;
  }

  function emptyShip() {
    return {
      name: "",
      email: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      postalCode: "",
      country: "GB",
    };
  }

  function readShip() {
    try {
      var raw = localStorage.getItem(shipKey());
      if (!raw) return emptyShip();
      var parsed = JSON.parse(raw);
      return Object.assign(emptyShip(), parsed || {});
    } catch (e) {
      return emptyShip();
    }
  }

  function writeShip(value) {
    try {
      localStorage.setItem(shipKey(), JSON.stringify(value || emptyShip()));
    } catch (e) {
      /* ignore */
    }
  }

  function shipFromForm() {
    function val(sel) {
      var el = root && root.querySelector(sel);
      return el ? String(el.value || "").trim() : "";
    }
    return {
      name: val("[data-ps-name]"),
      email: val("[data-ps-email]"),
      phone: val("[data-ps-phone]"),
      line1: val("[data-ps-line1]"),
      line2: val("[data-ps-line2]"),
      city: val("[data-ps-city]"),
      postalCode: val("[data-ps-postcode]"),
      country: val("[data-ps-country]") || "GB",
    };
  }

  function persistShipFromForm() {
    if (!root || !root.querySelector("[data-ps-name]")) return;
    writeShip(shipFromForm());
  }

  function validateShip(ship) {
    if (!ship.name) {
      return { error: "Enter the name for delivery.", field: "name" };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ship.email)) {
      return { error: "Enter a valid email address.", field: "email" };
    }
    if (ship.phone && String(ship.phone).replace(/\D/g, "").length < 8) {
      return {
        error: "Enter a phone number we can reach you on.",
        field: "phone",
      };
    }
    if (!ship.line1) {
      return { error: "Enter the first line of your address.", field: "line1" };
    }
    if (!ship.city) return { error: "Enter a town or city.", field: "city" };
    if (isUkShip(ship)) {
      if (!/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(ship.postalCode)) {
        return { error: "Enter a valid UK postcode.", field: "postalCode" };
      }
    } else if (String(ship.postalCode || "").length < 2) {
      return { error: "Enter a postcode or ZIP code.", field: "postalCode" };
    }
    return null;
  }

  function shipFieldSelector(field) {
    return (
      {
        name: "[data-ps-name]",
        email: "[data-ps-email]",
        phone: "[data-ps-phone]",
        line1: "[data-ps-line1]",
        city: "[data-ps-city]",
        postalCode: "[data-ps-postcode]",
        country: "[data-ps-country]",
        discountCode: "[data-ps-code]",
      }[field] || ""
    );
  }

  function fieldFromShipEl(el) {
    if (!el) return "";
    if (el.hasAttribute("data-ps-name")) return "name";
    if (el.hasAttribute("data-ps-email")) return "email";
    if (el.hasAttribute("data-ps-phone")) return "phone";
    if (el.hasAttribute("data-ps-line1")) return "line1";
    if (el.hasAttribute("data-ps-city")) return "city";
    if (el.hasAttribute("data-ps-postcode")) return "postalCode";
    if (el.hasAttribute("data-ps-country")) return "country";
    if (el.hasAttribute("data-ps-code")) return "discountCode";
    return "";
  }

  function applyCheckoutUiError(opts) {
    if (!root || !opts) return;
    var sel = shipFieldSelector(opts.field);
    if (sel) {
      var el = root.querySelector(sel);
      if (el) {
        el.style.borderColor = "#dc2626";
        el.style.boxShadow = "0 0 0 1px #dc2626";
        try {
          el.focus();
        } catch (e) {
          /* ignore */
        }
      }
    }
    var ids = opts.invalidVariantIds || [];
    for (var i = 0; i < ids.length; i++) {
      var line = root.querySelector('[data-ps-line="' + ids[i] + '"]');
      if (line) {
        line.style.border = "1px solid #dc2626";
        line.style.borderRadius = "8px";
        line.style.padding = "10px 8px";
        line.style.background = palette().errorBg;
      }
    }
    if (ids[0]) {
      var first = root.querySelector('[data-ps-line="' + ids[0] + '"]');
      if (first && first.scrollIntoView) {
        first.scrollIntoView({ block: "nearest" });
      }
    }
  }

  function intlOffered() {
    return typeof storeMeta.shippingIntlMinor === "number";
  }

  function isUkShip(ship) {
    return String(ship.country || "GB").toUpperCase() === "GB";
  }

  function chosenShippingMinor(ship) {
    if (!isUkShip(ship) && intlOffered()) return storeMeta.shippingIntlMinor;
    return storeMeta.shippingFlatMinor || 0;
  }

  function shippingLabel(ship) {
    return isUkShip(ship) ? "UK shipping" : "International shipping";
  }

  function inputStyle() {
    var t = palette();
    return (
      "width:100%;height:36px;border:1px solid " +
      t.line +
      ";border-radius:8px;padding:0 10px;font-size:0.85rem;box-sizing:border-box;background:" +
      t.inputBg +
      ";color:" +
      t.text
    );
  }

  function deliveryFieldsHtml(ship) {
    var t = palette();
    function field(attr, label, type, value, autocomplete, required) {
      return (
        '<label style="display:block;margin:0 0 8px">' +
        '<span style="display:block;font-size:0.72rem;color:' +
        t.muted +
        ';margin-bottom:4px">' +
        label +
        (required
          ? ' <span style="color:#dc2626" aria-hidden="true">*</span>'
          : "") +
        "</span>" +
        "<input " +
        attr +
        ' type="' +
        type +
        '" autocomplete="' +
        autocomplete +
        '" value="' +
        escapeAttr(value || "") +
        '"' +
        (required ? " required" : "") +
        ' style="' +
        inputStyle() +
        '" />' +
        "</label>"
      );
    }
    var uk = isUkShip(ship);
    var dest =
      '<div style="display:flex;gap:8px;margin:0 0 10px">' +
      '<label style="flex:1;border:1px solid ' +
      (uk ? t.destOn : t.line) +
      ';border-radius:8px;padding:8px 10px;font-size:0.8rem;cursor:pointer">' +
      '<input type="radio" name="ps-dest" data-ps-dest="GB" ' +
      (uk ? "checked " : "") +
      'style="margin-right:6px" />UK</label>';
    if (intlOffered()) {
      dest +=
        '<label style="flex:1;border:1px solid ' +
        (!uk ? t.destOn : t.line) +
        ';border-radius:8px;padding:8px 10px;font-size:0.8rem;cursor:pointer">' +
        '<input type="radio" name="ps-dest" data-ps-dest="INTL" ' +
        (!uk ? "checked " : "") +
        'style="margin-right:6px" />International</label>';
    }
    dest += "</div>";
    var countryField = "";
    if (!uk && intlOffered()) {
      var countries = storeMeta.shippingCountries || [];
      countryField =
        '<label style="display:block;margin:0 0 8px"><span style="display:block;font-size:0.72rem;color:' +
        t.muted +
        ';margin-bottom:4px">Country <span style="color:#dc2626" aria-hidden="true">*</span></span>' +
        '<select data-ps-country required style="' +
        inputStyle() +
        '">';
      for (var ci = 0; ci < countries.length; ci++) {
        countryField +=
          '<option value="' +
          escapeAttr(countries[ci].code) +
          '"' +
          (countries[ci].code === ship.country ? " selected" : "") +
          ">" +
          escapeHtml(countries[ci].name) +
          "</option>";
      }
      countryField += "</select></label>";
    } else {
      countryField = '<input type="hidden" data-ps-country value="GB" />';
    }
    return (
      '<div style="margin:14px 0 4px;font-size:0.78rem;font-weight:650;letter-spacing:0.04em;text-transform:uppercase;color:' +
      t.label +
      '">Delivery</div>' +
      dest +
      countryField +
      field("data-ps-name", "Full name", "text", ship.name, "name", true) +
      field("data-ps-email", "Email", "email", ship.email, "email", true) +
      field("data-ps-phone", "Phone (optional)", "tel", ship.phone, "tel") +
      field("data-ps-line1", "Address line 1", "text", ship.line1, "address-line1", true) +
      field("data-ps-line2", "Address line 2 (optional)", "text", ship.line2, "address-line2") +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
      field("data-ps-city", "Town / city", "text", ship.city, "address-level2", true) +
      field(
        "data-ps-postcode",
        uk ? "Postcode" : "Postcode / ZIP",
        "text",
        ship.postalCode,
        "postal-code",
        true,
      ) +
      "</div>" +
      '<p style="margin:4px 0 10px;font-size:0.72rem;color:' +
      t.muted +
      '">Stripe will show this address filled in, then take the card.</p>'
    );
  }

  function readCode() {
    try {
      return localStorage.getItem(codeKey()) || "";
    } catch (e) {
      return "";
    }
  }

  function writeCode(value) {
    try {
      localStorage.setItem(codeKey(), String(value || "").trim().toUpperCase());
    } catch (e) {
      /* ignore */
    }
  }

  function qtyForProduct(items, productId) {
    var n = 0;
    for (var i = 0; i < items.length; i++) {
      if (items[i].productId === productId) n += items[i].quantity || 0;
    }
    return n;
  }

  function previewCart(items, offers, code, shippingFlat) {
    var catalogue = 0;
    var i;
    for (i = 0; i < items.length; i++) {
      catalogue += (items[i].priceMinor || 0) * (items[i].quantity || 0);
    }
    offers = offers || [];
    var bundleDiscount = 0;
    var labels = [];
    for (i = 0; i < offers.length; i++) {
      var offer = offers[i];
      if (
        offer.kind === "bundle" &&
        offer.productIdA &&
        offer.productIdB &&
        offer.bundleOffMinor
      ) {
        var pairs = Math.min(
          qtyForProduct(items, offer.productIdA),
          qtyForProduct(items, offer.productIdB),
        );
        if (pairs > 0) {
          bundleDiscount += pairs * offer.bundleOffMinor;
          labels.push(offer.title);
        }
      }
    }
    var teeQty = 0;
    var toteQty = 0;
    for (i = 0; i < items.length; i++) {
      if (items[i].kind === "tee") teeQty += items[i].quantity || 0;
      if (items[i].kind === "tote") toteQty += items[i].quantity || 0;
    }
    var legacy = Math.min(teeQty, toteQty);
    if (legacy > 0) {
      bundleDiscount += legacy * 300;
      labels.push("Tee + tote bundle");
    }
    var afterBundle = Math.max(0, catalogue - bundleDiscount);
    var codeDiscount = 0;
    var codeError = "";
    var applied = "";
    var raw = String(code || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
    if (raw) {
      var match = null;
      for (i = 0; i < offers.length; i++) {
        if (offers[i].kind === "code" && offers[i].code === raw) {
          match = offers[i];
          break;
        }
      }
      if (!match) codeError = "That code is not valid.";
      else if (match.minSubtotalMinor && afterBundle < match.minSubtotalMinor) {
        codeError = "This code needs a higher spend.";
      } else {
        var value = match.discountValue || 0;
        if (match.discountKind === "percent") {
          codeDiscount = Math.floor(
            (afterBundle * Math.min(100, value)) / 100,
          );
        } else {
          codeDiscount = Math.min(afterBundle, value);
        }
        applied = raw;
        if (codeDiscount > 0) labels.push(match.title);
      }
    }
    var discount = Math.min(
      catalogue,
      bundleDiscount + (codeError ? 0 : codeDiscount),
    );
    var subtotal = catalogue - discount;
    var shipping = items.length ? shippingFlat || 0 : 0;
    var paidQty = 0;
    for (i = 0; i < items.length; i++) {
      var isGiftSku = false;
      for (var g = 0; g < offers.length; g++) {
        if (
          offers[g].kind === "gift" &&
          offers[g].giftProductId === items[i].productId
        ) {
          isGiftSku = true;
        }
      }
      if (!isGiftSku) paidQty += items[i].quantity || 0;
    }
    var gifts = [];
    if (paidQty > 0) {
      for (i = 0; i < offers.length; i++) {
        var gf = offers[i];
        if (gf.kind !== "gift" || !gf.giftProductId) continue;
        gifts.push({
          title: gf.giftTitle || gf.title,
          quantity: gf.giftMode === "per_order" ? 1 : paidQty,
        });
      }
    }
    return {
      catalogueSubtotalMinor: catalogue,
      discountMinor: discount,
      subtotalMinor: subtotal,
      shippingMinor: shipping,
      totalMinor: subtotal + shipping,
      discountLabel: labels.join(" · "),
      codeError: codeError,
      appliedCode: codeError ? "" : applied,
      gifts: gifts,
    };
  }

  var storeMeta = {
    slug: storeSlug,
    name: storeSlug,
    currency: "gbp",
    shippingFlatMinor: 525,
    shippingIntlMinor: null,
    shippingCountries: [],
    paymentsActive: false,
    embedTheme: "light",
  };
  var storeOffers = [];
  var open = false;
  var busy = false;
  var root = null;
  var button = null;

  function previewStorageKey() {
    return "paysynk-preview-cart:" + storeSlug;
  }

  function previewQueryFlag() {
    try {
      var q = new URLSearchParams(window.location.search);
      return q.get("paysynk-preview") || q.get("paysynk-cart") || "";
    } catch (e) {
      return "";
    }
  }

  function wantsPreview() {
    try {
      var flag = previewQueryFlag();
      if (flag === "1") {
        localStorage.setItem(previewStorageKey(), "1");
        return true;
      }
      if (flag === "0") {
        localStorage.removeItem(previewStorageKey());
        return false;
      }
      return localStorage.getItem(previewStorageKey()) === "1";
    } catch (e) {
      return false;
    }
  }

  function cartVisible() {
    return wantsPreview() || Boolean(storeMeta.paymentsActive);
  }

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
    persistShipFromForm();
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
    persistShipFromForm();
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
    persistShipFromForm();
    var requiredEls = root.querySelectorAll("input[required], select[required]");
    for (var ri = 0; ri < requiredEls.length; ri++) {
      if (!requiredEls[ri].checkValidity()) {
        var missingField = fieldFromShipEl(requiredEls[ri]);
        render("Please fill in this field.", { field: missingField });
        var missingEl = root.querySelector(shipFieldSelector(missingField));
        if (missingEl && missingEl.reportValidity) missingEl.reportValidity();
        return;
      }
    }
    var ship = readShip();
    var shipError = validateShip(ship);
    if (shipError) {
      render(shipError.error, { field: shipError.field });
      return;
    }
    if (!storeMeta.paymentsActive) {
      render("Checkout stays off until payments are connected.");
      return;
    }
    busy = true;
    render();
    fetch(origin + "/api/stores/" + encodeURIComponent(storeSlug) + "/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map(function (item) {
          return { variantId: item.variantId, quantity: item.quantity };
        }),
        discountCode: readCode() || undefined,
        customer: ship,
      }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          data._ok = res.ok;
          return data;
        });
      })
      .then(function (data) {
        if (!data._ok) {
          busy = false;
          render(data.error || "Checkout failed", {
            field: data.field,
            invalidVariantIds: data.invalidVariantIds,
          });
          return;
        }
        if (!data.redirectUrl || data.redirectUrl.indexOf("https://") !== 0) {
          throw new Error("Checkout failed");
        }
        writeCart(storeSlug, []);
        window.location.href = data.redirectUrl;
      })
      .catch(function (err) {
        busy = false;
        render(err.message || "Checkout failed");
      });
  }

  function render(errorMessage, errorOpts) {
    errorOpts = errorOpts || {};
    if (!cartVisible()) {
      if (button) button.style.display = "none";
      if (root) {
        open = false;
        root.innerHTML = "";
        root.style.display = "none";
      }
      return;
    }

    ensureUi();
    button.style.display = "";
    var items = readCart(storeSlug);
    var count = itemCount(items);
    button.textContent = count ? "Cart (" + count + ")" : "Cart";

    if (!open) {
      root.innerHTML = "";
      root.style.display = "none";
      return;
    }

    var ship = readShip();
    var preview = previewCart(
      items,
      storeOffers,
      readCode(),
      chosenShippingMinor(ship),
    );
    var subtotal = preview.catalogueSubtotalMinor;
    var shipping = preview.shippingMinor;
    var total = preview.totalMinor;
    var t = palette();
    var scheme = isDarkTheme() ? "dark" : "light";

    var giftLines = "";
    for (var gi = 0; gi < preview.gifts.length; gi++) {
      giftLines +=
        '<div style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid ' +
        t.lineSoft +
        ";color:" +
        t.gift +
        '">' +
        '<div style="font-weight:600;font-size:0.85rem">Free: ' +
        escapeHtml(preview.gifts[gi].title) +
        '</div><div style="font-size:0.8rem">×' +
        preview.gifts[gi].quantity +
        "</div></div>";
    }

    var invalidIds = errorOpts.invalidVariantIds || [];
    var lines = "";
    if (!items.length) {
      lines =
        '<p style="margin:1rem 0;color:' +
        t.muted +
        ';font-size:0.9rem">Your cart is empty.</p>';
    } else {
      for (var li = 0; li < items.length; li++) {
        var item = items[li];
        var lineBad = invalidIds.indexOf(item.variantId) !== -1;
        lines +=
          '<div data-ps-line="' +
          escapeAttr(item.variantId) +
          '" style="display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid ' +
          t.lineSoft +
          '">' +
          '<div style="min-width:0">' +
          '<div style="font-weight:600;font-size:0.9rem">' +
          escapeHtml(item.title) +
          "</div>" +
          (item.optionsLabel
            ? '<div style="color:' +
              t.muted +
              ';font-size:0.78rem;margin-top:2px">' +
              escapeHtml(item.optionsLabel) +
              "</div>"
            : "") +
          '<div style="color:' +
          t.muted +
          ';font-size:0.78rem;margin-top:2px">' +
          formatMoney(item.priceMinor, storeMeta.currency) +
          " each</div>" +
          (lineBad
            ? '<div style="color:#dc2626;font-size:0.78rem;margin-top:4px">This item is no longer available.</div>'
            : "") +
          '<button type="button" data-ps-remove="' +
          escapeAttr(item.variantId) +
          '" style="margin-top:6px;border:0;background:none;color:' +
          t.muted +
          ';padding:0;font-size:0.78rem;cursor:pointer;text-decoration:underline">Remove</button>' +
          "</div>" +
          '<input data-ps-qty="' +
          escapeAttr(item.variantId) +
          '" type="number" min="1" max="' +
          (item.maxStock || 99) +
          '" value="' +
          item.quantity +
          '" style="width:64px;height:36px;border:1px solid ' +
          (lineBad ? "#dc2626" : t.line) +
          ";border-radius:8px;padding:0 8px;background:" +
          t.inputBg +
          ";color:" +
          t.text +
          '" />' +
          "</div>";
      }
    }

    root.style.cssText =
      "display:block;position:fixed;inset:0;z-index:2147483001;font-family:Outfit,system-ui,sans-serif";
    root.innerHTML =
      '<div data-ps-backdrop style="position:absolute;inset:0;background:rgba(0,0,0,.35)"></div>' +
      '<aside style="position:absolute;top:0;right:0;height:100%;width:min(100%,420px);background:' +
      t.bg +
      ";color:" +
      t.text +
      ";color-scheme:" +
      scheme +
      ';box-shadow:0 25px 50px rgba(0,0,0,.25);display:flex;flex-direction:column">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid ' +
      t.lineSoft +
      '">' +
      "<div><div style=\"font-weight:700\">" +
      escapeHtml(storeMeta.name || "Your cart") +
      '</div><div style="font-size:0.75rem;color:' +
      t.muted +
      '">Powered by PaySynk</div></div>' +
      '<button type="button" data-ps-close style="border:0;background:none;color:' +
      t.muted +
      ';cursor:pointer;font-size:0.9rem">Close</button>' +
      "</div>" +
      '<div style="flex:1;overflow:auto;padding:0 18px">' +
      lines +
      giftLines +
      (items.length ? deliveryFieldsHtml(readShip()) : "") +
      "</div>" +
      (items.length
        ? '<div style="padding:16px 18px;border-top:1px solid ' +
          t.lineSoft +
          '">' +
          '<div style="display:flex;gap:8px;margin-bottom:10px">' +
          '<input data-ps-code type="text" placeholder="Discount code" value="' +
          escapeAttr(readCode()) +
          '" style="flex:1;height:36px;border:1px solid ' +
          t.line +
          ";border-radius:8px;padding:0 10px;font-size:0.85rem;background:" +
          t.inputBg +
          ";color:" +
          t.text +
          '" />' +
          '<button type="button" data-ps-apply-code style="border:1px solid ' +
          t.line +
          ";background:" +
          t.bg +
          ";color:" +
          t.text +
          ';border-radius:8px;padding:0 12px;font-size:0.8rem;cursor:pointer">Apply</button>' +
          "</div>" +
          (preview.codeError
            ? '<p style="color:' +
              t.error +
              ';font-size:0.78rem;margin:0 0 8px">' +
              escapeHtml(preview.codeError) +
              "</p>"
            : "") +
          '<div style="display:flex;justify-content:space-between;font-size:0.9rem;color:' +
          t.totals +
          ';margin-bottom:6px"><span>Items</span><span>' +
          formatMoney(subtotal, storeMeta.currency) +
          "</span></div>" +
          (preview.discountMinor
            ? '<div style="display:flex;justify-content:space-between;font-size:0.9rem;color:' +
              t.gift +
              ';margin-bottom:6px"><span>' +
              escapeHtml(preview.discountLabel || "Discount") +
              "</span><span>−" +
              formatMoney(preview.discountMinor, storeMeta.currency) +
              "</span></div>"
            : "") +
          '<div style="display:flex;justify-content:space-between;font-size:0.9rem;color:' +
          t.totals +
          ';margin-bottom:6px"><span>' +
          escapeHtml(shippingLabel(ship)) +
          "</span><span>" +
          formatMoney(shipping, storeMeta.currency) +
          "</span></div>" +
          '<div style="display:flex;justify-content:space-between;font-weight:700;margin-bottom:12px"><span>Total</span><span>' +
          formatMoney(total, storeMeta.currency) +
          "</span></div>" +
          (errorMessage
            ? '<p style="color:' +
              t.error +
              ';font-size:0.85rem;margin:0 0 10px">' +
              escapeHtml(errorMessage) +
              "</p>"
            : "") +
          (storeMeta.paymentsActive
            ? '<button type="button" data-ps-checkout ' +
              (busy ? "disabled " : "") +
              'style="width:100%;border:0;border-radius:999px;padding:0.75rem 1rem;font-weight:600;cursor:pointer;background:#9FE870;color:#141414">' +
              (busy ? "Redirecting…" : "Checkout with Stripe") +
              "</button>"
            : '<p style="margin:0;font-size:0.82rem;color:' +
              t.muted +
              '">Preview only — checkout turns on after Stripe is connected in PaySynk Settings.</p>') +
          "</div>"
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

    var applyBtn = root.querySelector("[data-ps-apply-code]");
    if (applyBtn) {
      applyBtn.onclick = function () {
        persistShipFromForm();
        var input = root.querySelector("[data-ps-code]");
        writeCode(input ? input.value : "");
        render();
      };
    }

    var shipInputs = root.querySelectorAll(
      "[data-ps-name],[data-ps-email],[data-ps-phone],[data-ps-line1],[data-ps-line2],[data-ps-city],[data-ps-postcode],[data-ps-country]",
    );
    for (var si = 0; si < shipInputs.length; si++) {
      shipInputs[si].oninput = persistShipFromForm;
      shipInputs[si].onchange = persistShipFromForm;
    }

    var destRadios = root.querySelectorAll("[data-ps-dest]");
    for (var di = 0; di < destRadios.length; di++) {
      destRadios[di].onchange = function () {
        persistShipFromForm();
        var next = readShip();
        if (this.getAttribute("data-ps-dest") === "GB") {
          next.country = "GB";
        } else {
          var countries = storeMeta.shippingCountries || [];
          next.country =
            next.country && next.country !== "GB"
              ? next.country
              : countries[0]
                ? countries[0].code
                : "IE";
        }
        writeShip(next);
        render();
      };
    }

    var checkoutBtn = root.querySelector("[data-ps-checkout]");
    if (checkoutBtn) checkoutBtn.onclick = checkout;

    if (preview.codeError && !errorOpts.field) {
      errorOpts.field = "discountCode";
    }
    applyCheckoutUiError(errorOpts);
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
        storeOffers = (data && data.offers) || [];
      })
      .catch(function () {
        /* keep defaults */
      });
  }

  window.PaySynkCart = {
    open: function (slug) {
      if (slug && slug !== storeSlug) return;
      if (!cartVisible()) return;
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
    if (wantsPreview()) render();
    loadStoreMeta().then(function () {
      render();
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
