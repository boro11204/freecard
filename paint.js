/* FreeCard painter: draws the card straight onto a canvas, without loading any picture through an
   <img> or a data:/blob: address. Some computers (filters, extensions, office policies) block those, and
   the usual snapshot method depends on them. Layout comes from a hidden full-size copy of the card;
   backgrounds, borders, gradients, ornaments and every word are drawn with the canvas itself, pictures are
   fetched as bytes and decoded with createImageBitmap. */
(function (global) {
  'use strict';
  var HEB = /[\u0590-\u05FF\uFB1D-\uFB4F]/, LTR = /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF]/;
  var BAD = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }
  function within(p, ms, fb) {
    return new Promise(function (res) {
      var done = false, t = setTimeout(function () { if (!done) { done = true; res(fb); } }, ms);
      Promise.resolve(p).then(function (v) { if (!done) { done = true; clearTimeout(t); res(v); } },
        function (e) { if (!done) { done = true; clearTimeout(t); console.warn('FreeCard paint: step failed', e); res(fb); } });
    });
  }

  /* ---------- pictures as bytes (no <img>, no data:/blob: image loads) ---------- */
  var bmp = {};
  function dataUrlBlob(u) {
    var i = u.indexOf(','), head = u.slice(5, i), body = u.slice(i + 1), type = head.split(';')[0] || 'application/octet-stream';
    if (/;base64/i.test(head)) {
      var bin = atob(body.replace(/\s/g, '')), a = new Uint8Array(bin.length);
      for (var k = 0; k < bin.length; k++) a[k] = bin.charCodeAt(k);
      return new Blob([a], { type: type });
    }
    return new Blob([decodeURIComponent(body)], { type: type });
  }
  function decode(blob) {
    if (global.createImageBitmap) return createImageBitmap(blob);
    return Promise.reject(new Error('createImageBitmap missing'));
  }
  function bitmap(url, ms) {
    if (!url) return Promise.resolve(null);
    if (!bmp[url]) {
      bmp[url] = (/^data:/i.test(url) ? Promise.resolve().then(function () { return dataUrlBlob(url); })
        : fetch(url, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error('picture ' + r.status); return r.blob(); }))
        .then(decode);
      bmp[url].catch(function () { delete bmp[url]; });
    }
    return within(bmp[url], ms || 6000, null);
  }

  /* ---------- small CSS readers ---------- */
  function splitTop(s, sep) {
    var out = [], depth = 0, cur = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (ch === '(') depth++; else if (ch === ')') depth--;
      if (depth === 0 && (sep ? ch === sep : /\s/.test(ch))) { if (cur.trim()) out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function rgba(c) {
    var m = /rgba?\(([^)]+)\)/.exec(c || '');
    if (!m) return c === 'transparent' ? [0, 0, 0, 0] : null;
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  }
  function css(c) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + c[3] + ')'; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t]; }
  function len(v, ref, z) { v = String(v).trim(); if (/%$/.test(v)) return num(v) / 100 * ref; return num(v) * z; }
  // "rgb(1, 2, 3) 10% 20px" -> {color, pos: [..]} ; colour first
  function stop(part) {
    var m = /^(rgba?\([^)]*\)|[a-z]+)\s*(.*)$/i.exec(part.trim());
    if (!m) return null;
    return { color: rgba(m[1]) || [0, 0, 0, 0], pos: m[2] ? m[2].trim().split(/\s+/) : [] };
  }
  function stopsAt(parts, lineLen, z) {
    var st = [];
    parts.forEach(function (p) {
      var s = stop(p); if (!s) return;
      if (!s.pos.length) st.push({ c: s.color, p: null });
      s.pos.forEach(function (q) { st.push({ c: s.color, p: len(q, lineLen, z) }); });
    });
    if (!st.length) return st;
    if (st[0].p == null) st[0].p = 0;
    if (st[st.length - 1].p == null) st[st.length - 1].p = lineLen;
    for (var i = 1; i < st.length; i++) {
      if (st[i].p == null) { var j = i; while (st[j].p == null) j++; var a = st[i - 1].p, b = st[j].p; for (var k = i; k < j; k++) st[k].p = a + (b - a) * (k - i + 1) / (j - i + 1); }
      if (st[i].p < st[i - 1].p) st[i].p = st[i - 1].p;
    }
    return st; // positions in px along the line
  }
  function colourAt(st, p) {
    if (p <= st[0].p) return st[0].c;
    for (var i = 1; i < st.length; i++) if (p <= st[i].p) { var a = st[i - 1], b = st[i]; return b.p === a.p ? b.c : mix(a.c, b.c, (p - a.p) / (b.p - a.p)); }
    return st[st.length - 1].c;
  }
  function addStops(g, st, L, repeating) {
    if (!repeating) {
      st.forEach(function (s) { g.addColorStop(Math.min(1, Math.max(0, s.p / L)), css(s.c)); });
      return;
    }
    var first = st[0].p, P = st[st.length - 1].p - first;
    if (!(P > 0.01)) { st.forEach(function (s) { g.addColorStop(0, css(s.c)); }); return; }
    var k0 = Math.floor((0 - first) / P) - 1, list = [];
    for (var k = k0; first + k * P <= L + P; k++) st.forEach(function (s) { list.push({ p: s.p + k * P, c: s.c }); });
    g.addColorStop(0, css(colourAt(list, 0)));
    list.forEach(function (s) { if (s.p > 0 && s.p < L) g.addColorStop(s.p / L, css(s.c)); });
    g.addColorStop(1, css(colourAt(list, L)));
  }
  function angleOf(a) {
    a = a.trim();
    var m = /^(-?[\d.]+)(deg|turn|rad|grad)$/.exec(a);
    if (m) { var v = parseFloat(m[1]); return m[2] === 'deg' ? v : m[2] === 'turn' ? v * 360 : m[2] === 'rad' ? v * 180 / Math.PI : v * 0.9; }
    if (/^to /.test(a)) {
      var t = /top/.test(a), b = /bottom/.test(a), l = /left/.test(a), r = /right/.test(a);
      if (t && r) return 45; if (b && r) return 135; if (b && l) return 225; if (t && l) return 315;
      return t ? 0 : r ? 90 : l ? 270 : 180;
    }
    return null;
  }
  function paintGradient(ctx, fn, args, x, y, w, h, z) {
    var parts = splitTop(args, ','), repeating = /^repeating-/.test(fn);
    if (/linear-gradient$/.test(fn)) {
      var ang = angleOf(parts[0]); if (ang == null) ang = 180; else parts = parts.slice(1);
      if (/^to /.test(String(parts[0] || '')) ) parts = parts.slice(1);
      var r = ang * Math.PI / 180, dx = Math.sin(r), dy = -Math.cos(r), L = Math.abs(w * dx) + Math.abs(h * dy);
      var cx = x + w / 2, cy = y + h / 2;
      var g = ctx.createLinearGradient(cx - dx * L / 2, cy - dy * L / 2, cx + dx * L / 2, cy + dy * L / 2);
      var st = stopsAt(parts, L, z); if (!st.length) return;
      addStops(g, st, L, repeating);
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    } else if (/radial-gradient$/.test(fn)) {
      var first = parts[0], shape = 'ellipse', size = 'farthest-corner', px = w / 2, py = h / 2, rx, ry;
      {
        if (!/^(rgba?\(|transparent)/.test(first)) {
          parts = parts.slice(1);
          var at = first.split(/\s+at\s+|^at\s+/), sz = (at[0] || '').trim(), pos = (at[1] || '').trim();
          if (/^at /.test(first)) { sz = ''; pos = first.replace(/^at\s+/, ''); }
          if (pos) {
            var pp = pos.split(/\s+/);
            var kx = { left: '0%', center: '50%', right: '100%' }, ky = { top: '0%', center: '50%', bottom: '100%' };
            px = len(kx[pp[0]] || pp[0], w, z); py = len(ky[pp[1] || 'center'] || pp[1], h, z);
          }
          var toks = sz ? sz.split(/\s+/) : [];
          if (toks.indexOf('circle') >= 0) shape = 'circle';
          toks = toks.filter(function (t) { return t !== 'circle' && t !== 'ellipse'; });
          if (toks.length === 2) { rx = len(toks[0], w, z); ry = len(toks[1], h, z); }
          else if (toks.length === 1 && /\d/.test(toks[0])) { rx = ry = len(toks[0], w, z); }
          else if (toks.length === 1) size = toks[0];
        }
      }
      if (rx == null) {
        var fx = Math.max(px, w - px), fy = Math.max(py, h - py), nx = Math.min(px, w - px), ny = Math.min(py, h - py);
        if (shape === 'circle') {
          rx = ry = size === 'closest-side' ? Math.min(nx, ny) : size === 'farthest-side' ? Math.max(fx, fy) : size === 'closest-corner' ? Math.hypot(nx, ny) : Math.hypot(fx, fy);
        } else if (size === 'closest-side') { rx = nx; ry = ny; }
        else if (size === 'farthest-side') { rx = fx; ry = fy; }
        else if (size === 'closest-corner') { rx = nx * Math.SQRT2; ry = ny * Math.SQRT2; }
        else { rx = fx * Math.SQRT2; ry = fy * Math.SQRT2; }
      }
      rx = Math.max(rx, 0.01); ry = Math.max(ry, 0.01);
      var st2 = stopsAt(parts, rx, z); if (!st2.length) return;
      ctx.save();
      ctx.translate(x + px, y + py); ctx.scale(1, ry / rx);
      var g2 = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      var Lr = repeating ? Math.hypot(w, h) / Math.min(1, ry / rx) : rx;
      if (repeating) { var g3 = ctx.createRadialGradient(0, 0, 0, 0, 0, Lr); addStops(g3, st2, Lr, true); g2 = g3; }
      else addStops(g2, st2, rx, false);
      ctx.fillStyle = g2; ctx.fillRect(-px, -py * rx / ry, w, h * rx / ry);
      ctx.restore();
    }
  }
  function bgSize(cs, i, w, h, iw, ih, z) {
    var v = (splitTop(cs.backgroundSize, ',')[i] || 'auto').trim();
    if (v === 'cover' || v === 'contain') { var k = (v === 'cover' ? Math.max : Math.min)(w / iw, h / ih); return [iw * k, ih * k]; }
    var p = v.split(/\s+/), a = p[0], b = p[1] || 'auto';
    var W = a === 'auto' ? null : len(a, w, z), H = b === 'auto' ? null : len(b, h, z);
    if (W == null && H == null) return [iw * z, ih * z];
    if (W == null) W = H * iw / ih; if (H == null) H = W * ih / iw;
    return [W, H];
  }
  function bgPos(cs, i, w, h, bw, bh, z) {
    var v = (splitTop(cs.backgroundPosition, ',')[i] || '0% 0%').trim().split(/\s+/);
    function one(t, free) { if (/%$/.test(t)) return num(t) / 100 * free; return num(t) * z; }
    return [one(v[0] || '0%', w - bw), one(v[1] || '50%', h - bh)];
  }

  /* ---------- shapes ---------- */
  function radii(cs, w, h, z) {
    var r = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map(function (n) {
      var v = String(cs['border' + n + 'Radius'] || '0').trim().split(/\s+/);
      return [len(v[0], w, z), len(v[1] || v[0], h, z)];
    });
    var f = 1;
    [[r[0][0] + r[1][0], w], [r[3][0] + r[2][0], w], [r[0][1] + r[3][1], h], [r[1][1] + r[2][1], h]].forEach(function (p) { if (p[0] > p[1] && p[0] > 0) f = Math.min(f, p[1] / p[0]); });
    return r.map(function (a) { return [a[0] * f, a[1] * f]; });
  }
  function rrect(p, x, y, w, h, R) {
    w = Math.max(0, w); h = Math.max(0, h);
    if (!R || R.every(function (a) { return a[0] <= 0 || a[1] <= 0; })) { p.rect(x, y, w, h); return p; }
    var tl = R[0], tr = R[1], br = R[2], bl = R[3];
    p.moveTo(x + tl[0], y);
    p.lineTo(x + w - tr[0], y);
    if (tr[0] > 0 && tr[1] > 0) p.ellipse(x + w - tr[0], y + tr[1], tr[0], tr[1], 0, -Math.PI / 2, 0); else p.lineTo(x + w, y);
    p.lineTo(x + w, y + h - br[1]);
    if (br[0] > 0 && br[1] > 0) p.ellipse(x + w - br[0], y + h - br[1], br[0], br[1], 0, 0, Math.PI / 2); else p.lineTo(x + w, y + h);
    p.lineTo(x + bl[0], y + h);
    if (bl[0] > 0 && bl[1] > 0) p.ellipse(x + bl[0], y + h - bl[1], bl[0], bl[1], 0, Math.PI / 2, Math.PI); else p.lineTo(x, y + h);
    p.lineTo(x, y + tl[1]);
    if (tl[0] > 0 && tl[1] > 0) p.ellipse(x + tl[0], y + tl[1], tl[0], tl[1], 0, Math.PI, Math.PI * 1.5); else p.lineTo(x, y);
    p.closePath();
    return p;
  }
  function shrink(R, t, r, b, l) {
    return [[R[0][0] - l, R[0][1] - t], [R[1][0] - r, R[1][1] - t], [R[2][0] - r, R[2][1] - b], [R[3][0] - l, R[3][1] - b]]
      .map(function (a) { return [Math.max(0, a[0]), Math.max(0, a[1])]; });
  }
  function ring(ctx, x, y, w, h, R, t, r, b, l, color) {
    var p = new Path2D();
    rrect(p, x, y, w, h, R);
    rrect(p, x + l, y + t, w - l - r, h - t - b, shrink(R, t, r, b, l));
    ctx.fillStyle = color; ctx.fill(p, 'evenodd');
  }
  function shadows(v) {
    if (!v || v === 'none') return [];
    return splitTop(v, ',').map(function (s) {
      var m = /(rgba?\([^)]*\))/.exec(s), col = m ? m[1] : 'rgba(0,0,0,.3)';
      var rest = s.replace(col, '').trim(), inset = /\binset\b/.test(rest);
      var n = rest.replace('inset', '').trim().split(/\s+/).filter(Boolean).map(num);
      return { color: col, x: n[0] || 0, y: n[1] || 0, blur: n[2] || 0, spread: n[3] || 0, inset: inset };
    });
  }

  /* ---------- svg ornaments ---------- */
  function svgPaint(ctx, svg, x, y, w, h) {
    var vb = (svg.getAttribute('viewBox') || ('0 0 ' + w + ' ' + h)).trim().split(/[\s,]+/).map(Number);
    var k = Math.min(w / vb[2], h / vb[3]);
    ctx.save();
    ctx.translate(x + (w - vb[2] * k) / 2, y + (h - vb[3] * k) / 2); ctx.scale(k, k); ctx.translate(-vb[0], -vb[1]);
    [].slice.call(svg.children).forEach(function (c) { svgNode(ctx, c); });
    ctx.restore();
  }
  function svgNode(ctx, el) {
    var cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
    ctx.save();
    ctx.globalAlpha *= num(cs.opacity === '' ? 1 : cs.opacity) || (cs.opacity === '0' ? 0 : 1);
    try { var t = el.transform && el.transform.baseVal && el.transform.baseVal.consolidate(); if (t) { var m = t.matrix; ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f); } } catch (e) {}
    var tag = el.tagName.toLowerCase(), p = null, A = function (n) { return num(el.getAttribute(n)); };
    if (tag === 'g') { [].slice.call(el.children).forEach(function (c) { svgNode(ctx, c); }); ctx.restore(); return; }
    if (tag === 'path') p = new Path2D(el.getAttribute('d') || '');
    else if (tag === 'rect') { p = new Path2D(); p.rect(A('x'), A('y'), A('width'), A('height')); }
    else if (tag === 'circle') { p = new Path2D(); p.arc(A('cx'), A('cy'), A('r'), 0, Math.PI * 2); }
    else if (tag === 'ellipse') { p = new Path2D(); p.ellipse(A('cx'), A('cy'), A('rx'), A('ry'), 0, 0, Math.PI * 2); }
    else if (tag === 'line') { p = new Path2D(); p.moveTo(A('x1'), A('y1')); p.lineTo(A('x2'), A('y2')); }
    else if (tag === 'polyline' || tag === 'polygon') {
      var pts = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number); p = new Path2D();
      for (var i = 0; i + 1 < pts.length; i += 2) i ? p.lineTo(pts[i], pts[i + 1]) : p.moveTo(pts[i], pts[i + 1]);
      if (tag === 'polygon') p.closePath();
    }
    if (p) {
      if (cs.fill && cs.fill !== 'none' && tag !== 'line' && tag !== 'polyline') {
        ctx.save(); ctx.globalAlpha *= num(cs.fillOpacity || 1); ctx.fillStyle = cs.fill; ctx.fill(p, cs.fillRule === 'evenodd' ? 'evenodd' : 'nonzero'); ctx.restore();
      }
      if (cs.stroke && cs.stroke !== 'none') {
        ctx.save(); ctx.globalAlpha *= num(cs.strokeOpacity || 1);
        ctx.strokeStyle = cs.stroke; ctx.lineWidth = num(cs.strokeWidth) || 1;
        ctx.lineCap = cs.strokeLinecap || 'butt'; ctx.lineJoin = cs.strokeLinejoin || 'miter';
        var d = cs.strokeDasharray && cs.strokeDasharray !== 'none' ? cs.strokeDasharray.split(/[\s,]+/).map(num) : [];
        if (ctx.setLineDash) ctx.setLineDash(d);
        ctx.stroke(p); ctx.restore();
      }
    }
    ctx.restore();
  }

  /* ---------- the copy we measure ---------- */
  var NOPS = 'fcx-nops';
  function ensureStyle() {
    if (document.getElementById('fcxPaintStyle')) return;
    var st = document.createElement('style'); st.id = 'fcxPaintStyle';
    st.textContent = '.' + NOPS + '::before,.' + NOPS + '::after{content:none!important;display:none!important}';
    document.head.appendChild(st);
  }
  function materialize(root) {
    // pseudo elements (frame inner line, rule diamond, arch inner line) become real elements so they can be measured
    var all = [root].concat([].slice.call(root.querySelectorAll('*')));
    all.forEach(function (e) {
      if (e instanceof SVGElement) return;
      ['::before', '::after'].forEach(function (ps) {
        var cs = getComputedStyle(e, ps), c = cs.content;
        if (!c || c === 'none' || c === 'normal' || cs.display === 'none') return;
        var sp = document.createElement('span'); sp.setAttribute('data-fcx', ps);
        for (var i = 0; i < cs.length; i++) {
          var p = cs[i]; if (p === 'content' || p.indexOf('--') === 0) continue;
          try { sp.style.setProperty(p, cs.getPropertyValue(p)); } catch (x) {}
        }
        var m = /^"([\s\S]*)"$/.exec(c); if (m && m[1]) sp.textContent = m[1].replace(/\\"/g, '"');
        if (ps === '::before') e.insertBefore(sp, e.firstChild); else e.appendChild(sp);
      });
    });
    all.forEach(function (e) { if (!(e instanceof SVGElement)) e.classList.add(NOPS); });
  }
  function copyOf(node, W) {
    ensureStyle();
    var wrap = document.createElement('div');
    wrap.className = node.parentElement ? node.parentElement.className : 'fc-wrap';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:fixed;left:-30000px;top:0;width:' + W + 'px;max-width:none;margin:0;padding:0;pointer-events:none;contain:layout;transform:none;transition:none;opacity:1;direction:ltr;';
    var copy = node.cloneNode(true);
    [].slice.call(copy.querySelectorAll('.fcx-ov')).forEach(function (x) { x.remove(); });
    [].slice.call(copy.querySelectorAll('img')).forEach(function (i) { i.setAttribute('loading', 'eager'); });
    copy.style.setProperty('box-shadow', 'none', 'important');
    copy.style.setProperty('border-radius', '0', 'important');
    copy.style.setProperty('margin', '0', 'important');
    copy.style.setProperty('animation', 'none', 'important');
    copy.style.setProperty('transition', 'none', 'important');
    wrap.appendChild(copy); document.body.appendChild(wrap);
    materialize(copy);
    return { node: copy, remove: function () { wrap.remove(); } };
  }

  /* ---------- text ---------- */
  function fontOf(cs, size) { return (cs.fontStyle === 'normal' ? '' : cs.fontStyle + ' ') + cs.fontWeight + ' ' + size + 'px ' + cs.fontFamily; }
  function textShadow(ctx, v, z) {
    var s = shadows(v)[0];
    if (!s) return;
    ctx.shadowColor = s.color; ctx.shadowOffsetX = s.x * z; ctx.shadowOffsetY = s.y * z; ctx.shadowBlur = s.blur * z;
  }
  var HAS_LS = (function () { try { var c = document.createElement('canvas').getContext('2d'); return 'letterSpacing' in c; } catch (e) { return false; } })();
  function drawWord(ctx, str, r, base, cs, rtlHint) {
    var rtl = HEB.test(str) ? true : LTR.test(str) ? false : rtlHint;
    try { ctx.direction = rtl ? 'rtl' : 'ltr'; } catch (e) {}
    ctx.textAlign = rtl ? 'right' : 'left';
    var m = ctx.measureText(str), asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
    var top = r.top - base.top, by = (asc > 0 && desc >= 0) ? top + asc * (r.height / (asc + desc)) : top + r.height * 0.78;
    var x = (rtl ? r.right : r.left) - base.left;
    var k = m.width ? r.width / m.width : 1;
    if (k > 0.5 && k < 1.6 && Math.abs(k - 1) > 0.04) {
      ctx.save(); ctx.translate(x, 0); ctx.scale(k, 1); ctx.fillText(str, 0, by); ctx.restore();
    } else ctx.fillText(str, x, by);
  }
  function drawText(ctx, n, cs, z, base) {
    var data = n.data; if (!data || !data.trim()) return;
    var size = num(cs.fontSize) * z;
    ctx.font = fontOf(cs, size);
    ctx.fillStyle = cs.color;
    var ls = cs.letterSpacing === 'normal' ? 0 : num(cs.letterSpacing) * z;
    if (HAS_LS) ctx.letterSpacing = ls + 'px';
    ctx.textBaseline = 'alphabetic';
    if (cs.textShadow && cs.textShadow !== 'none') textShadow(ctx, cs.textShadow, z);
    var up = cs.textTransform === 'uppercase', low = cs.textTransform === 'lowercase', rtlHint = cs.direction === 'rtl';
    var re = /\S+/g, mm;
    while ((mm = re.exec(data))) {
      var rg = document.createRange(); rg.setStart(n, mm.index); rg.setEnd(n, mm.index + mm[0].length);
      var rects = [].slice.call(rg.getClientRects()).filter(function (q) { return q.width > 0.5; });
      if (!rects.length) continue;
      var word = mm[0].replace(BAD, '');
      if (up) word = word.toUpperCase(); else if (low) word = word.toLowerCase();
      if (rects.length === 1) { drawWord(ctx, word, rects[0], base, cs, rtlHint); continue; }
      // a word broken over lines: draw it letter by letter
      for (var i = 0; i < mm[0].length; i++) {
        var ch = mm[0][i]; if (/\s/.test(ch)) continue;
        var cr = document.createRange(); cr.setStart(n, mm.index + i); cr.setEnd(n, mm.index + i + 1);
        var q = cr.getBoundingClientRect(); if (q.width < 0.5) continue;
        drawWord(ctx, up ? ch.toUpperCase() : ch, q, base, cs, rtlHint);
      }
    }
    if (HAS_LS) ctx.letterSpacing = '0px';
    ctx.shadowColor = 'rgba(0,0,0,0)'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  }

  /* ---------- painting ---------- */
  function matrixOf(t) {
    if (!t || t === 'none') return null;
    var m = /matrix(3d)?\(([^)]+)\)/.exec(t); if (!m) return null;
    var v = m[2].split(',').map(parseFloat);
    return m[1] ? [v[0], v[1], v[4], v[5], v[12], v[13]] : v;
  }
  function paintEl(ctx, e, base, z, info, isRoot, opts) {
    if (e.nodeType !== 1) return;
    var cs = getComputedStyle(e);
    if (cs.display === 'none') return;
    var zz = ZOOMED_CS ? 1 : z * (num(cs.zoom) || 1);
    var r = e.getBoundingClientRect(), x = r.left - base.left, y = r.top - base.top, w = r.width, h = r.height;
    var tr = info.get(e);
    ctx.save();
    if (!isRoot) { var op = cs.opacity === '' ? 1 : num(cs.opacity); if (cs.opacity === '0') op = 0; ctx.globalAlpha *= op; }
    if (tr && tr.m) {
      var o = tr.o.split(/\s+/).map(num);
      ctx.translate(x + o[0] * zz, y + o[1] * zz);
      ctx.transform(tr.m[0], tr.m[1], tr.m[2], tr.m[3], tr.m[4] * zz, tr.m[5] * zz);
      ctx.translate(-(x + o[0] * zz), -(y + o[1] * zz));
    }
    var hidden = cs.visibility === 'hidden';
    var R = isRoot ? null : radii(cs, w, h, zz);
    var bw = ['Top', 'Right', 'Bottom', 'Left'].map(function (s) {
      var st = cs['border' + s + 'Style']; return st === 'none' || st === 'hidden' ? 0 : num(cs['border' + s + 'Width']) * zz;
    });
    if (!hidden) {
      // outer shadows (not on the card itself)
      if (!isRoot) shadows(cs.boxShadow).filter(function (s) { return !s.inset; }).reverse().forEach(function (s) {
        ctx.save();
        var off = 20000, p = new Path2D(); rrect(p, x - off, y, w, h, R);
        ctx.shadowColor = s.color; ctx.shadowBlur = s.blur * zz; ctx.shadowOffsetX = off + s.x * zz; ctx.shadowOffsetY = s.y * zz;
        ctx.fillStyle = '#000'; ctx.fill(p); ctx.restore();
      });
      // background
      var clip = new Path2D(); rrect(clip, x, y, w, h, R);
      ctx.save(); ctx.clip(clip);
      var bc = rgba(cs.backgroundColor);
      if (bc && bc[3] > 0) { ctx.fillStyle = cs.backgroundColor; ctx.fillRect(x, y, w, h); }
      var layers = cs.backgroundImage && cs.backgroundImage !== 'none' ? splitTop(cs.backgroundImage, ',') : [];
      for (var i = layers.length - 1; i >= 0; i--) {
        var L = layers[i], fm = /^([a-z-]+)\(([\s\S]*)\)$/.exec(L);
        if (!fm) continue;
        try {
          if (fm[1] === 'url') {
            var u = fm[2].trim().replace(/^["']|["']$/g, ''), b = info.bitmaps[u];
            if (b) {
              var iw = b.naturalWidth || b.width, ih = b.naturalHeight || b.height, sz = bgSize(cs, i, w, h, iw, ih, zz), ps = bgPos(cs, i, w, h, sz[0], sz[1], zz);
              ctx.drawImage(b, x + ps[0], y + ps[1], sz[0], sz[1]);
            } else if (u) info.missing[u] = 1;
          } else paintGradient(ctx, fm[1], fm[2], x, y, w, h, zz);
        } catch (err) { console.warn('FreeCard paint: background skipped', err); }
      }
      ctx.restore();
      // border
      if (bw[0] || bw[1] || bw[2] || bw[3]) ring(ctx, x, y, w, h, R || [[0, 0], [0, 0], [0, 0], [0, 0]], bw[0], bw[1], bw[2], bw[3], cs.borderTopColor);
      // inset shadows (the stone arch's lines)
      var ins = shadows(cs.boxShadow).filter(function (s) { return s.inset && s.spread > 0; });
      if (ins.length) {
        var px = x + bw[3], py = y + bw[0], pw = w - bw[1] - bw[3], ph = h - bw[0] - bw[2], PR = shrink(R || [[0, 0], [0, 0], [0, 0], [0, 0]], bw[0], bw[1], bw[2], bw[3]);
        ins.reverse().forEach(function (s) { var sp = s.spread * zz; ring(ctx, px, py, pw, ph, PR, sp, sp, sp, sp, s.color); });
      }
      var tag = e.tagName.toLowerCase();
      if (tag === 'svg') { svgPaint(ctx, e, x, y, w, h); ctx.restore(); return; }
      if (tag === 'img') {
        var src = imgSrc(e), im = info.bitmaps[src];
        if (im) {
          var iw2 = im.naturalWidth || im.width, ih2 = im.naturalHeight || im.height, fit = cs.objectFit;
          var sx = 0, sy = 0, sw = iw2, sh = ih2, dx = x, dy = y, dw = w, dh = h;
          if (fit === 'cover') { var ir = iw2 / ih2, br = w / h; if (ir > br) { sw = ih2 * br; sx = (iw2 - sw) / 2; } else { sh = iw2 / br; sy = (ih2 - sh) / 2; } }
          else if (fit === 'contain') { var kk = Math.min(w / iw2, h / ih2); dw = iw2 * kk; dh = ih2 * kk; dx = x + (w - dw) / 2; dy = y + (h - dh) / 2; }
          ctx.drawImage(im, sx, sy, sw, sh, dx, dy, dw, dh);
        } else if (src) info.missing[src] = 1;
        ctx.restore(); return;
      }
    }
    if (!isRoot && cs.overflow !== 'visible' && cs.overflowX !== 'visible') {
      var cp = new Path2D(); rrect(cp, x + bw[3], y + bw[0], w - bw[1] - bw[3], h - bw[0] - bw[2], shrink(R, bw[0], bw[1], bw[2], bw[3])); ctx.clip(cp);
    }
    [].slice.call(e.childNodes).forEach(function (c) {
      if (c.nodeType === 3) { if (!hidden) drawText(ctx, c, cs, zz, base); }
      else if (c.nodeType === 1) paintEl(ctx, c, base, zz, info, false, opts);
    });
    ctx.restore();
  }

  function imgSrc(e) { return e.getAttribute('data-fc-src') || e.getAttribute('src') || ''; }
  function collect(root, noPictures) {
    var urls = {}, fonts = {}, info = new Map();
    var all = [root].concat([].slice.call(root.querySelectorAll('*')));
    all.forEach(function (e) {
      var cs = getComputedStyle(e);
      if (!(e instanceof SVGElement) || e.tagName.toLowerCase() === 'svg') {
        var m = matrixOf(cs.transform);
        if (m) info.set(e, { m: m, o: cs.transformOrigin });
      }
      if (cs.display === 'none') return;
      if (!noPictures) {
        (cs.backgroundImage.match(/url\(\s*["']?[^"')]+["']?\s*\)/g) || []).forEach(function (u) { urls[u.replace(/^url\(\s*["']?|["']?\s*\)$/g, '')] = 1; });
        if (e.tagName === 'IMG' && imgSrc(e)) urls[imgSrc(e)] = 1;
      }
      [].slice.call(e.childNodes).forEach(function (c) {
        if (c.nodeType === 3 && c.data.trim()) { var f = fontOf(cs, 40); fonts[f] = (fonts[f] || '') + c.data; }
      });
    });
    // measure without transforms; the transforms are applied while drawing
    all.forEach(function (e) { if (!(e instanceof SVGElement) || e.tagName.toLowerCase() === 'svg') e.style.setProperty('transform', 'none', 'important'); });
    return { urls: Object.keys(urls), fonts: fonts, info: info };
  }

  // does getComputedStyle already include CSS zoom (Firefox) or not (Chrome, Safari)?
  var ZOOMED_CS = null;
  function zoomedCs() {
    if (ZOOMED_CS !== null) return ZOOMED_CS;
    try {
      var d = document.createElement('div'); d.style.cssText = 'position:absolute;left:-9999px;top:0;zoom:2;font-size:10px;width:10px';
      document.body.appendChild(d); var cs = getComputedStyle(d);
      ZOOMED_CS = !cs.zoom || Math.abs(parseFloat(cs.fontSize) - 20) < 1; d.remove();
    } catch (e) { ZOOMED_CS = false; }
    return ZOOMED_CS;
  }
  // node: the card on the page. returns Promise<{canvas, missing}>
  function paint(node, opts) {
    opts = opts || {};
    zoomedCs();
    var W = Math.round(opts.width || 1080), tmp = copyOf(node, W), card = tmp.node, info;
    return Promise.resolve().then(function () {
      var c = collect(card, opts.noPictures);
      info = c.info; info.bitmaps = {}; info.missing = {};
      var fontJobs = document.fonts && document.fonts.load ? Object.keys(c.fonts).map(function (f) {
        return within(document.fonts.load(f, c.fonts[f].replace(/\s+/g, ' ').slice(0, 400)), 3000, null);
      }) : [];
      var picJobs = c.urls.map(function (u) {
        var abs = u; try { abs = /^data:/i.test(u) ? u : new URL(u, location.href).href; } catch (e) {}
        return bitmap(abs, opts.picMs || 6000).then(function (b) { if (b) info.bitmaps[u] = b; });
      });
      return Promise.all(fontJobs.concat(picJobs));
    }).then(function () {
      return new Promise(function (r) { requestAnimationFrame(function () { setTimeout(r, 0); }); });
    }).then(function () {
      var base = card.getBoundingClientRect(), H = Math.round(base.height * W / base.width);
      var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      var ctx = cv.getContext('2d'), s = W / base.width;
      var bg = getComputedStyle(card).backgroundColor;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
      if (bg && rgba(bg) && rgba(bg)[3] > 0) { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); }
      ctx.save(); ctx.scale(s, s);
      paintEl(ctx, card, base, 1, info, true, opts);
      ctx.restore();
      tmp.remove();
      var missing = Object.keys(info.missing).length;
      if (missing) console.warn('FreeCard paint: ' + missing + ' picture(s) could not be loaded');
      return { canvas: cv, missing: missing };
    }, function (e) { tmp.remove(); throw e; });
  }

  // can this browser show a picture made in the page (data: address, SVG with HTML inside)?
  var probeP = null;
  function probe() {
    if (probeP) return probeP;
    probeP = new Promise(function (res) {
      var done = false, t = setTimeout(function () { fin(false, 'timeout'); }, 1500);
      function fin(ok, why) { if (done) return; done = true; clearTimeout(t); global.__fcProbe = ok ? 'ok' : 'blocked:' + why; res(ok); }
      try {
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><foreignObject width="100%" height="100%">' +
          '<div xmlns="http://www.w3.org/1999/xhtml" style="width:4px;height:4px;background:#f00"></div></foreignObject></svg>';
        var i = new Image();
        i.onload = function () {
          try {
            var c = document.createElement('canvas'); c.width = 4; c.height = 4; var x = c.getContext('2d');
            x.drawImage(i, 0, 0); x.getImageData(0, 0, 1, 1); fin(true);
          } catch (e) { fin(false, 'draw'); }
        };
        i.onerror = function () { fin(false, 'error'); };
        i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      } catch (e) { fin(false, 'throw'); }
    });
    return probeP;
  }


  // Where even the site's own pictures cannot show (the preview's design art stays blank), the preview
  // gets a drawn copy laid over it, so what you see is what you will download.
  function watchPreview(mount) {
    if (!mount || !global.createImageBitmap || !global.MutationObserver) return;
    var done = false, t = setTimeout(function () { fin(false); }, 6000), test = new Image();
    function fin(ok) {
      if (done) return; done = true; clearTimeout(t); global.__fcSiteImages = ok ? 'ok' : 'blocked';
      if (!ok) { start(); return; }
      // pictures made in the page (the photo, your own background) are blocked on some computers even when the
      // site's own pictures load: there the preview gets the drawn copy too
      within(probe(), 2500, false).then(function (fine) { if (!fine) { global.__fcSiteImages = 'data-blocked'; start(); } });
    }
    test.onload = function () { fin(test.naturalWidth > 0); }; test.onerror = function () { fin(false); };
    test.src = 'img/tallis.webp';
    function start() {
      var pending = null, busy = false, again = false;
      if (getComputedStyle(mount).position === 'static') mount.style.position = 'relative';
      var mo = new MutationObserver(function (muts) {
        var ours = muts.every(function (m) { return [].slice.call(m.addedNodes).concat([].slice.call(m.removedNodes), [m.target]).every(function (n) { return n.classList && n.classList.contains('fcx-ov'); }); });
        if (!ours) sched();
      });
      mo.observe(mount, { childList: true, subtree: true, characterData: true, attributes: true });
      global.addEventListener('resize', sched);
      sched();
      function sched() { clearTimeout(pending); pending = setTimeout(draw, 180); }
      function draw() {
        if (busy) { again = true; return; }
        var card = mount.querySelector('.fc-card'); if (!card || !card.offsetWidth) return;
        busy = true;
        var dpr = Math.min(2, global.devicePixelRatio || 1);
        paint(card, { width: Math.round(card.offsetWidth * dpr) }).then(function (r) {
          var old = mount.querySelector('canvas.fcx-ov'), cv = r.canvas;
          cv.className = 'fcx-ov'; cv.setAttribute('aria-hidden', 'true');
          cv.style.cssText = 'position:absolute;left:' + card.offsetLeft + 'px;top:' + card.offsetTop + 'px;width:' + card.offsetWidth + 'px;height:' + card.offsetHeight +
            'px;z-index:3;pointer-events:none;border-radius:' + getComputedStyle(card).borderRadius;
          if (old) old.replaceWith(cv); else mount.appendChild(cv);
        }).catch(function (e) { console.warn('FreeCard preview', e); }).then(function () { busy = false; if (again) { again = false; sched(); } });
      }
    }
  }

  global.FreeCardPaint = { paint: paint, probe: probe, bitmap: bitmap, watchPreview: watchPreview };
})(window);
