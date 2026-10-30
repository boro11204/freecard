/* FreeCard on-screen keyboard (v20261029e): English + Hebrew, opens under the text box being edited.
   A small keyboard button sits inside every text box. On a computer the keyboard also opens by itself when you click
   into a text box (until you close it with ×); on a phone the button turns it on and off, and while it is on the phone's
   own keyboard stays hidden (inputmode="none"). Every key types at the cursor and fires the same input event as real
   typing, so the card preview updates at once. No libraries. */
(function () {
  'use strict';
  var d = document;
  function tr(s) { return window.FCi18n ? window.FCi18n.t(s) : s; }
  function uiLang() { try { return window.FCi18n ? window.FCi18n.lang() : 'en'; } catch (e) { return 'en'; } }
  if (window.FCi18n && window.FCi18n.add) window.FCi18n.add({
    'Keyboard': ['מקלדת', 'קלאוויאטור'],
    'Open the keyboard': ['פתיחת המקלדת', 'עפענען דעם קלאוויאטור'],
    'Close keyboard': ['סגירת המקלדת', 'צומאכן דעם קלאוויאטור'],
    'Move the keyboard': ['הזזת המקלדת', 'רירן דעם קלאוויאטור'],
    'space': ['רווח', 'רווח'],
    'Delete': ['מחיקה', 'אויסמעקן'],
    'Shift': ['אותיות גדולות', 'גרויסע אותיות'],
    'Numbers': ['מספרים', 'נומערן'],
    'Letters': ['אותיות', 'אותיות'],
    'Switch language': ['החלפת שפה', 'טוישן שפראך'],
    'New line': ['שורה חדשה', 'נייע שורה']
  });

  var HE = [['ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ'], ['ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל', 'ך', 'ף'], ['ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ']];
  var EN = [['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], ['z', 'x', 'c', 'v', 'b', 'n', 'm']];
  var NUM = [['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], ['/', '(', ')', '$', '&', '#', '%', '+', '=', '*'], ['·', '–', '_', '[', ']', '<', '>']];
  var PUNCT_HE = ['.', ',', '?', '!', '-', ':', ';', '"', "'", '׳', '״'];
  var PUNCT_EN = ['.', ',', '?', '!', '-', ':', ';', '"', "'", '@', '&'];
  var WORDS_HE = ['נ״י', 'תחי׳', 'שיחי׳', 'ר׳', 'ע״ה', 'ז״ל', 'אי״ה', 'בעזהשי״ת', 'הבעל״ט', 'לפ״ק', 'שליט״א', 'מוהר״ר'];

  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var touch = !fine;
  var AUTO_KEY = 'fc-vkb-auto';
  function autoOn() { try { return localStorage.getItem(AUTO_KEY) !== '0'; } catch (e) { return true; } }
  function setAuto(v) { try { localStorage.setItem(AUTO_KEY, v ? '1' : '0'); } catch (e) {} }

  var ICO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2.2"/><path d="M6 9.5h.01M9 9.5h.01M12 9.5h.01M15 9.5h.01M18 9.5h.01M6 12h.01M9 12h.01M12 12h.01M15 12h.01M18 12h.01M8 15h8"/></svg>';
  var BKSP = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/></svg>';
  var SHIFT = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 4l8 8h-4.5v7h-7v-7H4z"/></svg>';

  /* ---------- the panel ---------- */
  var kb = d.createElement('div');
  kb.className = 'vkb'; kb.id = 'vkb'; kb.hidden = true; kb.dir = 'ltr';
  kb.setAttribute('role', 'group'); kb.setAttribute('aria-label', tr('Keyboard'));
  kb.innerHTML = '<div class="vkb-top"><button type="button" class="vkb-grip" id="vkbGrip" aria-label="Move the keyboard" title="Move the keyboard">⋮⋮</button>' +
    '<span class="vkb-lab" id="vkbLab" dir="auto"></span><button type="button" class="vkb-x" id="vkbX" aria-label="Close keyboard" title="Close keyboard">×</button></div>' +
    '<div class="vkb-words" id="vkbWords" dir="rtl"></div><div class="vkb-rows" id="vkbRows"></div>';
  var rowsEl = kb.querySelector('#vkbRows'), wordsEl = kb.querySelector('#vkbWords'), labEl = kb.querySelector('#vkbLab');
  var field = null, layout = 'he', chosen = null, numbers = false, shift = 0; // shift: 0 off, 1 once, 2 caps lock
  var floating = false, lastShift = 0;

  function el(tag, cls, html) { var e = d.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function key(label, act, cls, aria) {
    var b = el('button', 'vkb-k' + (cls ? ' ' + cls : ''));
    b.type = 'button'; b.tabIndex = -1;
    if (/^</.test(label)) b.innerHTML = label; else b.textContent = label;
    if (aria) { b.setAttribute('aria-label', tr(aria)); b.title = tr(aria); }
    b._act = act;
    return b;
  }
  function draw() {
    rowsEl.innerHTML = ''; wordsEl.innerHTML = '';
    var he = layout === 'he' && !numbers;
    kb.classList.toggle('vkb-he', layout === 'he'); kb.classList.toggle('vkb-num', numbers);
    wordsEl.hidden = !he;
    if (he) WORDS_HE.forEach(function (w) { wordsEl.appendChild(key(w, w, 'vkb-w')); });
    var pr = el('div', 'vkb-r vkb-p');
    (layout === 'he' ? PUNCT_HE : PUNCT_EN).forEach(function (c) { pr.appendChild(key(c, c, 'vkb-pk')); });
    rowsEl.appendChild(pr);
    var rows = numbers ? NUM : layout === 'he' ? HE : EN;
    rows.forEach(function (row, i) {
      var r = el('div', 'vkb-r');
      if (!numbers && layout === 'en' && i === 2) {
        var s = key(SHIFT, 'shift', 'vkb-fn vkb-shift' + (shift ? ' on' : '') + (shift === 2 ? ' lock' : ''), 'Shift');
        s.setAttribute('aria-pressed', shift ? 'true' : 'false'); r.appendChild(s);
      }
      row.forEach(function (c) { var up = layout === 'en' && !numbers && shift; r.appendChild(key(up ? c.toUpperCase() : c, up ? c.toUpperCase() : c)); });
      if (!numbers && layout === 'en' && i === 2) r.appendChild(el('span', 'vkb-gap'));
      rowsEl.appendChild(r);
    });
    var last = el('div', 'vkb-r vkb-last');
    last.appendChild(key(numbers ? (layout === 'he' ? 'אבג' : 'ABC') : '123', 'num', 'vkb-fn vkb-123', numbers ? 'Letters' : 'Numbers'));
    last.appendChild(key(layout === 'he' ? 'EN' : 'עב', 'lang', 'vkb-fn vkb-lang', 'Switch language'));
    last.appendChild(key(tr('space'), ' ', 'vkb-space'));
    if (field && field.tagName === 'TEXTAREA') last.appendChild(key('↵', '\n', 'vkb-fn vkb-enter', 'New line'));
    var bk = key(BKSP, 'back', 'vkb-fn vkb-back', 'Delete'); last.appendChild(bk);
    rowsEl.appendChild(last);
  }

  /* ---------- typing at the cursor ---------- */
  function sel(f) {
    var s = f.selectionStart, e = f.selectionEnd;
    if (s == null) { s = e = f.value.length; }
    if (d.activeElement !== f && f._vkbSel) { s = f._vkbSel[0]; e = f._vkbSel[1]; }
    s = Math.min(s, f.value.length); e = Math.min(Math.max(e, s), f.value.length);
    return [s, e];
  }
  function fire(f, type, data) {
    var ev;
    try { ev = new InputEvent('input', { bubbles: true, inputType: type, data: data }); } catch (x) { ev = d.createEvent('Event'); ev.initEvent('input', true, false); }
    f.dispatchEvent(ev);
  }
  function insert(txt) {
    var f = field; if (!f || f.disabled || f.readOnly) return;
    var r = sel(f), s = r[0], e = r[1];
    if (f.maxLength > 0 && f.value.length - (e - s) + txt.length > f.maxLength) return;
    f.value = f.value.slice(0, s) + txt + f.value.slice(e);
    var p = s + txt.length;
    try { f.setSelectionRange(p, p); } catch (x) {}
    f._vkbSel = [p, p];
    fire(f, txt === '\n' ? 'insertLineBreak' : 'insertText', txt);
  }
  function back() {
    var f = field; if (!f || f.disabled || f.readOnly) return;
    var r = sel(f), s = r[0], e = r[1];
    if (s === e) {
      if (s === 0) return;
      s--;
      var c = f.value.charCodeAt(s);
      if (c >= 0xDC00 && c <= 0xDFFF && s > 0) s--;           // a whole emoji, not half of one
      while (s > 0 && /[\u0591-\u05C7]/.test(f.value.charAt(s)) ) s--; // a letter with its nikud goes together
    }
    f.value = f.value.slice(0, s) + f.value.slice(e);
    try { f.setSelectionRange(s, s); } catch (x) {}
    f._vkbSel = [s, s];
    fire(f, 'deleteContentBackward', null);
  }
  function act(a) {
    if (a === 'shift') { var now = Date.now(); shift = shift === 0 ? 1 : (shift === 1 && now - lastShift < 400 ? 2 : 0); lastShift = now; draw(); return; }  // tap twice quickly = caps lock
    if (a === 'num') { numbers = !numbers; draw(); return; }
    if (a === 'lang') { layout = layout === 'he' ? 'en' : 'he'; chosen = layout; numbers = false; shift = 0; draw(); return; }
    if (a === 'back') { back(); return; }
    insert(a);
    if (shift === 1) { shift = 0; draw(); }
  }

  /* keys work on tap; the field keeps its focus and its cursor */
  var rep = null, repT = null, downKey = null;
  function stopRep() { clearTimeout(repT); clearInterval(rep); repT = rep = null; }
  kb.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.vkb-words')) { downKey = null; return; }   // the word strip scrolls sideways
    e.preventDefault();
    var b = e.target.closest('.vkb-k'); downKey = b;
    if (b && b._act === 'back') { back(); stopRep(); repT = setTimeout(function () { rep = setInterval(back, 70); }, 450); }
  });
  kb.addEventListener('mousedown', function (e) { if (!e.target.closest('.vkb-words')) e.preventDefault(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { kb.addEventListener(t, stopRep); });
  d.addEventListener('pointerup', stopRep);
  kb.addEventListener('click', function (e) {
    var b = e.target.closest('.vkb-k'); if (!b) return;
    e.preventDefault();
    if (b._act === 'back') { if (e.detail === 0) back(); }   // pointer presses already deleted (and repeat while held)
    else act(b._act);
    if (field && !touch && d.activeElement !== field) { try { field.focus({ preventScroll: true }); } catch (x) {} }
  });
  kb.querySelector('#vkbX').addEventListener('click', function () { if (fine) setAuto(false); close(true); });

  /* ---------- moving it (drag the ⋮⋮) ---------- */
  var grip = kb.querySelector('#vkbGrip'), drag = null;
  grip.addEventListener('pointerdown', function (e) {
    e.preventDefault(); e.stopPropagation();
    var r = kb.getBoundingClientRect();
    if (!floating) { floating = true; kb.classList.remove('vkb-pop'); kb.classList.add('vkb-float'); kb.style.width = r.width + 'px'; d.body.appendChild(kb); }
    kb.style.left = r.left + 'px'; kb.style.top = r.top + 'px';
    drag = { x: e.clientX - r.left, y: e.clientY - r.top, id: e.pointerId };
    try { grip.setPointerCapture(e.pointerId); } catch (x) {}
  });
  grip.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var w = kb.offsetWidth, h = kb.offsetHeight;
    var x = Math.max(4 - w * 0.6, Math.min(innerWidth - w * 0.4, e.clientX - drag.x));
    var y = Math.max(0, Math.min(innerHeight - 40, e.clientY - drag.y));
    kb.style.left = x + 'px'; kb.style.top = y + 'px';
  });
  function endDrag() { drag = null; }
  grip.addEventListener('pointerup', endDrag); grip.addEventListener('pointercancel', endDrag);
  grip.addEventListener('click', function (e) { e.preventDefault(); });
  function dock() { floating = false; kb.classList.remove('vkb-float'); kb.style.left = kb.style.top = kb.style.width = ''; }

  /* ---------- opening and closing ---------- */
  function hasHe(s) { return /[\u0590-\u05FF]/.test(s || ''); }
  function pickLayout(f) {
    if (chosen) return chosen;
    if (f.value) return hasHe(f.value) ? 'he' : (/[A-Za-z]/.test(f.value) ? 'en' : (uiLang() === 'en' ? 'en' : 'he'));
    var st = window.__fcState, w = st && st.w;
    if (uiLang() !== 'en' || w === 'he' || w === 'yi') return 'he';
    return 'en';
  }
  function labelOf(f) {
    var l = f.id && d.querySelector('label[for="' + f.id + '"]');
    if (l) return (l.firstChild && l.firstChild.nodeType === 3 ? l.firstChild.textContent : l.textContent).trim();
    return f.getAttribute('aria-label') ? tr(f.getAttribute('aria-label')) : '';
  }
  function setIco(f, on) { var b = f && f._vkbBtn; if (b) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.classList.toggle('on', !!on); } }
  function open(f, why) {
    if (field && field !== f) { field.removeAttribute('inputmode'); setIco(field, false); }
    var wasOpen = !kb.hidden;
    field = f; layout = pickLayout(f); numbers = false; shift = 0;
    if (touch) f.setAttribute('inputmode', 'none');
    labEl.textContent = labelOf(f);
    draw(); setIco(f, true);
    if (!floating) { var w = f._vkbWrap || f; w.insertAdjacentElement('afterend', kb); }
    kb.hidden = false; d.body.classList.add('vkb-open');
    if (!floating) place(f);
    var sh = f.closest('.pe-sheet'); if (sh) sh.classList.add('vkb-in');
    if (d.activeElement !== f) {
      try { f.focus({ preventScroll: true }); } catch (x) { f.focus(); }
      try { var n = f.value.length; f.setSelectionRange(n, n); f._vkbSel = [n, n]; } catch (x) {}
    }
    if (touch && why === 'button') { try { f.blur(); f.focus({ preventScroll: true }); } catch (x) {} }  // hide the phone keyboard that was already up
    if (!floating) setTimeout(function () { reveal(f); }, wasOpen ? 0 : 30);
  }
  /* on a wide screen a narrow (half-width) box gets a roomier keyboard: it stays in the page under the box and
     reaches across into the empty space under the box next to it */
  function place(f) {
    kb.classList.remove('vkb-pop'); kb.style.width = kb.style.left = '';
    var w = f._vkbWrap || f, host = w.parentNode, card = f.closest('.panel, section, form') || d.body;
    if (innerWidth < 760 || w.offsetWidth >= 460 || f.closest('.pe-sheet')) return;
    var cr = card.getBoundingClientRect(), hr = host.getBoundingClientRect(), W = Math.min(540, cr.width - 24);
    if (W <= hr.width) return;
    kb.classList.add('vkb-pop'); kb.style.width = W + 'px';
    var want = hr.left + W <= cr.right - 8 ? hr.left : hr.right - W;
    kb.style.left = Math.round(want - kb.getBoundingClientRect().left) + 'px';
  }
  function reveal(f) {
    var sh = f.closest('.pe-sheet');
    if (sh) { var kr = kb.getBoundingClientRect(), sr = sh.getBoundingClientRect(); if (kr.bottom > sr.bottom) sh.scrollTop += kr.bottom - sr.bottom + 8; return; }
    var top = (f._vkbWrap || f).getBoundingClientRect().top, bot = kb.getBoundingClientRect().bottom;
    var head = 70, vh = window.visualViewport ? visualViewport.height : innerHeight;
    if (top < head) scrollBy({ top: top - head, behavior: 'smooth' });
    else if (bot > vh - 8) scrollBy({ top: Math.min(bot - vh + 12, top - head), behavior: 'smooth' });
  }
  function close(byUser) {
    if (field) { field.removeAttribute('inputmode'); setIco(field, false); }
    var sh = kb.closest('.pe-sheet') || d.querySelector('.pe-sheet.vkb-in'); if (sh) sh.classList.remove('vkb-in');
    kb.hidden = true; d.body.classList.remove('vkb-open'); stopRep();
    if (floating) dock();
    if (byUser && field && !touch) { try { field.focus({ preventScroll: true }); } catch (x) {} }
    field = null;
  }

  /* ---------- the keyboard button inside each text box ---------- */
  function eligible(f) {
    if (!f || f.disabled || f.readOnly) return false;
    if (f.tagName === 'TEXTAREA') return true;
    return f.tagName === 'INPUT' && /^(text|search|)$/.test((f.getAttribute('type') || '').toLowerCase());
  }
  function attach(f) {
    if (f._vkbBtn || !eligible(f)) return;
    var wrap = el('span', 'vkb-wrap' + (f.tagName === 'TEXTAREA' ? ' vkb-ta' : ''));
    f.parentNode.insertBefore(wrap, f); wrap.appendChild(f);
    var b = el('button', 'vkb-ico', ICO); b.type = 'button';
    b.setAttribute('aria-label', tr('Open the keyboard')); b.title = tr('Keyboard'); b.setAttribute('aria-pressed', 'false');
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (field === f && !kb.hidden) { if (fine) setAuto(false); close(true); }
      else { if (fine) setAuto(true); open(f, 'button'); }
    });
    wrap.appendChild(b);
    f._vkbBtn = b; f._vkbWrap = wrap; f.classList.add('vkb-f');
    f.addEventListener('pointerdown', function () { if (touch && !kb.hidden) f.setAttribute('inputmode', 'none'); });  // tapping the next box keeps the phone keyboard down
    f.addEventListener('focus', function () {
      if (!kb.hidden && field !== f) open(f, 'focus');          // the keyboard follows you to the next box
      else if (kb.hidden && fine && autoOn()) open(f, 'focus');  // on a computer it opens when you click in
    });
    ['select', 'keyup', 'mouseup', 'blur'].forEach(function (t) { f.addEventListener(t, function () { try { f._vkbSel = [f.selectionStart, f.selectionEnd]; } catch (x) {} }); });
  }
  function scan() {
    var roots = [d.getElementById('form'), d.getElementById('peSheet')];
    roots.forEach(function (r) { if (r) [].forEach.call(r.querySelectorAll('input, textarea'), attach); });
  }
  scan();
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !kb.hidden && field && d.activeElement === field) { e.stopPropagation(); close(true); } }, true);
  // a box that disappears (switching simcha, closing the part editor) takes the keyboard with it
  setInterval(function () { if (!kb.hidden && field && !floating && !field.offsetParent) close(false); if (!kb.hidden && field && floating && !d.contains(field)) close(false); }, 400);
  // the part editor fills its box from the card; re-check when it opens
  d.addEventListener('click', function () { setTimeout(scan, 0); }, true);
  window.addEventListener('resize', function () { if (floating) { var r = kb.getBoundingClientRect(); if (r.left > innerWidth - 60 || r.top > innerHeight - 40) dock(), (field && open(field)); } });
  window.FCvkb = { open: function (f) { open(typeof f === 'string' ? d.getElementById(f) : f, 'api'); }, close: function () { close(false); }, isOpen: function () { return !kb.hidden; }, field: function () { return field; }, layout: function () { return layout; } };
})();
