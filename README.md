# FreeCard

FreeCard is a free simcha card maker for the frum community. It makes invitations and matching pieces (thank-you cards, table numbers, bentcher covers, welcome signs) in Lashon Kodesh, Yiddish and English. It runs entirely in the browser: nothing to sign up for, nothing to pay, and every card is a download (JPEG, PDF, GIF, WhatsApp Status).

- **Live site:** https://freecard.sites.tab.bot/
- **This copy:** version **v20261029a** (October 29, 2026), a backup of the live site.

## Background art

The "New" photo-style backgrounds are AI-generated, made with **Canva** and **Leonardo.ai**. The site says so in its footer and on those designs' tiles. They are not hand-drawn.

## What's in here

- `index.html`, `core.js` and the other files at the top level are the whole site.
- `fonts/` holds the web fonts. `img/` holds the backgrounds and thumbnails.
- `test/` holds one test script used while building. It isn't needed to run the site.

## Hosting it free with GitHub Pages (later, if you want)

1. In this repository, open **Settings > Pages**.
2. Under "Build and deployment", choose **Deploy from a branch**, pick branch **main** and folder **/ (root)**, then click Save.
3. After a minute the site is live at `https://boro11204.github.io/freecard/`.

Note: on a free GitHub account, Pages only works when the repository is **public** (Settings > General > Danger Zone > Change visibility). This repository is private for now, and Pages is not turned on.
