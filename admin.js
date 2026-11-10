/* FreeCard site owner page (admin.html, v20261103m; card counter v20261110e): how many cards were made, who opened an account and which designs they chose. Read-only.
   Only accounts whose email the server lists as admin can read this; everyone else gets "only for the site owner". */
(function (global) {
  'use strict';
  var A = global.FCAccount, F = global.FreeCard, root = document.getElementById('adminPage');
  if (!A || !root) return;
  root.setAttribute('data-noi18n', '');
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function when(ms) { if (!ms) return '—'; try { return new Date(ms).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } }
  function dname(id) { var D = F && F.DESIGNS[id]; return D ? D.name : (id || '—'); }
  function tname(t) { var T = F && F.TYPES[t]; return T ? T.en : (t || ''); }
  function tile(id, cls) {
    var w = h('span', 'adm-tile ' + (cls || '')), D = F && F.DESIGNS[id];
    if (D && D.kind === 'img') { var im = document.createElement('img'); im.alt = ''; im.loading = 'lazy'; im.src = 'img/' + (D.thumb || 'p/' + (D.file || id)) + '.webp'; w.appendChild(im); }
    else if (D && F.renderCard) { var m = h('span', 'fc-wrap adm-mini'); w.appendChild(m); try { var c = F.sampleCard(D.types && D.types[0] || 'chasuna', id, 'en'); Object.keys(c).forEach(function (k) { if (!/^(t|d|w|f)$/.test(k)) c[k] = ''; }); F.renderCard(c, m, { thumb: true }); } catch (e) {} }
    if (D && D.vars && D.vars.bg) w.style.backgroundColor = D.vars.bg;
    return w;
  }
  // --- Cards made (anonymous counter, v20261110e) ---
  var COUNT_START = 'Nov 10, 2026';
  var ACT = { jpg: 'Picture (JPEG)', pdf: 'PDF', gif: 'Animated GIF', status: 'WhatsApp Status picture', tables: 'All table numbers', share: 'Shared (after making)' };
  var LANG = { en: 'English', he: 'Lashon Kodesh', yi: 'Yiddish' };
  function addCss() {
    if (document.getElementById('admCountCss')) return;
    var s = document.createElement('style'); s.id = 'admCountCss';
    s.textContent = '.adm-big{font-size:1.35em;margin-top:28px}.adm-note{font-size:13px;color:#6b5a48;margin:6px 0 12px;line-height:1.45}' +
      '.adm-ct{width:100%;border-collapse:collapse;font-size:14px}.adm-ct td,.adm-ct th{padding:6px 6px;border-bottom:1px solid rgba(0,0,0,.08);text-align:left;vertical-align:middle}' +
      '.adm-ct th{font-size:12px;color:#7a6a58;font-weight:600}.adm-ct td.n,.adm-ct th.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}' +
      '.adm-ct .adm-tile{width:36px;height:54px;display:inline-block;border-radius:4px;overflow:hidden;vertical-align:middle}.adm-ct .adm-tile img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.adm-ct small{display:block;color:#8a7a68;font-size:11px;word-break:break-all}.adm-bar{display:inline-block;height:8px;border-radius:4px;background:#c9a45a;vertical-align:middle;min-width:2px}' +
      '.adm-days td{padding:3px 6px}.adm-zero{color:#b5a898}.adm-wrapt{overflow-x:auto;-webkit-overflow-scrolling:touch}';
    document.head.appendChild(s);
  }
  function fmtDay(d) { try { return new Date(d + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }); } catch (e) { return d; } }
  function table(heads, rows, cls) {
    var w = h('div', 'adm-wrapt'), t = h('table', 'adm-ct ' + (cls || '')), tr = h('tr', '');
    heads.forEach(function (x) { tr.appendChild(h('th', /^(#|Cards|7 days|Shares)$/.test(x) ? 'n' : '', x)); });
    t.appendChild(tr); rows.forEach(function (r) { t.appendChild(r); }); w.appendChild(t); return w;
  }
  function td(text, cls) { return h('td', cls || '', text); }
  function bar(n, max) { var b = h('span', 'adm-bar'); b.style.width = Math.max(2, Math.round(120 * n / (max || 1))) + 'px'; return b; }
  function drawCounts(ct) {
    addCss();
    root.appendChild(h('h2', 'adm-h adm-big', 'Cards made'));
    if (!ct || ct.error) { root.appendChild(h('p', 'acct-err', 'Could not load the card counter' + (ct && ct.error ? ': ' + A.errText(ct.error) : '') + '. Press Refresh to try again.')); return; }
    var nums = h('div', 'adm-nums');
    [['All time', ct.all_time], ['Today', ct.today_n], ['Last 7 days', ct.d7], ['Last 30 days', ct.d30]].forEach(function (x) {
      var c = h('div', 'adm-num'); c.appendChild(h('b', '', String(x[1] || 0))); c.appendChild(h('span', '', x[0])); nums.appendChild(c);
    });
    root.appendChild(nums);
    root.appendChild(h('p', 'adm-note', 'Counting started ' + COUNT_START + ', when this counter went live, so cards made before that are not counted. ' +
      'A card counts each time someone on the Make page finishes a file: a picture (JPEG), a PDF to print, an animated GIF, a WhatsApp Status picture, or all the table numbers. ' +
      'Shares are listed apart, so sharing a card after making it is not counted twice. The counter itself keeps only the design, the simcha, the site language and the date. Each card’s words are listed under Card details below. Days are New York time.'));
    root.appendChild(h('h2', 'adm-h', 'Top designs'));
    var top = ct.top_designs || [];
    if (!top.length) root.appendChild(h('p', 'hint', 'No cards counted yet.'));
    else {
      root.appendChild(table(['#', '', 'Design', 'Simcha', '7 days', 'Cards'], top.slice(0, 50).map(function (d, i) {
        var r = h('tr', ''); r.appendChild(td(String(i + 1), 'n'));
        var c = td(''); c.appendChild(tile(d.design, 'sm')); r.appendChild(c);
        var nm = td(''); nm.appendChild(h('b', '', dname(d.design))); nm.appendChild(h('small', '', d.design)); r.appendChild(nm);
        r.appendChild(td(tname(d.category) + (d.categories > 1 ? ' +' + (d.categories - 1) + ' more' : '')));
        r.appendChild(td(String(d.n7 || 0), 'n'));
        var nc = td('', 'n'); nc.appendChild(h('b', '', String(d.n))); r.appendChild(nc);
        return r;
      })));
      if (top.length > 50) root.appendChild(h('p', 'hint', 'Showing the top 50 of ' + top.length + ' designs.'));
    }
    var cats = ct.categories || [];
    if (cats.length) {
      root.appendChild(h('h2', 'adm-h', 'Cards by simcha'));
      root.appendChild(table(['Simcha', '', 'Cards'], cats.map(function (c) {
        var r = h('tr', ''); r.appendChild(td(tname(c.category))); var b = td(''); b.appendChild(bar(c.n, cats[0].n)); r.appendChild(b);
        r.appendChild(td(String(c.n), 'n')); return r;
      })));
    }
    var acts = (ct.actions || []).map(function (a) { return (ACT[a.action] || a.action) + ': ' + a.n; });
    if (acts.length) { root.appendChild(h('h2', 'adm-h', 'What was made')); root.appendChild(h('p', 'adm-sim', acts.join(' · ') + (ct.hd ? ' · made with HD art: ' + ct.hd : ''))); }
    var langs = (ct.langs || []).map(function (a) { return (LANG[a.lang] || a.lang) + ': ' + a.n; });
    if (langs.length) root.appendChild(h('p', 'adm-sim', 'Site language: ' + langs.join(' · ')));
    root.appendChild(h('h2', 'adm-h', 'Per day (last 30 days)'));
    var byDay = {}, dmax = 1; (ct.days || []).forEach(function (d) { byDay[d.day] = d; if (d.n > dmax) dmax = d.n; });
    var today = ct.today || new Date().toISOString().slice(0, 10), rows = [];
    for (var i = 0; i < 30; i++) {
      var dt = new Date(today + 'T12:00:00Z'); dt.setUTCDate(dt.getUTCDate() - i); var key = dt.toISOString().slice(0, 10);
      if (key < '2026-11-10') break; // nothing was counted before the counter went live
      var x = byDay[key] || { n: 0, shares: 0 }, r = h('tr', x.n ? '' : 'adm-zero');
      r.appendChild(td(fmtDay(key) + (i === 0 ? ' (today)' : '')));
      var b = td(''); if (x.n) b.appendChild(bar(x.n, dmax)); r.appendChild(b);
      r.appendChild(td(String(x.shares || 0), 'n')); r.appendChild(td(String(x.n), 'n')); rows.push(r);
    }
    root.appendChild(table(['Day', '', 'Shares', 'Cards'], rows, 'adm-days'));
  }
  // --- Card details (v20261110f): every card made on the Make page, newest first, with all its words and settings ---
  var WORD_LABELS = { h: 'Top line', i: 'Opening line', n1: 'Name 1', n2: 'Name 2', p1: 'Parents / family 1', p2: 'Parents / family 2', dt: 'Date', hd: 'Hebrew date', pa: 'Parsha', tl: 'Time label', tm: 'Time', sc: 'Second time', hl: 'Hall / place', ad: 'Address', ex: 'Extra lines', nt: 'Note', x: 'Wording (the card text with its {fields})' };
  var WORD_ORDER = ['h', 'i', 'n1', 'n2', 'p1', 'p2', 'dt', 'hd', 'pa', 'tl', 'tm', 'sc', 'hl', 'ad', 'ex', 'nt', 'x'];
  var SET_LABELS = { t: 'Simcha', d: 'Design', w: 'Card language', ws: 'Wording style', f: 'Lettering', nf: 'Names lettering', tf: 'Top line lettering', bf: 'Body lettering', tz: 'Top line size', bz: 'Body size', ns: 'Names size', ev: 'Evening (Hebrew date of the next day)', pk: 'Matching piece', tn: 'Table number', th: 'Table number style' };
  var CARD_LANG = { he: 'Lashon Kodesh', yi: 'Yiddish', en: 'English', short: 'Short' };
  var cq = { page: 1, q: '', t: '' };
  function nyWhen(ts) { try { return new Date(ts).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } }
  function addCardCss() {
    if (document.getElementById('admCardCss')) return;
    var s = document.createElement('style'); s.id = 'admCardCss';
    s.textContent = '.adm-cd-bar{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 12px}.adm-cd-bar input{flex:1 1 180px;min-width:0;padding:10px 12px;border:1px solid rgba(0,0,0,.18);border-radius:10px;font:inherit;font-size:16px}' +
      '.adm-cd-bar select{flex:0 1 160px;padding:10px;border:1px solid rgba(0,0,0,.18);border-radius:10px;font:inherit;font-size:16px;background:#fff}.adm-cd-list{display:flex;flex-direction:column;gap:8px}' +
      '.adm-cd{border:1px solid rgba(0,0,0,.1);border-radius:12px;background:#fff;overflow:hidden}.adm-cd>summary{display:flex;gap:10px;align-items:center;padding:8px 10px;cursor:pointer;list-style:none}.adm-cd>summary::-webkit-details-marker{display:none}' +
      '.adm-cd .adm-tile{flex:0 0 40px;width:40px;height:60px;border-radius:5px;overflow:hidden;display:block}.adm-cd .adm-tile img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.adm-cd-tx{flex:1;min-width:0}.adm-cd-tx b{display:block;font-size:15px;line-height:1.25;overflow-wrap:anywhere}.adm-cd-tx small{display:block;color:#7a6a58;font-size:12.5px;line-height:1.4;margin-top:2px}' +
      '.adm-cd-nm{display:block;font-size:13.5px;color:#3d3125;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.adm-cd-ch{flex:0 0 auto;color:#b29a7a;font-size:18px;transition:transform .15s}.adm-cd[open] .adm-cd-ch{transform:rotate(90deg)}' +
      '.adm-cd-in{padding:4px 12px 12px;border-top:1px solid rgba(0,0,0,.07)}.adm-cd-in h4{margin:12px 0 4px;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#8a7a68}' +
      '.adm-kv{display:grid;grid-template-columns:minmax(84px,32%) 1fr;gap:4px 10px;font-size:14px;margin:0}.adm-kv dt{color:#7a6a58;font-size:12.5px;padding-top:2px}.adm-kv dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;unicode-bidi:plaintext}' +
      '.adm-cd-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.adm-pg{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:12px 0}.adm-pg span{font-size:13px;color:#7a6a58;text-align:center;flex:1}' +
      '.adm-sw{display:inline-block;width:12px;height:12px;border-radius:3px;border:1px solid rgba(0,0,0,.2);vertical-align:-1px;margin-inline-end:4px}';
    document.head.appendChild(s);
  }
  function kv(dl, k, v) { var a = h('dt', '', k), b = h('dd', '', v); b.setAttribute('dir', 'auto'); dl.appendChild(a); dl.appendChild(b); }
  function fmtVal(k, v) {
    if (typeof v === 'boolean') return v ? 'yes' : 'no';
    if (k === 't') return tname(v) + ' (' + v + ')';
    if (k === 'd') return dname(v) + ' (' + v + ')';
    if (k === 'w') return CARD_LANG[v] || v;
    if (k === 'ev') return v === '1' ? 'yes' : 'no';
    if (/^(f|nf|tf|bf)$/.test(k) && F && F.FONTS && F.FONTS[v]) return (F.FONTS[v].name || F.FONTS[v].label || v) + ' (' + v + ')';
    return String(v);
  }
  function peRows(dl, pe) { // the per-line changes (state.pe): returns how many lines it listed
    var o = null, shown = 0; try { o = JSON.parse(pe); } catch (e) {}
    if (!o || typeof o !== 'object') { kv(dl, 'Line edits', String(pe)); return 1; }
    Object.keys(o).forEach(function (line) {
      var e = o[line], parts = [];
      if (e && typeof e === 'object') Object.keys(e).forEach(function (q) { if (e[q] === '' || e[q] == null) return; parts.push(q + ': ' + (typeof e[q] === 'object' ? JSON.stringify(e[q]) : e[q])); });
      else if (e !== '' && e != null) parts.push(String(e));
      if (parts.length) { kv(dl, 'Line ' + line, parts.join(' · ')); shown++; }
    });
    return shown;
  }
  function openInEditor(c) {
    var DK = 'fc_draft_v2', had = null; try { had = JSON.parse(localStorage.getItem(DK) || 'null'); } catch (e) {}
    if (had && had.state && !confirm('Open this card in the editor? It replaces the card you have open there on this device. The saved record here does not change.')) return;
    var dd = c.data || {};
    try {
      localStorage.setItem(DK, JSON.stringify({ v: 2, at: Date.now(), state: dd.s || {}, touched: dd.u || {}, popts: dd.po || {}, photo: null, bg: null, cloud: null }));
      sessionStorage.setItem('fc_admin_view', '1'); // a copy opened from here is not counted again as a new card (this tab only)
    } catch (e) { alert('Could not open it: ' + e.message); return; }
    location.href = 'make.html?from=admin';
  }
  function cardRow(c) {
    var dd = c.data || {}, s = dd.s || {};
    var det = h('details', 'adm-cd'), sm = h('summary', '');
    sm.appendChild(tile(c.design, 'sm'));
    var tx = h('div', 'adm-cd-tx');
    tx.appendChild(h('b', '', (c.design_name || dname(c.design)) + ' · ' + tname(c.category)));
    var names = [s.n1, s.n2].filter(function (x) { return x && String(x).trim(); }).join(' & ');
    if (names) { var nm = h('span', 'adm-cd-nm', names); nm.setAttribute('dir', 'auto'); tx.appendChild(nm); }
    tx.appendChild(h('small', '', nyWhen(c.ts) + ' · ' + (ACT[c.action] || c.action) + (c.hd ? ' · HD' : '') + ' · site in ' + (LANG[c.lang] || c.lang) + (c.has_photo ? ' · had a photo (not kept)' : '')));
    sm.appendChild(tx); sm.appendChild(h('span', 'adm-cd-ch', '›')); det.appendChild(sm);
    var inn = h('div', 'adm-cd-in'); var built = false;
    det.addEventListener('toggle', function () {
      if (!det.open || built) return; built = true;
      inn.appendChild(h('h4', '', 'Words on the card'));
      var dl = h('dl', 'adm-kv'), any = false;
      WORD_ORDER.forEach(function (k) { if (s[k] != null && String(s[k]).trim() !== '') { kv(dl, WORD_LABELS[k], String(s[k])); any = true; } });
      if (!any) kv(dl, '—', 'No words typed');
      inn.appendChild(dl);
      inn.appendChild(h('h4', '', 'Settings'));
      var dl2 = h('dl', 'adm-kv');
      Object.keys(s).forEach(function (k) {
        if (WORD_LABELS[k] || k === 'pe' || s[k] === '' || s[k] == null) return;
        var v = fmtVal(k, s[k]), dt = SET_LABELS[k] || k;
        if (/^#[0-9a-f]{3,8}$/i.test(String(s[k]))) { var a = h('dt', '', dt), b = h('dd', ''); var sw = h('span', 'adm-sw'); sw.style.background = s[k]; b.appendChild(sw); b.appendChild(document.createTextNode(String(s[k]))); dl2.appendChild(a); dl2.appendChild(b); }
        else kv(dl2, dt, v);
      });
      var po = dd.po || {}; kv(dl2, 'Print options', 'paper ' + (po.paper || 'card') + (po.gray ? ' · black & white' : '') + (po.hq ? ' · high quality' : '') + (po.marks ? ' · crop marks' : ''));
      var ed = Object.keys(dd.u || {}); if (ed.length) kv(dl2, 'Boxes they changed', ed.map(function (k) { return WORD_LABELS[k] ? WORD_LABELS[k].replace(/ \(.*/, '') : k; }).join(', '));
      inn.appendChild(dl2);
      if (s.pe) { var dl3 = h('dl', 'adm-kv'); if (peRows(dl3, s.pe)) { inn.appendChild(h('h4', '', 'Per-line changes (font, size, color, position)')); inn.appendChild(dl3); } }
      var acts = h('div', 'adm-cd-acts'), ob = h('button', 'btn gold sm', 'Open in editor'); ob.type = 'button';
      ob.addEventListener('click', function () { openInEditor(c); }); acts.appendChild(ob);
      inn.appendChild(acts);
      inn.appendChild(h('p', 'adm-note', 'Opens a copy in the editor on this device. Nothing changes for the person who made it.'));
    });
    det.appendChild(inn);
    return det;
  }
  function loadCards(box) {
    box.innerHTML = ''; box.appendChild(h('p', 'hint', 'Loading card details…'));
    var qs = '?page=' + cq.page + (cq.q ? '&q=' + encodeURIComponent(cq.q) : '') + (cq.t ? '&t=' + encodeURIComponent(cq.t) : '');
    A.request('GET', '/admin/cards' + qs).then(function (r) { drawCards(box, r); }, function (er) {
      box.innerHTML = ''; box.appendChild(h('p', 'acct-err', 'Could not load the card details: ' + A.errText(er) + '.'));
    });
  }
  function drawCards(box, r) {
    box.innerHTML = '';
    var bar = h('form', 'adm-cd-bar'); bar.setAttribute('role', 'search');
    var inp = document.createElement('input'); inp.type = 'search'; inp.placeholder = 'Search the words: names, hall, date…'; inp.value = cq.q; inp.setAttribute('dir', 'auto'); inp.setAttribute('aria-label', 'Search the card words');
    var sel = document.createElement('select'); sel.setAttribute('aria-label', 'Simcha');
    var o0 = document.createElement('option'); o0.value = ''; o0.textContent = 'All simchas'; sel.appendChild(o0);
    var seen = {};
    (r.categories || []).forEach(function (c) { seen[c.category] = 1; var o = document.createElement('option'); o.value = c.category; o.textContent = tname(c.category) + ' (' + c.n + ')'; sel.appendChild(o); });
    if (cq.t && !seen[cq.t]) { var ox = document.createElement('option'); ox.value = cq.t; ox.textContent = tname(cq.t); sel.appendChild(ox); }
    sel.value = cq.t;
    var go = h('button', 'btn ghost sm', 'Search'); go.type = 'submit';
    bar.appendChild(inp); bar.appendChild(sel); bar.appendChild(go);
    bar.addEventListener('submit', function (e) { e.preventDefault(); cq.q = inp.value.trim(); cq.t = sel.value; cq.page = 1; loadCards(box); });
    sel.addEventListener('change', function () { cq.q = inp.value.trim(); cq.t = sel.value; cq.page = 1; loadCards(box); });
    box.appendChild(bar);
    var cards = r.cards || [], pages = Math.max(1, Math.ceil((r.total || 0) / (r.per_page || 50)));
    var lead = (r.total || 0) + ' card' + (r.total === 1 ? '' : 's') + (cq.q || cq.t ? ' found' : ' saved');
    box.appendChild(h('p', 'adm-sim', lead + (pages > 1 ? ' · page ' + cq.page + ' of ' + pages : '')));
    if (!cards.length) box.appendChild(h('p', 'hint', cq.q || cq.t ? 'No cards match.' : 'No cards made yet.'));
    var list = h('div', 'adm-cd-list'); cards.forEach(function (c) { list.appendChild(cardRow(c)); }); box.appendChild(list);
    if (pages > 1) {
      var pg = h('div', 'adm-pg'), pv = h('button', 'btn ghost sm', '‹ Newer'), nx = h('button', 'btn ghost sm', 'Older ›');
      pv.type = nx.type = 'button'; pv.disabled = cq.page <= 1; nx.disabled = cq.page >= pages;
      pv.addEventListener('click', function () { cq.page--; loadCards(box); box.scrollIntoView(); });
      nx.addEventListener('click', function () { cq.page++; loadCards(box); box.scrollIntoView(); });
      pg.appendChild(pv); pg.appendChild(h('span', '', 'Page ' + cq.page + ' of ' + pages)); pg.appendChild(nx); box.appendChild(pg);
    }
  }
  function drawCardDetails() {
    addCardCss();
    root.appendChild(h('h2', 'adm-h adm-big', 'Card details'));
    root.appendChild(h('p', 'adm-note', 'Every card made on the Make page since Nov 10, 2026, newest first: the words exactly as typed and every setting. ' +
      'Photos people add are never kept (only a note that there was one), and no emails, IP addresses or device ids. Kept for 365 days. Times are New York time. Tap a card to see it all.'));
    var box = h('div', 'adm-cd-box'); root.appendChild(box); loadCards(box);
  }
  function render() {
    root.innerHTML = '';
    if (!A.signedIn()) {
      var p = h('div', 'acct-panel'); p.appendChild(h('p', 'acct-lead', 'Sign in with the site owner account to see accounts and designs.'));
      var b = h('button', 'btn gold', 'Sign in'); b.type = 'button'; b.addEventListener('click', function () { A.open('in', render); }); p.appendChild(b); root.appendChild(p); return;
    }
    root.appendChild(h('p', 'hint', 'Loading…'));
    A.request('GET', '/admin/stats').then(function (st) {
      return A.request('GET', '/admin/users').then(function (us) {
        // the anonymous card counter is its own request, so the accounts view still shows if it fails
        return A.request('GET', '/admin/counts').catch(function (e) { return { error: e }; }).then(function (ct) { draw(st, us.users, ct); });
      });
    }).catch(function (er) {
      root.innerHTML = '';
      var p = h('div', 'acct-panel');
      if (er.code === 'not_admin') { p.appendChild(h('p', 'acct-lead', 'This page is only for the site owner.')); p.appendChild(h('p', 'acct-priv', 'Signed in as ' + (A.email() || '') + '.')); }
      else p.appendChild(h('p', 'acct-err', A.errText(er)));
      root.appendChild(p);
    });
  }
  function draw(st, users, ct) {
    root.innerHTML = '';
    var bar = h('div', 'acct-bar'); var who = h('div', 'acct-who', 'Site owner view · signed in as ' + (A.email() || '')); bar.appendChild(who);
    var rf = h('button', 'btn ghost sm', 'Refresh'); rf.type = 'button'; rf.addEventListener('click', render); bar.appendChild(rf); root.appendChild(bar);
    drawCounts(ct);
    drawCardDetails();
    root.appendChild(h('h2', 'adm-h adm-big', 'Accounts'));
    var nums = h('div', 'adm-nums');
    [['Accounts', st.accounts], ['New accounts (7 days)', st.accounts_7d], ['Saved cards', st.cards], ['Cards saved (7 days)', st.cards_saved_7d]].forEach(function (x) {
      var c = h('div', 'adm-num'); c.appendChild(h('b', '', String(x[1]))); c.appendChild(h('span', '', x[0])); nums.appendChild(c);
    });
    root.appendChild(nums);
    root.appendChild(h('h2', 'adm-h', 'Most chosen designs'));
    var top = h('div', 'adm-top');
    if (!st.top_designs.length) top.appendChild(h('p', 'hint', 'No saved cards yet.'));
    st.top_designs.forEach(function (d, i) {
      var r = h('div', 'adm-trow'); r.appendChild(h('span', 'adm-rank', String(i + 1))); r.appendChild(tile(d.design_id));
      var t = h('div', 'adm-tx'); t.appendChild(h('b', '', dname(d.design_id))); t.appendChild(h('small', '', d.design_id + ' · ' + d.n + ' card' + (d.n === 1 ? '' : 's') + ' · ' + d.users + ' account' + (d.users === 1 ? '' : 's')));
      r.appendChild(t); top.appendChild(r);
    });
    root.appendChild(top);
    if (st.simchas && st.simchas.length) { root.appendChild(h('h2', 'adm-h', 'Saved cards by simcha')); root.appendChild(h('p', 'adm-sim', st.simchas.map(function (s) { return tname(s.type) + ': ' + s.n; }).join(' · '))); }
    root.appendChild(h('h2', 'adm-h', 'Accounts (' + users.length + ')'));
    var list = h('div', 'adm-users');
    users.forEach(function (u) {
      var d = h('details', 'adm-user'); var s = h('summary', '');
      s.appendChild(h('b', 'adm-em', u.email)); s.appendChild(h('span', 'adm-c', u.cards + ' card' + (u.cards === 1 ? '' : 's')));
      s.appendChild(h('small', 'adm-dt', 'Signed up ' + when(u.created_at) + ' · last sign-in ' + when(u.last_login)));
      d.appendChild(s);
      var cl = h('div', 'adm-cards');
      if (!u.designs.length) cl.appendChild(h('p', 'hint', 'No saved cards.'));
      u.designs.forEach(function (c) { var r = h('div', 'adm-card'); r.appendChild(tile(c.design_id, 'sm')); var t = h('div', 'adm-tx'); t.appendChild(h('b', '', dname(c.design_id))); t.appendChild(h('small', '', [tname(c.type), c.design_id, 'saved ' + when(c.updated_at)].filter(Boolean).join(' · '))); r.appendChild(t); cl.appendChild(r); });
      d.appendChild(cl); list.appendChild(d);
    });
    root.appendChild(list);
    root.appendChild(h('p', 'acct-priv', 'Read-only. Passwords and recovery codes are never shown (they are stored scrambled). Card words are not shown here.'));
  }
  render(); A.onChange(function () { if (!document.querySelector('.acct-ov')) render(); });
})(window);
