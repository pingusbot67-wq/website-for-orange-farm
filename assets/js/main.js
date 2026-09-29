/*
 * Sunmist Fruit — page behaviour (shared by every page)
 * Smooth scroll (Lenis) + scroll animation (GSAP ScrollTrigger) + the 3D orchard
 * (scene.js) + language switching, page transitions, forms and small interactions.
 *
 * Per-page 3D is configured on <body>:
 *   data-scene="home"                 full scroll story (index.html)
 *   data-scene="page" data-fruit="1"  one fruit in the hero (0 tangerine, 1 lemon, 2 blueberries, 3 avocado, "none")
 *   data-anchor="x,y,scale"           where it sits (x, y in -1…1), data-anchor-mobile for phones
 */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- config
     Update these each season. Dates are the farm's local dates (Pacific). */
  var SITE = {
    email: 'sales@sunmistfruit.com',
    seasonStart: '2026-04-18',
    seasonEnd: '2026-10-31',
    openHour: 10,
    closeHour: 14,
    openDays: [0, 6], // Sunday, Saturday
    timeZone: 'America/Los_Angeles',
  };

  var root = document.documentElement, body = document.body;
  var I18N = window.I18N;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var lang = root.getAttribute('data-lang') || 'en';
  var ui = function () { return I18N.ui[lang]; };
  var fill = function (str, o) { return str.replace(/\{(\w+)\}/g, function (_, k) { return o[k] != null ? o[k] : ''; }); };
  var lenis = null, scene = null;

  if (reduced) root.classList.add('reduced');
  if (!hasGsap) root.classList.remove('js');

  /* ================================================================ i18n */
  var original = new WeakMap();
  $$('[data-i18n]').forEach(function (el) { original.set(el, el.innerHTML); });
  $$('[data-i18n-ph]').forEach(function (el) { original.set(el, el.getAttribute('placeholder')); });
  var titles = { en: document.title, zh: body.getAttribute('data-title-zh') };
  var metaDesc = $('meta[name="description"]');
  var descs = { en: metaDesc && metaDesc.getAttribute('content'), zh: body.getAttribute('data-desc-zh') };

  function applyLang(next) {
    lang = next === 'zh' ? 'zh' : 'en';
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang === 'zh' ? 'zh-Hans' : 'en');
    $$('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var html = lang === 'zh' ? I18N.zh[key] : original.get(el);
      if (html == null) return;
      el.innerHTML = html;
    });
    $$('[data-i18n-ph]').forEach(function (el) {
      el.setAttribute('placeholder', lang === 'zh' ? I18N.zh[el.getAttribute('data-i18n-ph')] : original.get(el));
    });
    if (titles[lang]) document.title = titles[lang];
    if (metaDesc && descs[lang]) metaDesc.setAttribute('content', descs[lang]);
    try { localStorage.setItem('sunmist-lang', lang); } catch (e) {}
    var url = new URL(location.href); url.searchParams.set('lang', lang);
    history.replaceState(null, '', url);
    splitAll();
    buildMarquee();
    refreshCounters();
    updateOpenStatus();
    $$('[data-upick-date]').forEach(updateDateHint);
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
    if (hasGsap) ScrollTrigger.refresh();
  }
  function switchLang(next) {
    if (next === lang) return;
    root.classList.add('lang-swap');
    setTimeout(function () {
      applyLang(next);
      requestAnimationFrame(function () { root.classList.remove('lang-swap'); });
    }, 260);
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('#langToggle')) switchLang(lang === 'en' ? 'zh' : 'en');
    var b = e.target.closest('[data-setlang]'); if (b) switchLang(b.getAttribute('data-setlang'));
  });

  /* ======================================================= split headings */
  function splitEl(el) {
    var frag = document.createDocumentFragment();
    var wrapWord = function (node) {
      var w = document.createElement('span'); w.className = 'w';
      var inner = document.createElement('span'); inner.appendChild(node); w.appendChild(inner);
      return w;
    };
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var text = node.textContent;
        // CJK has no spaces: split into short runs so lines can still wrap and stagger
        var parts = /[　-鿿]/.test(text) ? (text.match(/[　-鿿＀-￯][，。、“”！？：]?|[^　-鿿＀-￯]+/g) || []) : text.split(/(\s+)/);
        parts.forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(' '));
          else frag.appendChild(wrapWord(document.createTextNode(p)));
        });
      } else if (node.nodeName === 'BR') {
        frag.appendChild(node.cloneNode());
      } else if (node.nodeType === 1) {
        var clone = node.cloneNode(false);
        var tmp = node.cloneNode(true); splitEl(tmp);
        Array.prototype.slice.call(tmp.childNodes).forEach(function (c) { clone.appendChild(c); });
        frag.appendChild(clone);
      }
    });
    el.innerHTML = ''; el.appendChild(frag);
  }
  function splitAll() {
    $$('[data-split]').forEach(function (el) {
      splitEl(el);
      if (hasGsap && !reduced && !el._revealed) gsap.set($$('.w > span', el), { yPercent: 115 });
    });
  }
  function revealSplit(el, delay) {
    el._revealed = true;
    gsap.to($$('.w > span', el), { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.045, delay: delay || 0 });
  }

  /* ========================================================== marquee */
  var marqueeTween;
  function buildMarquee() {
    var track = $('#marquee'); if (!track) return;
    var row = track.querySelector('[data-i18n="marquee"]');
    $$('.marquee__row', track).forEach(function (r) { if (r !== row) r.remove(); });
    var need = Math.ceil((window.innerWidth * 2) / Math.max(row.offsetWidth, 1)) + 1;
    for (var i = 0; i < need; i++) track.appendChild(row.cloneNode(true)).removeAttribute('data-i18n');
    if (!hasGsap || reduced) return;
    if (marqueeTween) marqueeTween.kill();
    gsap.set(track, { x: 0 });
    marqueeTween = gsap.to(track, { x: -row.offsetWidth, duration: row.offsetWidth / 90, ease: 'none', repeat: -1 });
  }

  /* ========================================================== counters */
  function countTarget(el) { return parseFloat(el.getAttribute('data-count-' + lang) || el.getAttribute('data-count')); }
  function fmt(n) { return Math.round(n).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US'); }
  function refreshCounters() { $$('[data-count]').forEach(function (el) { if (el._counted || !hasGsap) el.textContent = fmt(countTarget(el)); }); }
  function runCounter(el) {
    el._counted = true;
    var o = { v: 0 };
    gsap.to(o, { v: countTarget(el), duration: 2, ease: 'power3.out', onUpdate: function () { el.textContent = fmt(o.v); } });
  }

  /* ========================================================== open status */
  function farmNow() {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: SITE.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
    return { y: +get('year'), m: +get('month'), d: +get('day'), h: +get('hour') };
  }
  var iso = function (dt) { return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); };
  var isOpenDay = function (dt) { var s = iso(dt); return SITE.openDays.indexOf(dt.getDay()) > -1 && s >= SITE.seasonStart && s <= SITE.seasonEnd; };
  var fmtDate = function (dt) { return new Intl.DateTimeFormat(ui().locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(dt); };

  function updateOpenStatus() {
    $$('[data-open-status]').forEach(function (el) {
      var n = farmNow(); var today = new Date(n.y, n.m - 1, n.d);
      if (isOpenDay(today) && n.h >= SITE.openHour && n.h < SITE.closeHour) { el.textContent = ui().openNow; return; }
      var dt = new Date(today); if (n.h >= SITE.openHour) dt.setDate(dt.getDate() + 1);
      for (var i = 0; i < 400; i++) {
        if (isOpenDay(dt)) { el.textContent = fill(ui().nextOpen, { date: fmtDate(dt) }); return; }
        dt.setDate(dt.getDate() + 1);
      }
      el.textContent = ui().seasonOver;
    });
  }

  /* ========================================================== U-Pick date hints */
  function updateDateHint(input) {
    var hint = $(input.getAttribute('data-upick-date')); if (!hint) return true;
    hint.className = 'date-hint'; hint.textContent = '';
    if (!input.value) return false;
    var p = input.value.split('-'); var dt = new Date(+p[0], +p[1] - 1, +p[2]);
    if (input.value < SITE.seasonStart || input.value > SITE.seasonEnd) { hint.textContent = ui().dateSeason; hint.classList.add('bad'); return false; }
    if (SITE.openDays.indexOf(dt.getDay()) < 0) { hint.textContent = ui().dateWeekday; hint.classList.add('bad'); return false; }
    hint.textContent = fill(ui().dateOk, { date: fmtDate(dt) }); hint.classList.add('ok'); return true;
  }
  $$('[data-upick-date]').forEach(function (input) {
    input.min = SITE.seasonStart; input.max = SITE.seasonEnd;
    input.addEventListener('change', function () { updateDateHint(input); });
  });

  /* ========================================================== enquiry forms → email
     <form data-mailform="wedding"> — subject comes from I18N.ui[lang].subjects.wedding,
     every named field is sent with its visible label. */
  function validate(form) {
    var ok = true;
    $$('[required]', form).forEach(function (input) {
      var bad = !input.value.trim() || (input.type === 'email' && !/^\S+@\S+\.\S+$/.test(input.value));
      var f = input.closest('.field'); if (f) f.classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    $$('[data-upick-date]', form).forEach(function (d) { if (!updateDateHint(d)) ok = false; });
    return ok;
  }
  function labelFor(el) {
    var group = /radio|checkbox/.test(el.type);
    var l = group ? el.closest('fieldset') : el.closest('label, fieldset'); var s = l && l.querySelector(group ? 'legend' : 'span, legend');
    return s ? s.textContent.trim() : el.name;
  }
  $$('form[data-mailform]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var m = $('.form__msg', form);
      if (!validate(form)) { m.textContent = ui().required; m.className = 'form__msg bad'; return; }
      var seen = {}, lines = [];
      $$('[name]', form).forEach(function (el) {
        if (seen[el.name] || el.closest('[hidden]')) return;
        seen[el.name] = true;
        var val;
        if (el.type === 'checkbox' || el.type === 'radio') {
          val = $$('[name="' + el.name + '"]:checked', form).map(function (c) { return c.closest('label').textContent.trim(); }).join(', ');
        } else val = el.value;
        lines.push(labelFor(el) + ': ' + (val || '-'));
      });
      lines.push(ui().labels.lang + ': ' + (lang === 'zh' ? '中文' : 'English'));
      var nameEl = $('[name=name]', form);
      var subject = fill(ui().subjects[form.getAttribute('data-mailform')] || ui().subjects.general, { name: nameEl ? nameEl.value : '' });
      location.href = window.__lastMail = 'mailto:' + SITE.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      m.textContent = ui().sent; m.className = 'form__msg ok';
      if (scene && form.hasAttribute('data-drop')) scene.dropFruit();
    });
  });
  document.addEventListener('input', function (e) { var f = e.target.closest && e.target.closest('.field'); if (f) f.classList.remove('is-invalid'); });

  /* ========================================================== checklist */
  var checklist = $('.checklist');
  if (checklist) {
    var boxes = $$('#checklist input');
    var checkDone = function () { checklist.classList.toggle('is-done', boxes.every(function (c) { return c.checked; })); };
    boxes.forEach(function (c, i) {
      try { c.checked = localStorage.getItem('sunmist-check-' + i) === '1'; } catch (e) {}
      c.addEventListener('change', function () { try { localStorage.setItem('sunmist-check-' + i, c.checked ? '1' : '0'); } catch (e) {} checkDone(); });
    });
    checkDone();
  }

  /* ========================================================== stars */
  $$('canvas.stars').forEach(function (c) {
    var g = c.getContext('2d'), pts = [], on = false, dpr = Math.min(devicePixelRatio || 1, 2);
    function size() {
      c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr; pts = [];
      for (var i = 0; i < 220; i++) pts.push({ x: Math.random() * c.width, y: Math.random() * c.height * 0.85, r: (Math.random() * 1.3 + 0.3) * dpr, p: Math.random() * 6, s: Math.random() * 2 + 0.5 });
    }
    function draw(t) {
      if (!on) return;
      g.clearRect(0, 0, c.width, c.height);
      pts.forEach(function (s) { g.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t / 1000 * s.s + s.p)); g.fillStyle = '#fff6e0'; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); });
      if (!reduced) requestAnimationFrame(draw);
    }
    size(); addEventListener('resize', size);
    new IntersectionObserver(function (en) { on = en[0].isIntersecting; if (on) requestAnimationFrame(draw); }).observe(c);
  });

  /* ========================================================== mobile menu + scroll lock */
  var burger = $('#burger'), mmenu = $('#mobileMenu');
  function setMenu(open) {
    if (!burger) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { mmenu.hidden = false; requestAnimationFrame(function () { mmenu.classList.add('is-open'); }); lock(true); }
    else if (mmenu.classList.contains('is-open')) { mmenu.classList.remove('is-open'); setTimeout(function () { if (!mmenu.classList.contains('is-open')) mmenu.hidden = true; }, 700); lock(false); }
  }
  if (burger) burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  function lock(v) { if (lenis) { if (v) lenis.stop(); else lenis.start(); } root.classList.toggle('is-locked', v); }
  document.addEventListener('scrolllock', function (e) { lock(e.detail); });

  /* ========================================================== links: in-page scroll vs page change */
  function scrollToEl(t, dur) {
    if (t && t.parentElement && t.parentElement.classList.contains('pin-spacer')) t = t.parentElement;
    if (lenis) lenis.scrollTo(t || 0, { offset: -90, duration: dur == null ? 1.4 : dur, immediate: dur === 0 });
    else if (!t) window.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 90, behavior: dur === 0 ? 'auto' : 'smooth' });
  }
  var curtain = $('#curtain');
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0 || a.target === '_blank' || a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (/^(mailto:|tel:|https?:)/.test(href)) return;
    var url = new URL(href, location.href);
    if (url.origin !== location.origin) return;
    var samePage = url.pathname === location.pathname || (href.charAt(0) === '#');
    if (samePage && url.hash) {
      e.preventDefault(); setMenu(false);
      scrollToEl(url.hash === '#top' ? null : $(url.hash));
      return;
    }
    if (samePage && !url.hash && url.search === location.search) { e.preventDefault(); setMenu(false); scrollToEl(null); return; }
    // different page: keep the language and play the orange curtain
    if (lang === 'zh') url.searchParams.set('lang', 'zh'); else url.searchParams.delete('lang');
    e.preventDefault();
    if (!curtain || reduced || !hasGsap) { location.href = url.href; return; }
    curtain.classList.remove('is-out');
    curtain.style.transition = 'none'; curtain.style.transform = 'translateY(100%)';
    void curtain.offsetWidth;
    curtain.style.transition = ''; curtain.style.transform = '';
    curtain.classList.add('is-in');
    setTimeout(function () { location.href = url.href; }, 520);
  });
  addEventListener('pageshow', function (e) { if (e.persisted && curtain) { curtain.classList.remove('is-in'); curtain.classList.add('is-out'); } });

  /* ========================================================== boot */
  splitAll();
  buildMarquee();
  updateOpenStatus();
  if (lang !== 'en') applyLang(lang);
  var yEl = $('#year'); if (yEl) yEl.textContent = new Date().getFullYear();

  if (!hasGsap) {
    var ld = $('#loader'); if (ld) ld.remove();
    if (curtain) curtain.classList.add('is-out');
    root.classList.add('no-webgl');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ================================================================ 3D scene */
  var canvas = $('#orchard');
  var sceneMode = body.getAttribute('data-scene');
  function parseAnchor(s) { if (!s) return null; var a = s.split(',').map(Number); return { x: a[0], y: a[1], s: a[2] == null ? 1 : a[2] }; }
  function initScene(done) {
    var ok = canvas && sceneMode && !reduced && window.OrchardScene && window.OrchardScene.supported();
    if (!ok) { root.classList.add('no-webgl'); if (canvas) canvas.remove(); return done(); }
    var fruitAttr = body.getAttribute('data-fruit');
    var opts = {
      mode: sceneMode === 'home' ? 'home' : 'page',
      fruit: fruitAttr === 'none' || fruitAttr == null ? null : +fruitAttr,
      anchor: parseAnchor(body.getAttribute('data-anchor')),
      anchorMobile: parseAnchor(body.getAttribute('data-anchor-mobile')),
      onReady: done,
    };
    // let the loader/curtain paint before the (synchronous) texture generation
    setTimeout(function () {
      try { scene = window.OrchardScene.create(canvas, opts); } catch (e) { console.warn(e); scene = null; }
      if (!scene) { root.classList.add('no-webgl'); canvas.remove(); done(); }
    }, 60);
  }

  var loader = $('#loader');
  if (lenis) lenis.stop();
  if (!location.hash) window.scrollTo(0, 0);

  if (loader) {
    var bar = $('#loaderBar'), count = $('#loaderCount'), prog = { v: 0 };
    var setProg = function () { count.textContent = Math.round(prog.v); bar.style.strokeDashoffset = 327 * (1 - prog.v / 100); };
    var loaderTween = gsap.to(prog, { v: 82, duration: 1.4, ease: 'power2.out', onUpdate: setProg });
    gsap.set(loader, { clipPath: 'circle(150% at 50% 50%)' });
    initScene(function () {
      loaderTween.kill();
      gsap.to(prog, {
        v: 100, duration: 0.5, ease: 'power1.inOut', onUpdate: setProg, onComplete: function () {
          gsap.timeline()
            .to('.loader__inner', { scale: 0.85, opacity: 0, duration: 0.45, ease: 'power2.in' })
            .to(loader, { clipPath: 'circle(0% at 50% 50%)', duration: 1, ease: 'expo.inOut' }, '-=0.1')
            .add(function () { loader.remove(); if (curtain) curtain.classList.add('is-out'); start(); }, '-=0.45');
        },
      });
      setupScroll();
    });
  } else {
    initScene(function () {
      setupScroll();
      if (curtain) curtain.classList.add('is-out');
      setTimeout(start, 250);
    });
  }

  function start() {
    if (lenis) lenis.start();
    var t = $('[data-intro]');
    if (t) revealSplit(t, 0);
    gsap.fromTo('[data-hero]', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.25 });
    if (location.hash) { var h = $(location.hash); if (h) setTimeout(function () { scrollToEl(h, 1.2); }, 350); }
  }

  /* ================================================================ scroll choreography */
  function setupScroll() {
    $$('[data-split]').forEach(function (el) {
      if (el.hasAttribute('data-intro')) return;
      ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: function () { revealSplit(el); } });
    });
    $$('[data-reveal]').forEach(function (el) {
      gsap.fromTo(el, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    $$('[data-count]').forEach(function (el) {
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: function () { runCounter(el); } });
    });
    var heroInner = $('.hero__inner, .phero__inner');
    if (heroInner) gsap.to(heroInner, { yPercent: -14, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: heroInner.parentElement, start: 'top top', end: 'bottom top', scrub: true } });

    if (sceneMode === 'home') setupHome();

    // falling fruit
    var basketEl = $('[data-basket]');
    if (scene && basketEl) {
      scene.attachBasket(basketEl);
      ScrollTrigger.create({ trigger: basketEl, start: 'top 60%', once: true, onEnter: function () { scene.dropFruit(); } });
      $$('[data-shake]').forEach(function (b) { b.addEventListener('click', function () { scene.dropFruit(); }); });
    } else $$('[data-shake]').forEach(function (b) { b.remove(); });

    // only render while a see-through section is on screen
    if (scene) {
      var visible = new Set();
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) visible.add(en.target); else visible.delete(en.target); });
        scene.setActive(visible.size > 0);
      });
      $$('[data-3d]').forEach(function (s) { io.observe(s); });
    }

    // nav + scroll → scene
    var nav = $('#nav'), lastY = 0;
    function onScroll(y) {
      if (scene) scene.set('scrollY', y);
      if (nav) {
        root.classList.toggle('is-scrolled', y > 40);
        nav.classList.toggle('is-hidden', y > lastY && y > 500 && !(mmenu && mmenu.classList.contains('is-open')));
      }
      lastY = y;
    }
    if (lenis) lenis.on('scroll', function (e) { onScroll(e.scroll); });
    else addEventListener('scroll', function () { onScroll(scrollY); }, { passive: true });
    onScroll(scrollY);

    if (lenis && marqueeTween) lenis.on('scroll', function (e) {
      var v = Math.min(Math.abs(e.velocity) / 10, 4);
      gsap.to(marqueeTween, { timeScale: (e.direction < 0 ? -1 : 1) * (1 + v), duration: 0.3, overwrite: true });
    });

    document.addEventListener('contentchange', function () { ScrollTrigger.refresh(); });
    ScrollTrigger.refresh();
  }

  /* home page: tangerine splits open, then morphs through the four fruits */
  function setupHome() {
    ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: 'bottom top', onUpdate: function (s) { scene && scene.set('heroOut', s.progress); } });
    ScrollTrigger.create({ trigger: '#story', start: 'top bottom', end: 'bottom top', onUpdate: function (s) { scene && scene.set('story', s.progress); } });

    var panels = $$('.fruit'), dots = $$('.fruits__dots button'), big = $('#fruitsBig'), cssFruit = $('#cssFruit');
    var current = -1, outP = 0;
    var fruitsST;
    function setBg() {
      var c = '#fff1de';
      if (outP < 0.5 && fruitsST && fruitsST.progress > 0 && current > -1) c = panels[current].getAttribute('data-bg');
      root.style.setProperty('--bg', c);
      if (scene) scene.setFog(c);
    }
    function showFruit(i) {
      if (i === current) return;
      var prev = panels[current]; current = i;
      if (prev) gsap.to(prev, { autoAlpha: 0, y: -40, duration: 0.5, ease: 'power2.in', overwrite: true });
      gsap.fromTo(panels[i], { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', delay: prev ? 0.2 : 0, overwrite: true });
      panels.forEach(function (p, k) { p.classList.toggle('is-active', k === i); });
      dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
      big.textContent = '0' + (i + 1);
      gsap.fromTo(big, { yPercent: 20, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, ease: 'expo.out' });
      if (cssFruit) cssFruit.setAttribute('data-i', i);
      setBg();
    }
    fruitsST = ScrollTrigger.create({
      trigger: '#fruits', start: 'top top', end: '+=300%', pin: true, anticipatePin: 1,
      onUpdate: function (s) { scene && scene.set('fruits', s.progress); showFruit(Math.min(3, Math.floor(s.progress * 4))); },
    });
    showFruit(0);
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () {
        var y = fruitsST.start + (fruitsST.end - fruitsST.start) * ((i + 0.5) / 4);
        if (lenis) lenis.scrollTo(y, { duration: 1.2 }); else window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
    var outEl = $('[data-scene-out]');
    if (outEl) ScrollTrigger.create({ trigger: outEl, start: 'top bottom', end: 'top top', onUpdate: function (s) { outP = s.progress; scene && scene.set('out', s.progress); setBg(); } });
  }

  /* ================================================================ cursor + magnetic + tilt (delegated, so shop cards work too) */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !reduced) {
    var cur = $('.cursor');
    if (!cur) { document.body.insertAdjacentHTML('beforeend', '<div class="cursor" aria-hidden="true"><div class="cursor__dot"></div><div class="cursor__ring"><span class="cursor__label" data-i18n="cursor.pick">' + (lang === 'zh' ? '采摘' : 'Pick') + '</span></div></div>'); cur = $('.cursor'); }
    var dot = $('.cursor__dot'), ring = $('.cursor__ring');
    var dx = gsap.quickTo(dot, 'x', { duration: 0.1 }), dy = gsap.quickTo(dot, 'y', { duration: 0.1 });
    var rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    var magnet = null, tilt = null;
    var mq = new WeakMap();
    var quick = function (el) { if (!mq.has(el)) mq.set(el, { x: gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' }) }); return mq.get(el); };
    addEventListener('pointermove', function (e) {
      cur.classList.add('is-on'); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      var t = e.target.closest ? e.target : null; if (!t) return;
      var m = t.closest('[data-magnetic]');
      if (magnet && magnet !== m) { var q0 = quick(magnet); q0.x(0); q0.y(0); }
      magnet = m;
      if (m) { var r = m.getBoundingClientRect(), q = quick(m); q.x((e.clientX - r.left - r.width / 2) * 0.25); q.y((e.clientY - r.top - r.height / 2) * 0.35); }
      var tl = t.closest('[data-tilt]');
      if (tilt && tilt !== tl) gsap.to(tilt, { rotateY: 0, rotateX: 0, duration: 0.9, ease: 'elastic.out(1, .5)' });
      tilt = tl;
      if (tl) { var b = tl.getBoundingClientRect(); gsap.to(tl, { rotateY: ((e.clientX - b.left) / b.width - 0.5) * 8, rotateX: -((e.clientY - b.top) / b.height - 0.5) * 8, duration: 0.6, ease: 'power3.out', transformPerspective: 900 }); }
      cur.classList.toggle('is-hover', !!m);
      cur.classList.toggle('is-link', !m && !!t.closest('a, button, label, input, select, textarea, summary'));
    });
    document.addEventListener('pointerleave', function () { cur.classList.remove('is-on'); });
  }

  addEventListener('resize', function () { clearTimeout(window.__rz); window.__rz = setTimeout(buildMarquee, 200); });
})();
