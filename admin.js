/*
  admin.js
  --------
  Powers the admin portal (admin.html).

  IMPORTANT SECURITY NOTE:
  This is a static site with no server, so there is no real backend
  authentication. ADMIN_PASSWORD below is just a casual gate to keep
  random visitors from poking at the form — anyone who views this file's
  source can read the password. Do not rely on this to protect anything
  sensitive. If you need real security, you'd need an actual backend
  (e.g. a small server + login system).
*/

const ADMIN_PASSWORD = "ajay2026"; // <-- change this to whatever you like
const LS_KEY = "portfolioData";

let state = null; // the full data object currently being edited

// ---------- LOGIN ----------
function checkSession() {
  return sessionStorage.getItem("adminAuthed") === "yes";
}

document.getElementById("loginBtn").addEventListener("click", attemptLogin);
document.getElementById("passwordInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") attemptLogin();
});

function attemptLogin() {
  const val = document.getElementById("passwordInput").value;
  if (val === ADMIN_PASSWORD) {
    sessionStorage.setItem("adminAuthed", "yes");
    showAdmin();
  } else {
    document.getElementById("loginError").style.display = "block";
  }
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("adminAuthed");
  location.reload();
});

function showAdmin() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("adminShell").style.display = "block";
  init();
}

if (checkSession()) showAdmin();

// ---------- TOAST ----------
let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

// ---------- DATA LOADING ----------
function init() {
  const draft = localStorage.getItem(LS_KEY);
  if (draft) {
    state = JSON.parse(draft);
    populateForm(state);
    toast("Loaded your saved draft");
  } else {
    fetch("data.json")
      .then((r) => r.json())
      .then((data) => {
        state = data;
        populateForm(state);
      })
      .catch(() => toast("Could not load data.json"));
  }
}

document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("This clears your local draft and reloads the site's default data.json. Continue?")) return;
  localStorage.removeItem(LS_KEY);
  fetch("data.json")
    .then((r) => r.json())
    .then((data) => {
      state = data;
      populateForm(state);
      toast("Reset to defaults");
    });
});

document.getElementById("loadFileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = JSON.parse(reader.result);
      populateForm(state);
      toast("Loaded file into the form");
    } catch (err) {
      toast("That file isn't valid JSON");
    }
  };
  reader.readAsText(file);
});

// ---------- FORM <-> STATE ----------
function populateForm(data) {
  document.getElementById("p_name").value = data.profile.name || "";
  document.getElementById("p_tagline").value = data.profile.tagline || "";
  document.getElementById("p_aboutTitle").value = data.profile.aboutTitle || "";
  document.getElementById("p_about").value = (data.profile.aboutParagraphs || []).join("\n");
  document.getElementById("p_quote").value = data.profile.quote || "";

  document.getElementById("c_email").value = data.contact.email || "";
  document.getElementById("c_phone").value = data.contact.phone || "";

  renderEducation(data.education || []);
  renderSkills(data.skills || []);
  renderCertifications(data.certifications || []);
  renderProjects(data.projects || []);
  renderSocials(data.contact.socials || []);
}

function readFormIntoState() {
  const prev = state || {};
  const data = {
    ...prev, // keep keys this form doesn't edit (experience, etc.)
    profile: {
      ...(prev.profile || {}), // keep role, status, headline, location
      name: document.getElementById("p_name").value.trim(),
      tagline: document.getElementById("p_tagline").value.trim(),
      aboutTitle: document.getElementById("p_aboutTitle").value.trim(),
      aboutParagraphs: document
        .getElementById("p_about")
        .value.split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      quote: document.getElementById("p_quote").value.trim(),
    },
    education: readEducation(),
    skills: readSkills(),
    certifications: readCertifications(),
    projects: readProjects(),
    contact: {
      ...(prev.contact || {}),
      email: document.getElementById("c_email").value.trim(),
      phone: document.getElementById("c_phone").value.trim(),
      socials: readSocials(),
    },
  };
  state = data;
  return data;
}

