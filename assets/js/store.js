/*
 * Sunmist Fruit — shop, cart and checkout
 * ---------------------------------------
 * PRODUCTS below is the whole catalogue. Change a price, add a size or a new
 * product here and the shop, product pages, cart and checkout all follow.
 *
 * The cart lives in the visitor's browser. Checkout sends the order to the farm
 * by email (the visitor's mail app opens with the order filled in) and the farm
 * replies with payment instructions (Zelle / Venmo / cash at pickup).
 * To take card payments online later, add a `payLink` (e.g. a Stripe Payment
 * Link) to a product option — the product page then shows a "Pay now" button.
 */
(function () {
  'use strict';

  var EMAIL = 'sales@sunmistfruit.com';
  var SEASON = { start: '2026-04-18', end: '2026-10-31', days: [0, 6] };

  var PRODUCTS = [
    {
      id: 'tangerines', fruit: 0, detail: 0, cat: 'fruit', img: 'assets/img/fruit-tangerine.png', bg: '#ffe7c7',
      name: { en: 'Tango Tangerines', zh: 'Tango 蜜橘' },
      tag: { en: 'Seedless, easy to peel, sweet as candy.', zh: '无籽、易剥、甜如蜜糖。' },
      unit: { en: '$2.50 / lb', zh: '$2.50 / 磅' },
      options: [
        { id: '5lb', label: { en: '5 lb', zh: '5 磅' }, price: 12.5 },
        { id: '10lb', label: { en: '10 lb', zh: '10 磅' }, price: 25 },
        { id: '20lb', label: { en: '20 lb box', zh: '20 磅整箱' }, price: 50 },
      ],
    },
    {
      id: 'lemons', fruit: 1, detail: 1, cat: 'fruit', img: 'assets/img/fruit-lemon.png', bg: '#fff3b8',
      name: { en: 'Meyer Lemons', zh: '梅尔柠檬' },
      tag: { en: 'The chef’s lemon — floral, sweet, thin-skinned.', zh: '大厨最爱——花香浓郁、微甜、皮薄。' },
      unit: { en: 'from $1.20 / lb', zh: '低至 $1.20 / 磅' },
      options: [
        { id: '5lb', label: { en: '5 lb', zh: '5 磅' }, price: 9 },
        { id: '10lb', label: { en: '10 lb', zh: '10 磅' }, price: 15 },
        { id: '20lb', label: { en: '20 lb box', zh: '20 磅整箱' }, price: 24 },
      ],
    },
    {
      // PRICE TO CONFIRM — blueberry prices weren't visible on the old site
      id: 'blueberries', fruit: 2, detail: 2, cat: 'fruit', img: 'assets/img/fruit-blueberries.png', bg: '#e3e4f6',
      name: { en: 'Blueberries', zh: '蓝莓' },
      tag: { en: 'Sun-warm, straight off the bush.', zh: '带着阳光的温度，从枝头直接入口。' },
      unit: { en: 'Seasonal', zh: '当季供应' },
      options: [
        { id: '1lb', label: { en: '1 lb', zh: '1 磅' }, price: 8 },
        { id: '3lb', label: { en: '3 lb', zh: '3 磅' }, price: 22 },
      ],
    },
    {
      // PRICE TO CONFIRM — avocado prices weren't visible on the old site
      id: 'avocados', fruit: 3, detail: 3, cat: 'fruit', img: 'assets/img/fruit-avocado.png', bg: '#e2ebcf',
      name: { en: 'Avocados', zh: '牛油果' },
      tag: { en: 'Creamy fruit from the top of the hill.', zh: '来自山顶的绵密牛油果。' },
      unit: { en: 'Seasonal', zh: '当季供应' },
      options: [
        { id: '5lb', label: { en: '5 lb', zh: '5 磅' }, price: 15 },
        { id: '10lb', label: { en: '10 lb', zh: '10 磅' }, price: 28 },
      ],
    },
    {
      id: 'upick-ticket', fruit: 0, cat: 'upick', img: 'assets/img/fruit-tangerine.png', bg: '#ffe0c2', needsDate: true, badge: 'ticket',
      name: { en: 'U-Pick Entry Ticket', zh: '自助采摘门票' },
      tag: { en: 'Weekend entry to the grove. Kids 2 and under are free.', zh: '周末入园采摘。2 岁及以下儿童免费。' },
      unit: { en: '$10 / person', zh: '$10 / 人' },
      options: [{ id: 'person', label: { en: 'Per person', zh: '每人' }, price: 10 }],
      about: {
        en: 'Your ticket lets you into the grove on the date you choose (Saturdays and Sundays, 10am – 2pm, April 18 – October 31). Pick as you go and pay for the fruit by the pound at the scale: Tango tangerines $2.50 / lb, Meyer lemons $1.50 / lb, blueberries and avocados at seasonal prices.',
        zh: '门票可在您选定的日期入园（4月18日至10月31日的每个周六、周日，上午10点至下午2点）。边摘边装，最后在秤前按磅付款：Tango 蜜橘 $2.50/磅，梅尔柠檬 $1.50/磅，蓝莓和牛油果按季定价。',
      },
    },
    {
      id: 'red-bag', fruit: 0, cat: 'upick', img: 'assets/img/fruit-tangerine.png', bg: '#ffd9d2', badge: 'bag',
      name: { en: 'U-Pick Red Bag', zh: '采摘红袋' },
      tag: { en: 'Fill it with up to 10 lb of Tango tangerines.', zh: '可装满最多 10 磅 Tango 蜜橘。' },
      unit: { en: '$25 / bag', zh: '$25 / 袋' },
      options: [{ id: 'bag', label: { en: '1 bag (10 lb)', zh: '1 袋（10 磅）' }, price: 25 }],
      about: {
        en: 'Our signature red bag holds about 10 lb of fresh Tango tangerines. Buy it ahead, pick it up at the stand on your visit and fill it straight from the trees.',
        zh: '招牌红袋可装约 10 磅新鲜 Tango 蜜橘。提前购买，到访时在采摘点领取，直接从树上摘满。',
      },
    },
  ];

  var UI = {
    en: {
      add: 'Add to cart', added: 'Added to cart', buy: 'Buy now', view: 'View', from: 'From', size: 'Size', qty: 'Quantity',
      date: 'Visit date', dateNeeded: 'Choose a weekend date in season first.', remove: 'Remove', each: 'each',
      empty: 'Your cart is empty.', emptyCta: 'Shop fruit', all: 'All', fruit: 'Fresh fruit', upick: 'U-Pick',
      about: 'About', taste: 'Taste', pick: 'How to pick', enjoy: 'How to enjoy', related: 'You might also like',
      pickup: 'Pick up at the farm', ship: 'Ship to me', home: 'Home', shop: 'Shop', notFound: 'We couldn’t find that product.',
      orderSubject: 'New order {no} — {name}', orderDone: 'Thank you! Order {no} is ready to send.',
      orderDoneP: 'Your email app has opened with the order filled in — press send and we will confirm availability, pickup or shipping, and payment within a day. Questions? Call 626-898-7800.',
      required: 'Please fill in the highlighted fields.', shipping: 'Shipping', shippingV: 'Quoted after we confirm', total: 'Estimated total',
      payLabel: 'Payment', ticketFor: 'Tickets for {date}', infantsFree: 'Kids 2 and under are free — no ticket needed.', kidsFree: 'free',
      addedTickets: '{n} ticket(s) added for {date}', lines: 'Order', perLb: 'per lb', payNow: 'Pay now',
    },
    zh: {
      add: '加入购物车', added: '已加入购物车', buy: '立即购买', view: '查看', from: '起', size: '规格', qty: '数量',
      date: '到访日期', dateNeeded: '请先选择采摘季内的周末日期。', remove: '删除', each: '每件',
      empty: '购物车是空的。', emptyCta: '去选购水果', all: '全部', fruit: '新鲜水果', upick: '自助采摘',
      about: '简介', taste: '口感', pick: '采摘技巧', enjoy: '食用建议', related: '您可能还喜欢',
      pickup: '到农场自取', ship: '邮寄到家', home: '首页', shop: '商店', notFound: '未找到该商品。',
      orderSubject: '新订单 {no} — {name}', orderDone: '谢谢！订单 {no} 已准备好发送。',
      orderDoneP: '邮件应用已打开并填好订单内容——点击发送后，我们会在一天内确认库存、自取或邮寄方式以及付款方式。有疑问请致电 626-898-7800。',
      required: '请填写标红的必填项。', shipping: '运费', shippingV: '确认订单后报价', total: '预计合计',
      payLabel: '付款方式', ticketFor: '{date} 的门票', infantsFree: '2 岁及以下儿童免费，无需购票。', kidsFree: '免费',
      addedTickets: '已添加 {n} 张 {date} 的门票', lines: '订单', perLb: '每磅', payNow: '立即付款',
    },
  };

  /* ---------------------------------------------------------------- helpers */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var lang = function () { return document.documentElement.getAttribute('data-lang') === 'zh' ? 'zh' : 'en'; };
  var t = function (o) { return o ? (o[lang()] || o.en) : ''; };
  var ui = function (k, vars) { var s = UI[lang()][k] || UI.en[k]; return vars ? s.replace(/\{(\w+)\}/g, function (_, x) { return vars[x]; }) : s; };
  var money = function (n) { return '$' + n.toFixed(2); };
  var byId = function (id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; };
  var optOf = function (p, oid) { return p.options.filter(function (o) { return o.id === oid; })[0] || p.options[0]; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fmtDate = function (iso) {
    if (!iso) return '';
    var p = iso.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return new Intl.DateTimeFormat(lang() === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(d);
  };
  function isOpenDate(iso) {
    if (!iso || iso < SEASON.start || iso > SEASON.end) return false;
    var p = iso.split('-'); return SEASON.days.indexOf(new Date(+p[0], +p[1] - 1, +p[2]).getDay()) > -1;
  }
  var detailsFor = function (p) { return p.detail != null && window.I18N ? window.I18N.details[lang()][p.detail] : null; };

  /* ---------------------------------------------------------------- cart */
  var KEY = 'sunmist-cart';
  var items = [];
  try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { items = []; }
  items = items.filter(function (it) { return byId(it.id); });

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
    document.dispatchEvent(new CustomEvent('cartchange'));
  }
  var Cart = {
    items: function () { return items; },
    count: function () { return items.reduce(function (n, it) { return n + it.qty; }, 0); },
    subtotal: function () { return items.reduce(function (s, it) { return s + optOf(byId(it.id), it.opt).price * it.qty; }, 0); },
    add: function (id, opt, qty, date) {
      var key = [id, opt, date || ''].join('|');
      var ex = items.filter(function (it) { return it.key === key; })[0];
      if (ex) ex.qty += qty; else items.push({ key: key, id: id, opt: opt, qty: qty, date: date || '' });
      save();
    },
    setQty: function (key, q) { items.forEach(function (it) { if (it.key === key) it.qty = Math.max(1, Math.min(99, q)); }); save(); },
    remove: function (key) { items = items.filter(function (it) { return it.key !== key; }); save(); },
    clear: function () { items = []; save(); },
  };
  window.SunmistCart = Cart;

  /* ---------------------------------------------------------------- toast */
  var toastTimer;
  function toast(msg) {
    var el = $('#toast'); if (!el) return;
    el.textContent = msg; el.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 2600);
  }

  /* ---------------------------------------------------------------- drawer */
  function lineHTML(it, compact) {
    var p = byId(it.id), o = optOf(p, it.opt);
    return '<div class="line" data-key="' + esc(it.key) + '">' +
      '<a class="line__img" href="product.html?id=' + p.id + '" style="background:' + p.bg + '"><img src="' + p.img + '" alt="" loading="lazy">' + badgeHTML(p) + '</a>' +
      '<div class="line__info"><a class="line__name" href="product.html?id=' + p.id + '">' + t(p.name) + '</a>' +
        '<span class="line__opt">' + t(o.label) + (it.date ? ' · ' + fmtDate(it.date) : '') + '</span>' +
        (compact ? '<span class="line__opt">× ' + it.qty + '</span>' :
        '<div class="stepper stepper--sm"><button type="button" data-dec aria-label="−"><svg class="i"><use href="#i-minus"/></svg></button><input type="number" min="1" max="99" value="' + it.qty + '" aria-label="' + ui('qty') + '"><button type="button" data-inc aria-label="+"><svg class="i"><use href="#i-plus"/></svg></button></div>') +
      '</div>' +
      '<div class="line__right"><strong>' + money(o.price * it.qty) + '</strong>' + (compact ? '' : '<button type="button" class="linklike line__rm" data-rm>' + ui('remove') + '</button>') + '</div>' +
    '</div>';
  }
  function badgeHTML(p) {
    if (p.badge === 'ticket') return '<span class="pbadge pbadge--ticket"><svg class="i"><use href="#i-ticket"/></svg></span>';
    if (p.badge === 'bag') return '<span class="pbadge pbadge--bag"><svg class="i"><use href="#i-bag"/></svg></span>';
    return '';
  }

  function renderDrawer() {
    var count = $('#cartCount'); if (count) { count.textContent = Cart.count(); count.classList.toggle('is-empty', !Cart.count()); }
    var box = $('#cartItems'); if (!box) return;
    box.innerHTML = items.length ? items.map(function (it) { return lineHTML(it); }).join('') :
      '<div class="empty"><img src="assets/img/fruit-tangerine.png" alt=""><p>' + ui('empty') + '</p><a class="btn btn--ink" href="shop.html">' + ui('emptyCta') + '</a></div>';
    $('#cartSubtotal').textContent = money(Cart.subtotal());
    $('#cartCheckout').classList.toggle('is-disabled', !items.length);
  }
  function bindLines(root) {
    root.addEventListener('click', function (e) {
      var line = e.target.closest('.line'); if (!line) return;
      var key = line.getAttribute('data-key'), it = items.filter(function (x) { return x.key === key; })[0]; if (!it) return;
      if (e.target.closest('[data-inc]')) Cart.setQty(key, it.qty + 1);
      else if (e.target.closest('[data-dec]')) Cart.setQty(key, it.qty - 1);
      else if (e.target.closest('[data-rm]')) Cart.remove(key);
    });
    root.addEventListener('change', function (e) {
      var line = e.target.closest('.line'); if (line && e.target.matches('input')) Cart.setQty(line.getAttribute('data-key'), parseInt(e.target.value, 10) || 1);
    });
  }

  var drawer = $('#cartDrawer');
  function openDrawer() {
    if (!drawer) return;
    drawer.hidden = false; requestAnimationFrame(function () { drawer.classList.add('is-open'); });
    document.dispatchEvent(new CustomEvent('scrolllock', { detail: true }));
  }
  function closeDrawer() {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove('is-open');
    setTimeout(function () { if (!drawer.classList.contains('is-open')) drawer.hidden = true; }, 500);
    document.dispatchEvent(new CustomEvent('scrolllock', { detail: false }));
  }
  if (drawer) {
    $('#cartOpen').addEventListener('click', openDrawer);
    drawer.addEventListener('click', function (e) { if (e.target.closest('[data-cart-close]')) closeDrawer(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
    bindLines($('#cartItems'));
  }

  function added(p, qty) {
    toast(ui('added') + ' — ' + t(p.name) + (qty > 1 ? ' × ' + qty : ''));
    var c = $('#cartCount'); if (c) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
  }

  /* ---------------------------------------------------------------- product card (shop + home) */
  function optionsHTML(p, name) {
    if (p.options.length < 2) return '';
    return '<div class="pills" role="radiogroup" aria-label="' + ui('size') + '">' + p.options.map(function (o, i) {
      return '<label><input type="radio" name="' + name + '" value="' + o.id + '"' + (i === (p.options.length > 2 ? 1 : 0) ? ' checked' : '') + '><span>' + t(o.label) + ' · ' + money(o.price) + '</span></label>';
    }).join('') + '</div>';
  }
  function cardHTML(p) {
    var min = Math.min.apply(null, p.options.map(function (o) { return o.price; }));
    return '<article class="pcard" data-id="' + p.id + '" data-cat="' + p.cat + '" data-tilt>' +
      '<a class="pcard__img" href="product.html?id=' + p.id + '" style="--pbg:' + p.bg + '"><img src="' + p.img + '" alt="' + esc(t(p.name)) + '" loading="lazy">' + badgeHTML(p) + '</a>' +
      '<div class="pcard__body">' +
        '<div class="pcard__top"><h3 class="pcard__name"><a href="product.html?id=' + p.id + '">' + t(p.name) + '</a></h3><span class="pcard__price">' + (p.options.length > 1 ? ui('from') + ' ' : '') + money(min) + '</span></div>' +
        '<p class="pcard__tag">' + t(p.tag) + '</p>' +
        optionsHTML(p, 'opt-' + p.id) +
        (p.needsDate ? '<label class="field field--inline"><span>' + ui('date') + '</span><input type="date" class="pcard__date" min="' + SEASON.start + '" max="' + SEASON.end + '"></label>' : '') +
        '<div class="pcard__actions"><div class="stepper"><button type="button" data-dec aria-label="−"><svg class="i"><use href="#i-minus"/></svg></button><input type="number" min="1" max="99" value="1" aria-label="' + ui('qty') + '"><button type="button" data-inc aria-label="+"><svg class="i"><use href="#i-plus"/></svg></button></div>' +
        '<button type="button" class="btn btn--orange" data-add data-magnetic><span>' + ui('add') + '</span><svg class="i"><use href="#i-bag"/></svg></button></div>' +
      '</div></article>';
  }
  function bindCards(root) {
    root.addEventListener('click', function (e) {
      var card = e.target.closest('[data-id]'); if (!card) return;
      var qtyIn = $('.stepper input', card);
      if (e.target.closest('[data-inc]') && qtyIn) qtyIn.value = Math.min(99, (+qtyIn.value || 1) + 1);
      if (e.target.closest('[data-dec]') && qtyIn) qtyIn.value = Math.max(1, (+qtyIn.value || 1) - 1);
      if (e.target.closest('[data-add]')) {
        var p = byId(card.getAttribute('data-id'));
        var sel = $('input[type=radio]:checked', card);
        var date = p.needsDate ? ($('.pcard__date, [data-date]', card) || {}).value : '';
        if (p.needsDate && !isOpenDate(date)) { toast(ui('dateNeeded')); var d = $('.pcard__date, [data-date]', card); if (d) d.focus(); return; }
        var q = qtyIn ? Math.max(1, +qtyIn.value || 1) : 1;
        Cart.add(p.id, sel ? sel.value : p.options[0].id, q, date);
        added(p, q);
      }
    });
  }

  /* ---------------------------------------------------------------- shop page */
  function renderShop() {
    var grid = $('#shopGrid'); if (!grid) return;
    var filter = grid.getAttribute('data-filter') || 'all';
    grid.innerHTML = PRODUCTS.filter(function (p) { return filter === 'all' || p.cat === filter; }).map(cardHTML).join('');
    $$('[data-shop-filter]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-shop-filter') === filter);
      b.textContent = ui(b.getAttribute('data-shop-filter'));
    });
  }
  var grid = $('#shopGrid');
  if (grid) {
    bindCards(grid);
    $$('[data-shop-filter]').forEach(function (b) {
      b.addEventListener('click', function () { grid.setAttribute('data-filter', b.getAttribute('data-shop-filter')); renderShop(); document.dispatchEvent(new CustomEvent('contentchange')); });
    });
  }

  /* ---------------------------------------------------------------- product page */
  var pv = $('#productView');
  var product = null;
  if (pv) {
    product = byId(new URLSearchParams(location.search).get('id')) || null;
    if (product) { document.body.setAttribute('data-fruit', product.fruit); document.documentElement.style.setProperty('--bg', product.bg); }
  }
  function renderProduct() {
    if (!pv) return;
    var p = product;
    if (!p) { pv.innerHTML = '<div class="wrap page-pad"><h1 class="h2">' + ui('notFound') + '</h1><a class="btn btn--orange" href="shop.html">' + ui('emptyCta') + '</a></div>'; return; }
    document.title = t(p.name) + ' — Sunmist Fruit';
    var d = detailsFor(p);
    var sel = pv.getAttribute('data-opt') || p.options[p.options.length > 2 ? 1 : 0].id;
    var o = optOf(p, sel);
    var tabs = d ? [['about', d.about], ['taste', d.taste], ['pick', '<ul>' + d.pick.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'], ['enjoy', d.enjoy]] : [['about', t(p.about)]];
    pv.innerHTML =
      '<section class="pdp" data-3d>' +
        '<div class="wrap pdp__grid">' +
          '<div class="pdp__stage" aria-hidden="true"><div class="pdp__halo"></div><img class="pdp__fallback" src="' + p.img + '" alt="">' + badgeHTML(p) + '</div>' +
          '<div class="pdp__info">' +
            '<nav class="crumbs"><a href="index.html">' + ui('home') + '</a><span>/</span><a href="shop.html">' + ui('shop') + '</a><span>/</span><span>' + t(p.name) + '</span></nav>' +
            '<h1 class="pdp__name">' + t(p.name) + '</h1>' +
            '<p class="pdp__tag">' + t(p.tag) + '</p>' +
            '<div class="pdp__price"><strong id="pdpPrice">' + money(o.price) + '</strong><span>' + t(p.unit) + '</span></div>' +
            (p.options.length > 1 ? '<p class="pdp__label">' + ui('size') + '</p>' + optionsHTML(p, 'pdp-opt').replace('value="' + sel + '"', 'value="' + sel + '" data-sel') : '') +
            (p.needsDate ? '<label class="field"><span>' + ui('date') + '</span><input type="date" data-date min="' + SEASON.start + '" max="' + SEASON.end + '"></label><p class="fine">' + ui('infantsFree') + '</p>' : '') +
            '<p class="pdp__label">' + ui('qty') + '</p>' +
            '<div class="pdp__actions"><div class="stepper stepper--lg"><button type="button" data-dec aria-label="−"><svg class="i"><use href="#i-minus"/></svg></button><input type="number" min="1" max="99" value="1" aria-label="' + ui('qty') + '"><button type="button" data-inc aria-label="+"><svg class="i"><use href="#i-plus"/></svg></button></div>' +
              '<button type="button" class="btn btn--orange btn--lg" data-add data-magnetic><span>' + ui('add') + '</span><svg class="i"><use href="#i-bag"/></svg></button>' +
              '<button type="button" class="btn btn--ink btn--lg" data-buy data-magnetic><span>' + ui('buy') + '</span><svg class="i"><use href="#i-arrow"/></svg></button></div>' +
            '<ul class="pdp__perks"><li><svg class="i"><use href="#i-home"/></svg>' + ui('pickup') + '</li><li><svg class="i"><use href="#i-truck"/></svg>' + ui('ship') + '</li><li><svg class="i"><use href="#i-leaf"/></svg>Temecula, CA</li></ul>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="panel panel--cream pdp-more"><div class="wrap">' +
        '<div class="tabs" role="tablist">' + tabs.map(function (tb, i) { return '<button type="button" role="tab" class="tabs__btn' + (i ? '' : ' is-active') + '" data-tab="' + i + '">' + ui(tb[0]) + '</button>'; }).join('') + '</div>' +
        tabs.map(function (tb, i) { return '<div class="tabs__panel' + (i ? '' : ' is-active') + '" data-panel="' + i + '"><div class="tabs__body">' + (tb[1].indexOf('<') === 0 ? tb[1] : '<p>' + tb[1] + '</p>') + '</div></div>'; }).join('') +
        '<h2 class="h3 related__title">' + ui('related') + '</h2>' +
        '<div class="shop-grid shop-grid--related" id="related">' + PRODUCTS.filter(function (x) { return x.id !== p.id; }).slice(0, 3).map(cardHTML).join('') + '</div>' +
      '</div></section>';
    var checked = $('input[data-sel]', pv); if (checked) checked.checked = true;
  }
  if (pv) {
    pv.addEventListener('change', function (e) {
      if (e.target.name === 'pdp-opt') { pv.setAttribute('data-opt', e.target.value); $('#pdpPrice').textContent = money(optOf(product, e.target.value).price); }
    });
    pv.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-tab]');
      if (tab) {
        $$('[data-tab]', pv).forEach(function (b) { b.classList.toggle('is-active', b === tab); });
        $$('[data-panel]', pv).forEach(function (x) { x.classList.toggle('is-active', x.getAttribute('data-panel') === tab.getAttribute('data-tab')); });
        return;
      }
      if (e.target.closest('#related')) return;
      var sec = e.target.closest('.pdp'); if (!sec) return;
      var qIn = $('.stepper input', sec);
      if (e.target.closest('[data-inc]')) qIn.value = Math.min(99, (+qIn.value || 1) + 1);
      if (e.target.closest('[data-dec]')) qIn.value = Math.max(1, (+qIn.value || 1) - 1);
      var buy = e.target.closest('[data-buy]');
      if (e.target.closest('[data-add]') || buy) {
        var date = product.needsDate ? $('[data-date]', sec).value : '';
        if (product.needsDate && !isOpenDate(date)) { toast(ui('dateNeeded')); $('[data-date]', sec).focus(); return; }
        var sel = $('input[name="pdp-opt"]:checked', sec);
        var q = Math.max(1, +qIn.value || 1);
        Cart.add(product.id, sel ? sel.value : product.options[0].id, q, date);
        if (buy) { location.href = 'checkout.html'; return; }
        added(product, q);
      }
    });
    bindCards(pv);
  }

  /* ---------------------------------------------------------------- quick-add buttons elsewhere (home, u-pick) */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-quick-add]'); if (!b) return;
    var p = byId(b.getAttribute('data-quick-add')); if (!p) return;
    var opt = b.getAttribute('data-opt') || p.options[0].id;
    Cart.add(p.id, opt, 1, '');
    added(p, 1);
  });

  /* U-Pick ticket booking widget (u-pick page) */
  var tix = $('#ticketForm');
  if (tix) {
    tix.addEventListener('submit', function (e) {
      e.preventDefault();
      var date = $('[name=date]', tix).value, n = +$('[name=adults]', tix).value + +$('[name=kids]', tix).value;
      if (!isOpenDate(date)) { toast(ui('dateNeeded')); $('[name=date]', tix).focus(); return; }
      if (n < 1) return;
      Cart.add('upick-ticket', 'person', n, date);
      var bags = +($('[name=bags]', tix) || { value: 0 }).value;
      if (bags > 0) Cart.add('red-bag', 'bag', bags, '');
      toast(ui('addedTickets', { n: n, date: fmtDate(date) }));
      var c = $('#cartCount'); if (c) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
      openDrawer();
    });
    var total = function () {
      var n = (+$('[name=adults]', tix).value || 0) + (+$('[name=kids]', tix).value || 0), bags = +($('[name=bags]', tix) || { value: 0 }).value || 0;
      $('#ticketTotal').textContent = money(n * 10 + bags * 25);
    };
    tix.addEventListener('input', total); total();
  }

  /* ---------------------------------------------------------------- checkout */
  var co = $('#checkout');
  function renderCheckout() {
    if (!co) return;
    var sum = $('#coSummary');
    var has = items.length > 0;
    $('#coEmpty').hidden = has; co.hidden = !has;
    if (!has) return;
    sum.innerHTML = items.map(function (it) { return lineHTML(it, true); }).join('');
    $('#coSubtotal').textContent = money(Cart.subtotal());
    $('#coTotal').textContent = money(Cart.subtotal());
    var ship = $('input[name=fulfil]:checked', co);
    $('#coAddress').hidden = !(ship && ship.value === 'ship');
    $('#coShipRow').hidden = !(ship && ship.value === 'ship');
    $('#coPickup').hidden = $('#coHint').hidden = !!(ship && ship.value === 'ship');
  }
  if (co) {
    co.addEventListener('change', function (e) { if (e.target.name === 'fulfil') renderCheckout(); });
    co.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('[required]', co).forEach(function (inp) {
        if (inp.closest('[hidden]')) return;
        var bad = !inp.value.trim() || (inp.type === 'email' && !/^\S+@\S+\.\S+$/.test(inp.value));
        var f = inp.closest('.field'); if (f) f.classList.toggle('is-invalid', bad);
        if (bad) ok = false;
      });
      var msg = $('.form__msg', co);
      if (!ok) { msg.textContent = ui('required'); msg.className = 'form__msg bad'; return; }
      var fd = new FormData(co);
      var now = new Date(), no = 'SF-' + String(now.getFullYear()).slice(2) + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + Math.floor(1000 + Math.random() * 9000);
      var label = function (name) { var el = co.querySelector('[name="' + name + '"]'); var group = el && /radio|checkbox/.test(el.type); var l = el && (group ? el.closest('fieldset') : el.closest('label, fieldset')); var s = l && l.querySelector(group ? 'legend' : 'span, legend'); return s ? s.textContent.trim() : name; };
      var radioText = function (name) { var r = co.querySelector('input[name="' + name + '"]:checked'); if (!r) return ''; var st = r.closest('label').querySelector('strong'); return (st || r.closest('label')).textContent.trim(); };
      var lines = [ui('lines') + ' ' + no, ''];
      items.forEach(function (it) {
        var p = byId(it.id), o = optOf(p, it.opt);
        lines.push('• ' + t(p.name) + ' — ' + t(o.label) + (it.date ? ' (' + it.date + ')' : '') + ' × ' + it.qty + ' = ' + money(o.price * it.qty));
      });
      lines.push('', ui('total') + ': ' + money(Cart.subtotal()), '');
      ['name', 'email', 'phone'].forEach(function (n) { lines.push(label(n) + ': ' + (fd.get(n) || '-')); });
      lines.push(label('fulfil') + ': ' + radioText('fulfil'));
      if (fd.get('fulfil') === 'ship') ['address', 'city', 'zip'].forEach(function (n) { lines.push(label(n) + ': ' + (fd.get(n) || '-')); });
      else lines.push(label('pickupDate') + ': ' + (fd.get('pickupDate') || '-'));
      lines.push(ui('payLabel') + ': ' + radioText('pay'));
      lines.push(label('notes') + ': ' + (fd.get('notes') || '-'));
      location.href = window.__lastMail = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(ui('orderSubject', { no: no, name: fd.get('name') })) + '&body=' + encodeURIComponent(lines.join('\n'));
      Cart.clear();
      var done = $('#coDone');
      $('#coDoneTitle').textContent = ui('orderDone', { no: no });
      $('#coDoneText').textContent = ui('orderDoneP');
      co.hidden = true; done.hidden = false;
      window.scrollTo(0, 0);
    });
  }

  /* ---------------------------------------------------------------- render all */
  function renderAll() { renderDrawer(); renderShop(); renderProduct(); renderCheckout(); }
  document.addEventListener('cartchange', function () { renderDrawer(); renderCheckout(); });
  document.addEventListener('langchange', function () { renderAll(); document.dispatchEvent(new CustomEvent('contentchange')); });
  renderAll();

  window.SunmistStore = { PRODUCTS: PRODUCTS, byId: byId, isOpenDate: isOpenDate, openDrawer: openDrawer, closeDrawer: closeDrawer, toast: toast };
})();
