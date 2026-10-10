/*
  script.js — interactions & motion
  - Scroll-reveal animations (IntersectionObserver, staggered)
  - Frosted nav that condenses on scroll + active-section highlighting
  - Mobile menu with Escape / outside-click close
  - Scroll progress bar, animated stat counters, card spotlight hover
  All motion is disabled for users who prefer reduced motion.
*/
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  root.classList.add("js");

  // ---------- Footer year ----------
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Scroll reveal ----------
  let revealObserver = null;
  function observeReveals() {
    const items = document.querySelectorAll(".reveal:not(.is-visible)");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    // Immediately reveal any element currently in the viewport
    const vh = window.innerHeight || document.documentElement.clientHeight || 900;
    items.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh + 40 && r.bottom > 0) {
        el.classList.add("is-visible");
      }
    });

    const remaining = document.querySelectorAll(".reveal:not(.is-visible)");
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.05, rootMargin: "0px 0px 40px 0px" }
      );
    }
    remaining.forEach((el) => revealObserver.observe(el));
  }

  // ---------- Stat counters ----------
  function animateCounters() {
    document.querySelectorAll(".stat strong").forEach((el) => {
      const target = parseInt(el.textContent, 10);
      if (isNaN(target) || reduceMotion) return;
      let started = false;
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting || started) return;
        started = true;
        io.disconnect();
        const start = performance.now();
        const dur = 1100;
        const tick = (now) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(target * eased);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      io.observe(el);
    });
  }

  // ---------- Card spotlight (follows pointer) ----------
  function bindSpotlight() {
    if (reduceMotion || !window.matchMedia("(hover: hover)").matches) return;
    document.querySelectorAll(".project-card, .cert-card, .skill-card").forEach((card) => {
      if (card.dataset.spot) return;
      card.dataset.spot = "1";
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  // ---------- Nav: condense, progress, active link ----------
  const nav = document.getElementById("nav");
  const progress = document.querySelector(".scroll-progress");
  const links = Array.from(document.querySelectorAll(".nav-links a"));
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (nav) nav.classList.toggle("scrolled", y > 12);
      if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

      // Active section = last section whose top has passed 35% of the viewport
      const mark = y + window.innerHeight * 0.35;
      let current = null;
      sections.forEach((s) => {
        if (s.offsetTop <= mark) current = s;
      });
      links.forEach((a) => {
        const active = current && a.getAttribute("href") === "#" + current.id;
        a.classList.toggle("active", !!active);
        if (active) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });

      // Reveal elements as user scrolls down
      const vh = window.innerHeight || 900;
      document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh - 20 && r.bottom > 0) {
          el.classList.add("is-visible");
        }
      });

      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  // ---------- Mobile menu ----------
  const toggle = document.getElementById("navToggle");
  function setMenu(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("no-scroll", open);
  }
  if (toggle) {
    toggle.addEventListener("click", () => setMenu(!nav.classList.contains("menu-open")));
    links.forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenu(false);
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) setMenu(false);
    });
  }

  // ---------- Journey tabs (segmented control) ----------
  function bindJourneyTabs() {
    const seg = document.querySelector(".seg");
    if (!seg || seg.dataset.bound) return;
    seg.dataset.bound = "1";
    const btns = Array.from(seg.querySelectorAll(".seg-btn"));
    const pill = seg.querySelector(".seg-pill");
    const movePill = (btn) => {
      if (!pill) return;
      pill.style.width = btn.offsetWidth + "px";
      pill.style.transform = `translateX(${btn.offsetLeft - 4}px)`;
    };
    btns.forEach((btn) =>
      btn.addEventListener("click", () => {
        btns.forEach((b) => {
          const on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-selected", String(on));
        });
        document.querySelectorAll(".journey-panel").forEach((p) => {
          const on = p.dataset.panel === btn.dataset.journey;
          p.hidden = !on;
          p.classList.toggle("is-active", on);
          if (on) p.querySelectorAll(".reveal").forEach((r) => r.classList.add("is-visible"));
        });
        movePill(btn);
        updateTimeline();
      })
    );
    const active = seg.querySelector(".seg-btn.is-active") || btns[0];
    requestAnimationFrame(() => movePill(active));
    window.addEventListener("resize", () => movePill(seg.querySelector(".seg-btn.is-active")));
  }

  // ---------- Skills explorer ----------
  function bindSkillTabs() {
    const tabs = Array.from(document.querySelectorAll(".skill-tab"));
    tabs.forEach((tab) => {
      if (tab.dataset.bound) return;
      tab.dataset.bound = "1";
      const activate = () => {
        tabs.forEach((t) => {
          const on = t === tab;
          t.classList.toggle("is-active", on);
          t.setAttribute("aria-selected", String(on));
        });
        document.querySelectorAll(".skill-panel").forEach((p) => {
          const on = p.dataset.skillPanel === tab.dataset.skill;
          p.hidden = !on;
          p.classList.toggle("is-active", on);
        });
      };
      tab.addEventListener("click", activate);
      if (window.matchMedia("(hover: hover)").matches) tab.addEventListener("mouseenter", activate);
    });
  }

  // ---------- Timeline: rail fills and nodes light up as you scroll ----------
  function updateTimeline() {
    const vh = window.innerHeight;
    document.querySelectorAll(".journey-panel:not([hidden]) .timeline").forEach((tl) => {
      const r = tl.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
      tl.style.setProperty("--progress", p.toFixed(3));
      tl.querySelectorAll(".timeline-item").forEach((it) => {
        const ir = it.getBoundingClientRect();
        it.classList.toggle("is-lit", ir.top < vh * 0.6);
      });
    });
  }
  window.addEventListener("scroll", () => requestAnimationFrame(updateTimeline), { passive: true });

  // ---------- Portrait: subtle 3D tilt on hover ----------
  const card = document.querySelector(".portrait-card");
  if (card && !reduceMotion && window.matchMedia("(hover: hover)").matches) {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    });
    card.addEventListener("pointerleave", () => (card.style.transform = ""));
  }

  // ---------- Boot ----------
  function boot() {
    observeReveals();
    bindSpotlight();
    bindJourneyTabs();
    bindSkillTabs();
    updateTimeline();
    onScroll();
  }
  boot();
  document.addEventListener("portfolio:rendered", () => {
    boot();
    animateCounters();
  });
})();
