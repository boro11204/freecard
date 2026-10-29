(function () {
  'use strict';
  var F = window.FreeCard, S = window.FreeCardStore;
  function $(id) { return document.getElementById(id); }
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2400); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) { e.textContent = txt; e.setAttribute('dir', 'auto'); } return e; }
  var qs = new URLSearchParams(location.search);
  var m = location.pathname.match(/\/h\/([a-z0-9]+)/);
  var id = m ? m[1] : (qs.get('c') || ''), k = qs.get('k') || '';
  if (!k && id && S.mine()[id]) k = S.mine()[id].k;
  var data = null, filter = 'all', card = null;

  function copyText(v, done) {
    function fallback() { var t = document.createElement('textarea'); t.value = v; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); toast(done); } catch (e) { toast('Select the link to copy it'); } t.remove(); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(function () { toast(done); }, fallback);
    else fallback();
  }
  function showMine() {
    var mine = S.mine(), ids = Object.keys(mine).filter(function (x) { return x !== id; });
    if (!ids.length) return;
    $('mineBox').hidden = false; var ul = $('mineList'); ul.innerHTML = '';
    ids.sort(function (a, b) { return (mine[b].at || 0) - (mine[a].at || 0); }).forEach(function (x) {
      var li = el('li'); var a = el('a', '', mine[x].title || x); a.href = S.hostUrl(x, mine[x].k); li.appendChild(a); ul.appendChild(li);
    });
  }
  function fail(e) {
    $('hLoading').hidden = true; $('hView').hidden = true; $('hErr').hidden = false;
    if (e && (e.status === 404 || e.message === 'not-found')) { $('hErrH').textContent = 'This card was not found'; $('hErrP').textContent = 'It may have been deleted.'; }
    showMine();
  }
  if (!id || !k) { fail(); return; }

  function people(r) { return r.coming ? (r.total || 1) : 0; }
  function render() {
    var d = data; card = F.expand(d.data);
    S.remember(id, k, d.title || F.titleOf(card));
    $('hLoading').hidden = true; $('hErr').hidden = true; $('hView').hidden = false;
    var title = d.title || F.titleOf(card);
    $('hTitle').textContent = title; document.title = 'Host page · ' + title;
    var when = [card.dt ? F.enDate(card.dt) : '', card.hl || ''].filter(Boolean).join(' · ');
    $('hSub').textContent = when;
    var link = S.shortUrl(id);
    $('hLink').value = link; $('hOpen').href = link; $('hEdit').href = S.editUrl(id, k);
    $('hWa').href = 'https://wa.me/?text=' + encodeURIComponent("You're invited! " + F.titleOf(card) + '\n' + link);
    $('hWaSelf').href = 'https://wa.me/?text=' + encodeURIComponent('My FreeCard host link for ' + title + ' (private):\n' + S.hostUrl(id, k));
    $('hCsv').href = S.csvUrl(id, k);

    var shown = d.rsvps.filter(function (r) { return !r.hidden; }), removed = d.rsvps.filter(function (r) { return r.hidden; });
    var yes = shown.filter(function (r) { return r.coming; }), no = shown.filter(function (r) { return !r.coming; });
    var ppl = yes.reduce(function (s, r) { return s + people(r); }, 0);
    $('sPeople').textContent = ppl; $('sYes').textContent = yes.length; $('sNo').textContent = no.length; $('sOpen').textContent = d.opens || 0;
    var men = 0, women = 0, kids = 0, any = false;
    yes.forEach(function (r) { if (r.men || r.women || r.kids) any = true; men += r.men || 0; women += r.women || 0; kids += r.kids || 0; });
    $('sSplit').hidden = !any;
    if (any) $('sSplit').textContent = 'Men ' + men + ' · Women ' + women + ' · Children ' + kids;

    var list = filter === 'yes' ? yes : filter === 'no' ? no : shown;
    var ul = $('gList'); ul.innerHTML = '';
    list.forEach(function (r) { ul.appendChild(guestRow(r, false)); });
    $('gEmpty').hidden = list.length > 0;
    $('gEmpty').textContent = shown.length ? 'Nobody in this list yet.' : 'No answers yet. When guests RSVP on the card, they show up here.';
    $('gRemovedBox').hidden = !removed.length; $('gRemoved').innerHTML = '';
    removed.forEach(function (r) { $('gRemoved').appendChild(guestRow(r, true)); });

    renderPersonal();

    var wl = $('wList'); wl.innerHTML = '';
    d.wishes.forEach(function (w) {
      var li = el('li', w.hidden ? 'is-hidden' : '');
      li.appendChild(el('p', 'w-msg', w.msg));
      var by = el('div', 'w-by'); by.appendChild(el('b', '', w.name)); by.appendChild(el('span', '', ' · ' + S.timeAgo(w.created) + (w.hidden ? ' · hidden' : '')));
      var b = el('button', 'linkbtn' + (w.hidden ? '' : ' red'), w.hidden ? 'Show again' : 'Hide'); b.type = 'button';
      b.addEventListener('click', function () {
        b.disabled = true;
        S.hideWish(id, k, w.id, !w.hidden).then(function () { w.hidden = w.hidden ? 0 : 1; render(); toast(w.hidden ? 'Wish hidden from the card' : 'Wish shown again'); }, function (e) { toast(e.message); b.disabled = false; });
      });
      by.appendChild(b); li.appendChild(by); wl.appendChild(li);
    });
    $('wEmpty').hidden = d.wishes.length > 0;
  }
  function guestRow(r, removed) {
    var li = el('li', r.coming ? 'yes' : 'no');
    var top = el('div', 'g-top');
    top.appendChild(el('b', 'g-name', r.name));
    var chip = el('span', 'g-chip', r.coming ? (people(r) + (people(r) === 1 ? ' person' : ' people')) : "Can't come"); chip.removeAttribute('dir');
    top.appendChild(chip); li.appendChild(top);
    var bits = [];
    if (r.coming && (r.men || r.women || r.kids)) bits.push('Men ' + (r.men || 0) + ' · Women ' + (r.women || 0) + ' · Children ' + (r.kids || 0));
    if (r.guest && r.guest !== r.name) bits.push('Invited as ' + r.guest);
    bits.push(S.timeAgo(r.updated));
    li.appendChild(el('div', 'g-meta', bits.join(' · ')));
    if (r.note) li.appendChild(el('div', 'g-note', '“' + r.note + '”'));
    var b = el('button', 'linkbtn' + (removed ? '' : ' red'), removed ? 'Put back' : 'Remove'); b.type = 'button';
    b.addEventListener('click', function () {
      if (!removed && !confirm((window.FCi18n ? FCi18n.t('Remove') : 'Remove') + ': ' + r.name + '?')) return;
      S.hideRsvp(id, k, r.id, !removed).then(function () { r.hidden = removed ? 0 : 1; render(); }, function (e) { toast(e.message); });
    });
    li.appendChild(b);
    return li;
  }
  function renderPersonal() {
    var names = data.guests || [];
    if (document.activeElement !== $('pList') && !$('pList').dataset.touched) $('pList').value = names.join('\n');
    var out = $('pOut'); out.innerHTML = '';
    if (!names.length) { $('pSum').hidden = true; return; }
    var byGuest = {};
    data.rsvps.forEach(function (r) { if (r.guest && !r.hidden) byGuest[r.guest] = r; });
    var opened = 0, answered = 0;
    names.forEach(function (name) {
      var r = byGuest[name], o = data.openedBy && data.openedBy[name];
      if (o) opened++; if (r) answered++;
      var li = el('li');
      var info = el('div', 'p-info'); info.appendChild(el('b', '', name));
      var st = r ? (r.coming ? '✓ Coming, ' + people(r) : '✗ Can\u2019t come') : o ? 'Opened, no answer yet' : 'Not opened yet';
      var s = el('span', 'p-st ' + (r ? (r.coming ? 'yes' : 'no') : o ? 'seen' : '')); s.textContent = st; info.appendChild(s);
      li.appendChild(info);
      var href = S.shortUrl(id, name);
      var wa = el('a', 'btn wa sm'); wa.textContent = 'WhatsApp'; wa.target = '_blank'; wa.rel = 'noopener';
      wa.href = 'https://wa.me/?text=' + encodeURIComponent("You're invited! " + F.titleOf(card) + '\n' + href);
      var cp = el('button', 'btn ghost sm'); cp.type = 'button'; cp.textContent = 'Copy';
      cp.addEventListener('click', function () { copyText(href, 'Copied link for ' + name); });
      li.appendChild(wa); li.appendChild(cp); out.appendChild(li);
    });
    $('pSum').hidden = false;
    $('pSum').textContent = names.length + ' invited · ' + opened + ' opened · ' + answered + ' answered';
  }
  function load(quiet) {
    return S.host(id, k).then(function (d) { data = d; render(); if (quiet === 'toast') toast('Up to date'); }, function (e) { if (!data) fail(e); else if (quiet === 'toast') toast(e.message); });
  }
  document.querySelectorAll('#hFilter button').forEach(function (b) {
    b.addEventListener('click', function () {
      filter = b.dataset.f;
      document.querySelectorAll('#hFilter button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      render();
    });
  });
  $('hRefresh').addEventListener('click', function () { load('toast'); });
  $('hCopy').addEventListener('click', function () { copyText($('hLink').value, 'Link copied'); });
  $('pList').addEventListener('input', function () { this.dataset.touched = '1'; });
  $('pMake').addEventListener('click', function () {
    var names = $('pList').value.split(/\r?\n/).map(function (s) { return s.trim().slice(0, 80); }).filter(Boolean).slice(0, 500);
    var b = $('pMake'); b.disabled = true;
    S.setGuests(id, k, names).then(function (j) { data.guests = j.guests; delete $('pList').dataset.touched; render(); toast(j.guests.length + ' personal links ready'); }, function (e) { toast(e.message); })
      .then(function () { b.disabled = false; });
  });
  $('hDelete').addEventListener('click', function () {
    if (!confirm(window.FCi18n ? FCi18n.t('Delete this card for good? The link will stop working and the guest list and wishes will be gone.') : 'Delete this card for good?')) return;
    S.remove(id, k).then(function () { S.forget(id); toast('Card deleted'); setTimeout(function () { location.href = 'make.html'; }, 900); }, function (e) { toast(e.message); });
  });
  load();
  setInterval(function () { if (!document.hidden && data) load(true); }, 45000);
  showMine();
})();
