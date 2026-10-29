# FreeCard

FreeCard is a free simcha card maker for the frum community. It makes invitations and matching pieces (thank-you cards, table numbers, bentcher covers, welcome signs) in Lashon Kodesh, Yiddish and English. It runs entirely in the browser: nothing to sign up for, nothing to pay, and every card is a download (JPEG, PDF, GIF, WhatsApp Status).

- **Live site:** https://freecard.sites.tab.bot/
- **Also live on GitHub Pages:** https://boro11204.github.io/freecard/
- **This copy:** version **v20261029a** (October 29, 2026), a backup of the live site.

## Background art

The "New" photo-style backgrounds are AI-generated, made with **Canva** and **Leonardo.ai**. The site says so in its footer and on those designs' tiles. They are not hand-drawn.

## What's in here

- `index.html`, `core.js` and the other files at the top level are the whole site.
- `fonts/` holds the web fonts. `img/` holds the backgrounds and thumbnails.
- `test/` holds one test script used while building. It isn't needed to run the site.

## GitHub Pages

This repository is public and GitHub Pages is turned on (Settings > Pages: deploy from branch **main**, folder **/ (root)**), so the same site is live at https://boro11204.github.io/freecard/. Any change pushed to `main` republishes it within a minute or two. The empty `.nojekyll` file tells GitHub to serve every file as-is.
