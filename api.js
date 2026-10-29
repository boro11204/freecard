/* FreeCard saved cards: talks to the FreeCard server and remembers the host's cards on this phone. */
(function (global) {
  'use strict';
  var LS = 'fc_mine_v1';
  function load() { try { return JSON.parse(localStorage.getItem(LS) || '{}') || {}; } catch (e) { return {}; } }
  function mine() { return load(); }
  function remember(id, k, title) {
    try { var m = load(); m[id] = { k: k, title: title || (m[id] && m[id].title) || '', at: Date.now() }; localStorage.setItem(LS, JSON.stringify(m)); } catch (e) {}
  }
  function forget(id) { try { var m = load(); delete m[id]; localStorage.setItem(LS, JSON.stringify(m)); } catch (e) {} }
  function rid(n) {
    var a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789', b = new Uint8Array(n), s = '';
    (global.crypto || global.msCrypto).getRandomValues(b);
    for (var i = 0; i < n; i++) s += a[b[i] % a.length];
    return s;
  }
  function keyFor(name) {
    try { var v = localStorage.getItem(name); if (!v) { v = rid(16); localStorage.setItem(name, v); } return v; } catch (e) { return rid(16); }
  }
  function req(method, path, body, raw) {
    var o = { method: method, headers: {} };
    if (body != null) {
      if (raw) { o.body = body; o.headers['content-type'] = 'image/jpeg'; }
      else { o.body = JSON.stringify(body); o.headers['content-type'] = 'application/json'; }
    }
    return fetch(path, o).then(function (r) {
      var ct = r.headers.get('content-type') || '';
      if (ct.indexOf('json') < 0) throw new Error(r.status === 404 ? 'not-found' : 'Server error ' + r.status);
      return r.json().then(function (j) {
        if (!r.ok || j.ok === false) { var e = new Error(j.error || ('Error ' + r.status)); e.status = r.status; throw e; }
        return j;
      });
    });
  }
  function origin() { return location.origin; }
  function shortUrl(id, to) { return origin() + '/c/' + id + (to ? '?to=' + encodeURIComponent(to) : ''); }
  function hostUrl(id, k) { return origin() + '/h/' + id + '?k=' + k; }
  function editUrl(id, k) { return origin() + '/make.html?edit=' + id + '&k=' + k; }
  function q(k) { return '?k=' + encodeURIComponent(k); }

  // a 1200x630 picture for link previews (WhatsApp, iMessage): the card centred on a soft backdrop
  function previewJpeg(cardBlob) {
    return new Promise(function (res, rej) {
      var img = new Image(), u = URL.createObjectURL(cardBlob);
      img.onload = function () {
        var W = 1200, H = 630, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        var ctx = cv.getContext('2d');
        var s = W / img.width, bh = img.height * s;
        try { ctx.filter = 'blur(22px)'; } catch (e) {}
        ctx.drawImage(img, -40, (H - bh) / 2 - 40, W + 80, bh + 80);
        try { ctx.filter = 'none'; } catch (e) {}
        ctx.fillStyle = 'rgba(250,246,238,0.55)'; ctx.fillRect(0, 0, W, H);
        var ch = H - 44, cw = img.width * ch / img.height, x = (W - cw) / 2, y = 22;
        ctx.save(); ctx.shadowColor = 'rgba(20,25,45,.35)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 8;
        ctx.fillStyle = '#fff'; ctx.fillRect(x, y, cw, ch); ctx.restore();
        ctx.drawImage(img, x, y, cw, ch);
        URL.revokeObjectURL(u);
        cv.toBlob(function (b) { b ? res(b) : rej(new Error('encode')); }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(u); rej(new Error('img')); };
      img.src = u;
    });
  }

  global.FreeCardStore = {
    mine: mine, remember: remember, forget: forget, keyFor: keyFor, rid: rid, shortUrl: shortUrl, hostUrl: hostUrl, editUrl: editUrl,
    create: function (data, title, descr) { return req('POST', '/api/cards', { data: data, title: title, descr: descr }); },
    update: function (id, k, data, title, descr) { return req('PUT', '/api/cards/' + id + q(k), { data: data, title: title, descr: descr }); },
    get: function (id, k) { return req('GET', '/api/cards/' + id + (k ? q(k) : '')); },
    uploadPreview: function (id, k, blob) { return req('PUT', '/api/cards/' + id + '/og' + q(k), blob, true); },
    previewJpeg: previewJpeg,
    host: function (id, k) { return req('GET', '/api/cards/' + id + '/host' + q(k)); },
    setGuests: function (id, k, list) { return req('PUT', '/api/cards/' + id + '/guests' + q(k), { guests: list }); },
    hideWish: function (id, k, wid, hidden) { return req('POST', '/api/cards/' + id + '/wish/' + wid + q(k), { hidden: hidden }); },
    hideRsvp: function (id, k, rid2, hidden) { return req('POST', '/api/cards/' + id + '/rsvp-hide/' + rid2 + q(k), { hidden: hidden }); },
    remove: function (id, k) { return req('POST', '/api/cards/' + id + '/delete' + q(k), {}); },
    csvUrl: function (id, k) { return '/api/cards/' + id + '/rsvps.csv' + q(k); },
    rsvp: function (id, body) { return req('POST', '/api/cards/' + id + '/rsvp', body); },
    myRsvp: function (id, gk) { return req('GET', '/api/cards/' + id + '/rsvp?gk=' + encodeURIComponent(gk)); },
    wishes: function (id) { return req('GET', '/api/cards/' + id + '/wishes'); },
    wish: function (id, name, msg) { return req('POST', '/api/cards/' + id + '/wishes', { name: name, msg: msg }); },
    opened: function (id, to) {
      var body = JSON.stringify({ to: to || '', vk: keyFor('fc_vk') });
      try { if (navigator.sendBeacon && navigator.sendBeacon('/api/cards/' + id + '/open', new Blob([body], { type: 'application/json' }))) return; } catch (e) {}
      fetch('/api/cards/' + id + '/open', { method: 'POST', body: body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(function () {});
    },
    timeAgo: function (ts) {
      var s = Math.max(0, Date.now() / 1000 - ts);
      if (s < 60) return 'just now';
      if (s < 3600) return Math.floor(s / 60) + ' min ago';
      if (s < 86400) return Math.floor(s / 3600) + ' h ago';
      var d = new Date(ts * 1000);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };
})(window);
