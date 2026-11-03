/* FreeCard: tap any part of the card and change just that part (v20261028d).
   The words, font, size, colour, bold, alignment, line spacing, and moving it a little up, down, left or right.
   The changes are kept with the card (state.pe) and drawn with ordinary CSS on the card itself, so every download
   and the drawn copy for computers that block pictures show exactly what the preview shows. */
(function () {
  'use strict';
  var F = window.FreeCard, api = window.__fcApi;
  if (!F || !api || !F.peParse) return;
  var state = api.state, form = api.form, mount = document.getElementById('card');
  function $(id) { return document.getElementById(id); }
  function tr(s) { return window.FCi18n ? window.FCi18n.t(s) : s; }
  if (window.FCi18n && window.FCi18n.add) window.FCi18n.add({
    'Tap any line on the card to change just that line.': ['הקישו על שורה בהזמנה כדי לשנות רק אותה.', 'דריקט אויף א שורה אויפן קארטל צו טוישן נאר יענע שורה.'],
    'Edit this part': ['עריכת החלק הזה', 'טוישן דעם טייל'],
    'Previous part': ['החלק הקודם', 'פריערדיגער טייל'], 'Next part': ['החלק הבא', 'קומענדיגער טייל'],
    'Done': ['סיום', 'פארטיג'], 'Words': ['מילים', 'ווערטער'], 'Font': ['גופן', 'שריפט'], 'Same as now': ['כמו עכשיו', 'ווי יעצט'], 'Same as card': ['כמו בהזמנה', 'ווי אויפן קארטל'],
    'Smaller': ['קטן יותר', 'קלענער'], 'Bigger': ['גדול יותר', 'גרעסער'], 'Bold': ['מודגש', 'דיק'], 'Color': ['צבע', 'קאליר'],
    'Align': ['יישור', 'אויסגלייכן'], 'Left': ['שמאל', 'לינקס'], 'Center': ['מרכז', 'אין מיטן'], 'Right': ['ימין', 'רעכטס'],
    'Line spacing': ['ריווח שורות', 'אפשטאנד צווישן שורות'], 'Less space': ['פחות ריווח', 'ווינציגער אפשטאנד'], 'More space': ['יותר ריווח', 'מער אפשטאנד'],
    'Move': ['הזזה', 'רירן'], 'Up': ['למעלה', 'ארויף'], 'Down': ['למטה', 'אראפ'],
    'Reset this part': ['איפוס החלק הזה', 'צוריקשטעלן דעם טייל'],
    'Undo all part changes': ['ביטול כל השינויים בחלקים', 'אפמאכן אלע טוישן אין די טיילן'],
    'Words in [BRACKETS] fill in from your details.': ['מילים ב[סוגריים] מתמלאות מהפרטים שלכם.', 'ווערטער אין [קלאמערן] ווערן אויסגעפילט פון אייערע פרטים.'],
    'These words come from the form.': ['המילים האלה מגיעות מהטופס.', 'די ווערטער קומען פונעם פארם.'],
    'Change in the form': ['לשנות בטופס', 'טוישן אינעם פארם'],
    'Photo': ['תמונה', 'בילד'], 'Shape': ['צורה', 'פארעם'], 'Size': ['גודל', 'גרייס'],
    'Smaller photo': ['תמונה קטנה יותר', 'קלענער בילד'], 'Bigger photo': ['תמונה גדולה יותר', 'גרעסער בילד'],
    'Remove photo': ['הסרת התמונה', 'אראפנעמען דאס בילד'], 'Pick any color': ['בחירת כל צבע', 'קלייבט סיי וועלכן קאליר'],
    'Delete this line': ['מחיקת השורה', 'אויסמעקן די שורה'],
    'This line is empty now. Type to bring it back.': ['השורה ריקה עכשיו. כתבו כדי להחזיר אותה.', 'די שורה איז יעצט ליידיג. שרייבט צו ברענגען זי צוריק.'],
    // v20261103g: text layout
    'Layout': ['פריסה', 'אויסשטעל'], 'Paragraph': ['פסקה', 'פאראגראף'], 'Copyfit': ['התאמה', 'אריינפאסן'], 'Tab': ['טאב', 'טאב'], 'Curve': ['קשת', 'בויגן'],
    'Text layout': ['פריסת הטקסט', 'אויסשטעל פונעם טעקסט'],
    'Curve down': ['קשת למטה', 'בויגן אראפ'], 'Curve up': ['קשת למעלה', 'בויגן ארויף'],
    'Dots': ['נקודות', 'פינטלעך'], 'Blank': ['ריק', 'ליידיג'], 'Columns': ['עמודות', 'שפאלטן'], 'Gap': ['רווח', 'אפשטאנד'],
    'Fewer columns': ['פחות עמודות', 'ווינציגער שפאלטן'], 'More columns': ['יותר עמודות', 'מער שפאלטן'], 'Smaller gap': ['רווח קטן יותר', 'קלענערער אפשטאנד'], 'Bigger gap': ['רווח גדול יותר', 'גרעסערער אפשטאנד'],
    'Line between': ['קו באמצע', 'ליניע אין מיטן'],
    'Lines wrap as usual.': ['השורות נשברות כרגיל.', 'די שורות ברעכן זיך ווי געווענליך.'],
    'One line that gets smaller so it always fits.': ['שורה אחת שמתכווצת כדי שתמיד תיכנס.', 'איין שורה וואס ווערט קלענער כדי זי זאל שטענדיג אריינפאסן.'],
    'Words, then the time: Kabolas Ponim 6:30. Press Enter for the next line.': ['מילים ואז השעה: קבלת פנים 6:30. Enter לשורה הבאה.', 'ווערטער, דערנאך די צייט: קבלת פנים 6:30. Enter פאר דער קומענדיגער שורה.'],
    'Press Enter for the next line; the lines are shared out over the columns.': ['Enter לשורה הבאה; השורות מתחלקות בין העמודות.', 'Enter פאר דער קומענדיגער שורה; די שורות ווערן צעטיילט צווישן די שפאלטן.'],
    'The line bends along an arc. Slide to bend it up or down.': ['השורה מתעקלת בקשת. הזיזו כדי לעקל למעלה או למטה.', 'די שורה בויגט זיך אויף א בויגן. רירט צו בויגן ארויף אדער אראפ.']
  });

  var COLOURS = [['', 'Design'], ['#a8802c', 'Gold'], ['#1f2f57', 'Navy'], ['#7a1f2b', 'Burgundy'], ['#1f5b3f', 'Green'], ['#1d4fa0', 'Blue'],
    ['#b4566a', 'Rose'], ['#5b3a8c', 'Purple'], ['#111111', 'Black'], ['#6b6f76', 'Gray'], ['#ffffff', 'White']];
  var FIELD_OF = { h: 'h', ex: 'ex', nt: 'nt', intro: 'i', hdate: 'hd', sched: 'sc', hall: 'hl', addr: 'ad' };
  var FORM_OF = { names: 'f-n1', parents: 'f-p1', date: 'f-dt', time: 'f-tm' };
  var EDITABLE = { n1: 1, n2: 1, p1: 1, p2: 1, hd: 1, pa: 1, sc: 1, hl: 1, ad: 1, h: 1, i: 1, ex: 1, nt: 1 };

  /* ---------- the panel ---------- */
  var ARW = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  function al(d) { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="' + d + '"/></svg>'; }
  var sheet = document.createElement('div');
  sheet.className = 'pe-sheet'; sheet.id = 'peSheet'; sheet.hidden = true;
  sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Edit this part');
  sheet.innerHTML =
    '<div class="pe-top"><button type="button" class="pe-nav" id="pePrev" aria-label="Previous part">‹</button>' +
    '<div class="pe-name" id="peName" dir="auto" data-noi18n></div>' +
    '<button type="button" class="pe-nav" id="peNext" aria-label="Next part">›</button>' +
    '<button type="button" class="btn gold pe-done" id="peDone">Done</button></div>' +
    '<div class="pe-body" id="peText">' +
     '<div class="pe-row pe-words"><textarea id="peWords" rows="1" dir="auto" aria-label="Words"></textarea>' +
      '<div class="pe-hint" id="peHint"></div></div>' +
     '<div class="pe-row pe-fontrow"><label class="pe-fontwrap" for="peFont"><span class="pe-flab">Font</span><select id="peFont" class="pe-font" aria-label="Font"><option value="">Same as card</option></select></label>' +
      '<div class="stepper pe-st" dir="ltr"><button type="button" id="peZm" aria-label="Smaller">A−</button><output id="peZ">100%</output><button type="button" id="peZp" aria-label="Bigger">A+</button></div>' +
      '<button type="button" class="pe-tg" id="peBold" aria-label="Bold" aria-pressed="false"><b>B</b></button></div>' +
     '<div class="pe-row pe-colors" id="peColors" role="group" aria-label="Color"></div>' +
     '<div class="pe-row"><div class="pe-seg" role="group" aria-label="Align">' +
      '<button type="button" data-a="l" aria-label="Left">' + al('M4 6h16M4 12h10M4 18h14') + '</button>' +
      '<button type="button" data-a="c" aria-label="Center">' + al('M4 6h16M7 12h10M5 18h14') + '</button>' +
      '<button type="button" data-a="r" aria-label="Right">' + al('M4 6h16M10 12h10M6 18h14') + '</button></div>' +
      '<div class="stepper pe-st pe-ls" role="group" aria-label="Line spacing"><button type="button" id="peLm" aria-label="Less space">' + al('M8 9h12M8 15h12M4 8l0 8') + '</button><output id="peL" aria-hidden="true">↕</output><button type="button" id="peLp" aria-label="More space">' + al('M8 6h12M8 18h12M4 5v14') + '</button></div><button type="button" class="pe-lobtn" id="peLoBtn" aria-expanded="false" aria-controls="peLo">' + al('M4 6h16M4 12h7M15 12h5M4 18h16') + '<span>Layout</span></button></div>' +
     '<div class="pe-lo" id="peLo" hidden role="group" aria-label="Text layout">' +
      '<div class="pe-lomodes">' +
       '<button type="button" data-lo="" aria-pressed="false">' + al('M4 6h16M4 10h16M4 14h16M4 18h10') + '<span>Paragraph</span></button>' +
       '<button type="button" data-lo="fit" aria-pressed="false">' + al('M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4') + '<span>Copyfit</span></button>' +
       '<button type="button" data-lo="tab" aria-pressed="false">' + al('M4 12h3M17 12h3M9 12h.01M12 12h.01M15 12h.01') + '<span>Tab</span></button>' +
       '<button type="button" data-lo="arc" aria-pressed="false">' + al('M4 17Q12 3 20 17') + '<span>Curve</span></button></div>' +
      '<div class="pe-row pe-loarc" id="peLoArc"><span class="pe-lab" aria-hidden="true">⌣</span><input type="range" id="peArc" min="-100" max="100" step="5" value="40" aria-label="Curve" dir="ltr"><span class="pe-lab" aria-hidden="true">⌒</span></div>' +
      '<div class="pe-row" id="peLoTab"><div class="pe-seg pe-ldseg" role="group" aria-label="Tab"><button type="button" data-ld="1" aria-pressed="true" aria-label="Dots">···</button><button type="button" data-ld="0" aria-pressed="false" aria-label="Blank">␣</button></div></div>' +
      '<div class="pe-row" id="peLoCols"><span class="pe-lab">Columns</span><div class="stepper pe-st" dir="ltr"><button type="button" id="peCm" aria-label="Fewer columns">−</button><output id="peC">1</output><button type="button" id="peCp" aria-label="More columns">+</button></div>' +
       '<span class="pe-lab pe-gapl">Gap</span><div class="stepper pe-st" dir="ltr"><button type="button" id="peGm" aria-label="Smaller gap">−</button><output id="peG">4</output><button type="button" id="peGp" aria-label="Bigger gap">+</button></div>' +
       '<button type="button" class="pe-tg pe-divtg" id="peDiv" aria-pressed="false" aria-label="Line between">' + al('M12 4v16') + '</button></div>' +
      '<div class="pe-hint" id="peLoHint"></div>' +
     '</div>' +
     '<div class="pe-row pe-moverow"><span class="pe-lab">Move</span><div class="pe-move" role="group" aria-label="Move">' +
      '<button type="button" data-mx="0" data-my="-1" aria-label="Up">' + ARW + '</button>' +
      '<button type="button" data-mx="0" data-my="1" aria-label="Down" class="r180">' + ARW + '</button>' +
      '<button type="button" data-mx="-1" data-my="0" aria-label="Left" class="r270">' + ARW + '</button>' +
      '<button type="button" data-mx="1" data-my="0" aria-label="Right" class="r90">' + ARW + '</button></div>' +
      '<button type="button" class="linkbtn pe-reset" id="peReset">Reset this part</button></div>' +
     '<div class="pe-row pe-delrow"><button type="button" class="btn pe-del" id="peDel"><span aria-hidden="true">🗑</span> <span>Delete this line</span></button></div>' +
    '</div>' +
    '<div class="pe-body" id="pePhoto" hidden>' +
     '<div class="pe-row"><span class="pe-lab">Shape</span><div class="pe-shapes" id="peShapes"></div></div>' +
     '<div class="pe-row"><span class="pe-lab">Size</span><div class="stepper pe-st"><button type="button" id="pePm" aria-label="Smaller photo">−</button><output id="peP">100%</output><button type="button" id="pePp" aria-label="Bigger photo">+</button></div>' +
      '<button type="button" class="linkbtn pe-reset" id="pePx">Remove photo</button></div>' +
    '</div>';
  document.body.appendChild(sheet);
  // the hint over the preview
  var lab = document.querySelector('#preview .preview-label');
  var hint = document.createElement('p'); hint.className = 'pe-tip'; hint.id = 'peTip';
  hint.innerHTML = '<span aria-hidden="true">👆</span> <span>Tap any line on the card to change just that line.</span> <button type="button" class="linkbtn" id="peUndoAll" hidden>Undo all part changes</button>';
  if (lab) lab.insertAdjacentElement('afterend', hint);

  var fsel = $('peFont');
  [].slice.call($('f-tf').options).forEach(function (o) { if (!o.value) return; var n = document.createElement('option'); n.value = o.value; n.textContent = o.textContent; fsel.appendChild(n); });
  COLOURS.forEach(function (c) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'cdot' + (c[0] ? '' : ' cdef'); b.dataset.c = c[0];
    b.title = c[1]; b.setAttribute('aria-label', c[1]);
    if (c[0]) b.style.background = c[0]; else b.textContent = c[1];
    b.addEventListener('click', function () { change(function (o) { if (c[0]) o.c = c[0]; else delete o.c; }); });
    $('peColors').appendChild(b);
  });
  var cpick = document.createElement('input'); cpick.type = 'color'; cpick.className = 'cpick'; cpick.title = 'Pick any color'; cpick.setAttribute('aria-label', 'Pick any color'); cpick.value = '#a8802c';
  cpick.addEventListener('input', function () { var v = cpick.value; change(function (o) { o.c = v; }); });
  $('peColors').appendChild(cpick);
  [].slice.call(document.querySelectorAll('#photoOpts .pshape .chip')).forEach(function (ch) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'chip sm'; b.dataset.ps = ch.dataset.ps; b.textContent = ch.textContent;
    b.addEventListener('click', function () { ch.click(); syncPhoto(); });
    $('peShapes').appendChild(b);
  });

  /* ---------- the edits ---------- */
  var sel = null;          // key of the selected part (without the piece prefix), or 'ph' for the photo
  function scope() { var pk = api.pieceOn(); return pk ? pk + '/' : ''; }
  function edits() { return F.peParse(state); }
  function saveEdits(ed) {
    Object.keys(ed).forEach(function (k) { if (!ed[k] || typeof ed[k] !== 'object' || F.peIsEmpty(ed[k])) delete ed[k]; });
    if (Object.keys(ed).length) state.pe = JSON.stringify(ed); else delete state.pe;
    $('peUndoAll').hidden = !state.pe;
  }
  function card() { return mount.querySelector('.fc-card'); }
  function partEl() { var c = card(); if (!c || !sel) return null; return c.querySelector('[data-pe="' + sel + '"]'); }
  function curTemplate() {
    var pk = api.pieceOn();
    if (pk) { var v = state['pw_' + pk]; return typeof v === 'string' && v.trim() ? v : F.pieceTemplate(Object.assign({}, state, { w: state.w === 'short' ? 'en' : state.w }), pk); }
    return F.templateOf(state) || '';
  }
  // what the words of the selected part come from: a field of the form, one line of the wording, or nothing editable here
  var src = null, delBlank = false;
  function sourceOf(e) {
    var k = e.getAttribute('data-pe');
    if (FIELD_OF[k]) return { type: 'field', field: FIELD_OF[k], multi: k === 'ex' };
    if (e.hasAttribute('data-pl')) {
      var idx = parseInt(e.getAttribute('data-pl'), 10), raws = curTemplate().split(/\r?\n/), raw = raws[idx];
      if (raw == null) return { type: 'none' };
      var title = /^#\s+/.test(raw), body = raw.replace(/^#\s+/, ''), m = /^\s*\[([^\]]+)\]\s*$/.exec(body);
      if (m) { var f = F.tokenMap(state.t)[m[1].trim().toUpperCase()]; if (f && EDITABLE[f]) return { type: 'field', field: f }; }
      return { type: 'line', idx: idx, title: title, tokens: /\[[^\]]+\]/.test(body) && !/^\s*\[LINE\]\s*$/i.test(body) };
    }
    return { type: 'none' };
  }
  function srcValue() {
    if (!src) return '';
    if (src.type === 'field') return (state[src.field] || '').replace(/\u2028/g, '\n');
    if (src.type === 'line') { var raw = curTemplate().split(/\r?\n/)[src.idx]; return raw == null || /^(#\s+)?\s*\[LINE\]\s*$/i.test(raw) ? '' : raw.replace(/^#\s+/, '').replace(/\u2028/g, '\n'); }
    return '';
  }
  function writeWords(v) {
    if (!src) return;
    if (src.type === 'field') {
      var fe = form.elements[src.field]; if (!fe) return;
      if (fe.tagName !== 'TEXTAREA') v = v.replace(/\r?\n/g, loEntries() ? '\u2028' : ' ');
      fe.value = v; fe.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    if (src.type !== 'line') return;
    v = v.replace(/\r?\n/g, loEntries() ? '\u2028' : ' ').replace(/\u2028{2,}/g, '\u2028');
    var raws = curTemplate().split(/\r?\n/), wasBlank = /^(#\s+)?\s*\[LINE\]\s*$/i.test(raws[src.idx] || ''), nraw = (src.title ? '# ' : '') + (v === '' && wasBlank && !delBlank ? '[LINE]' : v);
    raws[src.idx] = nraw;
    var ed = edits(), k = scope() + sel; if (ed[k]) { ed[k].r = nraw; saveEdits(ed); }
    var all = raws.join('\n'), pk = api.pieceOn();
    if (pk) { var pw = $('f-pw'); pw.value = all; pw.dispatchEvent(new Event('input', { bubbles: true })); }
    else { var x = form.elements.x; x.value = all; x.dispatchEvent(new Event('input', { bubbles: true })); }
  }
  function cur() { var o = edits()[scope() + sel]; return o && typeof o === 'object' ? o : {}; }
  function change(fn) {
    if (!sel || sel === 'ph') return;
    var ed = edits(), e = partEl(), k = scope() + sel;
    if (e && e.hasAttribute('data-pe-new') && ed[k]) {          // that number belongs to a line that moved: use a fresh key
      var n = 2; while (ed[k + '_' + n]) n++;
      sel = sel + '_' + n; k = scope() + sel;
    }
    var o = ed[k] && typeof ed[k] === 'object' ? ed[k] : {};
    fn(o, e);
    var clean = F.peClean(o);
    if (e && e.hasAttribute('data-pl')) { var raw = curTemplate().split(/\r?\n/)[parseInt(e.getAttribute('data-pl'), 10)]; if (raw != null) clean.r = raw; }
    if (F.peIsEmpty(clean)) delete ed[k]; else ed[k] = clean;
    saveEdits(ed);
    api.render();
    syncControls();
  }

  /* ---------- open, close, follow the selected part ---------- */
  var box = document.createElement('div'); box.className = 'fcx-ov pe-box'; box.setAttribute('aria-hidden', 'true'); box.hidden = true;
  // v20261103i: the line picked last stays outlined (lighter) after Done, so "+ Add line" goes right under it
  function softEl() { var i = api.selLine ? api.selLine() : null, c = card(); return i == null || !c ? null : c.querySelector('[data-pl="' + i + '"]'); }
  function placeBox() {
    var e = sheet.hidden ? softEl() : partEl();
    box.classList.toggle('pe-soft', sheet.hidden);
    if (!e) { box.hidden = true; return; }
    if (box.parentNode !== mount) mount.appendChild(box);
    var m = mount.getBoundingClientRect(), r = e.getBoundingClientRect();
    if (!r.width && !r.height) { box.hidden = true; return; }
    var pad = 3;
    box.style.left = (r.left - m.left - pad) + 'px'; box.style.top = (r.top - m.top - pad) + 'px';
    box.style.width = (r.width + pad * 2) + 'px'; box.style.height = (r.height + pad * 2) + 'px';
    box.hidden = false;
  }
  function partsList() { var c = card(); return c ? [].slice.call(c.querySelectorAll('[data-pe]')) : []; }
  function nameOf(e) {
    if (!e) return '';
    if (e.getAttribute('data-pe') === 'ph') return tr('Photo');
    var t = (F.plainText ? F.plainText(e) : (e.textContent || '')).replace(/\s+/g, ' ').trim();
    return t.length > 34 ? t.slice(0, 32) + '…' : t;
  }
  // v20261103g: Tab and columns take several lines in one part (Enter in the words box), kept as U+2028
  function loEntries() {
    var o = cur(); if (o.lo === 'tab' || parseInt(o.co, 10) > 1) return true;
    if (typeof o.t === 'string' && o.t.indexOf('\u2028') >= 0) return true;
    if (src && src.type === 'line') { var raw = curTemplate().split(/\r?\n/)[src.idx]; return !!raw && raw.indexOf('\u2028') >= 0; }
    return false;
  }
  var LO_HINT = { '': 'Lines wrap as usual.', fit: 'One line that gets smaller so it always fits.', tab: 'Words, then the time: Kabolas Ponim 6:30. Press Enter for the next line.', arc: 'The line bends along an arc. Slide to bend it up or down.' };
  function syncLayout() {
    var o = cur(), lo = o.lo || '', co = parseInt(o.co, 10) || 1, open = !$('peLo').hidden;
    $('peLoBtn').setAttribute('aria-expanded', open ? 'true' : 'false');
    $('peLoBtn').classList.toggle('on', !!(lo || co > 1));
    [].forEach.call(sheet.querySelectorAll('.pe-lomodes button'), function (b) { b.setAttribute('aria-pressed', (b.dataset.lo || '') === lo ? 'true' : 'false'); });
    $('peLoArc').hidden = lo !== 'arc'; $('peLoTab').hidden = lo !== 'tab'; $('peLoCols').hidden = lo === 'fit' || lo === 'arc';
    if (lo === 'arc' && document.activeElement !== $('peArc')) $('peArc').value = String(o.k || 40);
    [].forEach.call(sheet.querySelectorAll('.pe-ldseg button'), function (b) { b.setAttribute('aria-pressed', (o.ld === '0' ? '0' : '1') === b.dataset.ld ? 'true' : 'false'); });
    $('peC').textContent = String(co); $('peG').textContent = String(o.cg != null ? o.cg : 4); $('peDiv').setAttribute('aria-pressed', o.cd === '1' ? 'true' : 'false');
    $('peGm').disabled = $('peGp').disabled = $('peDiv').disabled = co < 2;
    var h = tr(LO_HINT[lo] || ''); if (co > 1 && lo !== 'tab') h = tr('Press Enter for the next line; the lines are shared out over the columns.');
    $('peLoHint').textContent = h;
  }
  function syncControls() {
    var e = partEl(), o = cur();
    if (sel === 'ph') { syncPhoto(); return; }
    if (e) $('peName').textContent = nameOf(e);
    fsel.value = o.f || '';
    $('peZ').textContent = (o.z || 100) + '%';
    var bold = o.b ? o.b === '1' : (e ? parseInt(getComputedStyle(e).fontWeight, 10) >= 600 : false);
    $('peBold').setAttribute('aria-pressed', bold ? 'true' : 'false');
    [].forEach.call(sheet.querySelectorAll('#peColors .cdot'), function (b) { b.setAttribute('aria-pressed', (b.dataset.c || '') === (o.c || '') ? 'true' : 'false'); });
    if (o.c) cpick.value = o.c;
    [].forEach.call(sheet.querySelectorAll('.pe-seg button'), function (b) { b.setAttribute('aria-pressed', b.dataset.a === o.a ? 'true' : 'false'); });
    $('peReset').disabled = F.peIsEmpty(F.peClean(o));
    $('peUndoAll').hidden = !state.pe;
    syncLayout();
  }
  function syncPhoto() {
    $('peName').textContent = tr('Photo');
    $('peP').textContent = ($('o-pz') && $('o-pz').textContent) || '100%';
    [].forEach.call(sheet.querySelectorAll('#peShapes .chip'), function (b) { b.setAttribute('aria-pressed', (b.dataset.ps || '') === (state.ps || '') ? 'true' : 'false'); });
  }
  function syncWords() {
    var ta = $('peWords'), h = $('peHint'), e = partEl();
    ta.dir = state.w === 'he' || state.w === 'yi' ? 'rtl' : 'auto';
    if (src && src.type === 'none') {
      // v20261102h: nothing on the card is permanent — fixed words (מזל טוב, בס״ד, the simcha's title, names from the form)
      // can be retyped right here or deleted
      ta.hidden = false; ta.rows = loEntries() ? 3 : 1;
      var ov = cur().t;
      if (document.activeElement !== ta) ta.value = typeof ov === 'string' ? ov.replace(/\u2028/g, '\n') : (e ? (F.plainText ? F.plainText(e) : (e.textContent || '').replace(/\s+/g, ' ').trim()) : '');
      h.innerHTML = '';
      if (ov === '') { var em = document.createElement('div'); em.textContent = tr('This line is empty now. Type to bring it back.'); h.appendChild(em); }
      var fid0 = FORM_OF[sel], target0 = fid0 && $(fid0);
      if (target0) {
        var s0 = document.createElement('span'); s0.textContent = tr('These words come from the form.') + ' ';
        var b0 = document.createElement('button'); b0.type = 'button'; b0.className = 'linkbtn'; b0.textContent = tr('Change in the form');
        b0.addEventListener('click', function () { close(); if (window.__fcEd && window.__fcEd.reveal && window.__fcEd.reveal(target0)) return; target0.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
        h.appendChild(s0); h.appendChild(b0);
      }
      h.hidden = !h.childNodes.length;
      return;
    }
    if (!src) {
      ta.hidden = true; ta.value = '';
      h.innerHTML = '';
      var fid = FORM_OF[sel], target = fid && $(fid);
      if (target) {
        var s = document.createElement('span'); s.textContent = tr('These words come from the form.') + ' ';
        var b = document.createElement('button'); b.type = 'button'; b.className = 'linkbtn'; b.textContent = tr('Change in the form');
        b.addEventListener('click', function () { close(); if (window.__fcEd && window.__fcEd.reveal && window.__fcEd.reveal(target)) return; /* v20261102g: in the editor the form lives in its drawer */ target.scrollIntoView({ block: 'center', behavior: 'smooth' }); if (target.focus && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) setTimeout(function () { target.focus({ preventScroll: true }); }, 350); });
        h.appendChild(s); h.appendChild(b);
      }
      h.hidden = !target;
      return;
    }
    ta.hidden = false;
    if (document.activeElement !== ta) ta.value = srcValue();
    ta.rows = src.multi || loEntries() ? 3 : 1;
    var msg = '';
    if (!e) msg = tr('This line is empty now. Type to bring it back.');
    else if (src.type === 'line' && src.tokens) msg = tr('Words in [BRACKETS] fill in from your details.');
    h.textContent = msg; h.hidden = !msg;
  }
  function open(key) {
    sel = key;
    var e = partEl(); if (!e) return;
    if (api.selectLine) api.selectLine(e.hasAttribute('data-pl') ? parseInt(e.getAttribute('data-pl'), 10) : null);
    var photo = key === 'ph';
    $('peText').hidden = photo; $('pePhoto').hidden = !photo;
    src = photo ? null : sourceOf(e);
    sheet.hidden = false; document.body.classList.add('pe-open');
    if (!photo) syncWords();
    syncControls(); placeBox();
    setTimeout(function () { reveal(); placeBox(); }, 30);
    setTimeout(function () { if (sel === key) { reveal(); placeBox(); } }, 480);
  }
  function close() {
    sel = null; src = null; sheet.hidden = true; box.hidden = true; document.body.classList.remove('pe-open');
    placeBox();
  }
  // keep the selected part in view above the panel (phones)
  function reveal() {
    var e = partEl(); if (!e) return;
    var r = e.getBoundingClientRect(), sh = sheet.getBoundingClientRect();
    var narrow = window.innerWidth <= 900, bottomLimit = narrow ? sh.top - 12 : window.innerHeight - 12;
    if (r.bottom > bottomLimit || r.top < 70) {
      var want = narrow ? Math.max(70, (sh.top - r.height) / 2) : (window.innerHeight - r.height) / 2;
      var pc = document.querySelector('.preview-col');
      if (!narrow && pc && pc.scrollHeight > pc.clientHeight) pc.scrollBy({ top: r.top - want, behavior: 'smooth' });
      else window.scrollBy({ top: r.top - want, behavior: 'smooth' });
    }
  }
  function step(dir) {
    var l = partsList(); if (!l.length) return;
    var i = l.indexOf(partEl()); i = i < 0 ? 0 : (i + dir + l.length) % l.length;
    open(l[i].getAttribute('data-pe'));
  }

  mount.addEventListener('click', function (ev) {
    var c = card(); if (!c || !c.contains(ev.target)) return;
    var e = ev.target.closest('[data-pe]');
    if (!e || !c.contains(e)) { if (!sheet.hidden) close(); if (api.selectLine) api.selectLine(null); placeBox(); return; }
    open(e.getAttribute('data-pe'));
  });
  $('peDone').addEventListener('click', close);
  $('pePrev').addEventListener('click', function () { step(-1); });
  $('peNext').addEventListener('click', function () { step(1); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !sheet.hidden) close(); });
  $('peWords').addEventListener('input', function (ev) {
    if (src && src.type === 'none') { var v = ev.target.value.replace(/\r?\n/g, loEntries() ? '\u2028' : ' '); change(function (o) { o.t = v; }); syncWords(); placeBox(); return; }
    writeWords(ev.target.value); syncWords(); placeBox();
  });
  // v20261102h: one tap deletes the line, whatever it is
  function delLine() {
    if (!sel || sel === 'ph' || !src) return;
    if (src.type === 'none') change(function (o) { o.t = ''; });
    else { delBlank = true; writeWords(''); delBlank = false; }
    $('peWords').value = '';
    syncWords(); syncControls(); placeBox();
  }
  $('peDel').addEventListener('click', delLine);
  fsel.addEventListener('change', function () { var v = fsel.value; change(function (o) { if (v) o.f = v; else delete o.f; }); });
  function zoomBy(d) { change(function (o) { var z = Math.max(40, Math.min(300, (parseInt(o.z, 10) || 100) + d)); if (z === 100) delete o.z; else o.z = z; }); }
  $('peZm').addEventListener('click', function () { zoomBy(-10); });
  $('peZp').addEventListener('click', function () { zoomBy(10); });
  $('peBold').addEventListener('click', function () {
    var on = $('peBold').getAttribute('aria-pressed') === 'true';
    change(function (o) { o.b = on ? '0' : '1'; });
  });
  [].forEach.call(sheet.querySelectorAll('.pe-seg button'), function (b) {
    b.addEventListener('click', function () { var a = b.dataset.a; change(function (o) { if (o.a === a) delete o.a; else o.a = a; }); });
  });
  function lineBy(d) {
    change(function (o, e) {
      var l = parseFloat(o.l);
      if (!isFinite(l) || !l) {
        l = 1.2;
        if (e) { var cs = getComputedStyle(e), lh = parseFloat(cs.lineHeight), fs = parseFloat(cs.fontSize); if (isFinite(lh) && isFinite(fs) && fs) l = lh / fs; }
      }
      o.l = Math.max(0.6, Math.min(3, Math.round((l + d) * 100) / 100));
    });
  }
  $('peLm').addEventListener('click', function () { lineBy(-0.1); });
  $('peLp').addEventListener('click', function () { lineBy(0.1); });
  // v20261103g: Layout (Paragraph / Copyfit / Tab / Curve + columns)
  $('peLoBtn').addEventListener('click', function () { $('peLo').hidden = !$('peLo').hidden; syncLayout(); if (!$('peLo').hidden) setTimeout(function () { $('peLo').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 30); });
  [].forEach.call(sheet.querySelectorAll('.pe-lomodes button'), function (b) {
    b.addEventListener('click', function () {
      var v = b.dataset.lo;
      change(function (o) { if (v) o.lo = v; else delete o.lo; if (v !== 'arc') delete o.k; else if (!o.k) o.k = 40; if (v !== 'tab') delete o.ld; });
      syncWords(); placeBox();
    });
  });
  var arcRaf = 0;
  $('peArc').addEventListener('input', function () {
    var v = parseInt($('peArc').value, 10) || 0; if (!v) v = 5;
    cancelAnimationFrame(arcRaf); arcRaf = requestAnimationFrame(function () { change(function (o) { o.lo = 'arc'; o.k = v; }); placeBox(); });
  });
  [].forEach.call(sheet.querySelectorAll('.pe-ldseg button'), function (b) {
    b.addEventListener('click', function () { var v = b.dataset.ld; change(function (o) { if (v === '0') o.ld = '0'; else delete o.ld; }); });
  });
  function colsBy(d) { change(function (o) { var n = Math.max(1, Math.min(4, (parseInt(o.co, 10) || 1) + d)); if (n > 1) o.co = n; else { delete o.co; delete o.cg; delete o.cd; } }); syncWords(); placeBox(); }
  function gapBy(d) { change(function (o) { var g = Math.max(0, Math.min(12, (o.cg != null ? parseInt(o.cg, 10) : 4) + d)); if (g === 4) delete o.cg; else o.cg = g; }); placeBox(); }
  $('peCm').addEventListener('click', function () { colsBy(-1); });
  $('peCp').addEventListener('click', function () { colsBy(1); });
  $('peGm').addEventListener('click', function () { gapBy(-1); });
  $('peGp').addEventListener('click', function () { gapBy(1); });
  $('peDiv').addEventListener('click', function () { var on = $('peDiv').getAttribute('aria-pressed') === 'true'; change(function (o) { if (on) delete o.cd; else o.cd = '1'; }); });
  // move buttons: a tap moves one step, holding keeps moving
  [].forEach.call(sheet.querySelectorAll('.pe-move button'), function (b) {
    var dx = parseInt(b.dataset.mx, 10), dy = parseInt(b.dataset.my, 10), t1 = null, t2 = null, used = false;
    function mv() { change(function (o) { o.x = (parseInt(o.x, 10) || 0) + dx; o.y = (parseInt(o.y, 10) || 0) + dy; }); placeBox(); }
    function stop() { clearTimeout(t1); clearInterval(t2); t1 = t2 = null; }
    b.addEventListener('pointerdown', function (ev) { if (ev.button > 0) return; used = true; mv(); stop(); t1 = setTimeout(function () { t2 = setInterval(mv, 90); }, 420); });
    ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach(function (n) { b.addEventListener(n, stop); });
    b.addEventListener('click', function () { if (used) { used = false; return; } mv(); });   // keyboard
    b.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
  });
  $('peReset').addEventListener('click', function () {
    var ed = edits(); delete ed[scope() + sel]; saveEdits(ed); api.render(); syncControls();
    if (src) { $('peWords').value = ''; $('peWords').blur(); syncWords(); } placeBox();
  });
  $('peUndoAll').addEventListener('click', function () {
    if (!confirm(tr('Undo all part changes') + '?')) return;
    delete state.pe; api.render(); syncControls(); $('peUndoAll').hidden = true;
  });
  $('pePm').addEventListener('click', function () { var b = document.querySelector('.stepper[data-k="pz"] button[data-d="-10"]'); if (b) b.click(); syncPhoto(); });
  $('pePp').addEventListener('click', function () { var b = document.querySelector('.stepper[data-k="pz"] button[data-d="10"]'); if (b) b.click(); syncPhoto(); });
  $('pePx').addEventListener('click', function () { var b = $('photoClear'); if (b) b.click(); close(); });

  var raf = 0, later = [];
  function after() {
    $('peUndoAll').hidden = !state.pe;
    if (sheet.hidden) { cancelAnimationFrame(raf); raf = requestAnimationFrame(placeBox); return; }
    if (sel && !partEl() && sel !== 'ph') {
      // the line is gone (emptied) or the card changed under us: keep the words box, hide the outline
      box.hidden = true;
    }
    if (src && sel !== 'ph') syncWords();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(placeBox);
    later.forEach(clearTimeout); later = [setTimeout(placeBox, 250), setTimeout(placeBox, 800)];
  }
  window.addEventListener('resize', function () { if (!sheet.hidden) placeBox(); });
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { setTimeout(placeBox, 120); });
  // switching between the card and a matching-set piece, or another simcha, closes the panel
  document.addEventListener('click', function (ev) { if (!sheet.hidden && ev.target.closest && ev.target.closest('#pieceChips .chip, #typeChips .chip, #langSeg button, #startOver')) close(); }, true);
  $('peUndoAll').hidden = !state.pe;
  window.FCPartEdit = { after: after, open: open, close: close, mark: placeBox, selected: function () { return sel; } };
})();
