/*! PLCS site script - vanilla JS, no dependencies.
    Replaces jQuery + Bootstrap JS + bootsnav + WOW + Isotope + Magnific Popup + Revolution Slider. */
(function () {
  'use strict';
  var d = document, w = window, de = d.documentElement;
  var reduced = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function on(el, ev, fn, opt) { el.addEventListener(ev, fn, opt || false); }

  de.classList.remove('no-js');
  de.classList.add('js');

  /* ---------- Header: sticky + "appear on scroll up" + scroll-to-top arrow ---------- */
  var header = $('header');
  var nav = $('nav.navbar') || $('nav');
  var arrow = $('.scroll-top-arrow');
  var lastY = 0, ticking = false;

  function onScroll() {
    ticking = false;
    var y = w.pageYOffset || de.scrollTop || 0;
    var h = nav ? nav.offsetHeight : 0;
    if (header && !header.classList.contains('no-sticky')) {
      header.classList.toggle('sticky', y >= h);
      if (y > lastY) header.classList.remove('header-appear');
      else header.classList.add('header-appear');
      if (y <= h) header.classList.remove('header-appear');
    }
    lastY = y;
    if (arrow) arrow.classList.toggle('is-visible', y > 150);
  }
  on(w, 'scroll', function () {
    if (!ticking) { ticking = true; w.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (arrow) {
    on(arrow, 'click', function (e) {
      e.preventDefault();
      w.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Active menu item ---------- */
  (function () {
    var file = (w.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    $$('.nav li a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('#')[0].toLowerCase();
      if (href && href === file) {
        a.parentNode.classList.add('active');
        var dd = a.closest('li.dropdown');
        if (dd) dd.classList.add('active');
      }
    });
  })();

  /* ---------- Collapse (mobile menu + accordions) ---------- */
  function setCollapse(el, open) {
    if (!el) return;
    var isOpen = el.classList.contains('show');
    if (open === isOpen) return;
    var done = function () {
      el.classList.remove('collapsing');
      el.classList.add('collapse');
      if (open) el.classList.add('show');
      el.style.height = '';
    };
    if (reduced) { el.classList.toggle('show', open); syncToggles(el, open); return; }
    if (open) {
      el.classList.remove('collapse');
      el.classList.add('collapsing');
      el.style.height = '0px';
      void el.offsetHeight;
      el.style.height = el.scrollHeight + 'px';
    } else {
      el.style.height = el.getBoundingClientRect().height + 'px';
      void el.offsetHeight;
      el.classList.remove('collapse', 'show');
      el.classList.add('collapsing');
      el.style.height = '0px';
    }
    w.setTimeout(done, 350);
    syncToggles(el, open);
  }

  function syncToggles(el, open) {
    var id = el.id;
    if (!id) return;
    $$('[data-toggle="collapse"]').forEach(function (t) {
      var target = t.getAttribute('data-target') || t.getAttribute('href');
      if (target !== '#' + id) return;
      t.classList.toggle('collapsed', !open);
      t.setAttribute('aria-expanded', open ? 'true' : 'false');
      var heading = t.closest('.panel-heading');
      if (heading) heading.classList.toggle('active-accordion', open);
      var icon = t.querySelector('.panel-title i');
      if (icon) {
        icon.classList.toggle('fa-angle-up', open);
        icon.classList.toggle('fa-angle-down', !open);
      }
    });
  }

  $$('[data-toggle="collapse"]').forEach(function (btn) {
    on(btn, 'click', function (e) {
      var sel = btn.getAttribute('data-target') || btn.getAttribute('href');
      if (!sel || sel.charAt(0) !== '#') return;
      var target = $(sel);
      if (!target) return;
      e.preventDefault();
      var open = !target.classList.contains('show');
      var parentSel = target.getAttribute('data-parent');
      if (open && parentSel) {
        var parent = $(parentSel);
        if (parent) $$('.collapse.show', parent).forEach(function (o) { if (o !== target) setCollapse(o, false); });
      }
      setCollapse(target, open);
    });
  });

  /* Close the mobile menu if the window is resized up to desktop */
  on(w, 'resize', function () {
    if (w.innerWidth > 991) $$('.navbar-collapse.show').forEach(function (n) { setCollapse(n, false); });
  });

  /* ---------- Scroll reveal (replaces WOW.js) ---------- */
  (function () {
    var els = $$('.wow');
    if (!els.length || reduced || !('IntersectionObserver' in w)) return;
    var vh = w.innerHeight || de.clientHeight;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        var delay = el.getAttribute('data-wow-delay');
        var dur = el.getAttribute('data-wow-duration');
        if (delay) el.style.animationDelay = delay;
        if (dur) el.style.animationDuration = dur;
        el.style.visibility = 'visible';
        el.classList.add('animated');
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) return;   // already on screen: never hide it
      el.style.visibility = 'hidden';
      io.observe(el);
    });
  })();

  /* ---------- Hero slideshow ---------- */
  (function () {
    var hero = $('.plcs-hero');
    if (!hero) return;
    var slides = $$('.plcs-slide', hero);
    var dotsWrap = $('.plcs-dots', hero);
    var dots = [];
    var idx = 0, timer = null;

    function lazyLoad() {
      $$('[data-srcset],[data-src]', hero).forEach(function (n) {
        if (n.dataset.srcset) { n.srcset = n.dataset.srcset; n.removeAttribute('data-srcset'); }
        if (n.dataset.src) { n.src = n.dataset.src; n.removeAttribute('data-src'); }
      });
    }
    function go(n) {
      n = (n + slides.length) % slides.length;
      slides[idx].classList.remove('is-active');
      slides[idx].setAttribute('aria-hidden', 'true');
      if (dots[idx]) { dots[idx].classList.remove('is-active'); dots[idx].removeAttribute('aria-current'); }
      idx = n;
      slides[idx].classList.add('is-active');
      slides[idx].removeAttribute('aria-hidden');
      if (dots[idx]) { dots[idx].classList.add('is-active'); dots[idx].setAttribute('aria-current', 'true'); }
    }
    function start() { stop(); if (!reduced && slides.length > 1) timer = w.setInterval(function () { go(idx + 1); }, 9000); }
    function stop() { if (timer) { w.clearInterval(timer); timer = null; } }

    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var b = d.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Show slide ' + (i + 1) + ' of ' + slides.length);
        if (i === 0) { b.className = 'is-active'; b.setAttribute('aria-current', 'true'); }
        on(b, 'click', function () { lazyLoad(); go(i); start(); });
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }
    // swipe
    var sx = null;
    on(hero, 'touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    on(hero, 'touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      sx = null;
      if (Math.abs(dx) > 50) { lazyLoad(); go(idx + (dx < 0 ? 1 : -1)); start(); }
    }, { passive: true });

    on(d, 'visibilitychange', function () { if (d.hidden) stop(); else start(); });
    // Secondary slide images load only after the page has finished loading.
    var later = function () { (w.requestIdleCallback || function (f) { w.setTimeout(f, 800); })(lazyLoad); start(); };
    if (d.readyState === 'complete') later(); else on(w, 'load', later);
  })();

  /* ---------- Video facade (YouTube loads only when clicked) ---------- */
  $$('[data-yt]').forEach(function (btn) {
    on(btn, 'click', function () {
      var f = d.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + btn.getAttribute('data-yt') + '?autoplay=1&rel=0';
      f.title = btn.getAttribute('data-title') || 'Video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.setAttribute('allowfullscreen', '');
      btn.parentNode.replaceChild(f, btn);
      f.focus();
    });
  });

  /* ---------- Gallery filter (replaces Isotope) ---------- */
  $$('.portfolio-filter a[data-filter]').forEach(function (a) {
    on(a, 'click', function (e) {
      e.preventDefault();
      var f = a.getAttribute('data-filter');
      $$('.portfolio-filter li').forEach(function (li) { li.classList.remove('active'); });
      if (a.parentNode) a.parentNode.classList.add('active');
      $$('.portfolio-grid > li.grid-item').forEach(function (li) {
        li.classList.toggle('is-filtered', !(f === '*' || li.matches(f)));
      });
    });
  });

  /* ---------- Lightbox (replaces Magnific Popup) ---------- */
  (function () {
    var links = $$('a.lightbox-group-gallery-item, .lightbox-portfolio a.gallery-link');
    if (!links.length) return;
    var box = d.createElement('div');
    box.className = 'plcs-lb';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Image viewer');
    box.innerHTML = '<button type="button" class="plcs-lb-close" aria-label="Close image">&times;</button>' +
      '<button type="button" class="plcs-lb-prev" aria-label="Previous image">&#8249;</button>' +
      '<img class="plcs-lb-img" alt="">' +
      '<button type="button" class="plcs-lb-next" aria-label="Next image">&#8250;</button>' +
      '<div class="plcs-lb-count" aria-live="polite"></div>';
    d.body.appendChild(box);
    var img = $('.plcs-lb-img', box), count = $('.plcs-lb-count', box);
    var set = [], pos = 0, opener = null;

    function thumbOf(a) {
      var li = a.closest('li');
      return a.querySelector('img') || (li && li.querySelector('img'));
    }
    function visibleSet() {
      return links.filter(function (a) { var li = a.closest('li'); return !(li && li.classList.contains('is-filtered')); });
    }
    function show(i) {
      pos = (i + set.length) % set.length;
      var a = set[pos], t = thumbOf(a);
      img.src = a.getAttribute('href');
      img.alt = t ? t.alt : '';
      count.textContent = (pos + 1) + ' / ' + set.length;
      var nxt = new Image(); nxt.src = set[(pos + 1) % set.length].getAttribute('href');
    }
    function open(a) {
      set = visibleSet();
      opener = a;
      box.classList.add('is-open');
      d.body.classList.add('plcs-lb-open');
      show(Math.max(0, set.indexOf(a)));
      $('.plcs-lb-close', box).focus();
    }
    function close() {
      box.classList.remove('is-open');
      d.body.classList.remove('plcs-lb-open');
      img.removeAttribute('src');
      if (opener) opener.focus();
    }
    links.forEach(function (a) {
      on(a, 'click', function (e) { e.preventDefault(); open(a); });
      if (!a.getAttribute('aria-label')) {
        var t = thumbOf(a);
        a.setAttribute('aria-label', 'View larger image' + (t && t.alt ? ': ' + t.alt : ''));
      }
    });
    on($('.plcs-lb-close', box), 'click', close);
    on($('.plcs-lb-prev', box), 'click', function () { show(pos - 1); });
    on($('.plcs-lb-next', box), 'click', function () { show(pos + 1); });
    on(box, 'click', function (e) { if (e.target === box) close(); });
    on(d, 'keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(pos - 1);
      else if (e.key === 'ArrowRight') show(pos + 1);
      else if (e.key === 'Tab') {
        var f = $$('button', box), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var tx = null;
    on(box, 'touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    on(box, 'touchend', function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 50) show(pos + (dx < 0 ? 1 : -1));
    }, { passive: true });
  })();
})();
