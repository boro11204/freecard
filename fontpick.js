/* FreeCard v20261103f: the compact font list. Every <select> of fonts on the page (the card's lettering, the font for
   the top / names / details, and the font of one line) becomes one small button showing the font's own letters; tapping
   it opens a scrollable list of every font, each name drawn in its own letters. A font file is fetched only when its row
   scrolls into view or the font is used on the card. The <select> stays underneath and keeps the value. */
(function () {
  'use strict';
  var F = window.FreeCard; if (!F) return;
  function tr(s) { return window.FCi18n ? window.FCi18n.t(s) : s; }
  if (window.FCi18n && window.FCi18n.add) window.FCi18n.add({
    'Yiddish & sofer classics': ['אידיש וסת״ם קלאסי', 'אידיש און סת״ם קלאסיש'], 'Elegant & headline': ['מהודר וכותרות', 'שיין און קעפלעך'],
    'Classic': ['קלאסי', 'קלאסיש'], 'Modern & fun': ['מודרני ושמח', 'מאדערן און פריילעך'], 'English letters only': ['אותיות אנגליות בלבד', 'נאר ענגלישע אותיות'],
    'Choose the lettering': ['בחירת גופן', 'קלייבט א שריפט'], 'Close': ['סגירה', 'פארמאכן'], 'Done': ['סיום', 'פארטיג'],
    'Same as the card': ['כמו בהזמנה', 'ווי אויפן קארטל'], 'Same as card': ['כמו בהזמנה', 'ווי אויפן קארטל'], 'fonts': ['גופנים', 'שריפטן'],
    'Add line': ['הוספת שורה', 'צולייגן א שורה'], 'Clear all text': ['ניקוי כל הטקסט', 'אויסמעקן אלע ווערטער'], 'Start from scratch': ['להתחיל מאפס', 'אנהייבן פון אנפאנג'],
    'Plain background': ['רקע חלק', 'גלאטער הינטערגרונט'], 'Tap to write': ['הקישו כדי לכתוב', 'דריקט צו שרייבן'],
    'Clear all the words on the card? You can then write your own lines.': ['למחוק את כל המילים בהזמנה? אחר כך תוכלו לכתוב שורות משלכם.', 'אויסמעקן אלע ווערטער אויפן קארטל? דערנאך קענט איר שרייבן אייערע אייגענע שורות.'],
    'Tap a line on the card to write it, or add more lines.': ['הקישו על שורה בהזמנה כדי לכתוב אותה, או הוסיפו שורות.', 'דריקט אויף א שורה אויפן קארטל צו שרייבן, אדער לייגט צו מער שורות.'],
    'Start a card from scratch? The words on this card will be cleared.': ['להתחיל הזמנה מאפס? המילים בהזמנה יימחקו.', 'אנהייבן א קארטל פון אנפאנג? די ווערטער אויף דעם קארטל ווערן אויסגעמעקט.'],
    'Blank card: pick a design or a plain background, then tap a line to write.': ['הזמנה ריקה: בחרו עיצוב או רקע חלק, ואז הקישו על שורה כדי לכתוב.', 'ליידיגער קארטל: קלייבט א דיזיין אדער א גלאטן הינטערגרונט, דערנאך דריקט אויף א שורה צו שרייבן.']
  });
  var GROUPS = window.FCFontGroups || [['', Object.keys(F.FONTS)]];
  var TILE = window.FCTileFont;
  var nativeValue = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  var open = null; // { sel, pop, opts }
  function isPhone() { return Math.min(window.innerWidth, document.documentElement.clientWidth || 9999) <= 640; }
  function fontOf(k, size) {
    var f = F.FONTS[k]; if (!f) return '';
    if (f.enOnly) return f.weight + ' ' + size + "px '" + f.family + "', serif";
    if (TILE) { try { return TILE(k, 0).replace(/([\d.]+)em/, function (a, n) { return (parseFloat(n) * size) + 'px'; }); } catch (e) {} }
    return (f.weight || 400) + ' ' + size + "px '" + (f.family || 'Frank Ruhl Libre') + "', 'Frank Ruhl Libre', serif";
  }
  function sampleText(k) { var f = F.FONTS[k]; return f && f.enOnly ? 'Mazel Tov' : 'מזל טוב'; }
  function fixed(k, s) { var f = F.FONTS[k]; return f && f.fix && F.fixText ? F.fixText(s, f.fix) : s; }
  function setSample(span, k, size) { span.textContent = fixed(k, sampleText(k)); span.style.font = fontOf(k, size); span.dir = F.FONTS[k].enOnly ? 'ltr' : 'rtl'; }

  function label(sel) {
    var b = sel._fpBtn; if (!b) return;
    var k = nativeValue.get.call(sel), s = b.querySelector('.fp-bs'), n = b.querySelector('.fp-bn');
    if (k && F.FONTS[k]) { setSample(s, k, b.classList.contains('fp-main') ? 24 : 19); s.hidden = false; n.textContent = tr(F.FONTS[k].name); n.setAttribute('data-noi18n', ''); }
    else { s.hidden = true; s.textContent = ''; var o = sel.options[sel.selectedIndex]; n.textContent = o ? o.textContent : ''; }
    b.setAttribute('aria-label', (sel.getAttribute('aria-label') || tr('Font')) + ': ' + n.textContent);
  }
  function enhance(sel, opts) {
    if (!sel || sel._fpBtn) return;
    opts = opts || {};
    var b = document.createElement('button'); b.type = 'button'; b.className = 'fp-btn' + (opts.main ? ' fp-main' : '');
    b.setAttribute('aria-haspopup', 'listbox'); b.setAttribute('aria-expanded', 'false');
    b.innerHTML = '<span class="fp-bs" aria-hidden="true"></span><span class="fp-bn"></span><span class="fp-chev" aria-hidden="true">▾</span>';
    sel.classList.add('fp-native'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    sel.parentNode.insertBefore(b, sel.nextSibling);
    sel._fpBtn = b; sel._fpOpts = opts;
    Object.defineProperty(sel, 'value', { configurable: true, get: function () { return nativeValue.get.call(this); }, set: function (v) { nativeValue.set.call(this, v); label(this); if (open && open.sel === this) mark(); } });
    sel.addEventListener('change', function () { label(sel); });
    b.addEventListener('click', function (ev) { ev.preventDefault(); if (open && open.sel === sel) close(); else show(sel, {}); });
    // a <label for> on the select opens the list too
    if (sel.id) [].forEach.call(document.querySelectorAll('label[for="' + sel.id + '"]'), function (l) { l.addEventListener('click', function (ev) { ev.preventDefault(); b.focus(); }); });
    label(sel);
  }

  var io = null;
  function rows(sel, list) {
    var have = {}; [].forEach.call(sel.options, function (o) { have[o.value] = o; });
    if (have['']) list.appendChild(row(sel, '', have[''].textContent));
    GROUPS.forEach(function (g) {
      var ks = g[1].filter(function (k) { return have[k]; }); if (!ks.length) return;
      if (g[0]) { var h = document.createElement('div'); h.className = 'fp-gh'; h.setAttribute('role', 'presentation'); h.textContent = tr(g[0]); list.appendChild(h); }
      ks.forEach(function (k) { list.appendChild(row(sel, k)); });
    });
  }
  function row(sel, k, text) {
    var r = document.createElement('div'); r.className = 'fp-row'; r.setAttribute('role', 'option'); r.tabIndex = -1; r.dataset.v = k;
    if (!k) { r.classList.add('fp-same'); r.innerHTML = '<span class="fp-s"></span><span class="fp-nm"><b></b></span>'; r.querySelector('b').textContent = text; }
    else {
      var f = F.FONTS[k];
      r.innerHTML = '<span class="fp-s" aria-hidden="true"></span><span class="fp-nm"><b data-noi18n></b><small dir="rtl" data-noi18n></small></span>' + (f.yi ? '<i class="nb">New</i>' : '');
      r.querySelector('b').textContent = f.name; r.querySelector('small').textContent = f.enOnly ? tr('English letters only') : (f.he || '');
      var s = r.querySelector('.fp-s'); s.textContent = fixed(k, sampleText(k)); s.dir = f.enOnly ? 'ltr' : 'rtl';
      s._k = k; // its font is set when the row comes into view (so only the fonts looked at are fetched)
      if (io) io.observe(s); else setSample(s, k, 23);
    }
    r.addEventListener('click', function () { pick(sel, k); });
    return r;
  }
  function pick(sel, k) {
    nativeValue.set.call(sel, k); label(sel); mark();
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    if (!(open && open.keep)) close();
  }
  function mark() {
    if (!open) return; var v = nativeValue.get.call(open.sel);
    [].forEach.call(open.list.querySelectorAll('.fp-row'), function (r) { var on = r.dataset.v === v; r.setAttribute('aria-selected', String(on)); r.classList.toggle('on', on); });
  }
  function place() {
    if (!open) return;
    var pop = open.pop, b = open.sel._fpBtn;
    if (open.sheet) { pop.classList.add('fp-sheet'); pop.style.cssText = ''; return; }
    pop.classList.remove('fp-sheet');
    var r = b.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var w = Math.min(Math.max(Math.min(r.width, 440), 300), vw - 16), left = Math.min(Math.max(8, r.left), vw - w - 8);
    var below = vh - r.bottom - 10, above = r.top - 10, up = below < 260 && above > below;
    var h = Math.max(180, Math.min(440, up ? above : below));
    pop.style.cssText = 'left:' + left + 'px;width:' + w + 'px;max-height:' + h + 'px;' + (up ? 'bottom:' + (vh - r.top + 4) + 'px;top:auto' : 'top:' + (r.bottom + 4) + 'px;bottom:auto');
  }
  function show(sel, how) {
    close();
    var sheet = !!how.sheet || isPhone();
    var pop = document.createElement('div'); pop.className = 'fp-pop';
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', tr('Choose the lettering'));
    var head = document.createElement('div'); head.className = 'fp-head';
    head.innerHTML = '<b></b><button type="button" class="fp-x"></button>';
    head.querySelector('b').textContent = (sel.getAttribute('aria-label') ? tr(sel.getAttribute('aria-label')) : tr('Font')) + ' · ' + Object.keys(F.FONTS).filter(function (k) { return [].some.call(sel.options, function (o) { return o.value === k; }); }).length + ' ' + tr('fonts');
    var x = head.querySelector('.fp-x'); x.textContent = how.keep ? tr('Done') : '✕'; x.setAttribute('aria-label', tr('Close'));
    x.addEventListener('click', close);
    var list = document.createElement('div'); list.className = 'fp-list'; list.setAttribute('role', 'listbox'); list.tabIndex = -1;
    pop.appendChild(head); pop.appendChild(list);
    var catcher = document.createElement('div'); catcher.className = 'fp-catch' + (sheet ? ' fp-dim' : '');
    catcher.addEventListener('click', close);
    document.body.appendChild(catcher); document.body.appendChild(pop);
    io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target); setSample(e.target, e.target._k, 23); });
    }, { root: list, rootMargin: '120px 0px' }) : null;
    open = { sel: sel, pop: pop, list: list, catcher: catcher, sheet: sheet, keep: !!how.keep && sheet, io: io };
    rows(sel, list);
    sel._fpBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('fp-open');
    place(); mark();
    var on = list.querySelector('.fp-row.on') || list.querySelector('.fp-row');
    if (on) { list.scrollTop = Math.max(0, on.offsetTop - list.clientHeight / 2 + on.offsetHeight / 2); try { on.focus({ preventScroll: true }); } catch (e) {} }
    pop.addEventListener('keydown', keys);
  }
  function keys(ev) {
    if (!open) return;
    var rs = [].slice.call(open.list.querySelectorAll('.fp-row')), i = rs.indexOf(document.activeElement);
    if (ev.key === 'Escape') { ev.preventDefault(); var b = open.sel._fpBtn; close(); b.focus(); return; }
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); var j = Math.max(0, Math.min(rs.length - 1, i + (ev.key === 'ArrowDown' ? 1 : -1))); rs[j].focus(); rs[j].scrollIntoView({ block: 'nearest' }); return; }
    if ((ev.key === 'Enter' || ev.key === ' ') && i >= 0) { ev.preventDefault(); rs[i].click(); return; }
    if (ev.key === 'Tab') close();
  }
  function close() {
    if (!open) return;
    var o = open; open = null;
    if (o.io) o.io.disconnect(); io = null;
    o.pop.remove(); o.catcher.remove();
    o.sel._fpBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('fp-open');
  }
  window.addEventListener('resize', function () { if (open) place(); });
  window.addEventListener('scroll', function () { if (open && !open.sheet) place(); }, true);

  function init() {
    enhance(document.getElementById('f-f'), { main: true });
    ['f-tf', 'f-nf', 'f-bf', 'peFont'].forEach(function (id) { enhance(document.getElementById(id), {}); });
    // "+ Add line" also inside the panel for one line
    var top = document.querySelector('#peSheet .pe-top'), api = window.__fcApi;
    if (top && api && api.addLine && !document.getElementById('peAddLine')) {
      var a = document.createElement('button'); a.type = 'button'; a.className = 'pe-add'; a.id = 'peAddLine';
      a.innerHTML = '<span aria-hidden="true">＋</span> <span>' + tr('Add line') + '</span>';
      a.addEventListener('click', function () { api.addLine(); });
      var done = document.getElementById('peDone'); top.insertBefore(a, done);
    }
  }
  init();
  window.FCFontPick = { open: function (sel, how) { if (sel && sel._fpBtn) show(sel, how || {}); }, close: close, enhance: enhance };
})();
