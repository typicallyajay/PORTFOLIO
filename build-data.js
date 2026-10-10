// build-data.js
// Regenerates data.js from data.json.
// data.js is the fallback the site uses when index.html is opened straight
// from disk (file://), where browsers block fetch("data.json").
//
// Usage (from the project folder):   node build-data.js
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "data.json");
const out = path.join(__dirname, "data.js");

const data = JSON.parse(fs.readFileSync(src, "utf8"));
const banner =
  "/* AUTO-GENERATED from data.json by build-data.js — do not edit by hand.\n" +
  "   Run `node build-data.js` after changing data.json. */\n";
fs.writeFileSync(out, banner + "window.PORTFOLIO_FALLBACK = " + JSON.stringify(data, null, 2) + ";\n");
console.log(`data.js written: ${data.projects.length} projects, ${data.certifications.length} certifications`);
