/*
  render.js
  ---------
  Pulls all editable content (bio, experience, education, skills,
  certifications, projects, contact) and injects it into the page.

  Load order (first one that works wins):
    1. A draft saved by the admin portal in this browser's localStorage
    2. data.json fetched from the server (works when hosted / on a local server)
    3. window.PORTFOLIO_FALLBACK from data.js (works even when index.html is
       opened directly from disk, where fetch() is blocked by the browser)

  When rendering finishes it fires a "portfolio:rendered" event so script.js
  can attach scroll animations to the freshly created elements.
*/

(function () {
  const LS_KEY = "portfolioData";

  // Escapes text for safe use in HTML content AND attribute values.
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Only allow http(s), mailto and tel links — blocks javascript: URLs.
  function safeUrl(url) {
    const u = String(url || "").trim();
    return /^(https?:|mailto:|tel:)/i.test(u) ? u : "";
  }

  const ICON_CHECK =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_ARROW =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_GITHUB =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 00-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 015.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.7 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0012 .5z"/></svg>';

  function getLocalDraft() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function loadData() {
    const draft = getLocalDraft();
    if (draft) return Promise.resolve(draft);
    const fallback = window.PORTFOLIO_FALLBACK || null;
    if (location.protocol === "file:") return Promise.resolve(fallback);
    return fetch("data.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : fallback))
      .catch(() => fallback);
  }

  const $ = (sel) => document.querySelector(sel);
  const setText = (sel, val) => {
    if (val == null || val === "") return;
    document.querySelectorAll(sel).forEach((el) => (el.textContent = val));
  };

  function renderHero(data) {
    const p = data.profile || {};
    setText("[data-field='hero-name']", p.name);
    setText("[data-field='headline']", p.headline);
    setText("[data-field='tagline']", p.tagline);
    setText("[data-field='status']", p.status);
    setText("[data-field='about-title']", p.aboutTitle);
    setText("[data-field='quote']", p.quote);

    const aboutBody = $("[data-field='about-body']");
    if (aboutBody && Array.isArray(p.aboutParagraphs)) {
      // aboutParagraphs intentionally allow simple <strong> markup from the admin.
      aboutBody.innerHTML = p.aboutParagraphs.map((t) => `<p>${t}</p>`).join("");
    }

    const projCount = $("[data-count='projects']");
    if (projCount && data.projects) projCount.textContent = data.projects.length;
    const certCount = $("[data-count='certifications']");
    if (certCount && data.certifications) certCount.textContent = data.certifications.length;
  }

  function timelineItem(date, title, sub, details, idx) {
    return `
      <li class="timeline-item reveal" style="--i:${idx % 3}">
        <span class="timeline-node" aria-hidden="true">${String(idx + 1).padStart(2, "0")}</span>
        <div class="timeline-card">
          <span class="timeline-date">${esc(date)}</span>
          <h4>${esc(title)}</h4>
          ${sub ? `<p class="timeline-sub">${esc(sub)}</p>` : ""}
          ${details ? `<p class="timeline-details">${esc(details)}</p>` : ""}
        </div>
      </li>`;
  }

  function renderExperience(data) {
    const el = $("[data-field='experience-list']");
    if (!el || !Array.isArray(data.experience)) return;
    el.innerHTML = data.experience
      .map((e, i) => timelineItem(e.date, e.title, e.org, e.details, i))
      .join("");
  }

  function renderEducation(data) {
    const el = $("[data-field='education-list']");
    if (!el || !Array.isArray(data.education)) return;
    el.innerHTML = data.education
      .map((e, i) => timelineItem(e.date, e.title, e.location, e.details, i))
      .join("");
  }

  // Interactive skills explorer: category tabs on the left, items on the right.
  function renderSkills(data) {
    const el = $("[data-field='skills-list']");
    if (!el || !Array.isArray(data.skills)) return;
    const tabs = data.skills
      .map(
        (cat, i) => `
        <button class="skill-tab ${i === 0 ? "is-active" : ""}" role="tab"
          aria-selected="${i === 0}" data-skill="${i}">
          <span class="skill-tab-num">${String(i + 1).padStart(2, "0")}</span>
          <span class="skill-tab-name">${esc(cat.category)}</span>
          <span class="skill-tab-count">${(cat.items || []).length}</span>
        </button>`
      )
      .join("");
    const panels = data.skills
      .map(
        (cat, i) => `
        <div class="skill-panel ${i === 0 ? "is-active" : ""}" role="tabpanel" data-skill-panel="${i}" ${i === 0 ? "" : "hidden"}>
          ${(cat.items || [])
            .map(
              (it, j) => `
            <div class="skill-tile" style="--j:${j}">
              <span class="skill-tile-icon">${ICON_CHECK}</span>
              <div><strong>${esc(it.title)}</strong>${it.desc ? `<span>${esc(it.desc)}</span>` : ""}</div>
            </div>`
            )
            .join("")}
        </div>`
      )
      .join("");
    el.innerHTML = `<div class="skill-tabs" role="tablist" aria-label="Skill categories">${tabs}</div><div class="skill-panels">${panels}</div>`;
  }

  // Simple Icons CDN (monochrome brand SVGs). Duplicated list → seamless loop.
  const TECH = [
    ["C", "c"], ["C++", "cplusplus"], ["Java", "openjdk"], ["Python", "python"],
    ["C#", "dotnet"], ["JavaScript", "javascript"], ["PHP", "php"], ["HTML5", "html5"],
    ["CSS3", "css"], ["React", "react"], ["Node.js", "nodedotjs"], ["MySQL", "mysql"],
    ["MongoDB", "mongodb"], ["AWS", "amazonwebservices"], ["Git", "git"], ["GitHub", "github"],
    ["FastAPI", "fastapi"], ["Figma", "figma"]
  ];
  function renderMarquee() {
    const el = $("[data-field='tech-marquee']");
    if (!el) return;
    const one = TECH.map(
      ([name, slug]) => `
      <span class="tech-logo">
        <img src="https://cdn.simpleicons.org/${slug}/475569" alt="" width="22" height="22" loading="lazy"
             onerror="this.remove()" />
        ${esc(name)}
      </span>`
    ).join("");
    el.innerHTML = one + `<span aria-hidden="true" class="marquee-dup">${one}</span>`;
  }

  function initials(name) {
    return String(name || "?")
      .replace(/[^A-Za-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
  }

  function renderCertifications(data) {
    const el = $("[data-field='certifications-list']");
    if (!el || !Array.isArray(data.certifications)) return;
    el.innerHTML = data.certifications
      .map((c, i) => {
        const link = safeUrl(c.link);
        const learning = (c.learning || []).filter(Boolean);
        return `
      <article class="cert-card reveal" style="--i:${i % 3}">
        <div class="cert-top">
          <span class="cert-badge" aria-hidden="true">${esc(initials(c.category))}</span>
          <div>
            <p class="cert-issuer">${esc(c.category)}</p>
            ${c.date ? `<p class="cert-date">${esc(c.date)}</p>` : ""}
          </div>
        </div>
        <h3>${esc(c.title)}</h3>
        ${c.description ? `<p class="cert-desc">${esc(c.description)}</p>` : ""}
        ${
          learning.length
            ? `<p class="cert-learn-title">What I learned</p>
               <ul class="check-list compact">${learning
                 .map((l) => `<li><span class="check">${ICON_CHECK}</span><div>${esc(l)}</div></li>`)
                 .join("")}</ul>`
            : ""
        }
        ${
          link
            ? `<a href="${esc(link)}" class="link-arrow" target="_blank" rel="noopener noreferrer"
                 aria-label="Verify ${esc(c.title)} credential">Verify credential</a>`
            : ""
        }
      </article>`;
      })
      .join("");
  }

  function renderProjects(data) {
    const el = $("[data-field='projects-list']");
    if (!el || !Array.isArray(data.projects)) return;
    el.innerHTML = data.projects
      .map((p, i) => {
        const link = safeUrl(p.link);
        const isGitHub = /github\.com/i.test(link);
        const highlights = (p.highlights || []).filter(Boolean);
        const num = String(i + 1).padStart(2, "0");
        const linkBtn = link
          ? `<a href="${esc(link)}" class="btn btn-sm project-link" target="_blank" rel="noopener noreferrer"
               aria-label="${isGitHub ? "View source of" : "Open"} ${esc(p.title)}">
               ${isGitHub ? ICON_GITHUB + " View on GitHub" : "Open " + ICON_ARROW}
             </a>`
          : "";
        const chips = (p.tech || []).map((t) => `<span class="chip">${esc(t)}</span>`).join("");
        const problem = p.problemSolved
          ? `<div class="project-problem">
               <span class="problem-label">The problem it solves</span>
               <p class="problem-text">${esc(p.problemSolved)}</p>
             </div>`
          : "";
        const list = highlights.length
          ? `<ul class="check-list compact">${highlights
              .map((h) => `<li><span class="check">${ICON_CHECK}</span><div>${esc(h)}</div></li>`)
              .join("")}</ul>`
          : "";

        if (p.featured) {
          return `
      <article class="project-card featured reveal" style="--i:0">
        <div class="project-main">
          <div class="project-meta">
            <span class="tag">${esc(p.category)}</span>
            ${p.role ? `<span class="project-role">${esc(p.role)}</span>` : ""}
          </div>
          <h3>${esc(p.title)}</h3>
          <p class="project-desc">${esc(p.description)}</p>
          ${problem}
          ${list}
        </div>
        <aside class="project-side">
          <span class="project-num" aria-hidden="true">${num}</span>
          <p class="side-label">Built with</p>
          <div class="chips">${chips}</div>
          ${linkBtn}
        </aside>
      </article>`;
        }

        return `
      <article class="project-card reveal" style="--i:${i % 2}">
        <span class="project-num small" aria-hidden="true">${num}</span>
        <div class="project-meta">
          <span class="tag">${esc(p.category)}</span>
          ${p.role ? `<span class="project-role">${esc(p.role)}</span>` : ""}
        </div>
        <h3>${esc(p.title)}</h3>
        <p class="project-desc">${esc(p.description)}</p>
        ${problem}
        ${list}
        <div class="project-foot">
          <div class="chips">${chips}</div>
          ${linkBtn}
        </div>
      </article>`;
      })
      .join("");
  }

  function renderContact(data) {
    const c = data.contact || {};
    if (c.email) {
      setText("[data-field='contact-email']", c.email);
      const a = $("[data-field='contact-email-link']");
      if (a) a.href = "mailto:" + c.email;
    }
    if (c.phone) {
      setText("[data-field='contact-phone']", c.phone);
      const a = $("[data-field='contact-phone-link']");
      if (a) a.href = "tel:" + c.phone.replace(/[^\d+]/g, "");
    }
    const socialsEl = $("[data-field='contact-socials']");
    if (socialsEl && Array.isArray(c.socials)) {
      socialsEl.innerHTML = c.socials
        .filter((s) => safeUrl(s.url))
        .map(
          (s) =>
            `<a href="${esc(safeUrl(s.url))}" class="social-link" target="_blank" rel="noopener noreferrer">${esc(s.label)} ${ICON_ARROW}</a>`
        )
        .join("");
    }
  }

  try { renderMarquee(); } catch (e) { console.error("[render] marquee failed:", e); }

  loadData().then((data) => {
    if (data) {
      const steps = [renderHero, renderExperience, renderEducation, renderSkills, renderCertifications, renderProjects, renderContact];
      steps.forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          console.error("[render] " + fn.name + " failed:", err);
        }
      });
    }
    document.dispatchEvent(new CustomEvent("portfolio:rendered"));
  });
})();
