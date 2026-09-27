/*
 * Sunmist Fruit — page behaviour
 * Smooth scroll (Lenis) + scroll choreography (GSAP ScrollTrigger) + the 3D
 * orchard (scene.js) + language switching, forms and small interactions.
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

  var root = document.documentElement;
  var I18N = window.I18N;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var lang = root.getAttribute('data-lang') || 'en';
  var ui = function () { return I18N.ui[lang]; };
  var fill = function (str, o) { return str.replace(/\{(\w+)\}/g, function (_, k) { return o[k] != null ? o[k] : ''; }); };

  if (reduced) root.classList.add('reduced');
  if (!hasGsap) { root.classList.remove('js'); }

  /* ================================================================ i18n */
  var original = new WeakMap();
  $$('[data-i18n]').forEach(function (el) { original.set(el, el.innerHTML); });
  $$('[data-i18n-ph]').forEach(function (el) { original.set(el, el.getAttribute('placeholder')); });

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
      var key = el.getAttribute('data-i18n-ph');
      el.setAttribute('placeholder', lang === 'zh' ? I18N.zh[key] : original.get(el));
    });
    document.title = ui().title;
    var md = $('meta[name="description"]'); if (md) md.setAttribute('content', ui().description);
    try { localStorage.setItem('sunmist-lang', lang); } catch (e) {}
    var url = new URL(location.href); url.searchParams.set('lang', lang);
    history.replaceState(null, '', url);
    splitAll();
    buildMarquee();
    refreshCounters();
    updateOpenStatus();
    updateDateHint();
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

  $('#langToggle').addEventListener('click', function () { switchLang(lang === 'en' ? 'zh' : 'en'); });
  $$('[data-setlang]').forEach(function (b) { b.addEventListener('click', function () { switchLang(b.getAttribute('data-setlang')); }); });

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
        // split inside <em> too, keeping the styling
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
    for (var i = 0; i < need; i++) track.appendChild(Object.assign(row.cloneNode(true), {})).removeAttribute('data-i18n');
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
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: SITE.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(new Date());
    var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
    return { y: +get('year'), m: +get('month'), d: +get('day'), h: +get('hour') };
  }
  var iso = function (dt) { return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); };
  var isOpenDay = function (dt) { var s = iso(dt); return SITE.openDays.indexOf(dt.getDay()) > -1 && s >= SITE.seasonStart && s <= SITE.seasonEnd; };
  var fmtDate = function (dt) { return new Intl.DateTimeFormat(ui().locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(dt); };

  function updateOpenStatus() {
    var el = $('#openStatus'); if (!el) return;
    var n = farmNow(); var today = new Date(n.y, n.m - 1, n.d);
    if (isOpenDay(today) && n.h >= SITE.openHour && n.h < SITE.closeHour) { el.textContent = ui().openNow; return; }
    var dt = new Date(today); if (n.h >= SITE.openHour) dt.setDate(dt.getDate() + 1);
    for (var i = 0; i < 400; i++) {
      if (isOpenDay(dt)) { el.textContent = fill(ui().nextOpen, { date: fmtDate(dt) }); return; }
      dt.setDate(dt.getDate() + 1);
    }
    el.textContent = ui().seasonOver;
  }

  /* ========================================================== booking date */
  var dateInput = $('#bookDate');
  function updateDateHint() {
    var hint = $('#dateHint'); if (!hint || !dateInput) return true;
    hint.className = 'date-hint'; hint.textContent = '';
    if (!dateInput.value) return false;
    var p = dateInput.value.split('-'); var dt = new Date(+p[0], +p[1] - 1, +p[2]);
    var s = dateInput.value;
    if (s < SITE.seasonStart || s > SITE.seasonEnd) { hint.textContent = ui().dateSeason; hint.classList.add('bad'); return false; }
    if (SITE.openDays.indexOf(dt.getDay()) < 0) { hint.textContent = ui().dateWeekday; hint.classList.add('bad'); return false; }
    hint.textContent = fill(ui().dateOk, { date: fmtDate(dt) }); hint.classList.add('ok'); return true;
  }
  if (dateInput) {
    dateInput.min = SITE.seasonStart; dateInput.max = SITE.seasonEnd;
    dateInput.addEventListener('change', updateDateHint);
  }

  /* ========================================================== forms → email */
  function validate(form) {
    var ok = true;
    $$('[required]', form).forEach(function (input) {
      var bad = !input.value.trim() || (input.type === 'email' && !/^\S+@\S+\.\S+$/.test(input.value));
      input.closest('.field').classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    return ok;
  }
  function openMail(subject, lines) {
    location.href = 'mailto:' + SITE.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
  }
  function msg(form, text, cls) { var m = $('.form__msg', form); m.textContent = text; m.className = 'form__msg ' + cls; }

  var bookForm = $('#bookForm');
  bookForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(bookForm), L = ui().labels;
    if (!validate(bookForm) || !updateDateHint()) { msg(bookForm, ui().required, 'bad'); return; }
    openMail(fill(ui().bookSubject, { date: fd.get('date'), name: fd.get('name') }), [
      L.name + ': ' + fd.get('name'), L.phone + ': ' + fd.get('phone'), L.email + ': ' + (fd.get('email') || '-'),
      L.date + ': ' + fd.get('date'), L.adults + ': ' + fd.get('adults'), L.kids + ': ' + (fd.get('kids') || 0),
      L.fruit + ': ' + fd.getAll('fruit').join(', '), L.notes + ': ' + (fd.get('notes') || '-'), L.lang + ': ' + (lang === 'zh' ? '中文' : 'English'),
    ]);
    msg(bookForm, ui().sent, 'ok');
    if (scene) scene.dropFruit();
  });

  var wsForm = $('#wsForm');
  wsForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(wsForm), L = ui().labels;
    if (!validate(wsForm)) { msg(wsForm, ui().required, 'bad'); return; }
    openMail(fill(ui().wsSubject, { company: fd.get('company') }), [
      L.company + ': ' + fd.get('company'), L.name + ': ' + fd.get('name'), L.email + ': ' + fd.get('email'),
      L.phone + ': ' + (fd.get('phone') || '-'), L.product + ': ' + fd.get('product'), L.qty + ': ' + (fd.get('qty') || '-'),
    ]);
    msg(wsForm, ui().sent, 'ok');
  });
  $$('.field input').forEach(function (i) { i.addEventListener('input', function () { i.closest('.field').classList.remove('is-invalid'); }); });

  /* ========================================================== checklist */
  var checklist = $('.checklist');
  $$('#checklist input').forEach(function (c, i) {
    try { c.checked = localStorage.getItem('sunmist-check-' + i) === '1'; } catch (e) {}
    c.addEventListener('change', function () {
      try { localStorage.setItem('sunmist-check-' + i, c.checked ? '1' : '0'); } catch (e) {}
      checkDone();
    });
  });
  function checkDone() { checklist.classList.toggle('is-done', $$('#checklist input').every(function (c) { return c.checked; })); }
  checkDone();

  /* ========================================================== details dialog */
  var dialog = $('#details');
  function openDetails(i) {
    var d = I18N.details[lang][i], en = I18N.details.en[i], L = ui().detail;
    $('#detailsBody').innerHTML =
      '<div class="details__hero"><div class="details__swatch" style="background:' + en.swatch + '"></div><div>' +
      '<h2 id="detailsTitle">' + d.name + '</h2><p class="details__tag">' + d.tag + '</p></div></div>' +
      '<div class="details__grid">' +
      '<div class="details__block details__block--wide"><h4>' + L.about + '</h4><p>' + d.about + '</p></div>' +
      '<div class="details__block"><h4>' + L.taste + '</h4><p>' + d.taste + '</p></div>' +
      '<div class="details__block"><h4>' + L.enjoy + '</h4><p>' + d.enjoy + '</p></div>' +
      '<div class="details__block details__block--wide"><h4>' + L.pick + '</h4><ul>' + d.pick.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></div>' +
      '<div class="details__block details__block--wide"><h4>' + L.price + '</h4><p>' + d.price + '</p></div>' +
      '</div><a href="#book" class="btn btn--orange btn--lg" data-close><span>' + L.cta + '</span><svg class="i"><use href="#i-arrow"/></svg></a>';
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    if (lenis) lenis.stop();
  }
  function closeDetails() { if (dialog.open) dialog.close(); }
  dialog.addEventListener('close', function () { if (lenis) lenis.start(); });
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) return closeDetails();
    var c = e.target.closest('[data-close]');
    if (c) { closeDetails(); if (c.getAttribute('href') === '#book') { e.preventDefault(); scrollToHash('#book'); } }
  });
  $$('[data-details]').forEach(function (b) { b.addEventListener('click', function () { openDetails(+b.getAttribute('data-details')); }); });

  /* ========================================================== mobile menu */
  var burger = $('#burger'), mmenu = $('#mobileMenu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { mmenu.hidden = false; requestAnimationFrame(function () { mmenu.classList.add('is-open'); }); if (lenis) lenis.stop(); }
    else { mmenu.classList.remove('is-open'); setTimeout(function () { if (!mmenu.classList.contains('is-open')) mmenu.hidden = true; }, 700); if (lenis) lenis.start(); }
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });

  /* ========================================================== anchors */
  var lenis = null;
  function scrollToHash(hash) {
    var t = hash === '#top' ? 0 : $(hash); if (t === null) return;
    // a pinned section moves inside its spacer; aim for the spacer so we land at the start
    if (t && t.parentElement && t.parentElement.classList.contains('pin-spacer')) t = t.parentElement;
    if (lenis) lenis.scrollTo(t, { offset: 0, duration: 1.6 });
    else if (t === 0) window.scrollTo({ top: 0, behavior: 'smooth' }); else t.scrollIntoView({ behavior: 'smooth' });
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var h = a.getAttribute('href'); if (h.length < 2) return;
      e.preventDefault(); setMenu(false); scrollToHash(h);
    });
  });

  /* ========================================================== stars (farm stay) */
  (function stars() {
    var c = $('#stars'); if (!c) return;
    var g = c.getContext('2d'), pts = [], on = false, dpr = Math.min(devicePixelRatio || 1, 2);
    function size() {
      c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr; pts = [];
      for (var i = 0; i < 220; i++) pts.push({ x: Math.random() * c.width, y: Math.random() * c.height * 0.8, r: (Math.random() * 1.3 + 0.3) * dpr, p: Math.random() * 6, s: Math.random() * 2 + 0.5 });
    }
    function draw(t) {
      if (!on) return;
      g.clearRect(0, 0, c.width, c.height);
      pts.forEach(function (s) { g.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t / 1000 * s.s + s.p)); g.fillStyle = '#fff6e0'; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); });
      if (!reduced) requestAnimationFrame(draw);
    }
    size(); addEventListener('resize', size);
    new IntersectionObserver(function (en) { on = en[0].isIntersecting; if (on) requestAnimationFrame(draw); }).observe(c);
  })();

  /* ========================================================== no-GSAP fallback */
  var scene = null;
  splitAll();
  buildMarquee();
  updateOpenStatus();
  if (lang !== 'en') applyLang(lang);

  if (!hasGsap) {
    $('#loader').remove(); root.classList.add('no-webgl');
    return;
  }

  /* ================================================================ 3D scene */
  var canvas = $('#orchard');
  function initScene(done) {
    var ok = !reduced && window.OrchardScene && window.OrchardScene.supported();
    if (!ok) { root.classList.add('no-webgl'); canvas.remove(); return done(); }
    // let the loader paint before the (synchronous) texture generation
    setTimeout(function () {
      try { scene = window.OrchardScene.create(canvas, { onReady: done }); } catch (e) { console.warn(e); scene = null; }
      if (!scene) { root.classList.add('no-webgl'); canvas.remove(); done(); }
    }, 60);
  }

  /* ================================================================ lenis */
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ================================================================ preloader */
  var bar = $('#loaderBar'), count = $('#loaderCount'), prog = { v: 0 };
  var setProg = function () { count.textContent = Math.round(prog.v); bar.style.strokeDashoffset = 327 * (1 - prog.v / 100); };
  var loaderTween = gsap.to(prog, { v: 82, duration: 1.4, ease: 'power2.out', onUpdate: setProg });
  if (lenis) lenis.stop();
  window.scrollTo(0, 0);

  initScene(function () {
    loaderTween.kill();
    gsap.to(prog, {
      v: 100, duration: 0.5, ease: 'power1.inOut', onUpdate: setProg, onComplete: function () {
        gsap.timeline()
          .to('.loader__inner', { scale: 0.85, opacity: 0, duration: 0.45, ease: 'power2.in' })
          .to('#loader', { clipPath: 'circle(0% at 50% 50%)', duration: 1, ease: 'expo.inOut' }, '-=0.1')
          .add(function () { $('#loader').remove(); if (lenis) lenis.start(); intro(); }, '-=0.45');
      },
    });
    setupScroll();
  });
  gsap.set('#loader', { clipPath: 'circle(150% at 50% 50%)' });

  function intro() {
    revealSplit($('.hero__title'), 0);
    gsap.fromTo('[data-hero]', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.3 });
  }

  /* ================================================================ scroll choreography */
  function setupScroll() {
    // headings
    $$('[data-split]').forEach(function (el) {
      if (el.classList.contains('hero__title')) return;
      ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: function () { revealSplit(el); } });
    });
    // fade-ups
    $$('[data-reveal]').forEach(function (el) {
      gsap.fromTo(el, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    // counters
    $$('[data-count]').forEach(function (el) {
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () { runCounter(el); } });
    });

    // hero parallax
    gsap.to('.hero__inner', { yPercent: -18, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });

    // 3D chapters
    ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: 'bottom top', onUpdate: function (s) { scene && scene.set('heroOut', s.progress); } });
    ScrollTrigger.create({ trigger: '#story', start: 'top bottom', end: 'bottom top', onUpdate: function (s) { scene && scene.set('story', s.progress); } });

    var panels = $$('.fruit'), dots = $$('.fruits__dots button'), big = $('#fruitsBig'), cssFruit = $('#cssFruit');
    var current = -1;
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
    var fruitsST = ScrollTrigger.create({
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

    var outP = 0;
    ScrollTrigger.create({ trigger: '#upick', start: 'top bottom', end: 'top top', onUpdate: function (s) { outP = s.progress; scene && scene.set('out', s.progress); setBg(); } });

    function setBg() {
      var c = '#fff1de';
      if (outP < 0.5 && fruitsST.progress > 0) c = panels[current].getAttribute('data-bg');
      root.style.setProperty('--bg', c);
      if (scene) scene.setFog(c);
    }

    // fruit basket finale
    if (scene) {
      scene.attachBasket($('#book'));
      ScrollTrigger.create({ trigger: '#book', start: 'top 55%', once: true, onEnter: function () { scene.dropFruit(); } });
      $('#shake').addEventListener('click', function () { scene.dropFruit(); });

      // only render while a see-through chapter is on screen
      var visible = new Set();
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) visible.add(en.target); else visible.delete(en.target); });
        scene.setActive(visible.size > 0);
      });
      ['#hero', '#story', '#fruits', '#book'].forEach(function (s) { io.observe($(s)); });
    } else {
      $('#shake').remove();
    }

    // scroll position → scene (floating fruit parallax) and nav state
    var nav = $('#nav'), lastY = 0;
    function onScroll(y) {
      if (scene) scene.set('scrollY', y);
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('is-hidden', y > lastY && y > 400 && !mmenu.classList.contains('is-open'));
      lastY = y;
    }
    if (lenis) lenis.on('scroll', function (e) { onScroll(e.scroll); });
    else addEventListener('scroll', function () { onScroll(scrollY); }, { passive: true });

    // marquee speeds up with scroll velocity
    if (lenis && marqueeTween) lenis.on('scroll', function (e) {
      var v = Math.min(Math.abs(e.velocity) / 10, 4);
      gsap.to(marqueeTween, { timeScale: (e.direction < 0 ? -1 : 1) * (1 + v), duration: 0.3, overwrite: true });
    });

    ScrollTrigger.refresh();
  }

  /* ================================================================ cursor + magnetic + tilt */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !reduced) {
    var cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring');
    var dx = gsap.quickTo(dot, 'x', { duration: 0.1 }), dy = gsap.quickTo(dot, 'y', { duration: 0.1 });
    var rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    addEventListener('pointermove', function (e) { cur.classList.add('is-on'); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    document.addEventListener('pointerleave', function () { cur.classList.remove('is-on'); });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest ? e.target : null; if (!t) return;
      cur.classList.toggle('is-hover', !!t.closest('[data-magnetic]'));
      cur.classList.toggle('is-link', !t.closest('[data-magnetic]') && !!t.closest('a, button, label, input, select, textarea'));
    });

    $$('[data-magnetic]').forEach(function (el) {
      var mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' }), my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.25); my((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', function () { mx(0); my(0); });
    });

    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotateY: px * 10, rotateX: -py * 10, duration: 0.6, ease: 'power3.out', transformPerspective: 900 });
      });
      el.addEventListener('pointerleave', function () { gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.9, ease: 'elastic.out(1, .5)' }); });
    });
  }

  addEventListener('resize', function () { clearTimeout(window.__rz); window.__rz = setTimeout(buildMarquee, 200); });
  var yEl = $('#year'); if (yEl) yEl.textContent = new Date().getFullYear();
})();
