# SimchaCard backup

- Version: **v20261106c**
- Backed up: Nov 6, 2026 (from the files live at that moment)
- The live site is **https://simchacard.pages.dev** (Cloudflare Pages project `simchacard`). Also at https://freecard.sites.tab.bot.
- This repo is a copy. GitHub Pages (https://boro11204.github.io/freecard/) serves it too, but the static copy has no server:
  saved cards, short links, RSVP and accounts need `_worker.js` (D1 database `DB`) and the `freecard-api` Worker.
- `_worker.js` holds no secrets. Server secrets (for example `ADMIN_EMAILS` on freecard-api, and the Cloudflare API token used to deploy)
  are kept in Cloudflare and are NOT in this repo.
- Older files that were removed from the live site (designs Benz took out) may still sit in this repo; the site no longer lists them.