// ---------- EDUCATION ----------
function educationCard(item = {}) {
  const card = document.createElement("div");
  card.className = "entry-card";
  card.dataset.type = "education";
  card.innerHTML = `
    <div class="entry-card-header">
      <span>Education Entry</span>
      <button class="admin-btn danger small remove-btn">Remove</button>
    </div>
    <div class="field-row">
      <div class="field-group">
        <label>Date Range</label>
        <input type="text" data-key="date" value="${escAttr(item.date)}" placeholder="2024 - Present" />
      </div>
      <div class="field-group">
        <label>Location / Institution</label>
        <input type="text" data-key="location" value="${escAttr(item.location)}" />
      </div>
    </div>
    <div class="field-group">
      <label>Title</label>
      <input type="text" data-key="title" value="${escAttr(item.title)}" />
    </div>
    <div class="field-group">
      <label>Details</label>
      <textarea data-key="details" rows="3">${escHtml(item.details)}</textarea>
    </div>
  `;
  card.querySelector(".remove-btn").addEventListener("click", () => card.remove());
  return card;
}

function renderEducation(list) {
  const container = document.getElementById("educationList");
  container.innerHTML = "";
  list.forEach((item) => container.appendChild(educationCard(item)));
}

document.getElementById("addEducationBtn").addEventListener("click", () => {
  document.getElementById("educationList").appendChild(educationCard());
});

function readEducation() {
  return Array.from(document.querySelectorAll('#educationList .entry-card')).map((card) => ({
    date: card.querySelector('[data-key="date"]').value.trim(),
    title: card.querySelector('[data-key="title"]').value.trim(),
    location: card.querySelector('[data-key="location"]').value.trim(),
    details: card.querySelector('[data-key="details"]').value.trim(),
  }));
}

// ---------- SKILLS ----------
function skillItemRow(item = {}) {
  const row = document.createElement("div");
  row.className = "skill-item-row entry-card";
  row.style.marginBottom = "10px";
  row.innerHTML = `
    <div>
      <div class="field-group" style="margin-bottom:8px;">
        <input type="text" data-key="title" value="${escAttr(item.title)}" placeholder="Skill name" />
      </div>
      <div class="field-group" style="margin-bottom:0;">
        <input type="text" data-key="desc" value="${escAttr(item.desc)}" placeholder="Short description" />
      </div>
    </div>
    <button class="admin-btn danger small remove-btn">✕</button>
  `;
  row.querySelector(".remove-btn").addEventListener("click", () => row.remove());
  return row;
}

function skillCategoryCard(cat = {}) {
  const card = document.createElement("div");
  card.className = "entry-card";
  card.dataset.type = "skillCategory";
  card.innerHTML = `
    <div class="entry-card-header">
      <span>Skill Category</span>
      <button class="admin-btn danger small remove-btn">Remove Category</button>
    </div>
    <div class="field-group">
      <label>Category Name</label>
      <input type="text" data-key="category" value="${escAttr(cat.category)}" />
    </div>
    <div class="skill-items"></div>
    <button class="admin-btn small add-skill-item-btn">+ Add Skill</button>
  `;
  const itemsContainer = card.querySelector(".skill-items");
  (cat.items || []).forEach((it) => itemsContainer.appendChild(skillItemRow(it)));
  card.querySelector(".remove-btn").addEventListener("click", () => card.remove());
  card.querySelector(".add-skill-item-btn").addEventListener("click", () => {
    itemsContainer.appendChild(skillItemRow());
  });
  return card;
}

function renderSkills(list) {
  const container = document.getElementById("skillsList");
  container.innerHTML = "";
  list.forEach((cat) => container.appendChild(skillCategoryCard(cat)));
}

document.getElementById("addSkillCategoryBtn").addEventListener("click", () => {
  document.getElementById("skillsList").appendChild(skillCategoryCard());
});

