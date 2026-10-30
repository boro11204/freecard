/* FreeCard downloads: JPEG and PDF of the rendered card, made in the browser.
   Fast path: only the fonts the card actually uses are embedded (fetched once, cached),
   the font/image cache is warmed while the page is idle, the finished picture is reused
   for the PDF if the card did not change, and on phones the file opens the share sheet
   ("Save Image" puts it straight into Photos). */
(function (global) {
  'use strict';
  var TARGET_W = 1080, QUALITY = 0.9;
  var dataCache = {};      // font url -> Promise<data url>
  var cssCache = {};       // family set -> Promise<@font-face css>
  var last = null;         // { key, blob, w, h }
  var UA = navigator.userAgent || '';
  // Safari and every iPhone browser (all WebKit) need a warm-up pass; Chrome/Android do not
  var WEBKIT = /iPhone|iPad|iPod|CriOS|FxiOS/.test(UA) || (/AppleWebKit/.test(UA) && !/Chrome\/|Chromium|Edg\/|Android/.test(UA));

  function familiesIn(node) {
    var set = {}, els = [node].concat([].slice.call(node.querySelectorAll('*')));
    els.forEach(function (e) {
      getComputedStyle(e).fontFamily.split(',').forEach(function (f) {
        f = f.trim().replace(/^["']|["']$/g, ''); if (f) set[f.toLowerCase()] = 1;
      });
    });
    return set;
  }
  function toDataUrl(url) {
    if (!dataCache[url]) {
      dataCache[url] = fetch(url).then(function (r) { if (!r.ok) throw new Error('font ' + r.status); return r.blob(); })
        .then(function (b) { return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsDataURL(b); }); });
      dataCache[url].catch(function () { delete dataCache[url]; });
    }
    return dataCache[url];
  }
  // @font-face rules (from our own fonts.css) for just the families the card uses, with the files inlined
  function fontCss(node) {
    var fams = familiesIn(node), key = Object.keys(fams).sort().join('|');
    if (cssCache[key]) return cssCache[key];
    var jobs = [];
    [].slice.call(document.styleSheets).forEach(function (sheet) {
      if (sheet.href && sheet.href.indexOf(location.origin) !== 0) return; // only our own stylesheets (not extensions')
      var rules; try { rules = sheet.cssRules; } catch (e) { return; }
      [].slice.call(rules || []).forEach(function (r) {
        if (r.type !== 5) return; // CSSFontFaceRule
        var fam = r.style.getPropertyValue('font-family').trim().replace(/^["']|["']$/g, '');
        if (!fams[fam.toLowerCase()]) return;
        var m = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(r.style.getPropertyValue('src'));
        if (!m) return;
        var abs; try { abs = new URL(m[1], sheet.href || location.href).href; } catch (e) { return; }
        if (abs.indexOf(location.origin) !== 0) return;
        jobs.push(toDataUrl(abs).catch(function (e) { console.warn('font skipped', abs, e); return null; }).then(function (d) {
          if (!d) return '';
          var s = r.style;
          return '@font-face{font-family:"' + fam + '";font-style:' + (s.getPropertyValue('font-style') || 'normal') +
            ';font-weight:' + (s.getPropertyValue('font-weight') || '400') +
            (s.getPropertyValue('unicode-range') ? ';unicode-range:' + s.getPropertyValue('unicode-range') : '') +
            ';src:url(' + d + ') format("woff2");}';
        }));
      });
    });
    cssCache[key] = Promise.all(jobs).then(function (a) { return a.join('\n'); });
    cssCache[key].catch(function () { delete cssCache[key]; });
    return cssCache[key];
  }
  function waitImages(node) {
    var imgs = [].slice.call(node.querySelectorAll('img'));
    return Promise.all(imgs.map(function (i) { return i.decode ? i.decode().catch(function () {}) : null; }));
  }
  function fontsLoaded() { var n = 0; try { document.fonts.forEach(function (f) { if (f.status === 'loaded') n++; }); } catch (e) {} return n; }
  function fontsReady() { return document.fonts ? document.fonts.ready : Promise.resolve(); }
  function nextPaint() { return new Promise(function (r) { requestAnimationFrame(function () { setTimeout(r, 0); }); }); }

  function loadImg(url) {
    return new Promise(function (res, rej) {
      var i = new Image(); i.onload = function () { (i.decode ? i.decode().catch(function () {}) : Promise.resolve()).then(function () { res(i); }); };
      i.onerror = rej; i.src = url;
    });
  }
  // Pictures on the card (design backgrounds, flower art, the photo) are drawn straight onto the canvas;
  // only the lettering and ornaments go through the HTML snapshot. Safari often leaves pictures out of
  // such snapshots on the first try, which is why the old code rendered everything twice.
  function imageLayers(node) {
    var base = node.getBoundingClientRect(), out = [];
    [node].concat([].slice.call(node.querySelectorAll('*'))).forEach(function (e, idx) {
      var cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      var r = e.getBoundingClientRect(), m = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(cs.backgroundImage);
      var box = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
      if (m) out.push({ idx: idx, kind: 'bg', url: m[1], box: box });
      if (e.tagName === 'IMG' && e.currentSrc) {
        var pr = e.parentElement.getBoundingClientRect(), pcs = getComputedStyle(e.parentElement);
        out.push({ idx: idx, kind: 'img', url: e.currentSrc, box: box, round: pcs.borderRadius.indexOf('50%') >= 0 || parseFloat(pcs.borderRadius) >= pr.width / 2 - 1 });
      }
    });
    return out;
  }
  function drawLayer(ctx, img, L, s) {
    var b = L.box, x = b.x * s, y = b.y * s, w = b.w * s, h = b.h * s;
    if (L.kind === 'bg') { ctx.drawImage(img, x, y, w, h); return; }
    // the photo: object-fit cover, clipped to its circle
    var ir = img.naturalWidth / img.naturalHeight, br = w / h, sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
    if (ir > br) { sw = sh * br; sx = (img.naturalWidth - sw) / 2; } else { sh = sw / br; sy = (img.naturalHeight - sh) / 2; }
    ctx.save();
    if (L.round) { ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2); ctx.clip(); }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    ctx.restore();
  }
  // characters that are not allowed in XML (pasted from Word/WhatsApp/PDF: vertical tab, form feed, other
  // control codes, broken emoji halves) make the snapshot fail, so they are cleaned out of the copy
  var BAD = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/g;
  function cleanText(t) { return t.replace(BAD, function (m, pre) { return (pre || '') + (/[\u000B\u000C]/.test(m) ? '\n' : ''); }); }
  function cleanTree(root) {
    var w = document.createTreeWalker(root, 4 /* text */), n;
    while ((n = w.nextNode())) { if (BAD.test(n.data)) { BAD.lastIndex = 0; n.data = cleanText(n.data); } BAD.lastIndex = 0; }
    [root].concat([].slice.call(root.querySelectorAll('*'))).forEach(function (e) {
      [].slice.call(e.attributes).forEach(function (a) { if (BAD.test(a.value)) { BAD.lastIndex = 0; try { e.setAttribute(a.name, cleanText(a.value)); } catch (x) {} } BAD.lastIndex = 0; });
    });
  }
  // an off-screen copy of the card with its pictures taken out, for the lettering snapshot
  function textOnlyCopy(node, layers) {
    var wrap = document.createElement('div');
    wrap.className = node.parentElement ? node.parentElement.className : 'fc-wrap';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:fixed;left:-20000px;top:0;width:' + node.offsetWidth + 'px;pointer-events:none;contain:layout;';
    var copy = node.cloneNode(true), all = [copy].concat([].slice.call(copy.querySelectorAll('*')));
    layers.forEach(function (L) {
      var e = all[L.idx]; if (!e) return;
      if (L.kind === 'bg') e.style.setProperty('background-image', 'none', 'important');
      else { e.style.setProperty('visibility', 'hidden', 'important'); e.removeAttribute('srcset'); e.setAttribute('src', BLANK); }
    });
    cleanTree(copy);
    copy.style.setProperty('background-color', 'transparent', 'important');
    copy.style.setProperty('animation', 'none', 'important');
    wrap.appendChild(copy); document.body.appendChild(wrap);
    return { node: copy, remove: function () { wrap.remove(); } };
  }
  function isBlank(cv) {
    try {
      var t = document.createElement('canvas'); t.width = 48; t.height = 72;
      var c = t.getContext('2d'); c.drawImage(cv, 0, 0, 48, 72);
      var d = c.getImageData(0, 0, 48, 72).data;
      for (var i = 3; i < d.length; i += 4) if (d[i] > 20) return false;
      return true;
    } catch (e) { return false; }
  }
  // never wait on the network or the browser forever: a picture or font that does not arrive is left out
  function within(p, ms, fallback) {
    return new Promise(function (res) {
      var done = false, t = setTimeout(function () { if (!done) { done = true; console.warn('FreeCard: gave up waiting after ' + ms + ' ms'); res(fallback); } }, ms);
      Promise.resolve(p).then(function (v) { if (!done) { done = true; clearTimeout(t); res(v); } },
        function (e) { if (!done) { done = true; clearTimeout(t); console.warn('FreeCard: step failed', e); res(fallback); } });
    });
  }
  function hardTimeout(p, ms, what) {
    return new Promise(function (res, rej) {
      var t = setTimeout(function () { rej(new Error(what + ' timed out after ' + Math.round(ms / 1000) + 's')); }, ms);
      p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); });
    });
  }
  // last resort that needs no snapshot at all: draw each word where the page shows it
  function drawTextDirect(ctx, node, s) {
    var base = node.getBoundingClientRect(), w = document.createTreeWalker(node, 4), n;
    ctx.textBaseline = 'alphabetic';
    while ((n = w.nextNode())) {
      var el = n.parentElement; if (!el || !n.data.trim()) continue;
      var cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      ctx.fillStyle = cs.color; ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + parseFloat(cs.fontSize) * s + 'px ' + cs.fontFamily;
      var re = /\S+/g, m;
      while ((m = re.exec(n.data))) {
        var rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
        var r = rg.getBoundingClientRect(); if (!r.width) continue;
        var word = cleanText(m[0]), rtl = /[\u0590-\u05FF]/.test(word);
        try { ctx.direction = rtl ? 'rtl' : 'ltr'; } catch (e) {}
        ctx.textAlign = rtl ? 'right' : 'left';
        // fit each word to the width it has on the page (zoom and letter-spacing are not in the computed size)
        var fs = parseFloat(cs.fontSize) * s, fam = cs.fontStyle + ' ' + cs.fontWeight + ' ';
        ctx.font = fam + fs + 'px ' + cs.fontFamily;
        var mw = ctx.measureText(word).width, k = mw ? (r.width * s) / mw : 1;
        if (k > 0.4 && k < 2.5 && Math.abs(k - 1) > 0.03) ctx.font = fam + fs * k + 'px ' + cs.fontFamily;
        ctx.fillText(word, ((rtl ? r.right : r.left) - base.left) * s, (r.bottom - base.top - r.height * 0.22) * s);
      }
    }
  }
  // opts: noPictures (leave out the photo and design art), plainFonts (do not embed lettering),
  //       scale (output width factor), direct (skip the snapshot and draw words straight on)
  function render(node, opts) {
    opts = opts || {};
    var h2i = global.htmlToImage;
    if (!h2i && !opts.direct) return Promise.reject(new Error('image library missing'));
    if (!node.offsetWidth) return Promise.reject(new Error('the card is not visible on the page'));
    var full = !opts.noPictures && !opts.plainFonts && !opts.scale && !opts.direct;
    var key = node.outerHTML + '|' + fontsLoaded();
    if (full && last && last.key === key) return Promise.resolve(last);
    if (opts.paint) {
      // drawn straight onto a canvas: no snapshot, no data:/blob: pictures (see paint.js)
      if (!global.FreeCardPaint) return Promise.reject(new Error('painter missing'));
      return global.FreeCardPaint.paint(node, { width: Math.round(TARGET_W * (opts.scale || 1)), noPictures: opts.noPictures }).then(function (p) {
        return encode(p.canvas).then(function (b) {
          var r = { key: key, blob: b, w: p.canvas.width, h: p.canvas.height, missing: p.missing, canvas: p.canvas, how: 'paint' };
          if (full && !r.missing) last = r;
          return r;
        });
      });
    }
    var css, layers, imgs, tmp, bgColor = getComputedStyle(node).backgroundColor;
    var W = Math.round(TARGET_W * (opts.scale || 1)), s = W / node.offsetWidth, H = Math.round(node.offsetHeight * s);
    return within(fontsReady(), 2500)
      .then(function () {
        return Promise.all([opts.plainFonts || opts.direct ? '' : within(fontCss(node), 6000, ''), within(waitImages(node), 3000)]);
      })
      .then(function (a) {
        css = a[0]; layers = imageLayers(node);
        return Promise.all(layers.map(function (L) { return opts.noPictures ? null : within(loadImg(L.url), 6000, null); }));
      })
      .then(function (a) {
        imgs = a;
        var missing = layers.filter(function (L, i) { return !imgs[i]; }).length;
        if (missing && !opts.noPictures) console.warn('FreeCard: ' + missing + ' picture(s) could not be loaded and were left out');
        if (opts.direct) return null;
        tmp = textOnlyCopy(node, layers);
        var o = { cacheBust: false, fontEmbedCSS: css, backgroundColor: null, skipFonts: !css, imagePlaceholder: BLANK,
          style: { borderRadius: '0', boxShadow: 'none', margin: '0', transform: 'none', backgroundColor: 'transparent' } };
        var warmUp = WEBKIT ? within(h2i.toCanvas(tmp.node, Object.assign({}, o, { pixelRatio: 0.15 })), 8000) : Promise.resolve();
        var snap = function () { return hardTimeout(h2i.toCanvas(tmp.node, Object.assign({}, o, { pixelRatio: s })), 10000, 'snapshot'); };
        return warmUp.then(snap).then(function (cv) { return isBlank(cv) ? snap() : cv; },
          function (e) { if (/timed out/.test(e && e.message)) throw e; console.warn('snapshot retry', e); return snap(); });
      })
      .then(function (textCv) {
        if (tmp) { tmp.remove(); tmp = null; }
        var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        var ctx = cv.getContext('2d');
        ctx.fillStyle = bgColor && bgColor !== 'rgba(0, 0, 0, 0)' ? bgColor : '#ffffff'; ctx.fillRect(0, 0, W, H);
        layers.forEach(function (L, i) { if (imgs[i]) { try { drawLayer(ctx, imgs[i], L, s); } catch (e) { console.warn('picture skipped', e); } } });
        if (textCv) ctx.drawImage(textCv, 0, 0, W, H); else drawTextDirect(ctx, node, s);
        return encode(cv).then(function (b) { return { key: key, blob: b, w: W, h: H, missing: imgs.filter(function (x) { return !x; }).length, canvas: cv, how: opts.direct ? 'direct' : 'snapshot' }; });
      })
      .then(function (r) { if (full && !r.missing) last = r; return r; }, function (e) { if (tmp) tmp.remove(); throw e; });
  }
  function encode(cv) {
    return new Promise(function (res, rej) {
      var done = function (b) { b ? res(b) : rej(new Error('encode failed')); };
      try {
        if (cv.toBlob) cv.toBlob(done, 'image/jpeg', QUALITY);
        else { var d = cv.toDataURL('image/jpeg', QUALITY), bin = atob(d.split(',')[1]), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); done(new Blob([a], { type: 'image/jpeg' })); }
      } catch (e) { rej(e); }
    });
  }
  var BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  // the full card first; if that fails, simpler versions so a file is always made.
  // Computers that block pictures made inside the page (data:/blob: addresses) cannot use the snapshot,
  // so there the card is drawn straight onto a canvas (paint.js), with all borders and art.
  var NOTE_PIC = 'Some pictures on the card could not load on this computer, so they were left out.';
  var A_SNAP = { opts: {}, ms: 16000, snap: true },
    A_PAINT = { opts: { paint: true }, ms: 20000 },
    A_PAINT_NOPIC = { opts: { paint: true, noPictures: true }, ms: 12000, note: 'Your computer had trouble with the pictures, so they were left out of this one.' },
    A_PLAIN = { opts: { noPictures: true, plainFonts: true, scale: 0.75 }, ms: 12000, snap: true, note: 'Your computer had trouble making the full card, so the pictures and the chosen lettering were left out of this one.' },
    A_DIRECT = { opts: { direct: true }, ms: 15000, note: 'Your computer had trouble making the full card, so this is a simpler version (borders and some decorations may be missing).' };
  var snapBroken = false, blockedImgs = null;
  function probe() {
    if (!global.FreeCardPaint) return Promise.resolve(true);
    return within(global.FreeCardPaint.probe(), 1800, false).then(function (ok) { blockedImgs = !ok; return ok; });
  }
  function renderSafely(getNode, onStep, extra) {
    var errors = [], i = 0, start = Date.now(), plan;
    function next() {
      while (i < plan.length && plan[i].snap && snapBroken) i++;
      if (i >= plan.length) { var e = new Error(errors.join(' | ')); e.name = 'AllAttemptsFailed'; return Promise.reject(e); }
      var a = plan[i++];
      if (onStep) onStep(i);
      var node = getNode(); if (!node) return Promise.reject(new Error('no card on the page'));
      if (Date.now() - start > 90000) { errors.push('stopped after 90s'); i = plan.length - 1; }
      var ro = a.opts;
      if (extra && extra.hq) { ro = Object.assign({}, a.opts); ro.scale = (a.opts.scale || 1) * 2; }
      return hardTimeout(render(node, ro), a.ms * (extra && extra.hq ? 1.5 : 1), 'try ' + i).then(function (r) { r.note = a.note || ''; r.errors = errors; return r; },
        function (e) {
          errors.push('try ' + i + ': ' + errDetail(e)); console.error('FreeCard try ' + i + ' failed', e);
          if (a.snap) snapBroken = true; // the snapshot does not work in this browser: use the painter from now on
          return next();
        });
    }
    return probe().then(function (ok) {
      // a card with a photo is drawn by the painter first too: the snapshot can leave the photo out
      var n0 = getNode(), photo = !!(n0 && n0.querySelector('.fc-photo img'));
      plan = !ok || snapBroken || !global.htmlToImage ? [A_PAINT, A_PAINT_NOPIC, A_DIRECT] : photo ? [A_PAINT, A_SNAP, A_PLAIN, A_DIRECT] : [A_SNAP, A_PAINT, A_PLAIN, A_DIRECT];
      if (!global.FreeCardPaint) plan = [A_SNAP, A_PLAIN, A_DIRECT];
      return next();
    });
  }
  // quietly load the fonts and pictures the card uses, so the first tap is quick
  function warm(node) {
    if (!node || !node.offsetWidth || !global.htmlToImage) return Promise.resolve();
    return probe().then(function (ok) { if (!ok) { console.warn('FreeCard: this browser blocks in-page pictures; using the canvas painter'); throw 'skip'; } })
      .then(fontsReady).then(function () { return fontCss(node); })
      .then(function (css) {
        imageLayers(node).forEach(function (L) { loadImg(L.url).catch(function () {}); });
        if (WEBKIT) return global.htmlToImage.toCanvas(node, { cacheBust: false, fontEmbedCSS: css, pixelRatio: 0.15 });
      })
      .catch(function () {});
  }

  // print layouts for the PDF (sizes in points, 72 per inch). The card itself is 2:3.
  var PAPERS = {
    card: { w: 288, h: 432, m: 0 },            // 4×6 in, the card exactly
    '5x7': { w: 360, h: 504, m: 0 },           // 5×7 in, a thin white edge left and right
    a5: { w: 419.53, h: 595.28, m: 18 },
    letter: { w: 612, h: 792, m: 36 },          // one card, centred
    letter2: { w: 792, h: 612, m: 18, two: true }, // two cards side by side, cut down the middle
    half: { w: 396, h: 612, m: 18 }             // 5.5×8.5 in
  };
  function layoutFor(paper, marks, ratio) {
    var P = PAPERS[paper] || PAPERS.card, pw = P.w, ph = P.h, slug = marks ? 32 : 0, rects = [];
    if (paper === 'card' || !PAPERS[paper]) {
      var cw = 288, ch = Math.round(288 / ratio * 100) / 100;
      pw = cw + 2 * slug; ph = ch + 2 * slug; rects.push({ x: slug, y: slug, w: cw, h: ch });
    } else {
      var cells = P.two ? [{ x: 0, y: 0, w: pw / 2, h: ph }, { x: pw / 2, y: 0, w: pw / 2, h: ph }] : [{ x: 0, y: 0, w: pw, h: ph }];
      cells.forEach(function (c) {
        var m = Math.max(P.m, slug), aw = c.w - 2 * m, ah = c.h - 2 * m, w = aw, h = aw / ratio;
        if (h > ah) { h = ah; w = ah * ratio; }
        rects.push({ x: c.x + (c.w - w) / 2, y: c.y + (c.h - h) / 2, w: w, h: h });
      });
    }
    return { pw: pw, ph: ph, rects: rects };
  }
  function f2(n) { return (Math.round(n * 100) / 100).toString(); }
  function pdfFromJpeg(bytes, w, h, po) {
    po = po || {};
    var enc = new TextEncoder(), parts = [], offsets = [], len = 0;
    function push(x) { var b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; }
    function obj(n, fn) { offsets[n] = len; push(n + ' 0 obj\n'); fn(); push('\nendobj\n'); }
    var marks = !!po.marks, L = layoutFor(po.paper || 'card', marks, w / h), pw = f2(L.pw), ph = f2(L.ph), BLEED = 9;
    var content = '';
    L.rects.forEach(function (r) {
      if (marks) {
        // the picture runs 1/8 in past the cut line (bleed), then thin cut marks at each corner
        var bx = r.x - BLEED, by = r.y - BLEED, bw = r.w + 2 * BLEED, bh = r.h + 2 * BLEED, s = Math.max(bw / r.w, bh / r.h);
        var iw = r.w * s, ih = r.h * s, ix = r.x + r.w / 2 - iw / 2, iy = r.y + r.h / 2 - ih / 2;
        content += 'q ' + f2(bx) + ' ' + f2(by) + ' ' + f2(bw) + ' ' + f2(bh) + ' re W n ' + f2(iw) + ' 0 0 ' + f2(ih) + ' ' + f2(ix) + ' ' + f2(iy) + ' cm /Im0 Do Q\n';
        var g = BLEED + 3, Ln = 18, x0 = r.x, x1 = r.x + r.w, y0 = r.y, y1 = r.y + r.h;
        content += 'q 0 G 0.5 w\n';
        [[x0, y0, -1, -1], [x1, y0, 1, -1], [x0, y1, -1, 1], [x1, y1, 1, 1]].forEach(function (c) {
          var x = c[0], y = c[1], dx = c[2], dy = c[3];
          content += f2(x + dx * g) + ' ' + f2(y) + ' m ' + f2(x + dx * (g + Ln)) + ' ' + f2(y) + ' l S\n';
          content += f2(x) + ' ' + f2(y + dy * g) + ' m ' + f2(x) + ' ' + f2(y + dy * (g + Ln)) + ' l S\n';
        });
        content += 'Q\n';
      } else {
        content += 'q ' + f2(r.w) + ' 0 0 ' + f2(r.h) + ' ' + f2(r.x) + ' ' + f2(r.y) + ' cm /Im0 Do Q\n';
      }
    });
    if (L.rects.length === 2 && !marks) content += 'q 0.75 G 0.5 w [3 3] 0 d ' + f2(L.pw / 2) + ' 6 m ' + f2(L.pw / 2) + ' ' + f2(L.ph - 6) + ' l S Q\n';
    var boxes = '';
    if (marks && L.rects.length === 1) {
      var r0 = L.rects[0];
      boxes = ' /TrimBox [' + [r0.x, r0.y, r0.x + r0.w, r0.y + r0.h].map(f2).join(' ') + '] /BleedBox [' + [r0.x - BLEED, r0.y - BLEED, r0.x + r0.w + BLEED, r0.y + r0.h + BLEED].map(f2).join(' ') + ']';
    }
    push('%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n');
    obj(1, function () { push('<< /Type /Catalog /Pages 2 0 R >>'); });
    obj(2, function () { push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'); });
    obj(3, function () { push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw + ' ' + ph + ']' + boxes + ' /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>'); });
    obj(4, function () {
      push('<< /Type /XObject /Subtype /Image /Width ' + w + ' /Height ' + h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + bytes.length + ' >>\nstream\n');
      push(bytes); push('\nendstream');
    });
    obj(5, function () { push('<< /Length ' + enc.encode(content).length + ' >>\nstream\n' + content + 'endstream'); });
    var xref = len;
    push('xref\n0 6\n0000000000 65535 f \n');
    for (var i = 1; i <= 5; i++) push(('0000000000' + offsets[i]).slice(-10) + ' 00000 n \n');
    push('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    return new Blob(parts, { type: 'application/pdf' });
  }

  // several cards in one PDF (the table numbers of a matching set): one card per page, or two on the 2-up paper
  function jpegSize(u8) {
    for (var i = 2; i + 9 < u8.length;) {
      if (u8[i] !== 0xFF) { i++; continue; }
      var m = u8[i + 1], L = (u8[i + 2] << 8) | u8[i + 3];
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { w: (u8[i + 7] << 8) | u8[i + 8], h: (u8[i + 5] << 8) | u8[i + 6] };
      i += 2 + L;
    }
    return null;
  }
  function pdfFromJpegs(blobs, po) {
    po = po || {};
    return Promise.all(blobs.map(function (b) { return b.arrayBuffer(); })).then(function (bufs) {
      var imgs = bufs.map(function (b) { var u = new Uint8Array(b), s = jpegSize(u) || { w: 1080, h: 1620 }; return { bytes: u, w: s.w, h: s.h }; });
      var enc = new TextEncoder(), parts = [], offsets = [], len = 0;
      function push(x) { var b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; }
      function obj(n, fn) { offsets[n] = len; push(n + ' 0 obj\n'); fn(); push('\nendobj\n'); }
      var L = layoutFor(po.paper || 'card', false, imgs[0].w / imgs[0].h), per = L.rects.length, pages = [];
      for (var i = 0; i < imgs.length; i += per) pages.push(imgs.slice(i, i + per).map(function (im, k) { return { im: i + k, r: L.rects[k] }; }));
      // objects: 1 catalog, 2 pages, then per image one XObject, then per page a page + its content
      var nImg = imgs.length, firstPage = 3 + nImg, total = 2 + nImg + pages.length * 2;
      push('%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n');
      obj(1, function () { push('<< /Type /Catalog /Pages 2 0 R >>'); });
      var kids = pages.map(function (p, k) { return (firstPage + k * 2) + ' 0 R'; }).join(' ');
      obj(2, function () { push('<< /Type /Pages /Kids [' + kids + '] /Count ' + pages.length + ' >>'); });
      imgs.forEach(function (im, k) {
        obj(3 + k, function () {
          push('<< /Type /XObject /Subtype /Image /Width ' + im.w + ' /Height ' + im.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + im.bytes.length + ' >>\nstream\n');
          push(im.bytes); push('\nendstream');
        });
      });
      pages.forEach(function (p, k) {
        var content = '', res = '';
        p.forEach(function (c) {
          content += 'q ' + f2(c.r.w) + ' 0 0 ' + f2(c.r.h) + ' ' + f2(c.r.x) + ' ' + f2(c.r.y) + ' cm /Im' + c.im + ' Do Q\n';
          res += ' /Im' + c.im + ' ' + (3 + c.im) + ' 0 R';
        });
        if (per === 2) content += 'q 0.75 G 0.5 w [3 3] 0 d ' + f2(L.pw / 2) + ' 6 m ' + f2(L.pw / 2) + ' ' + f2(L.ph - 6) + ' l S Q\n';
        var pn = firstPage + k * 2;
        obj(pn, function () { push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + f2(L.pw) + ' ' + f2(L.ph) + '] /Resources << /XObject <<' + res + ' >> >> /Contents ' + (pn + 1) + ' 0 R >>'); });
        obj(pn + 1, function () { push('<< /Length ' + enc.encode(content).length + ' >>\nstream\n' + content + 'endstream'); });
      });
      var xref = len;
      push('xref\n0 ' + (total + 1) + '\n0000000000 65535 f \n');
      for (var n = 1; n <= total; n++) push(('0000000000' + offsets[n]).slice(-10) + ' 00000 n \n');
      push('trailer\n<< /Size ' + (total + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
      return new Blob(parts, { type: 'application/pdf' });
    });
  }
  // a plain .zip (stored, no compression: JPEGs are already compressed)
  var CRC = null;
  function crc32(u8) {
    if (!CRC) { CRC = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
    var x = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) x = CRC[(x ^ u8[i]) & 0xFF] ^ (x >>> 8);
    return (x ^ 0xFFFFFFFF) >>> 0;
  }
  function zipStore(files) {
    var enc = new TextEncoder(), parts = [], central = [], off = 0, d = new Date();
    var dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    function hdr(size) { var b = new Uint8Array(size); return { b: b, v: new DataView(b.buffer) }; }
    files.forEach(function (f) {
      var name = enc.encode(f.name), crc = crc32(f.bytes), sz = f.bytes.length;
      var h = hdr(30); h.v.setUint32(0, 0x04034b50, true); h.v.setUint16(4, 20, true); h.v.setUint16(6, 0x0800, true); h.v.setUint16(8, 0, true);
      h.v.setUint16(10, dosTime, true); h.v.setUint16(12, dosDate, true); h.v.setUint32(14, crc, true); h.v.setUint32(18, sz, true); h.v.setUint32(22, sz, true);
      h.v.setUint16(26, name.length, true); h.v.setUint16(28, 0, true);
      parts.push(h.b, name, f.bytes);
      var c = hdr(46); c.v.setUint32(0, 0x02014b50, true); c.v.setUint16(4, 20, true); c.v.setUint16(6, 20, true); c.v.setUint16(8, 0x0800, true); c.v.setUint16(10, 0, true);
      c.v.setUint16(12, dosTime, true); c.v.setUint16(14, dosDate, true); c.v.setUint32(16, crc, true); c.v.setUint32(20, sz, true); c.v.setUint32(24, sz, true);
      c.v.setUint16(28, name.length, true); c.v.setUint32(42, off, true);
      central.push(c.b, name);
      off += 30 + name.length + sz;
    });
    var csize = central.reduce(function (s, b) { return s + b.length; }, 0);
    var e = hdr(22); e.v.setUint32(0, 0x06054b50, true); e.v.setUint16(8, files.length, true); e.v.setUint16(10, files.length, true); e.v.setUint32(12, csize, true); e.v.setUint32(16, off, true);
    return new Blob(parts.concat(central, [e.b]), { type: 'application/zip' });
  }

  // black & white: the finished drawing turned grey, pixel by pixel (works the same for every way the card is made)
  function grayCopy(src) {
    var cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height;
    var ctx = cv.getContext('2d'); ctx.drawImage(src, 0, 0);
    var im = ctx.getImageData(0, 0, cv.width, cv.height), a = im.data;
    for (var i = 0; i < a.length; i += 4) { var y = a[i] * 0.299 + a[i + 1] * 0.587 + a[i + 2] * 0.114; a[i] = a[i + 1] = a[i + 2] = y; }
    ctx.putImageData(im, 0, 0);
    return cv;
  }
  function finish(r, o) {
    if (!o || !o.gray || !r.canvas) return Promise.resolve(r);
    try {
      var g = grayCopy(r.canvas);
      return encode(g).then(function (b) { return Object.assign({}, r, { blob: b, canvas: g }); });
    } catch (e) { console.warn('FreeCard: black & white skipped', e); return Promise.resolve(r); }
  }
  function make(node, kind, o) {
    o = o || currentOpts();
    // the exact fonts first (a lettering picked a moment ago may still be on its way), then the picture
    var pre = global.FreeCard && global.FreeCard.loadCardFonts ? within(global.FreeCard.loadCardFonts(node), 4000, false) : Promise.resolve();
    return pre.then(function () { return renderSafely(function () { return node; }, null, o); }).then(function (r) { return finish(r, o); }).then(function (r) {
      if (kind === 'jpeg') return r.blob;
      return r.blob.arrayBuffer().then(function (buf) { return pdfFromJpeg(new Uint8Array(buf), r.w, r.h, o); });
    });
  }
  // print/download choices from the maker ("More options"); none of them are needed for a normal card
  var optsFn = null;
  function currentOpts() { try { return (optsFn && optsFn()) || {}; } catch (e) { return {}; } }
  function setOptions(fn) { optsFn = fn; }

  function saveLink(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 60000);
  }
  var INAPP = /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|GSA\/|; wv\)|Line\/|Snapchat|Twitter|LinkedInApp|MicroMessenger|Gmail/i.test(UA);
  function isPhone() {
    try { if (global.matchMedia && matchMedia('(pointer: coarse)').matches) return true; } catch (e) {}
    return /Mobi|Android|iPhone|iPad|iPod/.test(UA) || INAPP || (navigator.maxTouchPoints > 1 && /Macintosh/.test(UA));
  }
  function canShareFile(file) {
    try { return !!(file && navigator.canShare && navigator.share && navigator.canShare({ files: [file] })); } catch (e) { return false; }
  }
  function blobToDataUrl(blob) {
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(blob); });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function closePanel() { var old = document.getElementById('fcReady'); if (old) { old.remove(); } document.documentElement.classList.remove('fc-lock'); }
  // full-screen panel: the finished picture as a plain image (press and hold to save works in every browser),
  // with Download, Open PDF and an optional Share button. Used on every phone and as the fallback anywhere.
  function readyPanel(o) {
    closePanel();
    var box = document.createElement('div'); box.id = 'fcReady'; box.className = 'fc-ready'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    var html = '<div class="fc-ready-in"><button type="button" class="fc-ready-x" aria-label="Close">×</button>';
    if (o.error) {
      html += '<div class="fc-ready-t">Sorry, the card could not be made</div>' +
        '<p class="fc-ready-h">Please try again. If it keeps happening, open freecard.sites.tab.bot in Safari or Chrome and try there.</p>' +
        '<div class="fc-ready-b"><button type="button" class="btn gold fc-retry">Try again</button></div>' +
        (o.detail ? '<p class="fc-ready-d">Details: ' + esc(o.detail) + '</p>' : '');
    } else {
      var pdf = o.kind === 'pdf';
      html += '<div class="fc-ready-t">' + (pdf ? 'Your PDF is ready' : o.kind === 'zip' ? 'Your table numbers are ready' : o.kind === 'gif' ? 'Your animated card is ready' : o.kind === 'story' ? 'Your Status picture is ready' : 'Your card is ready') + '</div>';
      if (o.kind === 'gif') html += '<p class="fc-ready-h">It sparkles when it is sent as a GIF. On a phone, tap Share and pick WhatsApp.</p>';
      if (o.kind === 'story') html += '<p class="fc-ready-h">Sized for WhatsApp Status (9:16).</p>';
      if (o.kind === 'zip') html += '<p class="fc-ready-h">A .zip file with one JPEG for each table. The first one is shown here.</p>';
      if (o.note) html += '<p class="fc-ready-h fc-inapp">' + esc(o.note) + '</p>';
      if (o.desk && o.saved) html += '<p class="fc-ready-big">' + (pdf ? 'The PDF was saved to your Downloads folder.' : o.kind === 'zip' ? 'The .zip was saved to your Downloads folder.' : 'The picture was saved to your Downloads folder.') + '</p>';
      if (o.desk) html += '<p class="fc-ready-h">Not there? Click “Download” again, or right-click the picture and choose “Save image as”.</p>';
      else if (!pdf && o.kind !== 'zip') html += '<p class="fc-ready-big">Press and hold the picture, then tap “Save to Photos”.</p>';
      html += o.canvas ? '<div class="fc-ready-cv"></div>' : '<img class="fc-ready-img" alt="Your invitation" src="' + o.imgUrl + '">';
      html += '<div class="fc-ready-b">';
      if (pdf) html += '<a class="btn gold fc-open" href="' + o.fileUrl + '" target="_blank" rel="noopener">Open PDF</a>';
      html += '<a class="btn' + (pdf ? ' ghost' : ' gold') + ' fc-dl" download="' + esc(o.name) + '" href="' + o.fileUrl + '">Download</a>';
      if (o.canShare) html += '<button type="button" class="btn ghost fc-share">Share</button>';
      html += '</div>';
      if (pdf && !o.desk) html += '<p class="fc-ready-h">If the PDF doesn’t open, press and hold the picture to save it instead. It prints the same.</p>';
      if (INAPP) html += '<p class="fc-ready-h fc-inapp">For best results, open this site in Safari or Chrome.</p>';
    }
    html += '</div>';
    box.innerHTML = html;
    var slot = box.querySelector('.fc-ready-cv');
    if (slot && o.canvas) {
      var src = o.canvas, k = Math.min(1, 900 / src.height), pc = document.createElement('canvas');
      pc.width = Math.round(src.width * k); pc.height = Math.round(src.height * k);
      pc.className = 'fc-ready-img'; pc.setAttribute('role', 'img'); pc.setAttribute('aria-label', 'Your invitation');
      pc.style.width = 'auto'; pc.style.height = 'auto';
      try { var pctx = pc.getContext('2d'); pctx.imageSmoothingQuality = 'high'; pctx.drawImage(src, 0, 0, pc.width, pc.height); } catch (e) { console.warn('preview', e); }
      slot.parentNode.replaceChild(pc, slot);
    }
    document.body.appendChild(box);
    document.documentElement.classList.add('fc-lock');
    function close() { closePanel(); if (o.fileUrl) setTimeout(function () { URL.revokeObjectURL(o.fileUrl); }, 60000); }
    box.querySelector('.fc-ready-x').onclick = close;
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    var sh = box.querySelector('.fc-share');
    if (sh) sh.onclick = function () {
      try { navigator.share({ files: [o.file] }).catch(function (e) { if (!e || e.name !== 'AbortError') console.warn('share', e); }); } catch (e) { console.warn('share', e); }
    };
    var rt = box.querySelector('.fc-retry');
    if (rt) rt.onclick = function () { close(); if (o.retry) o.retry(); };
    return box;
  }
  function deliver(blob, name, kind, jpegBlob, note, canvas) {
    var file = null;
    try { file = new File([blob], name, { type: blob.type }); } catch (e) { file = null; }
    var desk = !isPhone(), saved = false;
    if (desk) {
      try { saveLink(blob, name); saved = true; } catch (e) { console.warn('download link failed', e); }
    }
    var fileUrl = '';
    try { fileUrl = URL.createObjectURL(blob); } catch (e) { fileUrl = ''; }
    // where in-page pictures are blocked, the preview in the window is the drawing itself, not a picture
    var useCanvas = !!(canvas && blockedImgs);
    return (useCanvas ? Promise.resolve('') : blobToDataUrl(jpegBlob || blob)).then(function (imgUrl) {
      var p = function (fu) { readyPanel({ note: note, kind: kind, name: name, imgUrl: imgUrl, canvas: useCanvas ? canvas : null, fileUrl: fu, file: file, desk: desk, saved: saved, canShare: !desk && canShareFile(file) }); };
      if (fileUrl) { p(fileUrl); return saved ? 'saved' : 'panel'; }
      // no blob links in this browser: use a data link for the file
      return blobToDataUrl(blob).then(function (du) { p(du); return 'panel'; });
    });
  }
  var VERSION = '20261030d';
  // a readable reason for any failure: Error objects, image load Events, strings
  function errDetail(e) {
    try {
      if (!e) return 'unknown error (' + String(e) + ')';
      if (typeof e === 'string') return e;
      if (global.Event && e instanceof Event) {
        var t = e.target, src = t && (t.currentSrc || t.src || t.href || '');
        return 'Event: ' + e.type + ' on ' + (t && t.tagName || (t && t.constructor && t.constructor.name) || '?') + (src ? ' ' + String(src).slice(0, 80) : '');
      }
      return (e.name || (e.constructor && e.constructor.name) || 'Error') + ': ' + (e.message || String(e));
    } catch (x) { return 'unreadable error'; }
  }
  function withTimeout(p, ms) {
    return new Promise(function (res, rej) {
      var t = setTimeout(function () { rej(new Error('timed out')); }, ms);
      p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); });
    });
  }

  var STYLE = '.fc-spin{display:inline-block;width:14px;height:14px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;' +
    'animation:fcspin .7s linear infinite;margin-right:7px;vertical-align:-2px}@keyframes fcspin{to{transform:rotate(360deg)}}' +
    'html.fc-lock,html.fc-lock body{overflow:hidden}' +
    '.fc-ready{position:fixed;inset:0;top:0;left:0;right:0;bottom:0;background:rgba(15,20,40,.72);z-index:1000;display:flex;align-items:center;justify-content:center;padding:10px;box-sizing:border-box}' +
    '.fc-ready-in{background:#fff;border-radius:18px;padding:16px 16px 18px;width:100%;max-width:460px;text-align:center;position:relative;max-height:100%;overflow:auto;-webkit-overflow-scrolling:touch;box-sizing:border-box}' +
    '.fc-ready-img{display:block;width:auto;max-width:100%;max-height:58vh;margin:8px auto 10px;border-radius:6px;box-shadow:0 4px 18px rgba(0,0,0,.2);-webkit-touch-callout:default;-webkit-user-select:auto;user-select:auto;pointer-events:auto}' +
    '.fc-ready-t{font-weight:700;font-size:19px;padding:0 30px}.fc-ready-big{font-size:17px;font-weight:700;color:#8a6419;margin:8px 0 0;line-height:1.35}' +
    '.fc-ready-d{font-size:11px;color:#888;margin:12px 0 0;word-break:break-all;font-family:monospace;user-select:text;-webkit-user-select:text}' +
    '.fc-ready-h{font-size:14px;color:#555;margin:10px 0 0;line-height:1.4}.fc-inapp{color:#8a6419}' +
    '.fc-ready-b{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}.fc-ready-b .btn{flex:1 1 120px;min-height:48px}' +
    '.fc-ready-x{position:absolute;right:8px;top:4px;border:0;background:none;font-size:32px;line-height:1;cursor:pointer;color:#555;padding:6px 10px}';
  function addStyle() {
    if (document.getElementById('fcDlStyle')) return;
    var st = document.createElement('style'); st.id = 'fcDlStyle'; st.textContent = STYLE; document.head.appendChild(st);
  }

  function wire(btnJpeg, btnPdf, getNode, getName, toast, more) {
    addStyle();
    var busy = false;
    function run(btn, kind) {
      if (busy) return;
      busy = true;
      var label = btn.innerHTML; btn.disabled = true; btn.setAttribute('aria-busy', 'true');
      btn.innerHTML = '<span class="fc-spin" aria-hidden="true"></span>Preparing…';
      var t0 = Date.now(), note = '', ro = {};
      var tick = setInterval(function () {
        var sec = Math.round((Date.now() - t0) / 1000);
        if (sec >= 4) btn.innerHTML = '<span class="fc-spin" aria-hidden="true"></span>' + (sec >= 15 ? 'Still working… ' : 'Preparing… ') + sec + 's';
      }, 1000);
      var p;
      try {
        p = nextPaint().then(function () {
          if (!getNode()) throw new Error('no card on the page');
          ro = currentOpts();
          return hardTimeout(renderSafely(getNode, null, ro), 90000, 'making the card');
        }).then(function (r) { return finish(r, ro); }).then(function (r) {
          note = r.note || (r.missing ? 'Some pictures on the card could not load on this computer, so they were left out.' : '');
          if (r.errors && r.errors.length) console.warn('FreeCard: earlier tries failed: ' + r.errors.join(' | '));
          global.__fcLastHow = r.how || '';
          if (kind === 'jpeg') return { blob: r.blob, jpeg: r.blob, canvas: r.canvas };
          if (kind === 'gif') {
            if (!global.FreeCardExtras) throw new Error('animation maker missing');
            return global.FreeCardExtras.gif(r.canvas, global.FreeCardExtras.layout(getNode())).then(function (b) { return { blob: b, jpeg: b, canvas: r.canvas }; });
          }
          if (kind === 'story') {
            if (!global.FreeCardExtras) throw new Error('status maker missing');
            return global.FreeCardExtras.story(r.canvas).then(function (s) { return { blob: s.blob, jpeg: s.blob, canvas: s.canvas }; });
          }
          return r.blob.arrayBuffer().then(function (buf) { return { blob: pdfFromJpeg(new Uint8Array(buf), r.w, r.h, ro), jpeg: r.blob, canvas: r.canvas }; });
        }).then(function (x) {
          global.__fcLastDownloadMs = Date.now() - t0;
          global.__fcLastNote = note;
          return deliver(x.blob, getName() + ({ jpeg: '.jpg', pdf: '.pdf', gif: '-animated.gif', story: '-status.jpg' }[kind]), kind, x.jpeg, note, x.canvas);
        });
      } catch (e) { p = Promise.reject(e); }
      p.then(function (how) {
        if (toast && how === 'saved') toast({ jpeg: 'Image saved', pdf: 'PDF saved', gif: 'Animated GIF saved', story: 'Status picture saved' }[kind]);
      }).catch(function (e) {
        var detail = errDetail(e) + ' [' + kind + ', ' + ((Date.now() - t0) / 1000).toFixed(1) + 's, v' + VERSION + ']';
        console.error('FreeCard download failed: ' + detail, e);
        global.__fcLastDownloadError = detail;
        try { readyPanel({ error: true, detail: detail, retry: function () { run(btn, kind); } }); } catch (e2) { if (toast) toast('Could not make the file, try again'); }
      }).then(function () { clearInterval(tick); busy = false; btn.disabled = false; btn.removeAttribute('aria-busy'); btn.innerHTML = label; });
    }
    if (btnJpeg) btnJpeg.addEventListener('click', function () { run(btnJpeg, 'jpeg'); });
    if (btnPdf) btnPdf.addEventListener('click', function () { run(btnPdf, 'pdf'); });
    if (more && more.gif) more.gif.addEventListener('click', function () { run(more.gif, 'gif'); });
    if (more && more.story) more.story.addEventListener('click', function () { run(more.story, 'story'); });
    // warm the font and picture cache once the page has settled
    var idle = global.requestIdleCallback || function (f) { return setTimeout(f, 1200); };
    setTimeout(function () { idle(function () { try { warm(getNode()); } catch (e) {} }); }, 800);
  }
  function fileName(c) {
    var n = (global.FreeCard.namesLine(c) || 'invitation').replace(/[^\w\u0590-\u05FF]+/g, '-').replace(/^-|-$/g, '');
    return 'FreeCard-' + (n || 'invitation');
  }
  global.FreeCardDownload = { make: make, wire: wire, warm: warm, fileName: fileName, pdfFromJpeg: pdfFromJpeg, setOptions: setOptions, layoutFor: layoutFor,
    pdfFromJpegs: pdfFromJpegs, zipStore: zipStore, deliver: deliver, options: currentOpts };
})(window);
