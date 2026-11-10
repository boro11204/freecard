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
      'Shares are listed apart, so sharing a card after making it is not counted twice. Only the design, the simcha, the site language and the date are kept: no names, card words, emails or addresses. Days are New York time.'));
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
