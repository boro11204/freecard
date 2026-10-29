(function () {
  'use strict';
  var F = window.FreeCard, S = window.FreeCardStore;
  function $(id) { return document.getElementById(id); }
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2400); }
  var qs = new URLSearchParams(location.search);
  var SAVED = window.__FC_SAVED || null;
  var code = location.hash.slice(1) || qs.get('c') || '';
  var guest = (qs.get('to') || '').slice(0, 80);
  var answer = 'yes', count = 2;

  if (SAVED && SAVED.missing) {
    $('loading').hidden = true; $('err').hidden = false;
    $('errH').textContent = 'This card was not found';
    $('errP').textContent = 'The link may have a typo, or the family removed the card. Ask them to send it again, or make your own card.';
    return;
  }
  var dataP = SAVED ? Promise.resolve(F.expand(SAVED.data)) : F.decodeCard(code);

  dataP.then(function (c) {
    if (!c || !c.t || !F.TYPES[c.t]) throw new Error('bad');
    $('loading').hidden = true; $('view').hidden = false;
    document.title = F.titleOf(c) + ' · FreeCard';
    var heb = c.w === 'he' || c.w === 'yi';
    F.renderCard(c, $('card'), { guest: guest });
    var names = F.namesLine(c);
    if (guest) { $('envFor').textContent = heb ? 'לכבוד' : 'For'; $('envTo').textContent = guest; }
    else if (names) { $('envTo').textContent = names; }
    $('envTo').setAttribute('dir', 'auto');

    var stage = $('stage');
    function open() { stage.classList.add('open'); }
    $('envelope').addEventListener('click', open);
    setTimeout(open, 1100);

    var days = F.daysUntil(c.dt);
    if (days != null && days >= 0) {
      $('countdown').hidden = false;
      $('countdown').textContent = days === 0 ? 'Today! · היום' : days === 1 ? 'Tomorrow · מחר' : 'In ' + days + ' days · עוד ' + days + ' ימים';
    }

    var id = SAVED && SAVED.id;
    var isHost = !!(id && S.mine()[id]);
    if (isHost) { $('hostBar').hidden = false; $('hostBarLink').href = S.hostUrl(id, S.mine()[id].k); }
    else if (id) S.opened(id, guest);

    var link = id ? S.shortUrl(id, guest) : location.href;
    var shareLink = id ? S.shortUrl(id) : location.href.replace(/\?to=[^#]*/, '');
    var T = F.TYPES[c.t];
    var label = (names ? names + ' ' : '') + T.en + (c.dt ? ' (' + F.enDate(c.dt) + ')' : '');
    var digits = F.phoneDigits(c.ph);
    var live = !!id && c.rs !== '0';      // answers are saved for the host's guest list

    function num(el) { var n = parseInt(el.value, 10); return isFinite(n) && n > 0 ? Math.min(n, 99) : 0; }
    function splitSum() { return num($('gMen')) + num($('gWomen')) + num($('gKids')); }
    function waMsg() {
      var who = $('gName').value.trim() || '(your name)';
      return answer === 'yes'
        ? 'RSVP for ' + label + ': ' + who + ' will be there, ' + count + (count === 1 ? ' person' : ' people') + '. Mazel Tov!'
        : 'RSVP for ' + label + ': ' + who + " can't make it. Mazel Tov!";
    }
    function upd() {
      var sum = splitSum(); if (sum) count = sum;
      $('count').textContent = count;
      $('countRow').hidden = answer !== 'yes';
      $('splitBox').hidden = answer !== 'yes';
      if (digits) {
        $('rsvpWa').href = 'https://wa.me/' + digits + '?text=' + encodeURIComponent(waMsg());
        $('rsvpSms').href = 'sms:+' + digits + '?&body=' + encodeURIComponent(waMsg());
      }
    }

    if (!live && !digits) { $('rsvpBox').hidden = true; }
    else {
      if (guest) $('gName').value = guest;
      if (live) {
        $('rsvpTo').textContent = 'Let ' + (c.hn || 'the family') + ' know if you can come.';
        $('rsvpSend').hidden = false;
        if (digits) { $('waRow').classList.add('extra'); $('rsvpWaTxt').textContent = 'Also on WhatsApp'; }
        else $('waRow').hidden = true;
      } else {
        $('rsvpTo').textContent = 'Your answer goes straight to ' + (c.hn || 'the family') + ' on WhatsApp or text.';
        $('rsvpSend').hidden = true; $('noteRow').hidden = true; $('splitBox').classList.add('gone');
      }
      document.querySelectorAll('.rsvp-q button').forEach(function (b) {
        b.addEventListener('click', function () {
          answer = b.dataset.a;
          document.querySelectorAll('.rsvp-q button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          upd();
        });
      });
      $('minus').addEventListener('click', function () { clearSplit(); count = Math.max(1, count - 1); upd(); });
      $('plus').addEventListener('click', function () { clearSplit(); count = Math.min(99, count + 1); upd(); });
      function clearSplit() { if (splitSum()) { $('gMen').value = ''; $('gWomen').value = ''; $('gKids').value = ''; } }
      ['gMen', 'gWomen', 'gKids'].forEach(function (k) { $(k).addEventListener('input', upd); });
      $('gName').addEventListener('input', upd);
      var nag = function (e) { if (!$('gName').value.trim()) { e.preventDefault(); $('gName').focus(); toast('Add your name first'); } };
      $('rsvpWa').addEventListener('click', nag); $('rsvpSms').addEventListener('click', nag);
      upd();
    }

    // real RSVP, saved for the host
    if (live) {
      var gk = S.keyFor('fc_gk_' + id);
      var showDone = function (r) {
        var txt = r.coming ? '<b>Thank you, ' + esc(r.name) + '!</b> We have you down as coming, ' + r.total + (r.total === 1 ? ' person' : ' people') + '.'
          : '<b>Thank you, ' + esc(r.name) + '.</b> We let the family know you can\u2019t make it.';
        $('rsvpDoneTxt').innerHTML = txt;
        $('rsvpForm').hidden = true; $('rsvpDone').hidden = false;
        if (!$('wName').value) $('wName').value = r.name;
      };
      $('rsvpChange').addEventListener('click', function () { $('rsvpForm').hidden = false; $('rsvpDone').hidden = true; $('gName').focus(); });
      S.myRsvp(id, gk).then(function (j) {
        var r = j.rsvp; if (!r) return;
        $('gName').value = r.name; answer = r.coming ? 'yes' : 'no'; count = r.total || 1;
        $('gMen').value = r.men || ''; $('gWomen').value = r.women || ''; $('gKids').value = r.kids || ''; $('gNote').value = r.note || '';
        if (r.men || r.women || r.kids) $('splitBox').open = true;
        document.querySelectorAll('.rsvp-q button').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.a === answer)); });
        upd(); showDone(r);
      }).catch(function () {});
      $('rsvpSend').addEventListener('click', function () {
        var name = $('gName').value.trim();
        if (!name) { $('gName').focus(); toast('Add your name first'); return; }
        var btn = $('rsvpSend'); btn.disabled = true; var old = btn.textContent; btn.textContent = 'Sending…';
        var body = { gk: gk, name: name, coming: answer === 'yes', total: count, men: num($('gMen')) || null, women: num($('gWomen')) || null,
          kids: num($('gKids')) || null, note: $('gNote').value.trim(), to: guest };
        S.rsvp(id, body).then(function () {
          showDone({ name: name, coming: body.coming, total: body.coming ? count : 0 });
          toast('Answer sent ✓');
        }, function (e) { toast(e.message || 'Could not send, please try again'); })
          .then(function () { btn.disabled = false; btn.textContent = old; });
      });
    }

    // Mazel Tov wall
    function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
    function wishLi(w) {
      var li = document.createElement('li');
      var m = document.createElement('p'); m.className = 'w-msg'; m.textContent = w.msg; m.setAttribute('dir', 'auto');
      var by = document.createElement('div'); by.className = 'w-by';
      var n = document.createElement('b'); n.textContent = w.name; n.setAttribute('dir', 'auto');
      var t = document.createElement('span'); t.textContent = ' · ' + S.timeAgo(w.created);
      by.appendChild(n); by.appendChild(t); li.appendChild(m); li.appendChild(by);
      return li;
    }
    if (id && c.wl !== '0') {
      $('wallBox').hidden = false;
      if (guest) $('wName').value = guest;
      S.wishes(id).then(function (j) {
        var ul = $('wall'); ul.innerHTML = '';
        (j.wishes || []).forEach(function (w) { ul.appendChild(wishLi(w)); });
        $('wallEmpty').hidden = !!(j.wishes || []).length;
      }).catch(function () {});
      $('wSend').addEventListener('click', function () {
        var name = $('wName').value.trim(), msg = $('wMsg').value.trim();
        if (!name) { $('wName').focus(); toast('Add your name'); return; }
        if (!msg) { $('wMsg').focus(); toast('Write a wish first'); return; }
        var btn = $('wSend'); btn.disabled = true;
        S.wish(id, name, msg).then(function (j) {
          $('wall').insertBefore(wishLi(j.wish), $('wall').firstChild); $('wallEmpty').hidden = true;
          $('wMsg').value = ''; toast('Mazel Tov posted ✓');
        }, function (e) { toast(e.message || 'Could not post, try again'); }).then(function () { btn.disabled = false; });
      });
    }

    if (digits) $('mazel').href = 'https://wa.me/' + digits + '?text=' + encodeURIComponent('Mazel Tov on the ' + T.en + '! ' + (names ? '(' + names + ')' : '') + (guest ? ' — ' + guest : ''));
    else $('mazel').href = 'https://wa.me/?text=' + encodeURIComponent('Mazel Tov! ' + label);
    if (id && c.wl !== '0' && !digits) $('mazel').hidden = true;

    var cal = F.calendarInfo(c, shareLink);
    if (!cal) $('calBox').hidden = true;
    else {
      $('calWhen').textContent = [F.enDate(c.dt), c.tm ? F.enTime(c.tm) : ''].filter(Boolean).join(' · ');
      $('gcal').href = cal.google;
      $('ics').addEventListener('click', function () {
        var blob = new Blob([cal.ics], { type: 'text/calendar;charset=utf-8' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'simcha.ics';
        document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      });
    }

    if (!c.ad && !c.hl) $('mapBox').hidden = true;
    else {
      var m = F.mapsLinks(c.ad || c.hl);
      $('mapWhere').innerHTML = '';
      [c.hl, c.ad].filter(Boolean).forEach(function (t) { var s = document.createElement('span'); s.className = 'addr-line'; s.textContent = t; s.setAttribute('dir', 'auto'); $('mapWhere').appendChild(s); });
      $('gmap').href = m.google; $('waze').href = m.waze; $('amap').href = m.apple;
    }

    $('shareWa').href = 'https://wa.me/?text=' + encodeURIComponent("You're invited! " + F.titleOf(c) + '\n' + shareLink);
    $('copyLink').addEventListener('click', function () {
      if (navigator.clipboard) navigator.clipboard.writeText(shareLink).then(function () { toast('Link copied'); }, function () { toast('Copy failed'); });
    });
    window.FreeCardDownload.wire($('dlJpg'), $('dlPdf'), function () { return $('card').querySelector('.fc-card'); },
      function () { return window.FreeCardDownload.fileName(c); }, toast);
    window.__fcCard = c;
    void link;
  }).catch(function (e) {
    console.error(e);
    $('loading').hidden = true; $('err').hidden = false;
  });
})();
