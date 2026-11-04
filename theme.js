/* FreeCard redesign sample: home gallery, editor tool dock and the theme's own extra strings.
   Pure UI on top of the site: it reads FreeCard's designs and presses the editor's own buttons. */
(function () {
  'use strict';
  var F = window.FreeCard, I = window.FCi18n;
  if (I && I.add) I.add({
    'New designs': ['עיצובים חדשים', 'נייע דיזיינס'], 'All': ['הכל', 'אלע'], 'New': ['חדש', 'נײַ'],
    'Show more designs': ['עוד עיצובים', 'נאך דיזיינס'], 'Browse the designs': ['לעיצובים', 'זעט די דיזיינס'],
    'Tap a design to make it yours. The words, the date and everything else you fill in.': ['הקישו על עיצוב כדי להתחיל. את הנוסח, התאריך וכל השאר ממלאים אתם.', 'דריקט אויף א דיזיין צו אנהייבן. די ווערטער, די דאטום און אלעס אנדערש פילט איר אריין.'],
    'The collection': ['האוסף', 'די זאמלונג'], 'designs': ['עיצובים', 'דיזיינס'], 'simchas': ['שמחות', 'שמחות'],
    'Words': ['נוסח', 'ווערטער'], 'Font': ['גופן', 'שריפט'], 'Add line': ['הוסף שורה', 'צולייגן שורה'], 'Layout': ['פריסה', 'אויסשטעל'],
    'Colors': ['צבעים', 'פארבן'], 'Download': ['הורדה', 'אראפלאדן'], 'Free, always': ['חינם, תמיד', 'אומזיסט, אלעמאל'],
    'Invitations for every simcha': ['הזמנות לכל שמחה', 'איינלאדונגען פאר יעדע שמחה'],
    'Made with care for every simcha.': ['נעשה באהבה לכל שמחה.', 'געמאכט מיט ליבשאפט פאר יעדע שמחה.'],
    'Fonts': ['גופנים', 'שריפטן'], 'Make a card': ['יצירת הזמנה', 'מאכן א קארטל'], 'Credits': ['קרדיטים', 'קרעדיטן'],
    'Choose a design, fill in the details, download.': ['בוחרים עיצוב, ממלאים פרטים, מורידים.', 'קלייבט א דיזיין, פילט אריין, לאדט אראפ.'],
    'Lashon Kodesh, Yiddish & English wording': ['נוסח בלשון הקודש, אידיש ואנגלית', 'ווערטער אין לשון קודש, אידיש און ענגליש'],
    'Start with a design': ['מתחילים מעיצוב', 'הייבט אן מיט א דיזיין']
  });
  if (I && I.add) I.add({
    'The FreeCard collection': ['האוסף של FreeCard', 'די FreeCard זאמלונג'],
    'Invitations worthy': ['הזמנות', 'איינלאדונגען'], 'of your simcha.': ['הראויות לשמחה שלכם.', 'ווערט פאר אייער שמחה.'],
    'Hundreds of designs, full wording in Lashon Kodesh, Yiddish and English, and your card ready to send on WhatsApp or print, free.': ['מאות עיצובים, נוסח מלא בלשון הקודש, אידיש ואנגלית, וההזמנה מוכנה לשליחה בוואטסאפ או להדפסה, בחינם.', 'הונדערטער דיזיינס, פולע ווערטער אין לשון קודש, אידיש און ענגליש, און אייער קארטל גרייט צו שיקן אויף וואטסאפ אדער דרוקן, אומזיסט.'],
    'Simcha invitations · free': ['הזמנות לשמחות · חינם', 'שמחה איינלאדונגען · אומזיסט'],
    'Beautiful invitations.': ['הזמנות יפות.', 'שיינע איינלאדונגען.'], 'Ready in a minute.': ['מוכנות בדקה.', 'גרייט אין א מינוט.'],
    'Choose a design, fill in the details in Lashon Kodesh, Yiddish or English, download a JPEG for WhatsApp or a PDF to print.': ['בוחרים עיצוב, ממלאים פרטים בלשון הקודש, אידיש או אנגלית, ומורידים JPEG לוואטסאפ או PDF להדפסה.', 'קלייבט א דיזיין, פילט אריין די פרטים אין לשון קודש, אידיש אדער ענגליש, לאדט אראפ א JPEG פאר וואטסאפ אדער א PDF צו דרוקן.'],
    'Lovely invitations for every simcha,': ['הזמנות מקסימות לכל שמחה,', 'שיינע איינלאדונגען פאר יעדע שמחה,'], 'made in a minute.': ['מוכנות בדקה.', 'געמאכט אין א מינוט.'],
    'Pick your simcha and a design, fill in the details in Lashon Kodesh, Yiddish or English, then download a JPEG for WhatsApp or a PDF to print. Free.': ['בוחרים שמחה ועיצוב, ממלאים פרטים בלשון הקודש, אידיש או אנגלית, ומורידים JPEG לוואטסאפ או PDF להדפסה. בחינם.', 'קלייבט די שמחה און א דיזיין, פילט אריין די פרטים אין לשון קודש, אידיש אדער ענגליש, און לאדט אראפ א JPEG פאר וואטסאפ אדער א PDF צו דרוקן. אומזיסט.'],
    'Start from scratch': ['להתחיל מאפס', 'אנהייבן פון אנפאנג'], 'Simcha Invitations': ['הזמנות לשמחות', 'שמחה איינלאדונגען']
  });
  if (!F) return;
  var D = F.DESIGNS;
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }

  /* ---------- home: the design gallery with simcha chips ---------- */
  var gal = document.getElementById('gallery');
  if (gal) {
    var chipsBox = gal.querySelector('.g-chips'), grid = gal.querySelector('.g-grid'), more = gal.querySelector('.g-more');
    var types = [], mode = gal.getAttribute('data-mode') || 'all';
    [].forEach.call(document.querySelectorAll('.types a.type[href*="type="]'), function (a) {
      var t = (a.getAttribute('href').match(/type=([a-z]+)/) || [])[1]; if (!t || !F.TYPES[t]) return;
      var en = a.querySelector('.t-en'), he = a.querySelector('.t-he');
      types.push({ t: t, en: en ? en.textContent : t, he: he ? he.textContent : '' });
    });
    // v20261103h: the All designs page has no simcha cards; its chips come from the simchas themselves
    if (!types.length) Object.keys(F.TYPES).forEach(function (t) { if (F.designsFor(t).first.some(function (k) { return D[k] && D[k].kind === 'img'; })) types.push({ t: t, en: F.TYPES[t].en || t, he: F.TYPES[t].he || '' }); });
    var all = Object.keys(D).filter(function (k) { return !D[k].plain && D[k].kind === 'img'; });
    var newOnes = all.filter(function (k) { return D[k].nb; });
    var cnt = gal.querySelector('.g-count'); if (cnt) cnt.textContent = String(Object.keys(D).filter(function (k) { return !D[k].plain; }).length);
    var lang = (I && I.lang && I.lang() === 'yi') ? 'yi' : 'he';
    var FEAT = 8, cur = 'new', shown = 0, list = [], PAGE = mode === 'featured' ? FEAT : (window.innerWidth < 600 ? 12 : 24);
    var io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); draw(e.target); } });
    }, { rootMargin: '300px 0px' }) : null;
    function draw(w) {
      var k = w.getAttribute('data-k'), t = w.getAttribute('data-t');
      try { F.renderCard(F.sampleCard(t, k, lang), w, { thumb: true }); w.classList.add('drawn'); } catch (e) { console.warn(e); }
      var cd = w.querySelector('.fc-card[data-bg]'); if (cd && !cd.style.backgroundImage) cd.style.backgroundImage = "url('" + cd.getAttribute('data-bg') + "')";
    }
    function chip(key, en, he) {
      var b = el('button', 'g-chip'); b.type = 'button'; b.setAttribute('data-g', key); b.setAttribute('aria-pressed', String(key === cur));
      b.appendChild(el('span', 'g-en')).textContent = en;
      if (he) { var h = el('span', 'g-he'); h.setAttribute('dir', 'rtl'); h.textContent = he; b.appendChild(h); }
      b.addEventListener('click', function () { pick(key); });
      return b;
    }
    if (chipsBox) {
      chipsBox.appendChild(chip('new', 'New', 'חדש'));
      chipsBox.appendChild(chip('all', 'All', 'הכל'));
      types.forEach(function (x) { chipsBox.appendChild(chip(x.t, x.en, x.he)); });
    }
    function listFor(key) {
      if (key === 'featured') { // v20261103h: home shows only a short row of the newest, one per simcha, not the whole collection
        var seen = {}, out = [];
        (F.FEATURED || []).forEach(function (k) { if (out.length < FEAT && D[k] && D[k].kind === 'img' && !out.some(function (x) { return x[0] === k; })) { out.push([k, D[k].types[0]]); seen[D[k].types[0]] = 1; } }); // v20261103l: a chosen row first
        newOnes.forEach(function (k) { var t = D[k].types[0]; if (out.length < FEAT && !seen[t]) { seen[t] = 1; out.push([k, t]); } });
        newOnes.forEach(function (k) { if (out.length < FEAT && !out.some(function (x) { return x[0] === k; })) out.push([k, D[k].types[0]]); });
        return out;
      }
      if (key === 'new') return newOnes.map(function (k) { return [k, D[k].types[0]]; });
      if (key === 'all') { var nb = all.filter(function (k) { return D[k].nb; }), rest = all.filter(function (k) { return !D[k].nb; }); return nb.concat(rest).map(function (k) { return [k, D[k].types[0]]; }); }
      var g = F.designsFor(key); return g.first.filter(function (k) { return D[k].kind === 'img'; }).map(function (k) { return [k, key]; });
    }
    function tile(k, t) {
      var d = D[k], a = el('a', 'g-tile'); a.href = 'make.html?type=' + t + '&design=' + encodeURIComponent(k);
      a.setAttribute('aria-label', d.name);
      var w = el('div', 'fc-wrap g-card'); w.setAttribute('data-k', k); w.setAttribute('data-t', t); if (d.vars && d.vars.bg) w.style.backgroundColor = d.vars.bg;
      a.appendChild(w);
      var cap = el('span', 'g-cap'); cap.appendChild(el('span', 'g-name')).textContent = d.name;
      var tt = F.TYPES[t]; if (tt) cap.appendChild(el('small', 'g-type')).textContent = tt.en;
      a.appendChild(cap);
      if (d.nb) a.appendChild(el('i', 'nb')).textContent = 'New';
      return a;
    }
    function page() {
      var end = Math.min(list.length, shown + PAGE);
      for (var i = shown; i < end; i++) { var a = tile(list[i][0], list[i][1]); grid.appendChild(a); var w = a.firstChild; if (io) io.observe(w); else draw(w); }
      shown = end; if (more) more.hidden = shown >= list.length;
    }
    function pick(key) {
      cur = key; list = listFor(key); shown = 0; grid.innerHTML = '';
      if (!chipsBox) { page(); return; }
      [].forEach.call(chipsBox.querySelectorAll('.g-chip'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-g') === key)); });
      if (mode === 'all' && history.replaceState) { try { var u = new URL(location.href); if (key === 'new') u.searchParams.delete('g'); else u.searchParams.set('g', key); history.replaceState(null, '', u); } catch (x) {} }
      var on = chipsBox.querySelector('[aria-pressed="true"]'); if (on && on.scrollIntoView && chipsBox.scrollWidth > chipsBox.clientWidth) { try { chipsBox.scrollTo({ left: on.offsetLeft - 24, behavior: 'smooth' }); } catch (x) {} }
      page();
    }
    if (more) more.addEventListener('click', page);
    var g0 = new URLSearchParams(location.search).get('g');
    pick(mode === 'featured' ? 'featured' : (g0 && (g0 === 'all' || F.TYPES[g0]) ? g0 : 'new'));
  }

  /* ---------- v20261103h: each simcha card on the home page shows one of its designs ---------- */
  var tcards = document.querySelectorAll('.types a.type');
  if (tcards.length) {
    var lang2 = (I && I.lang && I.lang() === 'yi') ? 'yi' : 'he';
    var io2 = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io2.unobserve(e.target); drawType(e.target); } });
    }, { rootMargin: '400px 0px' }) : null;
    var PICK = { chasuna: 'ai15adobechasunablacklacquergoldpeonie' }; // the home page's own cover for the chasuna
    function drawType(w) {
      var t = w.getAttribute('data-t'), k = w.getAttribute('data-k');
      try { F.renderCard(F.sampleCard(t, k, lang2), w, { thumb: true }); w.classList.add('drawn'); } catch (e) { console.warn(e); }
      var cd = w.querySelector('.fc-card[data-bg]'); if (cd && !cd.style.backgroundImage) cd.style.backgroundImage = "url('" + cd.getAttribute('data-bg') + "')";
    }
    [].forEach.call(tcards, function (a) {
      var m = (a.getAttribute('href') || '').match(/type=([a-z]+)/), t = m && m[1], k = null;
      if (t && F.TYPES[t]) {
        var f = F.designsFor(t).first.filter(function (x) { return D[x] && D[x].kind === 'img'; });
        k = PICK[t] && f.indexOf(PICK[t]) >= 0 ? PICK[t] : f[0];
      }
      var w = el('div', 'fc-wrap t-pic'); a.classList.add('has-pic'); a.insertBefore(w, a.firstChild);
      if (!k) { w.classList.add('t-pic-blank'); if (a.classList.contains('t-custom')) { w.setAttribute('data-t', 'mazeltov'); w.setAttribute('data-k', 'plaincream'); } else return; }
      else { w.setAttribute('data-t', t); w.setAttribute('data-k', k); if (D[k].vars && D[k].vars.bg) w.style.backgroundColor = D[k].vars.bg; }
      if (io2) io2.observe(w); else drawType(w);
    });
  }
  /* hero cards beyond the two the home page draws */
  [['heroC', 'vort', 'he'], ['heroD', 'bris', 'he'], ['heroE', 'kiddush', 'he']].forEach(function (h) {
    var m = document.getElementById(h[0]); if (!m) return;
    var k = m.getAttribute('data-design'); if (k && !D[k]) k = null;
    try { F.renderCard(F.sampleCard(m.getAttribute('data-type') || h[1], k, h[2]), m); } catch (e) { console.warn(e); }
  });
  [['heroA'], ['heroB']].forEach(function (h) {
    var m = document.getElementById(h[0]); if (!m || !m.getAttribute('data-design')) return;
    var k = m.getAttribute('data-design'); if (!D[k]) return;
    try { F.renderCard(F.sampleCard(m.getAttribute('data-type') || 'chasuna', k, m.getAttribute('data-lang') || 'he'), m); } catch (e) { console.warn(e); }
  });

  /* ---------- editor: one tidy tool dock (it presses the editor's own buttons) ---------- */
  var tools = document.getElementById('edToolsHead');
  if (tools) {
    var ic = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
    var B = [
      ['words', 'Words', ic('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'), function () { var b = document.getElementById('edDetailsBtn'); if (b) b.click(); }],
      ['font', 'Font', ic('<path d="M5 19L11 5l6 14M7.5 13.5h7"/><path d="M19 9v10"/>'), function () { var b = document.getElementById('fontCur'); if (b) b.click(); }],
      ['line', 'Add line', ic('<path d="M4 6h11M4 11h11M4 16h6"/><path d="M13.5 20l.8-3.2 5.2-5.2 2.4 2.4-5.2 5.2z"/>'), function () { var b = document.getElementById('addLine'); if (b) b.click(); }],
      ['layout', 'Layout', ic('<path d="M4 6h16M4 12h7M15 12h5M4 18h16"/><path d="M11 12h4" stroke-dasharray="1 2"/>'), function () {
        var c = document.querySelector('#card [data-pe]'); if (!c) return; c.click();
        setTimeout(function () { var l = document.getElementById('peLoBtn'), p = document.getElementById('peLo'); if (l && p && p.hidden) l.click(); }, 180); }],
      ['colors', 'Colors', ic('<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.3"/><circle cx="12" cy="7.5" r="1.3"/><circle cx="16" cy="10" r="1.3"/><path d="M12 21c-1.5 0-2-1-2-2s1-1.6 1-2.6"/>'), function () {
        var d = document.getElementById('moreOpts'); if (!d) return; d.open = true; try { d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (x) { d.scrollIntoView(); } }],
      ['dl', 'Download', ic('<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>'), function () { var b = document.getElementById('dlJpg'); if (b) b.click(); }]
    ];
    var dock = el('div', 'ed-dock'); dock.id = 'edDock'; dock.setAttribute('role', 'toolbar'); dock.setAttribute('aria-label', 'Card tools');
    B.forEach(function (x) {
      var b = el('button', 'dk dk-' + x[0], x[2]); b.type = 'button'; var s = el('span'); s.textContent = x[1]; b.appendChild(s);
      b.addEventListener('click', x[3]); dock.appendChild(b);
    });
    var dn = document.querySelector('.maker-grid .draft-note');
    if (dn) dn.parentNode.insertBefore(dock, dn); else tools.parentNode.insertBefore(dock, tools);
    // a design picked in the home gallery opens straight in the editor
    var q = new URLSearchParams(location.search);
    if (q.get('design') && D[q.get('design')] && window.__fcEd) setTimeout(function () { try { window.__fcEd.enter(); } catch (e) {} }, 60);
  }
})();
