# Sunmist Fruit — website

The Sunmist Fruit website (U-Pick, fruit shop, weddings, events, orchard villa and wholesale in Temecula, California), rebuilt with 3D fruit, scroll animation and a full English / 中文 switch.

## Pages

| Page | What's on it |
|---|---|
| `index.html` — Home | A 3D tangerine that splits open as you scroll, then turns into a lemon, blueberries and avocado (each with **Add to cart**). Then links to every part of the farm, a weddings feature, a shop preview, U-Pick hours with a live "open now" badge, and a fruit pile you can push around. |
| `u-pick.html` — U-Pick | How it works, prices (entry, red bag, fruit per lb), where each fruit grows, what to bring, map, and booking: **buy tickets and red bags** (weekend dates in season only), or **RSVP by email**. |
| `shop.html` — Shop | Every product with sizes, quantity and **Add to cart**. Filter by fresh fruit or U-Pick. |
| `product.html?id=…` — Product | 3D fruit, sizes, price, quantity, **Add to cart / Buy now**, then tabs for About, Taste, How to pick and How to enjoy. |
| `checkout.html` — Checkout | Contact details, pickup (with date) or shipping, and payment choice (Zelle / Venmo / cash). |
| `weddings.html` — Weddings | Price from $4,000, capacity, the venue, what's included, packages, how the day runs, FAQ and an enquiry form. |
| `events.html` — Special Events | Price from $2,000, event ideas, amenities and an enquiry form. |
| `airbnb.html` — Airbnb | The orchard villa and stargazing cabin, rooms, book-direct $200 saving and a booking request form. |
| `wholesale.html` — Fruit Wholesale | Volumes, products and a quote form. |
| `about.html` / `contact.html` | The farm's story, plus contact details, a message form and a map. |

Every page shares one header: a top bar (phone, email, hours, **EN / 中文**), then the logo, the menu with a **Shop** dropdown, the cart and **Book U-Pick**. Each menu link opens its own page with a short orange page transition.

## How orders and forms work

There is no server. The cart is saved in the visitor's browser. **Place order** and every enquiry form open the visitor's email app with a message to `sales@sunmistfruit.com` already filled in (items, sizes, dates, totals, pickup or shipping). The farm then replies to confirm and sends payment details. Nothing is charged on the website.

To take card payments later, the easiest route is a Stripe or Square payment link per product, or moving the catalogue into Shopify or WooCommerce.

## Editing

- **Products and prices:** `PRODUCTS` at the top of `assets/js/store.js`. The shop, product pages, cart and checkout all read from it. ⚠️ Blueberry and avocado prices are placeholders: please confirm them.
- **Season dates and hours:** `SITE` at the top of `assets/js/main.js` and `SEASON` in `assets/js/store.js`. Also update the wording in the pages.
- **Menu and footer:** `assets/js/layout.js`.
- **Chinese text:** `assets/js/i18n.js`. Each `data-i18n="key"` in the HTML has a Chinese line under the same key.
- **WeChat QR code:** save it as `assets/img/wechat-qr.png`, then uncomment the `<img>` line near "WeChat reservations welcome" in `u-pick.html` and `contact.html`.
- **Product photos:** `assets/img/fruit-*.png` are renders of the 3D fruit. Real photos can replace them under the same names.

## Running it

It's a static site: upload the folder to any host (GitHub Pages, Netlify, cPanel and so on), or preview it locally:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

The 3D scene source is `src/scene.js`. After editing it, run `npm install && npm run build` to rebuild `assets/js/scene.js`.

## Built with

Three.js (3D, with every texture generated in code), GSAP + ScrollTrigger and Lenis (all vendored in `assets/vendor/`), and self-hosted Bricolage Grotesque and Instrument Serif (SIL OFL) plus Noto Sans SC for Chinese. Visitors with reduced motion turned on, or without WebGL, get a lighter version with the same content.
