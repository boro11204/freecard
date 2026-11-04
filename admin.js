/* FreeCard site owner page (admin.html, v20261103m): who opened an account and which designs they chose. Read-only.
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
  function render() {
    root.innerHTML = '';
    if (!A.signedIn()) {
      var p = h('div', 'acct-panel'); p.appendChild(h('p', 'acct-lead', 'Sign in with the site owner account to see accounts and designs.'));
      var b = h('button', 'btn gold', 'Sign in'); b.type = 'button'; b.addEventListener('click', function () { A.open('in', render); }); p.appendChild(b); root.appendChild(p); return;
    }
    root.appendChild(h('p', 'hint', 'Loading…'));
    A.request('GET', '/admin/stats').then(function (st) {
      return A.request('GET', '/admin/users').then(function (us) { draw(st, us.users); });
    }).catch(function (er) {
      root.innerHTML = '';
      var p = h('div', 'acct-panel');
      if (er.code === 'not_admin') { p.appendChild(h('p', 'acct-lead', 'This page is only for the site owner.')); p.appendChild(h('p', 'acct-priv', 'Signed in as ' + (A.email() || '') + '.')); }
      else p.appendChild(h('p', 'acct-err', A.errText(er)));
      root.appendChild(p);
    });
  }
  function draw(st, users) {
    root.innerHTML = '';
    var bar = h('div', 'acct-bar'); var who = h('div', 'acct-who', 'Site owner view · signed in as ' + (A.email() || '')); bar.appendChild(who);
    var rf = h('button', 'btn ghost sm', 'Refresh'); rf.type = 'button'; rf.addEventListener('click', render); bar.appendChild(rf); root.appendChild(bar);
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