function readSkills() {
  return Array.from(document.querySelectorAll('#skillsList > .entry-card')).map((card) => ({
    category: card.querySelector('[data-key="category"]').value.trim(),
    items: Array.from(card.querySelectorAll(".skill-item-row")).map((row) => ({
      title: row.querySelector('[data-key="title"]').value.trim(),
      desc: row.querySelector('[data-key="desc"]').value.trim(),
    })),
  }));
}

// ---------- CERTIFICATIONS ----------
function certCard(item = {}) {
  const card = document.createElement("div");
  card.className = "entry-card";
  card.dataset.type = "cert";
  card.innerHTML = `
    <div class="entry-card-header">
      <span>Certificate</span>
      <button class="admin-btn danger small remove-btn">Remove</button>
    </div>
    <div class="field-row">
      <div class="field-group">
        <label>Issuer / Category</label>
        <input type="text" data-key="category" value="${escAttr(item.category)}" placeholder="e.g. Coursera" />
      </div>
      <div class="field-group">
        <label>Date</label>
        <input type="text" data-key="date" value="${escAttr(item.date)}" placeholder="e.g. March 2026" />
      </div>
    </div>
    <div class="field-group">
      <label>Certificate Title</label>
      <input type="text" data-key="title" value="${escAttr(item.title)}" />
    </div>
    <div class="field-group">
      <label>Description (optional)</label>
      <textarea data-key="description" rows="2">${escHtml(item.description)}</textarea>
    </div>
    <div class="field-group">
      <label>What you learned (one point per line, optional)</label>
      <textarea data-key="learning" rows="3">${escHtml((item.learning || []).join("\n"))}</textarea>
    </div>
    <div class="field-group">
      <label>Verification Link</label>
      <input type="url" data-key="link" value="${escAttr(item.link)}" placeholder="https://..." />
    </div>
  `;
  card.querySelector(".remove-btn").addEventListener("click", () => card.remove());
  return card;
}

function renderCertifications(list) {
  const container = document.getElementById("certificationsList");
  container.innerHTML = "";
  list.forEach((item) => container.appendChild(certCard(item)));
}

document.getElementById("addCertBtn").addEventListener("click", () => {
  document.getElementById("certificationsList").appendChild(certCard());
});

function readCertifications() {
  return Array.from(document.querySelectorAll('#certificationsList .entry-card')).map((card) => ({
    category: card.querySelector('[data-key="category"]').value.trim(),
    title: card.querySelector('[data-key="title"]').value.trim(),
    date: card.querySelector('[data-key="date"]').value.trim(),
    description: card.querySelector('[data-key="description"]').value.trim(),
    learning: card
      .querySelector('[data-key="learning"]')
      .value.split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    link: card.querySelector('[data-key="link"]').value.trim(),
  }));
}

// ---------- PROJECTS ----------
function projectCard(item = {}) {
  const card = document.createElement("div");
  card.className = "entry-card";
  card.dataset.type = "project";
  card.innerHTML = `
    <div class="entry-card-header">
      <span>Project</span>
      <button class="admin-btn danger small remove-btn">Remove</button>
    </div>
    <div class="field-row">
      <div class="field-group">
        <label>Category</label>
        <input type="text" data-key="category" value="${escAttr(item.category)}" placeholder="e.g. Web App" />
      </div>
      <div class="field-group">
        <label>Tech Tags (comma separated)</label>
        <input type="text" data-key="tech" value="${escAttr((item.tech || []).join(", "))}" placeholder="React, Node.js" />
      </div>
    </div>
    <div class="field-group">
      <label>Project Title</label>
      <input type="text" data-key="title" value="${escAttr(item.title)}" />
    </div>
    <div class="field-group">
      <label>Description</label>
      <textarea data-key="description" rows="2">${escHtml(item.description)}</textarea>
    </div>
    <div class="field-row">
      <div class="field-group">
        <label>Your Role (optional)</label>
        <input type="text" data-key="role" value="${escAttr(item.role)}" placeholder="e.g. Team Lead · Hackathon" />
      </div>
      <div class="field-group">
        <label>GitHub / Live Link (optional)</label>
        <input type="url" data-key="link" value="${escAttr(item.link)}" placeholder="https://github.com/..." />
      </div>
    </div>
    <div class="field-group">
      <label>Highlights (one per line, optional)</label>
      <textarea data-key="highlights" rows="3">${escHtml((item.highlights || []).join("\n"))}</textarea>
    </div>
    <div class="field-group">
      <label><input type="checkbox" data-key="featured" ${item.featured ? "checked" : ""} /> Featured (shown as the large hero project)</label>
    </div>
  `;
  card.querySelector(".remove-btn").addEventListener("click", () => card.remove());
  return card;
}

