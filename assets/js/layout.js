/*
 * Sunmist Fruit — shared header, footer and cart drawer.
 * Every page has <div id="site-header"></div> and <div id="site-footer"></div>;
 * this file fills them so the menu only has to be edited in one place.
 * English text lives here; Chinese is in i18n.js under the same data-i18n keys.
 */
(function () {
  'use strict';
  var page = document.body.getAttribute('data-page') || '';

  var NAV = [
    { href: 'index.html', key: 'nav.home', en: 'Home', page: 'home' },
    { href: 'u-pick.html', key: 'nav.upick', en: 'U-Pick', page: 'upick' },
    { href: 'shop.html', key: 'nav.shop', en: 'Shop', page: 'shop', children: [
      { href: 'shop.html', key: 'nav.shopAll', en: 'All products' },
      { href: 'product.html?id=tangerines', key: 'f0.name', en: 'Tango Tangerines' },
      { href: 'product.html?id=lemons', key: 'f1.name', en: 'Meyer Lemons' },
      { href: 'product.html?id=blueberries', key: 'f2.name', en: 'Blueberries' },
      { href: 'product.html?id=avocados', key: 'f3.name', en: 'Avocados' },
      { href: 'wholesale.html', key: 'nav.wholesale', en: 'Fruit Wholesale' },
    ] },
    { href: 'weddings.html', key: 'nav.weddings', en: 'Weddings', page: 'weddings' },
    { href: 'events.html', key: 'nav.events', en: 'Special Events', page: 'events' },
    { href: 'airbnb.html', key: 'nav.stay', en: 'Airbnb', page: 'stay' },
    { href: 'about.html', key: 'nav.about', en: 'About Us', page: 'about' },
    { href: 'contact.html', key: 'nav.contact', en: 'Contact', page: 'contact' },
  ];

  var icon = function (id) { return '<svg class="i"><use href="#i-' + id + '"/></svg>'; };
  var link = function (n, cls) {
    return '<a href="' + n.href + '" class="' + (cls || '') + (n.page === page ? ' is-current' : '') + '"' + (n.page === page ? ' aria-current="page"' : '') + '><span data-i18n="' + n.key + '">' + n.en + '</span></a>';
  };

  var desktop = NAV.map(function (n) {
    if (!n.children) return link(n, 'nav__link');
    return '<div class="nav__drop">' + link(n, 'nav__link nav__link--drop') +
      '<div class="nav__menu">' + n.children.map(function (c) { return '<a href="' + c.href + '"><span data-i18n="' + c.key + '">' + c.en + '</span></a>'; }).join('') + '</div></div>';
  }).join('');

  var mobile = NAV.map(function (n) {
    var out = link(n, 'mmenu__link');
    if (n.children) out += '<div class="mmenu__sub">' + n.children.slice(1).map(function (c) { return '<a href="' + c.href + '"><span data-i18n="' + c.key + '">' + c.en + '</span></a>'; }).join('') + '</div>';
    return out;
  }).join('');

  var header =
    '<div class="topbar" id="topbar"><div class="topbar__inner">' +
      '<div class="topbar__contact"><a href="tel:+16268987800">' + icon('phone') + '626-898-7800</a><a href="mailto:sales@sunmistfruit.com">' + icon('mail') + 'sales@sunmistfruit.com</a></div>' +
      '<div class="topbar__right"><span class="topbar__hours">' + icon('clock') + '<span data-i18n="top.hours">U-Pick every Sat &amp; Sun, 10am – 2pm</span></span>' +
      '<button class="lang" id="langToggle" type="button" aria-label="Switch language / 切换语言"><span class="lang__opt" data-l="en">EN</span><span class="lang__sep">/</span><span class="lang__opt" data-l="zh">中文</span></button></div>' +
    '</div></div>' +
    '<header class="nav" id="nav">' +
      '<a href="index.html" class="nav__logo" aria-label="Sunmist Fruit"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="22" r="15" fill="#ff7417"/><circle cx="15" cy="17" r="4" fill="#ffb25a" opacity=".7"/><path d="M20 8c2-5 8-7 13-5-2 5-7 7-13 5z" fill="#2f6b2a"/><path d="M20 7.5v3" stroke="#2f6b2a" stroke-width="2" stroke-linecap="round"/></svg><span>Sunmist<em>Fruit</em></span></a>' +
      '<nav class="nav__links" aria-label="Main">' + desktop + '</nav>' +
      '<div class="nav__actions">' +
        '<button class="cart-btn" id="cartOpen" type="button" aria-label="Cart">' + icon('bag') + '<span class="cart-btn__count" id="cartCount">0</span></button>' +
        '<a href="u-pick.html#book" class="btn btn--sm btn--orange nav__cta" data-magnetic><span data-i18n="nav.book">Book U-Pick</span></a>' +
        '<button class="burger" id="burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span></button>' +
      '</div>' +
    '</header>' +
    '<div class="mmenu" id="mobileMenu" hidden><nav>' + mobile + '</nav>' +
      '<p class="mmenu__contact"><a href="tel:+16268987800">626-898-7800</a><br><a href="mailto:sales@sunmistfruit.com">sales@sunmistfruit.com</a></p></div>' +
    '<aside class="drawer" id="cartDrawer" aria-label="Cart" hidden>' +
      '<div class="drawer__scrim" data-cart-close></div>' +
      '<div class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="cartTitle">' +
        '<div class="drawer__head"><h2 id="cartTitle" data-i18n="cart.title">Your cart</h2><button type="button" class="drawer__close" data-cart-close aria-label="Close">×</button></div>' +
        '<div class="drawer__body" id="cartItems"></div>' +
        '<div class="drawer__foot"><div class="drawer__total"><span data-i18n="cart.subtotal">Subtotal</span><strong id="cartSubtotal">$0.00</strong></div>' +
          '<p class="fine" data-i18n="cart.note">Pick up at the farm or have it shipped — we confirm every order personally.</p>' +
          '<a href="checkout.html" class="btn btn--orange btn--block btn--lg" id="cartCheckout"><span data-i18n="cart.checkout">Checkout</span>' + icon('arrow') + '</a>' +
          '<a href="shop.html" class="btn btn--ghost btn--block" data-cart-close><span data-i18n="cart.continue">Continue shopping</span></a></div>' +
      '</div>' +
    '</aside>' +
    '<div class="toast" id="toast" role="status" aria-live="polite"></div>' +
    '<div class="curtain" id="curtain" aria-hidden="true"></div>' +
    '<div class="cursor" aria-hidden="true"><div class="cursor__dot"></div><div class="cursor__ring"><span class="cursor__label" data-i18n="cursor.pick">Pick</span></div></div>';

  var footer =
    '<footer class="footer"><div class="wrap">' +
      '<div class="footer__top">' +
        '<div><p class="footer__label" data-i18n="foot.visit">Visit</p><p>26700 Avenida Del Oro<br>Temecula, CA 92590</p>' +
          '<p class="footer__small"><a href="https://www.google.com/maps/dir/?api=1&destination=26700+Avenida+Del+Oro,+Temecula,+CA+92590" target="_blank" rel="noopener" data-i18n="visit.dir">Directions</a></p></div>' +
        '<div><p class="footer__label" data-i18n="foot.hours">U-Pick hours</p><p data-i18n="foot.hoursV">Sat &amp; Sun, 10am – 2pm<br>April 18 – October 31</p></div>' +
        '<div><p class="footer__label" data-i18n="foot.explore">Explore</p><p class="footer__links">' +
          '<a href="u-pick.html" data-i18n="nav.upick">U-Pick</a><a href="shop.html" data-i18n="nav.shop">Shop</a><a href="weddings.html" data-i18n="nav.weddings">Weddings</a><a href="events.html" data-i18n="nav.events">Special Events</a><a href="airbnb.html" data-i18n="nav.stay">Airbnb</a><a href="wholesale.html" data-i18n="nav.wholesale">Fruit Wholesale</a><a href="about.html" data-i18n="nav.about">About Us</a></p></div>' +
        '<div><p class="footer__label" data-i18n="foot.contact">Contact</p><p><a href="tel:+16268987800">626-898-7800</a><br><a href="tel:+12258038239">225-803-8239</a><br><a href="mailto:sales@sunmistfruit.com">sales@sunmistfruit.com</a><br><a href="https://x.com/sunmistfruit" target="_blank" rel="noopener">X / @sunmistfruit</a></p>' +
          '<p class="footer__small"><button type="button" class="linklike" data-setlang="zh">中文版</button> · <button type="button" class="linklike" data-setlang="en">English</button></p></div>' +
      '</div>' +
      '<div class="footer__word" aria-hidden="true">Sunmist</div>' +
      '<div class="footer__bottom"><p>© <span id="year">2026</span> Sunmist Fruit</p><p data-i18n="foot.made">Grown in Temecula, California</p><a href="#top" class="linklike" data-i18n="foot.top">Back to top ↑</a></div>' +
    '</div></footer>';

  var sprite =
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' +
    '<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>' +
    '<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>' +
    '<symbol id="i-minus" viewBox="0 0 24 24"><path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>' +
    '<symbol id="i-clock" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></g></symbol>' +
    '<symbol id="i-cal" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></g></symbol>' +
    '<symbol id="i-pin" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></g></symbol>' +
    '<symbol id="i-phone" viewBox="0 0 24 24"><path d="M6.6 3.5h2.7l1.4 4-2 1.3a11 11 0 0 0 6.5 6.5l1.3-2 4 1.4v2.7a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>' +
    '<symbol id="i-mail" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7l8 6 8-6"/></g></symbol>' +
    '<symbol id="i-chat" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M9.5 4C5.4 4 2.5 6.6 2.5 9.8c0 1.8.9 3.3 2.4 4.4L4.3 17l3-1.6c.7.2 1.4.3 2.2.3"/><path d="M15 9c3.6 0 6.5 2.3 6.5 5.2 0 1.5-.8 2.9-2 3.8l.5 2.3-2.6-1.3c-.8.2-1.6.4-2.4.4-3.6 0-6.5-2.3-6.5-5.2S11.4 9 15 9z"/></g></symbol>' +
    '<symbol id="i-basket" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M3 10h18l-2 9a2 2 0 0 1-2 1.5H7A2 2 0 0 1 5 19z"/><path d="M8 10l3-6M16 10l-3-6M9 14v3M15 14v3M12 14v3"/></g></symbol>' +
    '<symbol id="i-bag" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></g></symbol>' +
    '<symbol id="i-scale" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16M7 20h10M5 7h14"/><path d="M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/></g></symbol>' +
    '<symbol id="i-leaf" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19C4 11 9 5 20 4c0 11-6 16-15 15z"/><path d="M5 19l8-8"/></g></symbol>' +
    '<symbol id="i-mountain" viewBox="0 0 24 24"><path d="M2 20l7-12 4 6 3-4 6 10z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>' +
    '<symbol id="i-sun" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g></symbol>' +
    '<symbol id="i-ring" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><circle cx="12" cy="14.5" r="6"/><path d="M9 4h6l-3 4.5z"/></g></symbol>' +
    '<symbol id="i-users" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.5c2.6.1 4.4 1.8 5 4.5"/></g></symbol>' +
    '<symbol id="i-home" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></g></symbol>' +
    '<symbol id="i-star" viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>' +
    '<symbol id="i-truck" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M2 6h12v10H2zM14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></g></symbol>' +
    '<symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></symbol>' +
    '<symbol id="i-ticket" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V4H3z" transform="translate(0 2)"/><path d="M14 6v12" stroke-dasharray="2 2"/></g></symbol>' +
    '<symbol id="art-arch" viewBox="0 0 200 160"><defs><linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2c4"/><stop offset="1" stop-color="#ffc9a6"/></linearGradient></defs>' +
    '<rect width="200" height="160" fill="url(#gA)"/><circle cx="150" cy="46" r="20" fill="#fff4dd"/>' +
    '<path d="M0 104 Q60 88 110 98 T200 92 V160 H0z" fill="#9fbf74"/><path d="M0 118 Q70 106 130 116 T200 112 V160 H0z" fill="#7fa65a"/>' +
    '<g fill="#2f5a2a"><circle cx="14" cy="96" r="13"/><circle cx="36" cy="92" r="12"/><circle cx="170" cy="92" r="13"/><circle cx="192" cy="96" r="12"/><circle cx="4" cy="116" r="15"/><circle cx="196" cy="116" r="15"/></g>' +
    '<g fill="#ff8a1e"><circle cx="10" cy="92" r="2.4"/><circle cx="18" cy="99" r="2.4"/><circle cx="34" cy="88" r="2.4"/><circle cx="40" cy="96" r="2.4"/><circle cx="166" cy="89" r="2.4"/><circle cx="175" cy="97" r="2.4"/><circle cx="2" cy="112" r="2.4"/><circle cx="198" cy="113" r="2.4"/></g>' +
    '<g fill="#f6d34a"><circle cx="188" cy="92" r="2.2"/><circle cx="194" cy="100" r="2.2"/><circle cx="8" cy="120" r="2.2"/></g>' +
    '<path d="M86 160 L96 112 H104 L114 160z" fill="#f4e6cf"/>' +
    '<path d="M72 128 V86 a28 28 0 0 1 56 0 V128" fill="none" stroke="#8a5a32" stroke-width="4" stroke-linecap="round"/>' +
    '<g fill="#fff" stroke="#f2b9c3" stroke-width=".8"><circle cx="74" cy="84" r="4.5"/><circle cx="80" cy="70" r="4"/><circle cx="92" cy="61" r="4.5"/><circle cx="108" cy="61" r="4.5"/><circle cx="120" cy="70" r="4"/><circle cx="126" cy="84" r="4.5"/><circle cx="100" cy="58" r="4"/></g>' +
    '<g fill="#3f7a35"><ellipse cx="85" cy="64" rx="4" ry="2" transform="rotate(-30 85 64)"/><ellipse cx="115" cy="64" rx="4" ry="2" transform="rotate(30 115 64)"/><ellipse cx="73" cy="92" rx="4" ry="2" transform="rotate(70 73 92)"/><ellipse cx="127" cy="92" rx="4" ry="2" transform="rotate(-70 127 92)"/></g>' +
    '<g fill="#fffaf3" stroke="#c9a67c" stroke-width=".8"><rect x="58" y="132" width="10" height="7" rx="1.5"/><rect x="44" y="140" width="11" height="8" rx="1.5"/><rect x="132" y="132" width="10" height="7" rx="1.5"/><rect x="145" y="140" width="11" height="8" rx="1.5"/><rect x="30" y="150" width="12" height="8" rx="1.5"/><rect x="158" y="150" width="12" height="8" rx="1.5"/></g></symbol>' +
    '<symbol id="art-barn" viewBox="0 0 200 160"><defs><linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2d55"/><stop offset=".6" stop-color="#c46a5a"/><stop offset="1" stop-color="#f3a86b"/></linearGradient><radialGradient id="gBl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".8"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>' +
    '<rect width="200" height="160" fill="url(#gB)"/><path d="M0 110 Q50 96 100 104 T200 100 V160 H0z" fill="#2c3a2a"/>' +
    '<path d="M110 118 V84 L140 62 L170 84 V118z" fill="#7a2e22"/><path d="M104 86 L140 58 L176 86" fill="none" stroke="#3a150f" stroke-width="5" stroke-linecap="round"/>' +
    '<rect x="131" y="92" width="18" height="26" fill="#ffcf7a"/><path d="M131 92 L149 118 M149 92 L131 118" stroke="#7a2e22" stroke-width="2"/><circle cx="140" cy="100" r="40" fill="url(#gBl)"/>' +
    '<path d="M6 40 Q50 64 100 44 T196 42" fill="none" stroke="#2a2233" stroke-width="1"/>' +
    '<g fill="#ffe7a0"><circle cx="16" cy="45" r="2"/><circle cx="30" cy="51" r="2"/><circle cx="46" cy="54" r="2"/><circle cx="62" cy="53" r="2"/><circle cx="78" cy="50" r="2"/><circle cx="94" cy="46" r="2"/><circle cx="112" cy="41" r="2"/><circle cx="130" cy="39" r="2"/><circle cx="148" cy="40" r="2"/><circle cx="166" cy="42" r="2"/><circle cx="184" cy="43" r="2"/></g>' +
    '<rect x="14" y="124" width="84" height="6" rx="2" fill="#f6ead6"/><g fill="#5a3a22"><rect x="18" y="130" width="3" height="12"/><rect x="91" y="130" width="3" height="12"/></g>' +
    '<g fill="#ffcf7a"><rect x="24" y="118" width="3" height="6"/><rect x="44" y="118" width="3" height="6"/><rect x="64" y="118" width="3" height="6"/><rect x="84" y="118" width="3" height="6"/></g>' +
    '<g fill="#ff8a1e"><circle cx="34" cy="122" r="2.6"/><circle cx="54" cy="122" r="2.6"/><circle cx="74" cy="122" r="2.6"/></g></symbol>' +
    '<symbol id="art-valley" viewBox="0 0 200 160"><defs><linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb85c"/><stop offset="1" stop-color="#ffe3b0"/></linearGradient></defs>' +
    '<rect width="200" height="160" fill="url(#gV)"/><circle cx="100" cy="84" r="30" fill="#fff1c9"/>' +
    '<path d="M0 90 Q40 70 80 86 T160 78 T200 84 V160 H0z" fill="#c9a36a" opacity=".7"/><path d="M0 104 Q60 88 120 100 T200 96 V160 H0z" fill="#8fae62"/><path d="M0 124 Q80 110 200 122 V160 H0z" fill="#5f8a44"/>' +
    '<g fill="#2f5a2a">' + [0,1,2,3,4,5,6,7,8].map(function(i){return '<circle cx="'+(10+i*23)+'" cy="'+(132+(i%2)*4)+'" r="9"/>';}).join('') + '</g>' +
    '<g fill="#ff8a1e">' + [0,1,2,3,4,5,6,7,8].map(function(i){return '<circle cx="'+(8+i*23)+'" cy="'+(130+(i%2)*4)+'" r="2"/>';}).join('') + '</g>' +
    '<g fill="#2f5a2a">' + [0,1,2,3,4,5,6,7,8,9].map(function(i){return '<circle cx="'+(i*22)+'" cy="'+(152+(i%2)*3)+'" r="11"/>';}).join('') + '</g>' +
    '<g fill="#f6d34a">' + [0,1,2,3,4,5,6,7,8,9].map(function(i){return '<circle cx="'+(i*22+3)+'" cy="'+(150+(i%2)*3)+'" r="2"/>';}).join('') + '</g>' +
    '<g fill="none" stroke="#6a4a2a" stroke-width="1.4" stroke-linecap="round"><path d="M56 60 q4 -3 8 0 q4 -3 8 0"/><path d="M130 50 q3 -2 6 0 q3 -2 6 0"/></g></symbol>' +
    '<symbol id="art-cabin" viewBox="0 0 200 160"><rect width="200" height="160" fill="#101c30"/>' +
    '<g fill="#fff6e0">' + [[20,20],[48,36],[80,14],[120,30],[160,18],[184,44],[30,60],[140,58],[100,50],[70,40]].map(function(p){return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="1.2"/>';}).join('') + '</g>' +
    '<circle cx="158" cy="40" r="13" fill="#fff3d6"/><circle cx="164" cy="36" r="12" fill="#101c30"/>' +
    '<path d="M0 120 Q60 96 110 112 T200 106 V160 H0z" fill="#1d3a28"/><circle cx="100" cy="112" r="44" fill="#ffbf6a" opacity=".22"/>' +
    '<path d="M70 124 V100 L100 78 L130 100 V124z" fill="#3b2616"/><path d="M64 102 L100 74 L136 102" fill="none" stroke="#241509" stroke-width="6" stroke-linecap="round"/>' +
    '<rect x="92" y="104" width="16" height="20" rx="2" fill="#ffc46e"/><rect x="76" y="104" width="11" height="9" rx="1.5" fill="#ffc46e"/><rect x="113" y="104" width="11" height="9" rx="1.5" fill="#ffc46e"/>' +
    '<g fill="#16301f"><circle cx="30" cy="118" r="14"/><circle cx="172" cy="112" r="15"/></g><g fill="#ff8a1e"><circle cx="26" cy="114" r="2"/><circle cx="34" cy="121" r="2"/><circle cx="168" cy="108" r="2"/><circle cx="176" cy="116" r="2"/></g></symbol>' +
    '<symbol id="art-cabin-lg" viewBox="0 0 420 340"><defs><linearGradient id="hill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#1f3a2a"/><stop offset="1" stop-color="#0c1a12"/></linearGradient><radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffbf6a" stop-opacity=".9"/><stop offset="1" stop-color="#ffbf6a" stop-opacity="0"/></radialGradient></defs>' +
    '<circle cx="330" cy="70" r="26" fill="#fff3d6"/><circle cx="342" cy="62" r="24" fill="#0f1a2c"/><path d="M0 250 Q110 180 220 230 T420 210 V340 H0Z" fill="url(#hill)"/>' +
    '<g fill="#16301f"><circle cx="40" cy="238" r="22"/><circle cx="78" cy="228" r="18"/><circle cx="360" cy="222" r="24"/><circle cx="395" cy="232" r="18"/></g>' +
    '<g fill="#ff8a2a"><circle cx="34" cy="232" r="3"/><circle cx="48" cy="244" r="3"/><circle cx="82" cy="222" r="3"/><circle cx="354" cy="214" r="3"/><circle cx="370" cy="228" r="3"/><circle cx="398" cy="226" r="3"/></g>' +
    '<circle cx="210" cy="215" r="90" fill="url(#glow)" class="cabin__glow"/><path d="M140 250 V200 L210 150 L280 200 V250Z" fill="#3b2616"/><path d="M128 204 L210 142 L292 204" stroke="#241509" stroke-width="12" fill="none" stroke-linecap="round"/>' +
    '<g stroke="#2a1a0d" stroke-width="2" opacity=".6"><path d="M142 214H278M142 226H278M142 238H278"/></g>' +
    '<rect x="192" y="210" width="36" height="40" rx="3" fill="#ffc46e" class="cabin__win"/><rect x="152" y="208" width="24" height="20" rx="2" fill="#ffc46e" class="cabin__win"/><rect x="244" y="208" width="24" height="20" rx="2" fill="#ffc46e" class="cabin__win"/></symbol>' +
    '</svg>';

  var h = document.getElementById('site-header'); if (h) h.outerHTML = header;
  var f = document.getElementById('site-footer'); if (f) f.outerHTML = footer;
  document.body.insertAdjacentHTML('afterbegin', sprite);
})();
