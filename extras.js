/* FreeCard extras: animated GIF with twinkling sparkles, and a WhatsApp Status (9:16) picture.
   Everything is made in the browser from the finished card picture; nothing is uploaded.
   The GIF encoder (median-cut palette, LZW) is written here from the GIF89a spec; no outside code. */
(function (global) {
  'use strict';

  /* ---------- palette: median cut over 5-bit colour buckets ---------- */
  function buildPalette(px, n, maxColors) {
    var cnt = new Uint32Array(32768), sr = new Float64Array(32768), sg = new Float64Array(32768), sb = new Float64Array(32768);
    var step = n > 400000 ? 2 : 1, i, k;
    for (i = 0; i < n; i += step) {
      var o = i * 4, r = px[o], g = px[o + 1], b = px[o + 2];
      k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      cnt[k]++; sr[k] += r; sg[k] += g; sb[k] += b;
    }
    var keys = [];
    for (k = 0; k < 32768; k++) if (cnt[k]) keys.push(k);
    function boxOf(list) {
      var mn = [31, 31, 31], mx = [0, 0, 0], tot = 0;
      list.forEach(function (k) { var c = [k >> 10, (k >> 5) & 31, k & 31]; for (var j = 0; j < 3; j++) { if (c[j] < mn[j]) mn[j] = c[j]; if (c[j] > mx[j]) mx[j] = c[j]; } tot += cnt[k]; });
      var d = [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]], ax = d[1] >= d[0] && d[1] >= d[2] ? 1 : d[0] >= d[2] ? 0 : 2;
      return { list: list, ax: ax, span: d[ax], tot: tot };
    }
    var boxes = [boxOf(keys)];
    while (boxes.length < maxColors) {
      var best = -1, bs = 0;
      for (i = 0; i < boxes.length; i++) { var sc = boxes[i].span * Math.sqrt(boxes[i].tot); if (boxes[i].list.length > 1 && sc > bs) { bs = sc; best = i; } }
      if (best < 0) break;
      var bx = boxes[best], ax = bx.ax, sh = ax === 0 ? 10 : ax === 1 ? 5 : 0;
      bx.list.sort(function (a, b) { return ((a >> sh) & 31) - ((b >> sh) & 31); });
      var half = bx.tot / 2, acc = 0, cut = 0;
      for (i = 0; i < bx.list.length - 1; i++) { acc += cnt[bx.list[i]]; if (acc >= half) { cut = i + 1; break; } }
      if (!cut) cut = Math.max(1, bx.list.length >> 1);
      boxes.splice(best, 1, boxOf(bx.list.slice(0, cut)), boxOf(bx.list.slice(cut)));
    }
    return boxes.map(function (bx) {
      var r = 0, g = 0, b = 0, t = 0;
      bx.list.forEach(function (k) { r += sr[k]; g += sg[k]; b += sb[k]; t += cnt[k]; });
      return [Math.round(r / t), Math.round(g / t), Math.round(b / t)];
    });
  }

  /* ---------- map the picture onto the palette (light error diffusion for smooth gradients) ---------- */
  function mapPixels(px, w, h, pal, base) {
    var out = new Uint8Array(w * h), cache = new Int16Array(32768).fill(-1), np = pal.length;
    var er = new Float32Array((w + 2) * 2), eg = new Float32Array((w + 2) * 2), eb = new Float32Array((w + 2) * 2), D = 0.72;
    function near(r, g, b) {
      var k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3), c = cache[k];
      if (c >= 0) return c;
      var bi = 0, bd = 1e9, rr = (r & 248) + 4, gg = (g & 248) + 4, bb = (b & 248) + 4;
      for (var j = 0; j < np; j++) { var p = pal[j], dr = p[0] - rr, dg = p[1] - gg, db = p[2] - bb, d = dr * dr * 3 + dg * dg * 4 + db * db * 2; if (d < bd) { bd = d; bi = j; } }
      cache[k] = bi; return bi;
    }
    for (var y = 0; y < h; y++) {
      var cur = (y & 1) * (w + 2), nxt = ((y + 1) & 1) * (w + 2);
      for (var x = 0; x <= w + 1; x++) { er[nxt + x] = 0; eg[nxt + x] = 0; eb[nxt + x] = 0; }
      for (x = 0; x < w; x++) {
        var o = (y * w + x) * 4, e = cur + x + 1;
        var r = px[o] + er[e], g = px[o + 1] + eg[e], b = px[o + 2] + eb[e];
        r = r < 0 ? 0 : r > 255 ? 255 : r; g = g < 0 ? 0 : g > 255 ? 255 : g; b = b < 0 ? 0 : b > 255 ? 255 : b;
        var idx = near(r | 0, g | 0, b | 0), p = pal[idx];
        out[y * w + x] = idx + base;
        var qr = (r - p[0]) * D, qg = (g - p[1]) * D, qb = (b - p[2]) * D;
        er[e + 1] += qr * 7 / 16; eg[e + 1] += qg * 7 / 16; eb[e + 1] += qb * 7 / 16;
        var n2 = nxt + x + 1;
        er[n2 - 1] += qr * 3 / 16; eg[n2 - 1] += qg * 3 / 16; eb[n2 - 1] += qb * 3 / 16;
        er[n2] += qr * 5 / 16; eg[n2] += qg * 5 / 16; eb[n2] += qb * 5 / 16;
        er[n2 + 1] += qr / 16; eg[n2 + 1] += qg / 16; eb[n2 + 1] += qb / 16;
      }
    }
    return out;
  }

  /* ---------- GIF89a writer ---------- */
  function ByteOut() { this.a = new Uint8Array(1 << 20); this.n = 0; }
  ByteOut.prototype.b = function (v) { if (this.n >= this.a.length) { var t = new Uint8Array(this.a.length * 2); t.set(this.a); this.a = t; } this.a[this.n++] = v; };
  ByteOut.prototype.w16 = function (v) { this.b(v & 255); this.b((v >> 8) & 255); };
  ByteOut.prototype.s = function (str) { for (var i = 0; i < str.length; i++) this.b(str.charCodeAt(i)); };
  function lzw(out, idx, minSize) {
    out.b(minSize);
    var clear = 1 << minSize, eoi = clear + 1, size = minSize + 1, next = eoi + 1, dict = new Map();
    var buf = 0, bits = 0, block = new Uint8Array(255), bl = 0;
    function flushBlock() { if (bl) { out.b(bl); for (var i = 0; i < bl; i++) out.b(block[i]); bl = 0; } }
    function emit(code) {
      buf |= code << bits; bits += size;
      while (bits >= 8) { block[bl++] = buf & 255; if (bl === 255) flushBlock(); buf >>>= 8; bits -= 8; }
    }
    emit(clear);
    var pre = idx[0];
    for (var i = 1; i < idx.length; i++) {
      var k = idx[i], key = pre * 4096 + k, v = dict.get(key);
      if (v !== undefined) { pre = v; continue; }
      emit(pre);
      if (next < 4096) { dict.set(key, next++); if (next > (1 << size) && size < 12) size++; }
      else { emit(clear); dict.clear(); size = minSize + 1; next = eoi + 1; }
      pre = k;
    }
    emit(pre); emit(eoi);
    if (bits > 0) { block[bl++] = buf & 255; if (bl === 255) flushBlock(); }
    flushBlock(); out.b(0);
  }
  function encodeGif(w, h, palette, frames, delayCs) {
    var o = new ByteOut();
    o.s('GIF89a'); o.w16(w); o.w16(h); o.b(0xF7); o.b(0); o.b(0);
    for (var i = 0; i < 256; i++) { var c = palette[i] || [0, 0, 0]; o.b(c[0]); o.b(c[1]); o.b(c[2]); }
    o.b(0x21); o.b(0xFF); o.b(11); o.s('NETSCAPE2.0'); o.b(3); o.b(1); o.w16(0); o.b(0);
    frames.forEach(function (f) {
      o.b(0x21); o.b(0xF9); o.b(4); o.b((1 << 2) | (f.transparent ? 1 : 0)); o.w16(delayCs); o.b(f.transparent ? 0 : 0); o.b(0);
      o.b(0x2C); o.w16(f.x); o.w16(f.y); o.w16(f.w); o.w16(f.h); o.b(0);
      lzw(o, f.idx, 8);
    });
    o.b(0x3B);
    return o.a.subarray(0, o.n);
  }

  /* ---------- sparkles ---------- */
  var SPARK = [[255, 255, 255], [255, 247, 214], [250, 222, 140], [233, 189, 82], [196, 146, 46], [150, 104, 28]];
  function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function lum(px, w, h, x, y) { x = Math.max(0, Math.min(w - 1, x | 0)); y = Math.max(0, Math.min(h - 1, y | 0)); var o = (y * w + x) * 4; return 0.3 * px[o] + 0.59 * px[o + 1] + 0.11 * px[o + 2]; }
  function stamp(idx, w, h, cx, cy, r, dark) {
    if (r < 1.2) return;
    var arm = dark ? 3 : 5, mid = dark ? 2 : 4, core = dark ? 1 : 3, ri = Math.ceil(r), thin = Math.max(0.9, r * 0.2);
    for (var y = -ri; y <= ri; y++) for (var x = -ri; x <= ri; x++) {
      var px = Math.round(cx + x), py = Math.round(cy + y);
      if (px < 0 || py < 0 || px >= w || py >= h) continue;
      var ax = Math.abs(x), ay = Math.abs(y), d = Math.sqrt(x * x + y * y), c = -1;
      if (d <= r * 0.26 + 0.6) c = core;
      else if (ax / r + ay / thin <= 1 || ay / r + ax / thin <= 1) c = (d < r * 0.55) ? mid : arm;
      else if (r > 5 && (Math.abs(ax - ay) <= 0.7 && d <= r * 0.45)) c = mid;
      if (c >= 0) idx[py * w + px] = c;
    }
  }
  function spots(rects, w, h, count, seed) {
    var R = rnd(seed || 7), out = [], tries = 0, text = rects.text || [], hot = rects.art || [], fr = rects.frame;
    function inText(x, y) { for (var i = 0; i < text.length; i++) { var t = text[i]; if (x > t[0] - 0.02 && x < t[2] + 0.02 && y > t[1] - 0.012 && y < t[3] + 0.012) return true; } return false; }
    while (out.length < count && tries++ < count * 60) {
      var x, y, pick = R();
      if (hot.length && pick < 0.55) { var a = hot[Math.floor(R() * hot.length)]; x = a[0] + R() * (a[2] - a[0]); y = a[1] + R() * (a[3] - a[1]); }
      else if (fr && pick < 0.85) { var side = Math.floor(R() * 4), t = R(); x = side < 2 ? fr[0] + t * (fr[2] - fr[0]) : (side === 2 ? fr[0] : fr[2]); y = side < 2 ? (side ? fr[3] : fr[1]) : fr[1] + t * (fr[3] - fr[1]); }
      else { x = 0.04 + R() * 0.92; y = 0.03 + R() * 0.94; }
      if (x < 0.02 || x > 0.98 || y < 0.015 || y > 0.985 || inText(x, y)) continue;
      var ok = true;
      for (var i = 0; i < out.length; i++) { var dx = out[i].x - x, dy = (out[i].y - y) * h / w; if (dx * dx + dy * dy < 0.0045) { ok = false; break; } }
      if (!ok) continue;
      out.push({ x: x, y: y, ph: R(), sz: 0.55 + R() * 0.45, sp: R() < 0.3 ? 2 : 1 });
    }
    return out;
  }

  // rectangles of the card's art, frame and text (0..1 of the card), read from the live card on the page
  function layout(node) {
    var res = { art: [], text: [], frame: null };
    try {
      var cr = node.getBoundingClientRect(), W = cr.width, H = cr.height;
      var rel = function (r) { return [(r.left - cr.left) / W, (r.top - cr.top) / H, (r.right - cr.left) / W, (r.bottom - cr.top) / H]; };
      [].forEach.call(node.querySelectorAll('.fc-art, .fc-orn, .fc-arch'), function (e) { var r = e.getBoundingClientRect(); if (r.width > 4 && r.height > 4 && getComputedStyle(e).display !== 'none') res.art.push(rel(r)); });
      var fr = node.querySelector('.fc-frame'); if (fr && getComputedStyle(fr).display !== 'none') res.frame = rel(fr.getBoundingClientRect());
      var inner = node.querySelector('.fc-in') || node;
      [].forEach.call(inner.querySelectorAll('*'), function (e) {
        if (e.children.length) return;
        var r = e.getBoundingClientRect(); if (r.width > 2 && r.height > 2 && (e.textContent || '').trim()) res.text.push(rel(r));
      });
      var ph = node.querySelector('.fc-photo, img'); if (ph) res.text.push(rel(ph.getBoundingClientRect()));
    } catch (e) { console.warn('sparkle layout', e); }
    return res;
  }

  function toCanvas(src, width) {
    var k = width / src.width, c = document.createElement('canvas');
    c.width = Math.round(src.width * k); c.height = Math.round(src.height * k);
    var x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, c.width, c.height);
    return c;
  }
  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }

  // src: the finished card canvas; rects: layout(node). Resolves with a GIF Blob.
  function gif(src, rects, opts) {
    opts = opts || {};
    var width = opts.width || 720, frames = opts.frames || 18, delay = opts.delay || 9;
    var cv = toCanvas(src, width), w = cv.width, h = cv.height, px = cv.getContext('2d').getImageData(0, 0, w, h).data;
    return tick().then(function () {
      var pal = buildPalette(px, w * h, 249);
      return tick().then(function () {
        var base = mapPixels(px, w, h, pal, 7);
        var palette = [[0, 0, 0]].concat(SPARK, pal);
        var sp = spots(rects || {}, w, h, opts.count || 26, opts.seed || 11);
        sp.forEach(function (s) { s.dark = lum(px, w, h, s.x * w, s.y * h) < 120; });
        var rmax = w * 0.03, list = [], prev = null;
        for (var f = 0; f < frames; f++) {
          var cur = new Uint8Array(base);
          sp.forEach(function (s) {
            var t = (f / frames * s.sp + s.ph) % 1, v = Math.sin(t * Math.PI * 2);
            if (v > 0) stamp(cur, w, h, s.x * w, s.y * h, rmax * s.sz * Math.pow(v, 1.3), s.dark);
          });
          if (!prev) list.push({ x: 0, y: 0, w: w, h: h, idx: cur, transparent: false });
          else {
            var x0 = w, y0 = h, x1 = -1, y1 = -1, i, x, y;
            for (y = 0; y < h; y++) for (x = 0; x < w; x++) { i = y * w + x; if (cur[i] !== prev[i]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
            if (x1 < 0) { x0 = 0; y0 = 0; x1 = 0; y1 = 0; }
            var fw = x1 - x0 + 1, fh = y1 - y0 + 1, sub = new Uint8Array(fw * fh);
            for (y = 0; y < fh; y++) for (x = 0; x < fw; x++) { i = (y + y0) * w + x + x0; sub[y * fw + x] = cur[i] === prev[i] ? 0 : cur[i]; }
            list.push({ x: x0, y: y0, w: fw, h: fh, idx: sub, transparent: true });
          }
          prev = cur;
        }
        return tick().then(function () { return new Blob([encodeGif(w, h, palette, list, delay)], { type: 'image/gif' }); });
      });
    });
  }

  // the card in the middle of a 1080×1920 picture (WhatsApp Status / stories), on a soft blur of itself
  function story(src) {
    var W = 1080, H = 1920, c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d'), sm = document.createElement('canvas'); sm.width = 40; sm.height = 60;
    var sx = sm.getContext('2d'); sx.drawImage(src, 0, 0, 40, 60);
    var d = sx.getImageData(0, 0, 40, 60).data, top = [0, 0, 0], bot = [0, 0, 0], i, j;
    for (i = 4; i < 36; i++) for (j = 0; j < 3; j++) { top[j] += d[i * 4 + j] / 32; bot[j] += d[(59 * 40 + i) * 4 + j] / 32; }
    var shade = function (c, k) { return 'rgb(' + c.map(function (v) { return Math.round(v * k); }).join(',') + ')'; };
    var gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, shade(top, 0.92)); gr.addColorStop(1, shade(bot, 0.8));
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    var cw = 960, ch = Math.round(src.height * cw / src.width); if (ch > 1720) { ch = 1720; cw = Math.round(src.width * ch / src.height); }
    var cx = (W - cw) / 2, cy = (H - ch) / 2;
    x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 40; x.shadowOffsetY = 12; x.fillStyle = '#fff'; x.fillRect(cx, cy, cw, ch); x.restore();
    x.drawImage(src, cx, cy, cw, ch);
    return new Promise(function (res, rej) {
      try { c.toBlob(function (b) { b ? res({ blob: b, canvas: c }) : rej(new Error('status picture failed')); }, 'image/jpeg', 0.9); }
      catch (e) { try { var d = c.toDataURL('image/jpeg', 0.9), bin = atob(d.split(',')[1]), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); res({ blob: new Blob([a], { type: 'image/jpeg' }), canvas: c }); } catch (e2) { rej(e2); } }
    });
  }

  global.FreeCardExtras = { gif: gif, story: story, layout: layout, _encodeGif: encodeGif };
})(window);