function renderProjects(list) {
  const container = document.getElementById("projectsList");
  container.innerHTML = "";
  list.forEach((item) => container.appendChild(projectCard(item)));
}

document.getElementById("addProjectBtn").addEventListener("click", () => {
  document.getElementById("projectsList").appendChild(projectCard());
});

function readProjects() {
  return Array.from(document.querySelectorAll('#projectsList .entry-card')).map((card) => ({
    featured: card.querySelector('[data-key="featured"]').checked,
    category: card.querySelector('[data-key="category"]').value.trim(),
    role: card.querySelector('[data-key="role"]').value.trim(),
    title: card.querySelector('[data-key="title"]').value.trim(),
    description: card.querySelector('[data-key="description"]').value.trim(),
    highlights: card
      .querySelector('[data-key="highlights"]')
      .value.split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    tech: card
      .querySelector('[data-key="tech"]')
      .value.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    link: card.querySelector('[data-key="link"]').value.trim(),
  }));
}

// ---------- SOCIALS ----------
function socialRow(item = {}) {
  const row = document.createElement("div");
  row.className = "entry-card";
  row.style.marginBottom = "10px";
  row.innerHTML = `
    <div class="field-row" style="align-items:end;">
      <div class="field-group" style="margin-bottom:0;">
        <label>Label</label>
        <input type="text" data-key="label" value="${escAttr(item.label)}" placeholder="LINKEDIN" />
      </div>
      <div class="field-group" style="margin-bottom:0;">
        <label>URL</label>
        <input type="url" data-key="url" value="${escAttr(item.url)}" placeholder="https://..." />
      </div>
    </div>
    <button class="admin-btn danger small remove-btn" style="margin-top:12px;">Remove</button>
  `;
  row.querySelector(".remove-btn").addEventListener("click", () => row.remove());
  return row;
}

function renderSocials(list) {
  const container = document.getElementById("socialsList");
  container.innerHTML = "";
  list.forEach((item) => container.appendChild(socialRow(item)));
}

document.getElementById("addSocialBtn").addEventListener("click", () => {
  document.getElementById("socialsList").appendChild(socialRow());
});

function readSocials() {
  return Array.from(document.querySelectorAll('#socialsList .entry-card')).map((row) => ({
    label: row.querySelector('[data-key="label"]').value.trim(),
    url: row.querySelector('[data-key="url"]').value.trim(),
  }));
}

// ---------- SAVE / DOWNLOAD ----------
function saveDraft() {
  const data = readFormIntoState();
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  toast("Draft saved — open your site in this browser to preview it");
}

function downloadJson() {
  const data = readFormIntoState();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast("Downloaded — replace data.json on your host to make it live for everyone");
}

document.getElementById("saveDraftBtn").addEventListener("click", saveDraft);
document.getElementById("saveDraftBtn2").addEventListener("click", saveDraft);
document.getElementById("downloadBtn").addEventListener("click", downloadJson);
document.getElementById("downloadBtn2").addEventListener("click", downloadJson);

// ---------- HELPERS ----------
function escAttr(str) {
  return String(str || "").replace(/"/g, "&quot;");
}
function escHtml(str) {
  return String(str || "");
}
