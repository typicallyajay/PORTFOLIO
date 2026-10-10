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
  const pageLoader = document.getElementById("pageLoader");
  if (pageLoader) {
    const loaderStartedAt = performance.now();
    let loaderDismissed = false;
    root.classList.add("page-loading");
    const dismissLoader = () => {
      if (loaderDismissed) return;
      loaderDismissed = true;
      const minimumDuration = reduceMotion ? 120 : 520;
      const remaining = Math.max(0, minimumDuration - (performance.now() - loaderStartedAt));
      window.setTimeout(() => root.classList.remove("page-loading"), remaining);
    };
    const loaderFallback = window.setTimeout(dismissLoader, 2500);
    window.addEventListener(
      "load",
      () => {
        window.clearTimeout(loaderFallback);
        dismissLoader();
      },
      { once: true },
    );
    if (document.readyState === "complete") {
      window.clearTimeout(loaderFallback);
      dismissLoader();
    }
  }

  function scrollToSection(id) {
    const section = document.getElementById(id);
    if (!section) return;
    history.pushState(null, "", `#${id}`);
    section.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

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

  // ---------- Draggable elastic tech charms ----------
  const ropeToy = document.getElementById("ropeToy");
  if (ropeToy) {
    ropeToy.querySelectorAll(".rope-toy__item").forEach((item) => {
      const charm = item.querySelector(".rope-toy__charm");
      const feedback = item.querySelector(".rope-toy__feedback");
      let dragStart = null;
      let snapTimer;
      let feedbackTimer;
      let pullDistance = 0;
      let suppressClick = false;
      const baseLength = () =>
        parseFloat(getComputedStyle(item).getPropertyValue("--base-length")) || 24;
      const setPull = (x, y) => {
        const anchorLength = baseLength() + y;
        item.style.setProperty("--pull-x", `${x}px`);
        item.style.setProperty("--pull-y", `${y}px`);
        item.style.setProperty("--cord-length", `${Math.hypot(x, anchorLength)}px`);
        item.style.setProperty(
          "--cord-angle",
          `${(-Math.atan2(x, anchorLength) * 180) / Math.PI}deg`,
        );
      };
      const snapBack = () => {
        item.classList.remove("is-dragging");
        setPull(0, 0);
        if (pullDistance > 12) {
          if (feedback) {
            feedback.textContent = ["Boing!", "Nice pull!", "Stretch!", "Wheee!"][
              Math.floor(Math.random() * 4)
            ];
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
              feedback.style.opacity = "1";
            }
          }
          item.classList.remove("is-springing");
          void item.offsetWidth;
          item.classList.add("is-springing");
          clearTimeout(feedbackTimer);
          feedbackTimer = setTimeout(() => {
            item.classList.remove("is-springing");
            if (feedback) feedback.style.removeProperty("opacity");
          }, 900);
        }
        pullDistance = 0;
      };

      charm.addEventListener("pointerdown", (event) => {
        if (event.button !== 0 && event.pointerType === "mouse") return;
        clearTimeout(snapTimer);
        suppressClick = false;
        const charmRect = charm.getBoundingClientRect();
        const railRect = item.getBoundingClientRect();
        dragStart = {
          x: event.clientX,
          y: event.clientY,
          pointerId: event.pointerId,
          minX: railRect.left - charmRect.left,
          maxX: railRect.right - charmRect.right,
        };
        charm.setPointerCapture(event.pointerId);
        item.classList.add("is-dragging");
        event.preventDefault();
      });
      charm.addEventListener("pointermove", (event) => {
        if (!dragStart || dragStart.pointerId !== event.pointerId) return;
        const x = Math.max(
          dragStart.minX,
          Math.min(dragStart.maxX, event.clientX - dragStart.x),
        );
        const y = Math.max(-14, Math.min(14, event.clientY - dragStart.y));
        pullDistance = Math.hypot(x, y);
        setPull(x, y);
      });
      const finishDrag = (event) => {
        if (!dragStart || dragStart.pointerId !== event.pointerId) return;
        const shouldNavigate = pullDistance >= (window.innerWidth < 1600 ? 14 : 24);
        suppressClick = pullDistance > 12;
        dragStart = null;
        snapBack();
        if (shouldNavigate) scrollToSection(charm.dataset.target);
      };
      charm.addEventListener("pointerup", finishDrag);
      charm.addEventListener("pointercancel", finishDrag);
      charm.addEventListener("click", (event) => {
        if (suppressClick) {
          event.preventDefault();
          suppressClick = false;
          return;
        }
        scrollToSection(charm.dataset.target);
      });
      charm.addEventListener("keydown", (event) => {
        const offsets = {
          ArrowDown: [0, 18],
          ArrowUp: [0, -18],
          ArrowLeft: [-18, 0],
          ArrowRight: [18, 0],
        };
        if (offsets[event.key]) {
          event.preventDefault();
          item.classList.add("is-dragging");
          pullDistance = Math.hypot(...offsets[event.key]);
          setPull(...offsets[event.key]);
          clearTimeout(snapTimer);
          snapTimer = setTimeout(snapBack, 650);
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          snapBack();
          scrollToSection(charm.dataset.target);
        }
      });
    });
  }

  // ---------- Section dock and scroll progress ----------
  const progress = document.querySelector(".scroll-progress");
  const toyLinks = ropeToy
    ? Array.from(ropeToy.querySelectorAll(".rope-toy__charm"))
    : [];
  const sections = toyLinks
    .map((button) => document.getElementById(button.dataset.target))
    .filter(Boolean);

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

      // Active section = last section whose top has passed 35% of the viewport
      const mark = y + window.innerHeight * 0.35;
      let current = null;
      sections.forEach((s) => {
        if (s.offsetTop <= mark) current = s;
      });
      toyLinks.forEach((button) => {
        const active = current && button.dataset.target === current.id;
        button.classList.toggle("active", !!active);
        if (active) button.setAttribute("aria-current", "location");
        else button.removeAttribute("aria-current");
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
  window.addEventListener("popstate", () => {
    const section = document.getElementById(location.hash.slice(1));
    if (section) {
      section.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  });
  onScroll();

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
