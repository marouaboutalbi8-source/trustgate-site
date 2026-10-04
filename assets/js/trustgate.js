/* TrustGate · "The Gate" (v2). Motion follows the brand principle "open, then hold": ease-out, no bounce.
   Every page is complete without this file; GSAP and Lenis add the choreography when they load. */
(function () {
  "use strict";
  var d = document, root = d.documentElement, W = window;
  var reduce = W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = W.matchMedia && W.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var lenis = null;

  /* ------------------------------------------------ doors: arrival */
  var intro = root.classList.contains("intro");
  var arriving = root.classList.contains("doors-shut");
  var openDelay = intro ? 1800 : 280;
  if (arriving) {
    setTimeout(function () { root.classList.remove("doors-shut"); }, openDelay);
    setTimeout(function () { root.classList.remove("intro"); }, openDelay + 1200);
  }
  var revealAt = arriving ? (openDelay + 380) / 1000 : .15;
  W.addEventListener("pageshow", function (e) { if (e.persisted) root.classList.remove("doors-shut"); });

  /* ------------------------------------------------ doors: departure, and in-page anchors */
  d.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
    var href = a.getAttribute("href");
    if (!href || /^(https?:|mailto:|tel:)/.test(href)) return;
    var here = location.pathname.split("/").pop() || "index.html";
    var parts = href.split("#");
    if (href.charAt(0) === "#" || parts[0] === here) {
      var t = parts[1] && d.getElementById(parts[1]);
      if (t) { e.preventDefault(); closeMenu(); if (lenis) lenis.scrollTo(t, { offset: -90, duration: 1.6 }); else t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }
      return;
    }
    if (href.indexOf(".html") < 0 || reduce) return;
    e.preventDefault();
    try { sessionStorage.setItem("tg-doors", "1"); } catch (err) { }
    root.classList.add("doors-shut");
    setTimeout(function () { location.href = href; }, 1000);
  });

  /* ------------------------------------------------ Doha clock and office status */
  function tick() {
    var now = new Date(), t, wd, h;
    try {
      t = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Qatar", hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
      wd = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Qatar", weekday: "short" }).format(now);
      h = parseInt(t, 10);
    } catch (e) { return; }
    $$("[data-clock]").forEach(function (c) { c.textContent = t; });
    var open = wd !== "Fri" && h >= 8 && h < 17;
    $$("[data-status]").forEach(function (s) { s.textContent = open ? "The office is open" : "The office is closed"; });
    $$("[data-today]").forEach(function (s) {
      try { s.textContent = "Doha, " + new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Qatar", day: "numeric", month: "long", year: "numeric" }).format(now); } catch (e) { }
    });
  }
  tick(); setInterval(tick, 15000);

  /* ------------------------------------------------ menu */
  var mbtn = $(".hd-menu"), menu = $("#menu");
  function closeMenu() {
    if (!menu || menu.hidden) return;
    mbtn.setAttribute("aria-expanded", "false"); menu.classList.remove("open"); root.classList.remove("menu-open");
    if (lenis) lenis.start();
    setTimeout(function () { if (!menu.classList.contains("open")) menu.hidden = true; }, 1100);
  }
  if (mbtn && menu) {
    mbtn.addEventListener("click", function () {
      if (mbtn.getAttribute("aria-expanded") === "true") return closeMenu();
      menu.hidden = false; mbtn.setAttribute("aria-expanded", "true"); root.classList.add("menu-open");
      if (lenis) lenis.stop();
      requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add("open"); }); });
    });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
    var ph = $(".mn-ph img", menu);
    $$(".mn-list a", menu).forEach(function (a) {
      var src = a.getAttribute("data-img"); var pre = new Image(); pre.src = src;
      a.addEventListener("mouseenter", function () { if (ph.getAttribute("src") === src) return; ph.style.opacity = 0; setTimeout(function () { ph.src = src; ph.style.opacity = 1; }, 220); });
    });
  }

  /* ------------------------------------------------ three doors (structures) */
  var drs = $$(".dr-p");
  function openDoor(p) { drs.forEach(function (x) { x.classList.toggle("on", x === p); }); }
  drs.forEach(function (p) {
    p.addEventListener("click", function () { openDoor(p); });
    p.addEventListener("focus", function () { openDoor(p); });
    if (fine) p.addEventListener("mouseenter", function () { openDoor(p); });
  });

  /* ------------------------------------------------ route planner tabs */
  var rtabs = $$(".rp-tab");
  rtabs.forEach(function (t, i) {
    var pick = function (n, f) { rtabs.forEach(function (x) { var on = x === n; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; d.getElementById(x.getAttribute("aria-controls")).hidden = !on; }); if (f) n.focus(); if (W.ScrollTrigger) W.ScrollTrigger.refresh(); };
    t.addEventListener("click", function () { pick(t); });
    t.addEventListener("keydown", function (e) { var n = null; if (e.key === "ArrowRight") n = rtabs[(i + 1) % rtabs.length]; if (e.key === "ArrowLeft") n = rtabs[(i - 1 + rtabs.length) % rtabs.length]; if (n) { e.preventDefault(); pick(n, true); } });
  });

  /* ------------------------------------------------ document checklist, remembered in this browser */
  var dcs = $$("[data-doc]");
  if (dcs.length) {
    var dn = $("[data-dc-n]"), prog = $(".dc-prog");
    var upd = function () { var c = dcs.filter(function (x) { return x.checked; }).length; dn.textContent = c; prog.style.strokeDashoffset = (1 - c / dcs.length).toFixed(3); try { localStorage.setItem("tg-docs", JSON.stringify(dcs.map(function (x) { return x.checked ? 1 : 0; }))); } catch (e) { } };
    try { var sv0 = JSON.parse(localStorage.getItem("tg-docs") || "[]"); dcs.forEach(function (x, i) { x.checked = !!sv0[i]; }); } catch (e) { }
    dcs.forEach(function (x) { x.addEventListener("change", upd); }); upd();
  }


  /* ------------------------------------------------ accordion with picture */
  var accs = $$(".acc"), acim = $$(".ac-img");
  accs.forEach(function (a) {
    a.addEventListener("toggle", function () {
      if (!a.open) return;
      accs.forEach(function (b) { if (b !== a) b.open = false; });
      acim.forEach(function (m) { m.classList.toggle("on", m.getAttribute("data-i") === a.getAttribute("data-i")); });
    });
  });

  /* ------------------------------------------------ card carousel */
  var cct = $(".cc-track");
  if (cct) $$(".cc-b").forEach(function (b) { b.addEventListener("click", function () { var c = cct.querySelector(".cc"); cct.scrollBy({ left: (c ? c.offsetWidth * 1.05 : 400) * parseInt(b.getAttribute("data-cc"), 10), behavior: reduce ? "auto" : "smooth" }); }); });

  /* ------------------------------------------------ living dots in the closing card (after Antigravity) */
  $$(".fn-dots").forEach(function (cv) {
    if (reduce) return;
    var ctx = cv.getContext("2d"), P = [], mx = -999, my = -999, on = false, DPR = Math.min(2, W.devicePixelRatio || 1);
    var size = function () { var w = cv.clientWidth, h = cv.clientHeight; cv.width = w * DPR; cv.height = h * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      P = []; var n = Math.round(w * h / 5200); for (var i = 0; i < n; i++) P.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18, r: Math.random() * 1.3 + .4 }); };
    var tick = function () {
      var w = cv.clientWidth, h = cv.clientHeight; ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < P.length; i++) { var p = P[i], dx = p.x - mx, dy = p.y - my, dd = Math.hypot(dx, dy);
        if (dd < 140) { p.x += dx / dd * 1.6; p.y += dy / dd * 1.6; }
        p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x = w; if (p.x > w) p.x = 0; if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.fillStyle = "rgba(255,255,255," + (dd < 160 ? .75 : .3) + ")"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
      if (on) requestAnimationFrame(tick);
    };
    var card = cv.parentElement;
    card.addEventListener("pointermove", function (e) { var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    card.addEventListener("pointerleave", function () { mx = my = -999; });
    size(); W.addEventListener("resize", size);
    if ("IntersectionObserver" in W) new IntersectionObserver(function (es) { es.forEach(function (en) { var was = on; on = en.isIntersecting; if (on && !was) requestAnimationFrame(tick); }); }).observe(card);
  });

  /* ------------------------------------------------ index filter */
  var fbtns = $$(".ix-f button");
  function filt(k) {
    fbtns.forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-f") === k); });
    $$(".ix-list li").forEach(function (li) { li.classList.toggle("off", k !== "all" && li.getAttribute("data-p") !== k); });
    if (W.ScrollTrigger) W.ScrollTrigger.refresh();
  }
  fbtns.forEach(function (b) { b.addEventListener("click", function () { filt(b.getAttribute("data-f")); }); });
  if (fbtns.length) {
    var hk = (location.hash || "").slice(1);
    if (["corporate", "support", "digital"].indexOf(hk) >= 0) filt(hk);
    W.addEventListener("hashchange", function () { var k = location.hash.slice(1); if (["corporate", "support", "digital"].indexOf(k) >= 0) filt(k); });
  }

  /* ------------------------------------------------ copy */
  function copyText(text, btn, el) {
    var done = function () { var o = btn.textContent; btn.classList.add("done"); btn.textContent = "Copied"; setTimeout(function () { btn.classList.remove("done"); btn.textContent = o; }, 1800); };
    var fallback = function () {
      var t = el || btn.previousElementSibling; if (!t) return;
      var r = d.createRange(); r.selectNodeContents(t); var s = W.getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "Selected";
    };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch (err) { fallback(); }
  }
  $$("[data-copy]").forEach(function (b) { b.addEventListener("click", function () { copyText(b.getAttribute("data-copy"), b); }); });

  /* ------------------------------------------------ the letter */
  var fm = $("#enquiry");
  if (fm) {
    var sel = $("#f-service"), hk2 = decodeURIComponent((location.hash || "").slice(1));
    if (hk2 && sel && sel.querySelector('option[value="' + hk2 + '"]')) sel.value = hk2;
    var err = $(".lt-err", fm), done = $(".lt-done", fm), sum = $(".lt-sum", fm);
    var names = { "f-name": "your name", "f-email": "your email", "f-phone": "your phone number" };
    fm.addEventListener("submit", function (e) {
      e.preventDefault();
      var miss = [];
      $$("[required]", fm).forEach(function (f) {
        var bad = !f.value.trim() || (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()));
        f.setAttribute("aria-invalid", bad ? "true" : "false"); if (bad) miss.push(names[f.id]);
      });
      if (miss.length) { err.hidden = false; err.textContent = "Please add " + miss.join(", ") + " so we can reply."; fm.querySelector('[aria-invalid="true"]').focus(); return; }
      err.hidden = true;
      var v = function (n) { var f = fm.elements[n]; return f ? (f.value || "").trim() : ""; };
      var svc = sel && sel.value ? sel.options[sel.selectedIndex].text : "something I describe below";
      var text = "Dear TrustGate,\n\nMy name is " + v("name") + (v("company") ? ", from " + v("company") : "") + ". I would like your help with " + svc + "." +
        (v("message") ? "\n\n" + v("message") : "") + "\n\nYou can reach me at " + v("email") + " or " + v("phone") + ", preferably by " + v("pref") + ".\n\nWith thanks.";
      var endpoint = fm.getAttribute("data-endpoint");
      var show = function () { sum.textContent = text; done.hidden = false; done.focus(); };
      if (endpoint) {
        fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text, name: v("name"), email: v("email"), phone: v("phone"), service: svc }) })
          .then(function (r) { if (!r.ok) throw 0; $(".cap", done).textContent = "Your letter has been sent"; $(".lt-dn", done).textContent = "A member of the team will reply within one working day."; show(); })
          .catch(function () { err.hidden = false; err.textContent = "Your letter could not be sent. Please call or email us and we will reply quickly."; });
        return;
      }
      show();
    });
    var cs = $("[data-copy-sum]", fm);
    if (cs) cs.addEventListener("click", function () { copyText(sum.textContent, cs, sum); });
  }

  /* ------------------------------------------------ cursor */
  if (fine && !reduce) {
    var cur = $(".cur"), ring = $(".cur-r");
    if (cur) {
      root.classList.add("has-cur");
      var mx = -100, my = -100, cx = -100, cy = -100;
      W.addEventListener("pointermove", function (e) {
        mx = e.clientX; my = e.clientY;
        var t = e.target, im = t.closest && t.closest("[data-cursor-img]"), ln = t.closest && t.closest("a, button, .dr-p, select, input, textarea");
        var tone = t.closest && t.closest("[data-tone], .mn");
        cur.classList.toggle("dark", !!tone && (tone.classList.contains("mn") || tone.getAttribute("data-tone") === "dark"));
        if (im && W.innerWidth > 1000) { ring.style.backgroundImage = "url(" + im.getAttribute("data-cursor-img") + ")"; cur.classList.add("img"); cur.classList.remove("link"); }
        else { cur.classList.remove("img"); ring.style.backgroundImage = ""; cur.classList.toggle("link", !!ln); }
      }, { passive: true });
      d.addEventListener("pointerleave", function () { mx = my = -200; });
      (function loop() { cx += (mx - cx) * .18; cy += (my - cy) * .18; cur.style.transform = "translate3d(" + cx + "px," + cy + "px,0)"; requestAnimationFrame(loop); })();
    }
  }

  /* ------------------------------------------------ choreography (GSAP) */
  function boot() {
    var gsap = W.gsap, ST = W.ScrollTrigger;
    if (!gsap || !ST) return;
    gsap.registerPlugin(ST);
    root.classList.add("gs");
    if (reduce) { root.classList.remove("gs"); return; }

    if (W.Lenis) {
      lenis = new W.Lenis({ lerp: .085, smoothWheel: true, wheelMultiplier: .95 });
      lenis.on("scroll", ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    var hd = $(".hd");
    var setTone = function (t) { if (hd && hd.getAttribute("data-tone") !== t) hd.setAttribute("data-tone", t); };
    $$("[data-tone]").forEach(function (sec) {
      if (sec === hd) return;
      ST.create({ trigger: sec, start: "top 42px", end: "bottom 42px", onToggle: function (s) { if (s.isActive && !sec.classList.contains("hx")) setTone(sec.getAttribute("data-tone")); } });
    });
    ST.create({ start: 0, end: "max", onUpdate: function (s) { if (!root.classList.contains("menu-open")) hd.classList.toggle("away", s.direction === 1 && s.scroll() > 240); } });

    /* headline lines rise */
    $$("[data-split]").forEach(function (el) {
      if (el.closest(".hx")) return;
      var top = el.getBoundingClientRect().top < W.innerHeight;
      gsap.from($$(".ln-i", el), { yPercent: 115, duration: 1.4, ease: "expo.out", stagger: .09, delay: top ? revealAt : 0,
        scrollTrigger: top ? null : { trigger: el, start: "top 88%" } });
    });
    /* quiet rise for supporting text */
    $$(".ph-cap, .ph-txt, .ph-row .toc, .ph-count, .ph-row .seal, .sh-crumb, .sh-row, .rt-lede, .dr-head p:not(.cap), .pr-ip, .cl-t, .lg-copy p, .lg-copy .gl, .sh-file, .nt-q, .nd, .gp, .gt-wrap, .fqs, .ab-lead, .ab-txt, .ct-dl, .lt, .rt-note, .stp-list li, .sv-list li, .gd-list li, .vl-list, .fn-grid > div, .wd-p, .rg-dl, .stt-cols > div").forEach(function (el) {
      if (el.closest(".hx")) return;
      var top = el.getBoundingClientRect().top < W.innerHeight;
      gsap.from(el, { y: 46, opacity: 0, duration: 1.3, ease: "expo.out", delay: top ? revealAt + .25 : 0, scrollTrigger: top ? null : { trigger: el, start: "top 92%" } });
    });
    /* plates open like a gate: the frame lifts, the photograph settles */
    $$(".plate-f").forEach(function (f) {
      var i = $(".plate-i", f), band = f.closest(".band-pl"), top = f.getBoundingClientRect().top < W.innerHeight;
      gsap.fromTo(f, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.7, ease: "expo.inOut", delay: top ? revealAt : 0, scrollTrigger: top ? null : { trigger: f, start: "top 85%" } });
      if (band) gsap.fromTo(i, { yPercent: -16 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: f, start: "top bottom", end: "bottom top", scrub: true } });
      else gsap.fromTo(i, { scale: 1.28 }, { scale: 1, duration: 2.2, ease: "expo.out", delay: top ? revealAt : 0, scrollTrigger: top ? null : { trigger: f, start: "top 85%" } });
    });

    /* ---------------- hero: fly through the gate; the city dissolves into atmosphere */
    var hx = $(".hx");
    if (hx) {
      var gate = $(".hx-gate", hx), photo = $(".hx-photo", hx), himg = $(".hx-img", hx), ringP = $(".hx-ring path", hx);
      var st = { q: 0, p: 0 }, G = {}, tilt = { x: 0, y: 0 }, tgt = { x: 0, y: 0 };
      if (fine) {
        hx.addEventListener("pointermove", function (e) { tgt.x = (e.clientX / W.innerWidth - .5) * 16; tgt.y = -(e.clientY / W.innerHeight - .5) * 12; });
        hx.addEventListener("pointerleave", function () { tgt.x = tgt.y = 0; });
        gsap.ticker.add(function () { if (Math.abs(tgt.x - tilt.x) + Math.abs(tgt.y - tilt.y) < .01) return; tilt.x += (tgt.x - tilt.x) * .06; tilt.y += (tgt.y - tilt.y) * .06; if (G.w) draw(); });
      }
      var geo = function () {
        var a = gate.getBoundingClientRect(), b = hx.getBoundingClientRect();
        G.x = a.left - b.left + a.width / 2; G.y = a.top - b.top + a.height / 2; G.r = a.width * .372;
        G.w = b.width; G.h = b.height; G.R = Math.hypot(G.w / 2, G.h / 2) + 4;
        G.k = (G.R / G.r) * 1.35;   /* how far the ring must grow to leave the frame */
      };
      var draw = function () {
        var e = Math.min(1, st.p / .5), k = e * e * (3 - 2 * e);
        var r = G.r * st.q + (G.R - G.r) * Math.pow(e, 1.6);
        photo.style.clipPath = "circle(" + r.toFixed(1) + "px at " + (G.x + (G.w / 2 - G.x) * k).toFixed(1) + "px " + (G.y + (G.h / 2 - G.y) * k).toFixed(1) + "px)";
        var s = 1 + (G.k - 1) * Math.pow(e, 1.6), tl = 1 - e;
        gate.style.transform = "translate(-50%,-50%) rotateX(" + (tilt.y * tl).toFixed(2) + "deg) rotateY(" + (tilt.x * tl).toFixed(2) + "deg) scale(" + s.toFixed(4) + ")";
        var late = Math.min(1, Math.max(0, (st.p - .42) / .2));
        himg.style.transform = "scale(" + (1.16 - .16 * e + .06 * late).toFixed(4) + ")";
        himg.style.filter = "";
      };
      geo(); draw();
      ST.addEventListener("refreshInit", geo);
      ST.addEventListener("refresh", draw);
      W.addEventListener("resize", function () { geo(); draw(); });
      gsap.set(ringP, { strokeDasharray: 1, strokeDashoffset: 1 });
      var it = gsap.timeline({ delay: revealAt });
      it.to(ringP, { strokeDashoffset: 0, duration: 1.5, ease: "expo.inOut" }, 0)
        .to(st, { q: 1, duration: 1.7, ease: "expo.inOut", onUpdate: draw }, .45)
        .from($$(".hx-a .ln-i, .hx-b .ln-i", hx), { yPercent: 115, duration: 1.6, ease: "expo.out", stagger: .12 }, .5)
        .from([$(".hx-side", hx), $(".hx-sc", hx)], { opacity: 0, y: 20, duration: 1.2, ease: "expo.out", stagger: .1 }, 1);
      var parts = gsap.timeline({
        scrollTrigger: { trigger: hx, start: "top top", end: "+=300%", pin: true, scrub: 1, anticipatePin: 1,
          onUpdate: function (s) { setTone(s.progress > .3 ? "dark" : "light"); }, onLeaveBack: function () { setTone("light"); } }
      });
      parts.to(st, { p: 1, ease: "none", duration: 1, onUpdate: draw }, 0)
        .to(".hx-a", { x: function () { return -W.innerWidth * .35; }, y: function () { return -W.innerHeight * .2; }, opacity: 0, ease: "power2.in", duration: .38 }, 0)
        .to(".hx-b", { x: function () { return W.innerWidth * .35; }, y: function () { return W.innerHeight * .2; }, opacity: 0, ease: "power2.in", duration: .38 }, 0)
        .to([".hx-side", ".hx-sc"], { opacity: 0, y: 30, ease: "none", duration: .2 }, 0)
        .to(".hx-plate", { opacity: 1, ease: "none", duration: .08 }, .4)
        .to(".hx-plate", { opacity: 0, ease: "none", duration: .1 }, .5)
        .fromTo(".hx-sky", { opacity: 0 }, { opacity: 1, ease: "power1.inOut", duration: .12 }, .48)
        .to(".hx-st", { opacity: 1, ease: "none", duration: .04 }, .58)
        .from(".hx-st .ln", { y: 50, opacity: 0, ease: "power3.out", duration: .16, stagger: .035 }, .6)
        .from(".hx-st .stt-cols > *", { opacity: 0, y: 30, ease: "power2.out", duration: .12, stagger: .02 }, .8)
        .to({}, { duration: .06 }, .94);
    }

    var mm = gsap.matchMedia();
    /* ---------------- practice: horizontal gallery on wide screens */
    mm.add("(min-width: 1001px)", function () {
      var pr = $(".pr");
      if (pr) {
        var track = $(".pr-track", pr), bar = $(".pr-bar", pr);
        var dist = function () { return Math.max(0, track.scrollWidth - W.innerWidth); };
        var h = gsap.to(track, { x: function () { return -dist(); }, ease: "none",
          scrollTrigger: { trigger: pr, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true,
            onUpdate: function (s) { bar.style.setProperty("--p", s.progress.toFixed(4)); } } });
        $$(".pr-panel:not(.pr-intro)", pr).forEach(function (p) {
          gsap.fromTo($(".pr-img", p), { xPercent: -12 }, { xPercent: 0, ease: "none", scrollTrigger: { trigger: p, containerAnimation: h, start: "left right", end: "right left", scrub: true } });
          gsap.fromTo($(".pr-num", p), { xPercent: 30 }, { xPercent: -10, ease: "none", scrollTrigger: { trigger: p, containerAnimation: h, start: "left right", end: "right left", scrub: true } });
          gsap.from($$(".pr-txt > *", p), { y: 60, opacity: 0, stagger: .08, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: p, containerAnimation: h, start: "left 70%" } });
        });
      }
      /* the route: the aside follows the active step */
      var rt = $(".rt");
      if (rt) {
        var n = $(".rt-n", rt), au = $(".rt-auth", rt), dd = $(".rt-d", rt), lis = $$(".rt-list li", rt), cur = -1;
        var show = function (i) {
          if (i === cur) return; cur = i;
          lis.forEach(function (l, j) { l.classList.toggle("on", j === i); });
          gsap.to([n, au, dd], { opacity: 0, y: -14, duration: .25, ease: "power2.in", onComplete: function () {
            n.textContent = lis[i].getAttribute("data-n"); au.textContent = lis[i].getAttribute("data-auth"); dd.textContent = lis[i].getAttribute("data-d");
            gsap.fromTo([n, au, dd], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .7, ease: "expo.out", stagger: .05 });
          } });
        };
        lis.forEach(function (l, i) { ST.create({ trigger: l, start: "top 58%", end: "bottom 58%", onToggle: function (s) { if (s.isActive) show(i); } }); });
        lis[0].classList.add("on");
      }
    });
    mm.add("(max-width: 1000px)", function () {
      $$(".rt-list li").forEach(function (l) { ST.create({ trigger: l, start: "top 75%", end: "bottom 25%", toggleClass: "on" }); });
    });

    /* ---------------- the seal comes down on the certificate */
    var sl = $(".sl");
    if (sl && W.innerWidth > 1000) {
      var seal = $(".sl-seal", sl), imp = $(".imp", sl);
      var stl = gsap.timeline({ scrollTrigger: { trigger: sl, start: "top top", end: "+=150%", pin: true, scrub: 1 } });
      stl.fromTo(".sl-l", { xPercent: -60, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "power3.out", duration: .4 }, 0)
        .fromTo(".sl-r", { xPercent: 60, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "power3.out", duration: .4 }, 0)
        .fromTo(".sl-doc", { y: 120, rotate: -10 }, { y: 0, rotate: -4, ease: "power2.out", duration: .5 }, 0)
        .fromTo(seal, { y: function () { return -W.innerHeight * .75; }, x: -60, scale: 1.9, rotate: -28, filter: "drop-shadow(0 120px 60px rgba(60,10,20,.18))" },
          { y: 0, x: 0, scale: 1, rotate: 0, filter: "drop-shadow(0 18px 18px rgba(60,10,20,.38))", ease: "power2.in", duration: .6 }, .05)
        .to(seal, { scale: .965, duration: .05, ease: "none" }, .65)
        .to(imp, { opacity: .72, duration: .05, ease: "none" }, .66)
        .to(seal, { y: -18, x: 14, rotate: 6, scale: 1, duration: .3, ease: "power2.out" }, .72)
        .fromTo(".sl-spec", { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: .04, duration: .2 }, .55)
        .fromTo(".sl-k", { opacity: 0 }, { opacity: 1, duration: .15 }, .4);
    }

    /* ---------------- Qatar in dots: a live map, the authorities rolling past, the file card */
    var qa = $(".qa");
    if (qa) {
      var cv = $(".qa-map", qa), ctx = cv.getContext("2d"), pin = $(".qa-pin", qa), dots = [], DPR = Math.min(2, W.devicePixelRatio || 1);
      /* Qatar's outline, longitude and latitude, simplified */
      var QA = [[50.82, 24.75], [50.86, 24.98], [50.80, 25.20], [50.76, 25.42], [50.77, 25.58], [50.86, 25.70], [50.96, 25.86], [51.05, 26.02], [51.15, 26.12], [51.24, 26.16], [51.33, 26.10], [51.43, 25.98], [51.53, 25.88], [51.58, 25.74], [51.53, 25.58], [51.52, 25.44], [51.55, 25.33], [51.62, 25.22], [51.63, 25.08], [51.60, 24.95], [51.52, 24.80], [51.42, 24.62], [51.30, 24.52], [51.12, 24.47], [50.95, 24.56]];
      var DOHA = [51.531, 25.322];
      var inside = function (x, y) { var c = false; for (var i = 0, j = QA.length - 1; i < QA.length; j = i++) { var a = QA[i], b = QA[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
      var M = {}, mxp = -999, myp = -999, seen = 0;
      var build = function () {
        var w = cv.clientWidth, h = cv.clientHeight; cv.width = w * DPR; cv.height = h * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        var lx0 = 50.72, lx1 = 51.70, ly0 = 24.42, ly1 = 26.22, kx = Math.cos(25.3 * Math.PI / 180);
        var sc = Math.min(w / ((lx1 - lx0) * kx), h / (ly1 - ly0));
        M = { w: w, h: h, ox: (w - (lx1 - lx0) * kx * sc) / 2, oy: (h - (ly1 - ly0) * sc) / 2, sc: sc, kx: kx, lx0: lx0, ly1: ly1 };
        var proj = function (lon, lat) { return [M.ox + (lon - lx0) * kx * sc, M.oy + (ly1 - lat) * sc]; };
        dots = []; var step = Math.max(6, Math.round(w / 64));
        for (var py = 0; py < h; py += step) for (var px = 0; px < w; px += step) {
          var lon = lx0 + (px - M.ox) / (kx * sc), lat = ly1 - (py - M.oy) / sc;
          if (inside(lon, lat)) dots.push({ x: px, y: py, d: Math.hypot(lon - DOHA[0], lat - DOHA[1]) });
        }
        var p = proj(DOHA[0], DOHA[1]); M.dx = p[0]; M.dy = p[1];
        var cr = cv.getBoundingClientRect(), qr = qa.getBoundingClientRect();
        pin.style.transform = "translate(" + (cr.left - qr.left + p[0] - 4.5) + "px," + (cr.top - qr.top + p[1] - 6) + "px)";
      };
      var t0 = performance.now();
      var frame = function (now) {
        ctx.clearRect(0, 0, M.w, M.h);
        var t = (now - t0) / 1000, rv = Math.min(1, seen);
        for (var i = 0; i < dots.length; i++) {
          var o = dots[i], dd = Math.hypot(o.x - mxp, o.y - myp), near = Math.max(0, 1 - dd / 120);
          var wave = .5 + .5 * Math.sin(t * 1.4 - o.d * 9);
          var a = (.26 + .38 * wave + .5 * near) * Math.min(1, Math.max(0, rv * 1.6 - o.d * 1.2));
          ctx.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")";
          ctx.beginPath(); ctx.arc(o.x, o.y, 1.15 + 1.4 * near, 0, 6.283); ctx.fill();
        }
        if (vis) requestAnimationFrame(frame);
      };
      var vis = false;
      new IntersectionObserver(function (es) { es.forEach(function (en) { var was = vis; vis = en.isIntersecting; if (vis && !was) requestAnimationFrame(frame); }); }).observe(qa);
      cv.addEventListener("pointermove", function (e) { var r = cv.getBoundingClientRect(); mxp = e.clientX - r.left; myp = e.clientY - r.top; });
      cv.addEventListener("pointerleave", function () { mxp = myp = -999; });
      build(); W.addEventListener("resize", build); ST.addEventListener("refresh", build);
      var sv = { v: 0 };
      gsap.to(sv, { v: 1, duration: 2.6, ease: "power2.out", scrollTrigger: { trigger: qa, start: "top 60%" }, onUpdate: function () { seen = sv.v; }, onComplete: function () { pin.classList.add("on"); } });
      /* rolling picker */
      var items = $$(".qa-list li", qa), list = $(".qa-list", qa), ai = 0;
      var roll = function () { var lh = items[0].offsetHeight; list.style.transform = "translateY(" + (lh * (3 - ai)) + "px)"; items.forEach(function (li, j) { li.classList.toggle("on", j === ai); }); };
      roll();
      setInterval(function () { if (vis) { ai = (ai + 1) % items.length; roll(); } }, 1900);
      gsap.fromTo(".qa-card", { y: function () { return W.innerWidth > 1000 ? W.innerHeight * .45 : 60; }, rotate: 5 }, { y: 0, rotate: -2, ease: "none", scrollTrigger: { trigger: qa, start: "top bottom", end: "center center", scrub: 1 } });
      gsap.fromTo(".qa-word", { xPercent: 8 }, { xPercent: -6, ease: "none", scrollTrigger: { trigger: qa, start: "top bottom", end: "bottom top", scrub: true } });
    }

    /* ---------------- floating call to action steps aside for the finale */
    var pill = $(".pill");
    if (pill) {
      ST.create({ trigger: ".fn", start: "top 85%", onToggle: function (s) { pill.classList.toggle("off", s.isActive); } });
      ST.create({ start: 0, end: 200, onToggle: function (s) { if ($(".hx")) pill.classList.toggle("off", s.isActive); } });
      if ($(".hx")) pill.classList.add("off");
    }


    /* ---------------- inner video heroes drift slightly as you leave them */
    $$(".vh").forEach(function (v) {
      gsap.to($(".vh-v", v), { scale: 1.16, yPercent: 8, ease: "none", scrollTrigger: { trigger: v, start: "top top", end: "bottom top", scrub: true } });
      gsap.to($(".vh-in", v), { yPercent: -18, opacity: .2, ease: "none", scrollTrigger: { trigger: v, start: "top top", end: "bottom top", scrub: true } });
    });

    /* ---------------- services: the list drives the picture */
    var sxi = $$(".sx-item"), sxim = $$(".sx-img"), sxc = $("[data-sx-cap]");
    if (sxi.length) {
      var showSx = function (a) {
        var i = a.getAttribute("data-i");
        sxi.forEach(function (x) { x.classList.toggle("on", x === a); });
        sxim.forEach(function (m) { m.classList.toggle("on", m.getAttribute("data-i") === i); });
        if (sxc) sxc.textContent = $(".sx-t", a).textContent;
      };
      sxi.forEach(function (a) {
        ST.create({ trigger: a, start: "top 55%", end: "bottom 55%", onToggle: function (s) { if (s.isActive) showSx(a); } });
        if (fine) a.addEventListener("mouseenter", function () { showSx(a); });
      });
    }

    /* ---------------- service page: photo drifts, checklist ticks itself off, steps light up */
    var sdi = $(".sd-img");
    if (sdi) gsap.fromTo(sdi, { yPercent: -8 }, { yPercent: 4, ease: "none", scrollTrigger: { trigger: ".sd", start: "top top", end: "bottom top", scrub: true } });
    var sci = $$(".sc-i"), scn = $("[data-sc-n]");
    if (sci.length) {
      var cnt = function () { scn.textContent = sci.filter(function (x) { return x.classList.contains("on"); }).length; };
      sci.forEach(function (li) { ST.create({ trigger: li, start: "top 62%", onEnter: function () { li.classList.add("on"); cnt(); }, onLeaveBack: function () { li.classList.remove("on"); cnt(); } }); });
    }
    $$(".sp-i").forEach(function (li, i) { ST.create({ trigger: ".sp-list", start: "top " + (80 - i * 10) + "%", onEnter: function () { li.classList.add("on"); }, onLeaveBack: function () { li.classList.remove("on"); } }); });
    var sbp = $(".sb-paper");
    if (sbp) gsap.fromTo(sbp, { y: 120, rotate: -5 }, { y: 0, rotate: -1.2, ease: "none", scrollTrigger: { trigger: ".sb", start: "top bottom", end: "center center", scrub: 1 } });
    var nxi = $(".nx-img");
    if (nxi) gsap.fromTo(nxi, { yPercent: -10 }, { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".nx", start: "top bottom", end: "bottom top", scrub: true } });

    /* ---------------- about: photographs float at different depths */
    var afs = $$(".af");
    if (afs.length) {
      afs.forEach(function (f) { var k = parseFloat(f.getAttribute("data-depth")); gsap.to(f, { y: function () { return -W.innerHeight * k * 1.6; }, ease: "none", scrollTrigger: { trigger: ".ah", start: "top top", end: "bottom top", scrub: true } }); });
      if (fine) $(".ah").addEventListener("pointermove", function (e) {
        var x = e.clientX / W.innerWidth - .5, y = e.clientY / W.innerHeight - .5;
        afs.forEach(function (f) { var k = parseFloat(f.getAttribute("data-depth")); gsap.to($(".af-in", f), { x: -x * 120 * k, y: -y * 80 * k, duration: 1.2, ease: "power3.out" }); });
      });
      gsap.from(afs, { opacity: 0, scale: .8, y: 60, duration: 1.8, ease: "expo.out", stagger: .08, delay: revealAt + .2 });
    }
    var asc = $$(".as-c"), asi = $$(".as-img");
    asc.forEach(function (c) { ST.create({ trigger: c, start: "top 50%", end: "bottom 50%", onToggle: function (s) { if (s.isActive) asi.forEach(function (m) { m.classList.toggle("on", m.getAttribute("data-i") === c.getAttribute("data-i")); }); } }); });
    var avt = $(".avs-track");
    if (avt && W.innerWidth > 1000) {
      gsap.to(avt, { x: function () { return -Math.max(0, avt.scrollWidth - W.innerWidth); }, ease: "none",
        scrollTrigger: { trigger: ".avs", start: "top top", end: function () { return "+=" + Math.max(1, avt.scrollWidth - W.innerWidth); }, pin: true, scrub: 1, invalidateOnRefresh: true } });
    }
    /* ---------------- ledger: the paper is laid on the desk; the days count down */
    var paper = $(".lg-paper");
    if (paper) {
      gsap.fromTo(paper, { y: 140, rotate: -4 }, { y: 0, rotate: 0, ease: "none", scrollTrigger: { trigger: ".lg", start: "top bottom", end: "center center", scrub: 1 } });
      var num = $(".lg-num"), o = { v: 120 };
      gsap.to(o, { v: 16, duration: 2.2, ease: "expo.out", scrollTrigger: { trigger: paper, start: "top 70%" }, onUpdate: function () { num.textContent = Math.round(o.v); } });
    }

    /* ---------------- values fill as they pass */
    $$(".vl-i").forEach(function (v) { ST.create({ trigger: v, start: "top 70%", end: "bottom 30%", toggleClass: "on" }); });

    /* ---------------- finale: the arc turns slowly with the scroll */
    var fa = $(".fn-arc");
    if (fa) gsap.fromTo(fa, { rotate: -40 }, { rotate: 10, ease: "none", scrollTrigger: { trigger: ".fn", start: "top bottom", end: "bottom bottom", scrub: true } });

    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ST.refresh(); });
    W.addEventListener("load", function () { ST.refresh(); });
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot); else boot();
})();
