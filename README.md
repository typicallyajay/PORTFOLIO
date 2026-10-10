# Ajay Kothari — Portfolio

Static portfolio website built with HTML, CSS, and vanilla JavaScript. The
GitHub Pages site is published from the root of the `main` branch.

## Run locally

From the repository folder, start Python's static file server:

```powershell
py -m http.server 8000
```

Then open <http://localhost:8000/>. Serving the files over HTTP exercises the
same `data.json` loading path used by the hosted site. You can also open
`index.html` directly; `data.js` provides a fallback for browsers that block
fetch requests from `file://` pages.

## Update portfolio content

1. Edit `data.json`.
2. Regenerate the direct-file fallback:

   ```powershell
   node build-data.js
   ```

3. Run the local site and check the page.
4. Commit and push the updated files to `main`; GitHub Pages deploys from the
   repository root.

`data.js` is generated from `data.json`; do not edit it by hand. Layout and
interactions are in `style.css` and `script.js`, while `render.js` builds the
content sections.

## Admin portal and security

There is no admin portal or browser-based content editor in this repository.
The previous static admin page could not provide real authentication and has
been removed. Portfolio content is public, so do not put passwords, private
data, API keys, or other secrets in `data.json` or any frontend file.

The `main` branch is protected by the **Owner-only main updates** GitHub
ruleset. See [REPOSITORY_SECURITY.md](./REPOSITORY_SECURITY.md) for the access
policy and its limitations.

## Checks

There is no package manifest or automated test suite. The project can be checked
without installing dependencies:

```powershell
node --check script.js
node --check render.js
node --check build-data.js
node -e "JSON.parse(require('fs').readFileSync('data.json', 'utf8'))"
git diff --check
```
