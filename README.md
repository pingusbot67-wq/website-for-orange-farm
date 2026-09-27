# Sunmist Fruit — website

A one-page website for Sunmist Fruit, a U-Pick tangerine and Meyer lemon farm in Temecula, California. It has 3D scroll animation and a full English / 中文 language switch.

## What's on the page

| Section | What it does |
|---|---|
| **Hero** | A 3D Tango tangerine floats beside the headline, follows the cursor, and spins faster when you flick the mouse. |
| **Our grove** | As you scroll, the tangerine splits open and sprays juice to show its segments. Animated stats: 20,000+ trees, 5M lbs lemons, 1M lbs tangerines. |
| **Our fruit** | A pinned section. As you scroll, the fruit changes from tangerine to Meyer lemon, then blueberries, then avocado. Each fruit has a **Details** pop-up covering taste, picking tips, how to enjoy it, and price. |
| **U-Pick** | The three steps, the price board, and season and hours. A live badge says whether the farm is open right now or when the next U-Pick day is (Pacific time). |
| **Visit** | A "what to bring" checklist that remembers ticks, facts (bags and poles, picnics, trails), a Google Map, and directions. |
| **Farm stay** | The orchard villa and stargazing cabin, over an animated night sky. |
| **Weddings & events** | The venue pitch and an enquiry button. |
| **Wholesale** | A quote-request form. |
| **Book** | The U-Pick reservation form. Fruit tumbles down and piles up behind it (visitors can push it around with the cursor, or press "Shake the tree"). |

The forms don't need a server. Submitting one checks the fields, including that the date is a weekend in season, then opens the visitor's email app with a message to `sales@sunmistfruit.com` already written.

## Language

The **EN / 中文** button in the header switches every piece of text, including form messages, the pop-ups and dates. The choice is remembered. You can also link straight to a language with `?lang=zh` or `?lang=en`. Chinese-language browsers get Chinese automatically.

- English text lives in `index.html`.
- Chinese text lives in `assets/js/i18n.js`, under the same `data-i18n` key.

## Updating things each season

- **Season dates and hours:** the `SITE` block at the top of `assets/js/main.js` (these drive the open badge and the booking checks), plus the wording in `index.html` and `assets/js/i18n.js`.
- **Prices:** search for `$2.50`, `$1.50` and `$10` in `index.html` and `assets/js/i18n.js`.
- **WeChat QR code:** save it as `assets/img/wechat-qr.png`, then uncomment the `<img>` line near "WeChat reservations welcome" in `index.html`.

## Running it

It's a static site: upload the folder to any web host (GitHub Pages, Netlify, cPanel and so on). To preview it locally:

```bash
npm run serve        # or: python3 -m http.server
```

The 3D scene is written in `src/scene.js` and bundled into `assets/js/scene.js`. After you edit the scene:

```bash
npm install
npm run build
```

## How it's built

- **Three.js** for the 3D fruit. Every peel texture, the cut-open segments (a custom shader), the leaves and the lighting are generated in code, so there are no 3D model or image files.
- **GSAP + ScrollTrigger** for the scroll animation, and **Lenis** for smooth scrolling. All are vendored in `assets/vendor/`, so no CDN is needed.
- Fonts: Bricolage Grotesque and Instrument Serif are self-hosted (SIL OFL). Noto Sans SC loads from Google Fonts for Chinese, with PingFang and Microsoft YaHei as fallbacks.
- Visitors who have reduced motion turned on, or whose device has no WebGL, get a lighter CSS version with the same content.
