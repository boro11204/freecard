(function () {
  'use strict';
  var F = window.FreeCard;
  var form = document.getElementById('form');
  var cardMount = document.getElementById('card');
  var params = new URLSearchParams(location.search);
  var type = F.TYPES[params.get('type')] ? params.get('type') : 'chasuna';
  var lang = ['he', 'yi', 'en', 'short'].indexOf(params.get('lang')) >= 0 ? params.get('lang') : 'he';
  var design = F.DESIGNS[params.get('design')] ? params.get('design') : null; // a removed design (old link) gets the simcha's default
  var state = F.sampleCard(type, design, lang);
  state.x = F.defaultTemplate(type, lang);
  var touched = {}, photo = null;
  var FIELDS = ['h', 'tl', 'i', 'x', 'n1', 'n2', 'p1', 'p2', 'dt', 'hd', 'pa', 'tm', 'sc', 'hl', 'ad', 'ex', 'nt'];
  var SAMPLE_FIELDS = ['n1', 'n2', 'p1', 'p2', 'hl', 'ad', 'tm', 'sc'];

  function $(id) { return document.getElementById(id); }
  var warmTimer = null;
  function warmSoon() { clearTimeout(warmTimer); warmTimer = setTimeout(function () { var n = cardMount.querySelector('.fc-card'); if (n && window.FreeCardDownload) window.FreeCardDownload.warm(n); }, 900); }
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2000); }
  function fillForm() { FIELDS.forEach(function (k) { var e = form.elements[k]; if (e) e.value = state[k] || ''; }); }

  // v20261029b: each design tile is a real little card (the design's own picture, colors and the simcha's ready-made
  // wording in the card's language and lettering), drawn only when it scrolls into view so the page stays light.
  var tileObs = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(function (ents) {
    ents.forEach(function (e) { if (!e.isIntersecting) return; tileObs.unobserve(e.target); drawTile(e.target); });
  }, { rootMargin: '250px 0px' }) : null;
  function tileCard(key) {
    var w = state.w || 'he';
    var c = F.sampleCard(state.t, key, w === 'short' ? 'en' : w);
    c.w = w; c.x = w === 'short' ? '' : tplFor(state.t, w);
    c.f = state.f; if (state.nf) c.nf = state.nf;
    return c;
  }
  function drawTile(w) {
    var key = w.getAttribute('data-k'); if (!key || !w.isConnected) return;
    try { F.renderCard(tileCard(key), w, { thumb: true }); w.classList.add('drawn'); } catch (e) { console.warn(e); }
    // v20261102g: the tile is already drawn only when it comes into view, so its picture loads now too (a second wait inside
    // a sideways strip could leave a tile as plain cream with only its words)
    var cd = w.querySelector('.fc-card[data-bg]'); if (cd && !cd.style.backgroundImage) cd.style.backgroundImage = "url('" + cd.getAttribute('data-bg') + "')";
  }
  function swatch(key) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'swatch'; b.dataset.design = key; b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', F.DESIGNS[key].name + ' design');
    var w = document.createElement('div'); w.className = 'fc-wrap sw-card'; w.setAttribute('data-k', key);
    var D = F.DESIGNS[key]; if (D.vars && D.vars.bg) w.style.backgroundColor = D.vars.bg;
    var s = document.createElement('span'); s.className = 'sw-name'; s.textContent = D.name;
    b.appendChild(w); b.appendChild(s);
    if (D.ai) { var ai = document.createElement('small'); ai.className = 'ai-note'; var leo = D.src === 'leo', gem = D.src === 'gem', adobe = D.src === 'adobe'; ai.textContent = leo ? 'AI art · Leonardo.ai' : gem ? 'AI art · Google Gemini' : adobe ? 'AI art · Adobe Firefly' : 'AI art · Canva'; ai.title = leo ? 'Background art AI-generated with Leonardo.ai' : gem ? 'Background art AI-generated with Google Gemini' : adobe ? 'Background art AI-generated with Adobe Firefly' : 'Background art AI-generated with Canva'; b.appendChild(ai); }
    if (D.nb) { var nb = document.createElement('i'); nb.className = 'nb'; nb.textContent = 'New'; b.appendChild(nb); }
    b.addEventListener('click', function () { state.d = key; applyUI(); render(); warmSoon(); if (b.closest('#swFirst, #swRest')) edEnter(); else edCenter(); });
    return b;
  }
  function watchTiles(box) { box.querySelectorAll('.sw-card:not(.drawn)').forEach(function (w) { if (tileObs) tileObs.observe(w); else drawTile(w); }); }
  function buildSwatches() {
    var g = F.designsFor(state.t);
    if (tileObs) tileObs.disconnect();
    $('swFirst').innerHTML = ''; $('swRest').innerHTML = '';
    g.first.forEach(function (k) { $('swFirst').appendChild(swatch(k)); });
    g.rest.forEach(function (k) { $('swRest').appendChild(swatch(k)); });
    $('swLabel').textContent = 'Designs for ' + F.TYPES[state.t].en;
    watchTiles($('swFirst')); watchTiles($('swRest'));
    edBuildStrip(g);
  }
  // the tiles follow the card's language and lettering (redrawn a moment after a change, only those in view)
  var tileTimer = null;
  function refreshTiles() { clearTimeout(tileTimer); tileTimer = setTimeout(function () {
    if (tileObs) tileObs.disconnect();
    document.querySelectorAll('.sw-card').forEach(function (w) { w.classList.remove('drawn'); w.innerHTML = ''; });
    watchTiles($('swFirst')); watchTiles($('swRest')); if (edStripEl && edStripEl.isConnected) { watchTiles(edStripEl); edDrawVisible(); }
  }, 400); }
  /* ---------- lettering: a picture of each font, in its own letters ---------- */
  var FONT_KEYS = Object.keys(F.FONTS);
  var TILE = { // how each lettering's sample is drawn: [Hebrew sample font, English sample font]
    script: ["700 1em 'Frank Ruhl Libre', serif", "400 .8em 'Great Vibes', cursive"],
    serif: ["400 1em 'Bellefair', 'Frank Ruhl Libre', serif", "400 .64em 'Bellefair', serif"],
    bold: ["400 1em 'Suez One', serif", "400 .6em 'Suez One', serif"],
    modern: ["700 1em 'Heebo', sans-serif", "700 .6em 'Heebo', sans-serif"]
  };
  function tileFont(k, i) {
    if (TILE[k]) return TILE[k][i];
    var f = F.FONTS[k], z = { karantina: 1.3, amatic: 1.3 }[k] || 1;
    return f.weight + ' ' + (i ? 0.62 * z : z) + "em '" + f.family + "', 'Frank Ruhl Libre', serif";
  }
  window.FCTileFont = tileFont;
  // load a lettering's files (both weights, Hebrew and English letters) before it is needed
  var fontLoads = {};
  function familiesOf(k) {
    if (F.FONTS[k] && F.FONTS[k].family) return [F.FONTS[k].family];
    return { script: ['Great Vibes', 'Frank Ruhl Libre', 'Cormorant Garamond'], serif: ['Bellefair', 'Frank Ruhl Libre'], bold: ['Suez One', 'FC Bold Body', 'Frank Ruhl Libre'], modern: ['Heebo'] }[k] || [];
  }
  function preloadFont(k) {
    if (fontLoads[k]) return fontLoads[k];
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var jobs = [];
    familiesOf(k).forEach(function (fam) {
      ['400', '700', 'italic 500'].forEach(function (w) {
        if (w === 'italic 500' && fam !== 'Cormorant Garamond') return;
        jobs.push(document.fonts.load(w + " 40px '" + fam + "'", 'אבגדהוזחטיכלמנסעפצקרשת׳״ AaBbMm 0123456789').catch(function () {}));
      });
    });
    fontLoads[k] = Promise.all(jobs);
    return fontLoads[k];
  }
  // v20261103f: every lettering in one compact list (fontpick.js draws it), grouped, the new Yiddish/sofer fonts first.
  // The lists are real <select>s underneath, so the choice also works without the drawn list.
  var FONT_GROUPS = [
    ['Fancy & artistic', ['noashalev', 'solitreo', 'shuneet', 'ellinia', 'farissol', 'ktavyad', 'antiochus', 'cafe', 'journal', 'hillel', 'nesherkaton', 'anka', 'ozrad', 'horev', 'maaravon', 'archai', 'migdal', 'kurkevan', 'dybbuk', 'wetpaint', 'vinyl', 'gemstones', 'eldad', 'kunstlicheberg', 'shimshon', 'camping', 'busta', 'latet', 'gagua', 'mevorach', 'petel', 'choco', 'ariana', 'ashem', 'hofesh', 'touring', 'yoav', 'keshet', 'sinaa', 'comix', 'akitza', 'anarchy', 'betzefer', 'motek', 'haim', 'hatachana', 'lakahat', 'shimshonagol', 'yoavcursive', 'dlilah', 'ilanit', 'dragon', 'paskol', 'nehama', 'noot', 'stopmotion', 'miri', 'trashim', 'nachlaot', 'refoyl', 'danayad']],
    ['Yiddish & sofer classics', ['shlomostam', 'stamashk', 'taameyashk', 'keteryg', 'mekorot', 'rommvilna', 'shlomosemi', 'keteraram', 'ezra', 'taameyfrank', 'drugulin', 'nesher', 'yehoash']],
    ['Elegant & headline', ['notocondblack', 'notoblack', 'cardo', 'libertinus', 'bellefair', 'hadasim', 'shofar', 'dorian', 'gan', 'gladia', 'lulav', 'aharoni', 'yehuda', 'shaliah', 'asakim', 'carmelit', 'yarden']],
    ['Classic', ['script', 'serif', 'bold', 'frank', 'david', 'notoserif', 'rashi', 'bona', 'tinos', 'miriam']],
    ['Modern & fun', ['bubbles', 'modern', 'shmulik', 'rubik', 'assistant', 'alef', 'varela', 'secular', 'karantina', 'amatic', 'playpen', 'gveret', 'fredoka', 'plex', 'simpleclm', 'ptil', 'osaran']],
    ['English letters only', ['playfair', 'cinzel', 'parisienne', 'allura', 'pinyon', 'italianno', 'baskerville', 'marcellus', 'cormorant', 'alexbrush', 'tangerine']]
  ];
  (function () { var seen = {}; FONT_GROUPS.forEach(function (g) { g[1] = g[1].filter(function (k) { return F.FONTS[k] && !(window.FC_NO_PERSONAL_FONTS && (F.FONTS[k].license === 'personal' || F.FONTS[k].license === 'unclear')) && !seen[k] && (seen[k] = 1); }); });
    var rest = FONT_KEYS.filter(function (k) { return !seen[k]; }); if (rest.length) FONT_GROUPS[2][1] = FONT_GROUPS[2][1].concat(rest);
    FONT_KEYS = [].concat.apply([], FONT_GROUPS.map(function (g) { return g[1]; })); })();
  window.FCFontGroups = FONT_GROUPS;
  ['f-f', 'f-nf', 'f-tf', 'f-bf'].forEach(function (id) {
    var sel = $(id); if (!sel) return;
    FONT_GROUPS.forEach(function (g) {
      var og = document.createElement('optgroup'); og.label = g[0];
      g[1].forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = F.FONTS[k].name; og.appendChild(o); });
      sel.appendChild(og);
    });
  });
  $('f-f').addEventListener('change', function (e) { if (F.FONTS[e.target.value]) setFont(e.target.value); });
  // a font for the top and for the details (the names use f-nf)
  ['f-tf', 'f-bf'].forEach(function (id) {
    $(id).addEventListener('change', function (e) {
      var k = e.target.value, key = e.target.dataset.k; state[key] = F.FONTS[k] ? k : '';
      applyUI(); render(); warmSoon();
      if (k) preloadFont(k).then(settleFonts);
    });
  });
  $('partsReset').addEventListener('click', function () {
    state.tf = ''; state.bf = ''; state.nf = ''; state.tz = ''; state.bz = ''; state.ns = '';
    syncMore(); applyUI(); render(); warmSoon();
  });
  function setFont(k) {
    state.f = k;
    applyUI(); render(); warmSoon(); refreshTiles();
    // switching shows at once; when the font's files land a moment later the card is measured again
    preloadFont(k).then(function () { if (state.f === k) settleFonts(); });
  }
  $('f-nf').addEventListener('change', function (e) {
    var k = e.target.value; state.nf = F.FONTS[k] ? k : '';
    applyUI(); render(); warmSoon(); refreshTiles();
    if (k) preloadFont(k).then(settleFonts);
  });
  function stepFont(d) { var i = FONT_KEYS.indexOf(state.f); if (i < 0) i = 0; setFont(FONT_KEYS[(i + d + FONT_KEYS.length) % FONT_KEYS.length]); }
  $('fontPrev').addEventListener('click', function () { stepFont(-1); });
  $('fontNext').addEventListener('click', function () { stepFont(1); });
  $('fontCur').addEventListener('click', function () {
    if (window.FCFontPick) { window.FCFontPick.open($('f-f'), { sheet: true, keep: true }); return; }
    var p = $('letterPanel'); p.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  // after every change: any font the card uses that is not here yet is fetched, then the card is fitted again
  var settleTimer = null;
  function settleFonts() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(function () { var c = cardMount.querySelector('.fc-card'); if (c && F.loadCardFonts) F.loadCardFonts(c).then(function (changed) { if (changed) warmSoon(); }); }, 0);
  }
  if (document.fonts && document.fonts.addEventListener) {
    var refitTimer = null;
    document.fonts.addEventListener('loadingdone', function () {
      clearTimeout(refitTimer);
      refitTimer = setTimeout(function () { var c = cardMount.querySelector('.fc-card'); if (c) F.fitCard(c); }, 60);
    });
  }
  // fetch every lettering quietly once the page has settled, so switching is instant
  function preloadAll() { FONT_KEYS.filter(function (k) { return !F.FONTS[k].yi; }).filter(function (k) { return !F.FONTS[k].art; }).filter(function (k) { return !F.FONTS[k].art2; }).reduce(function (p, k) { return p.then(function () { return preloadFont(k); }); }, Promise.resolve()); }
  if ('requestIdleCallback' in window) setTimeout(function () { requestIdleCallback(preloadAll, { timeout: 4000 }); }, 2500);
  else setTimeout(preloadAll, 3000);
  function buildTokens() {
    var box = $('tokChips'); box.innerHTML = '';
    F.tokensFor(state.t).forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tok'; b.textContent = '[' + t + ']';
      b.addEventListener('click', function () {
        var ta = $('f-x'), s = ta.selectionStart || ta.value.length, e = ta.selectionEnd || s;
        ta.value = ta.value.slice(0, s) + '[' + t + ']' + ta.value.slice(e);
        state.x = ta.value; touched.x = true; ta.focus(); render();
      });
      box.appendChild(b);
    });
  }

  // wording styles: the standard text, a heimish one (Lashon Kodesh / Yiddish) or a short simple one (English)
  function styleOf(t, w, ws) { var T = F.TEMPLATES[t]; return ws && T && T[w + '_' + ws] ? T[w + '_' + ws] : ''; }
  function tplFor(t, w) { return styleOf(t, w, state.ws) || F.defaultTemplate(t, w); }
  function syncStyle() {
    var any = false;
    document.querySelectorAll('#styleSeg .chip').forEach(function (b) {
      var ok = !b.dataset.ws || !!styleOf(state.t, state.w, b.dataset.ws);
      b.hidden = !ok; if (ok && b.dataset.ws) any = true;
      b.setAttribute('aria-pressed', String((styleOf(state.t, state.w, state.ws) ? state.ws : '') === b.dataset.ws));
    });
    $('styleRow').hidden = !any || state.w === 'short';
  }
  document.querySelectorAll('#styleSeg .chip').forEach(function (b) {
    b.addEventListener('click', function () {
      var ws = b.dataset.ws;
      if (touched.x && !confirm(window.FCi18n ? window.FCi18n.t('Replace your edited wording with this style?') : 'Replace your edited wording with this style?')) return;
      state.ws = ws; state.x = tplFor(state.t, state.w); touched.x = false; form.elements.x.value = state.x; syncStyle(); render();
    });
  });
  // the Hebrew date for the day (or, for an evening simcha, the night that begins the next Hebrew day: "אור ליום …", "ליל שבת קודש …")
  function hebFor(iso) {
    if (state.ev !== '1') return F.hebDate(iso);
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); if (!m) return F.hebDate(iso);
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + 1)), nx = d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2);
    var s = F.hebDate(nx); if (!s) return '';
    return /^שבת/.test(s) ? 'ליל ' + s : 'אור ל' + s;
  }
  function applyUI() {
    var T = F.TYPES[state.t];
    $('l-n1').textContent = T.label1;
    $('w-n2').hidden = !T.label2; if (T.label2) $('l-n2').textContent = T.label2;
    $('w-p1').hidden = !T.parents1; if (T.parents1) $('l-p1').textContent = T.parents1;
    $('w-p2').hidden = !T.parents2; if (T.parents2) $('l-p2').textContent = T.parents2;
    $('f-tl').placeholder = T.timeLabel;
    var short = state.w === 'short';
    $('w-x').hidden = short; $('w-i').hidden = !short; $('w-tl').hidden = !short;
    document.querySelectorAll('#typeChips .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.type === state.t)); });
    try { var pc = document.querySelector('#typeChips .chip[aria-pressed="true"]'), row = pc && pc.parentNode; if (row && row.scrollWidth > row.clientWidth) row.scrollLeft = pc.offsetLeft - row.offsetLeft - 14; } catch (e) {}
    document.querySelectorAll('.swatch').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.design === state.d)); });
    document.querySelectorAll('.plain-dot').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.design === state.d)); });
    document.querySelectorAll('#langSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.w === state.w)); });
    var fk = F.FONTS[state.f] ? state.f : 'script';
    $('f-f').value = fk;
    $('fontCurName').textContent = F.FONTS[fk].name;
    syncStyle();
    // v20261103h: in the standard lettering the names default to Noto Serif Black, and the list says so
    try { var nf0 = $('f-nf').options[0], nfl = fk === 'script' ? 'Default: ' + F.FONTS[F.DEF_NAMES].name : 'Same as the card'; if (nf0) { nf0.dataset.en = nfl; nf0.textContent = window.FCi18n && window.FCi18n.t ? window.FCi18n.t(nfl) : nfl; } } catch (e) {}
    $('f-nf').value = F.FONTS[state.nf] ? state.nf : '';
    $('f-tf').value = F.FONTS[state.tf] ? state.tf : '';
    $('f-bf').value = F.FONTS[state.bf] ? state.bf : '';
    syncMore();
    if (typeof syncSet === 'function') syncSet();
  }

  var bgRaw = null, bg = null, popts = { gray: false, paper: 'card', hq: false, marks: false };
  function pieceOn() { return F.PIECES && F.PIECES[state.pk] ? state.pk : ''; }
  function render() {
    var pk = pieceOn();
    if (pk) F.renderCard(F.pieceCard(state, pk, state.tn, state.th === '1'), cardMount, { bg: bg, piece: pk, noFoot: true });
    else F.renderCard(state, cardMount, { photo: photo, bg: bg });
    cardMount.classList.toggle('fc-bw', !!popts.gray);
    settleFonts();
    saveSoon();
    if (window.FCPartEdit) { try { window.FCPartEdit.after(); } catch (e) { console.warn(e); } }
    if (typeof hintsSoon === 'function') hintsSoon();
    if (typeof buildList === 'function' && lineList) buildList();
  }

  function swapSamples(prevType, prevLang) {
    var T = F.TYPES[state.t];
    var heb = state.w === 'he' || state.w === 'yi';
    var s = heb ? T.sampleHe : T.sample;
    SAMPLE_FIELDS.forEach(function (k) { if (!touched[k]) state[k] = s[k] || ''; });
    if (!T.label2 && !touched.n2) state.n2 = '';
  }
  function setType(t) {
    state.t = t;
    var T = F.TYPES[t];
    if (!touched.h) state.h = T.head;
    if (!touched.tl) state.tl = T.timeLabel;
    var keepW = keepOn(); // v20261106c: with "Keep my words" on, lines they typed stay when the simcha changes
    if (!(keepW && touched.i)) state.i = T.intro[state.w === 'en' || state.w === 'short' ? 'en' : 'he'];
    if (!(keepW && touched.x)) { state.x = state.w === 'short' ? '' : tplFor(t, state.w); touched.x = false; }
    if (!F.DESIGNS[state.d].plain && F.DESIGNS[state.d].types.indexOf(t) < 0) state.d = F.designsFor(t).first[0];
    swapSamples();
    buildSwatches(); buildTokens(); fillForm(); applyUI(); render();
  try { if (window.FreeCardPaint) window.FreeCardPaint.watchPreview(cardMount); } catch (e) { console.warn(e); }
  }
  function setLang(w) {
    if (touched.x && state.w !== 'short' && w !== state.w && !confirm('Replace your edited wording with the ready-made ' + (w === 'en' ? 'English' : w === 'yi' ? 'Yiddish' : w === 'he' ? 'Lashon Kodesh' : 'short') + ' text?')) return;
    var wasHeb = state.w === 'he' || state.w === 'yi';
    state.w = w;
    var T = F.TYPES[state.t];
    state.x = w === 'short' ? '' : tplFor(state.t, w); touched.x = false;
    state.i = T.intro[w === 'en' || w === 'short' ? 'en' : 'he'];
    var isHeb = w === 'he' || w === 'yi';
    if (wasHeb !== isHeb) swapSamples();
    if (!touched.pa && F.parsha) state.pa = F.parsha(state.dt, w);
    fillForm(); applyUI(); render(); refreshTiles();
  }

  document.querySelectorAll('#typeChips .chip').forEach(function (b) { b.addEventListener('click', function () { setType(b.dataset.type); }); });
  document.querySelectorAll('#langSeg button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.w); }); });
  $('resetX').addEventListener('click', function () { state.x = tplFor(state.t, state.w); touched.x = false; form.elements.x.value = state.x; render(); });

  form.addEventListener('input', function (e) {
    var k = e.target.name; if (!k) return;
    state[k] = e.target.value; touched[k] = true;
    if (k === 'dt' && !touched.hd) { state.hd = hebFor(state.dt); form.elements.hd.value = state.hd; }
    if (k === 'dt' && !touched.pa && F.parsha) { state.pa = F.parsha(state.dt, state.w); form.elements.pa.value = state.pa; }
    render();
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  $('f-eve').addEventListener('change', function (e) { state.ev = e.target.checked ? '1' : ''; touched.hd = false; state.hd = hebFor(state.dt); form.elements.hd.value = state.hd; render(); });
  $('paAuto').addEventListener('click', function () { touched.pa = false; state.pa = F.parsha(state.dt, state.w); form.elements.pa.value = state.pa; render(); });
  $('hdAuto').addEventListener('click', function () { touched.hd = false; state.hd = hebFor(state.dt); form.elements.hd.value = state.hd; render(); });

  // photo: resized in the browser, shown on the preview and on downloads
  $('f-photo').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0]; if (!file) return;
    function use(src, w, h) {
      var s = Math.min(1, 700 / Math.max(w, h));
      var cv = document.createElement('canvas'); cv.width = Math.round(w * s); cv.height = Math.round(h * s);
      cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height);
      photo = cv.toDataURL('image/jpeg', 0.88); $('photoClear').hidden = false; syncMore(); render();
    }
    function viaImage() {
      var rd = new FileReader();
      rd.onload = function () {
        var img = new Image();
        img.onload = function () { use(img, img.width, img.height); };
        img.onerror = function () { alert('Sorry, this picture could not be opened. Please try a JPG or PNG.'); };
        img.src = rd.result;
      };
      rd.readAsDataURL(file);
    }
    // decoded straight from the file (works even where in-page picture addresses are blocked)
    if (window.createImageBitmap) {
      createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return createImageBitmap(file); })
        .then(function (b) { use(b, b.width, b.height); }, viaImage);
    } else viaImage();
  });
  $('photoClear').addEventListener('click', function () { photo = null; $('f-photo').value = ''; $('photoClear').hidden = true; syncMore(); render(); });

  var getNode = function () { return cardMount.querySelector('.fc-card'); };
  var getName = function () { var pk = pieceOn(); return window.FreeCardDownload.fileName(state) + (pk ? '-' + pk + (pk === 'table' ? '-' + (parseInt(state.tn, 10) || 1) : '') : ''); };
  window.FreeCardCountMeta = function () { return { d: state.d, t: state.t }; }; // anonymous card counter: design + simcha only
  window.FreeCardDownload.wire($('dlJpg'), $('dlPdf'), getNode, getName, toast, { gif: $('dlGif'), story: $('dlStory') });
  window.FreeCardDownload.wire($('dlJpg2'), $('dlPdf2'), getNode, getName, toast);


  /* ---------- matching set: thank-you note, table numbers, bentcher cover, welcome sign (v20261028c) ---------- */
  function tnRange() {
    var a = Math.max(1, Math.min(200, parseInt(state.tfrom, 10) || 1)), b = Math.max(1, Math.min(200, parseInt(state.tto, 10) || 20));
    if (b < a) { var t = a; a = b; b = t; }
    if (b - a > 99) b = a + 99;
    return [a, b];
  }
  function syncSet() {
    var pk = pieceOn();
    document.querySelectorAll('#pieceChips .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.pk === pk)); });
    $('pieceOpts').hidden = !pk; $('tableOpts').hidden = pk !== 'table';
    if (pk) {
      var v = state['pw_' + pk];
      var ta = $('f-pw'); ta.dir = state.w === 'he' || state.w === 'yi' ? 'rtl' : 'ltr'; if (document.activeElement !== ta) ta.value = typeof v === 'string' && v.trim() ? v : F.pieceTemplate(Object.assign({}, state, { w: state.w === 'short' ? 'en' : state.w }), pk);
    }
    var r = tnRange(); $('f-tfrom').value = r[0]; $('f-tto').value = r[1];
    var n = Math.max(r[0], Math.min(r[1], parseInt(state.tn, 10) || r[0])); state.tn = String(n); $('o-tn').textContent = n;
    $('f-theb').checked = state.th === '1';
    var lab = document.querySelector('.preview-label');
    if (lab) { var nm = pk ? F.PIECES[pk] : null; lab.innerHTML = ''; lab.appendChild(document.createTextNode('Live preview')); if (nm) { var s = document.createElement('span'); s.className = 'pl-piece'; s.textContent = ' · ' + nm.en; lab.appendChild(s); } }
  }
  document.querySelectorAll('#pieceChips .chip').forEach(function (b) {
    b.addEventListener('click', function () { state.pk = b.dataset.pk || ''; syncSet(); render(); warmSoon(); });
  });
  $('f-pw').addEventListener('input', function (e) { var pk = pieceOn(); if (!pk) return; state['pw_' + pk] = e.target.value; render(); });
  $('pwReset').addEventListener('click', function () { var pk = pieceOn(); if (!pk) return; delete state['pw_' + pk]; $('f-pw').value = ''; $('f-pw').blur(); syncSet(); render(); });
  ['f-tfrom', 'f-tto'].forEach(function (id) {
    $(id).addEventListener('change', function (e) { state[id === 'f-tfrom' ? 'tfrom' : 'tto'] = String(e.target.value || ''); syncSet(); render(); });
  });
  $('f-theb').addEventListener('change', function (e) { state.th = e.target.checked ? '1' : ''; render(); });
  $('tnStep').querySelectorAll('button').forEach(function (b) {
    b.addEventListener('click', function () { var r = tnRange(), n = (parseInt(state.tn, 10) || r[0]) + parseInt(b.dataset.d, 10); if (n < r[0]) n = r[1]; if (n > r[1]) n = r[0]; state.tn = String(n); syncSet(); render(); });
  });
  $('setLink').addEventListener('click', function () { $('setPanel').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  // every table number, made one by one off screen, then one PDF (a number per page) or a .zip of JPEGs
  var batchBusy = false;
  function makeTables(kind, btn) {
    if (batchBusy) return; batchBusy = true;
    var D = window.FreeCardDownload, r = tnRange(), nums = [], label = btn.innerHTML, out = [];
    for (var n = r[0]; n <= r[1]; n++) nums.push(n);
    var host = document.createElement('div'); host.className = 'fc-wrap'; host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:fixed;left:-12000px;top:0;width:480px;pointer-events:none';
    document.body.appendChild(host);
    [$('dlTablesPdf'), $('dlTablesZip')].forEach(function (b) { b.disabled = true; });
    var heb = state.th === '1', i = 0;
    function step() {
      if (i >= nums.length) return Promise.resolve();
      var n = nums[i];
      btn.innerHTML = '<span class="fc-spin" aria-hidden="true"></span>Making ' + (i + 1) + ' of ' + nums.length + '…';
      var node = F.renderCard(F.pieceCard(state, 'table', n, heb), host, { bg: bg, piece: 'table', noFoot: true });
      return D.make(node, 'jpeg').then(function (blob) { out.push({ n: n, blob: blob }); i++; return step(); });
    }
    var base = window.FreeCardDownload.fileName(state) + '-tables-' + r[0] + '-' + r[1];
    step().then(function () {
      btn.innerHTML = '<span class="fc-spin" aria-hidden="true"></span>Putting it together…';
      if (kind === 'pdf') return D.pdfFromJpegs(out.map(function (x) { return x.blob; }), D.options()).then(function (pdf) { return D.deliver(pdf, base + '.pdf', 'pdf', out[0].blob, '', null); });
      return Promise.all(out.map(function (x) { return x.blob.arrayBuffer(); })).then(function (bufs) {
        var zip = D.zipStore(bufs.map(function (b, k) { return { name: 'table-' + (heb ? out[k].n : out[k].n) + '.jpg', bytes: new Uint8Array(b) }; }));
        return D.deliver(zip, base + '.zip', 'zip', out[0].blob, '', null);
      });
    }).then(function (how) {
      try { if (D.count) D.count('tables', false); } catch (e) {}
      $('tnMsg').textContent = (kind === 'pdf' ? 'Your PDF with ' : 'Your .zip with ') + nums.length + ' table numbers is ready.';
      if (how === 'saved') toast(kind === 'pdf' ? 'PDF saved' : 'Zip saved');
    }, function (e) {
      console.warn('tables', e); $('tnMsg').textContent = 'Sorry, the table numbers could not be made. Please try again, or download them one by one with the buttons under the preview.';
    }).then(function () {
      host.remove(); btn.innerHTML = label; batchBusy = false;
      [$('dlTablesPdf'), $('dlTablesZip')].forEach(function (b) { b.disabled = false; });
    });
  }
  $('dlTablesPdf').addEventListener('click', function () { makeTables('pdf', this); });
  $('dlTablesZip').addEventListener('click', function () { makeTables('zip', this); });

  /* ---------- More options: text size, names size, colours, own background, text only, black & white ---------- */
  var COLOURS = [['', 'Design'], ['#a8802c', 'Gold'], ['#1f2f57', 'Navy'], ['#7a1f2b', 'Burgundy'], ['#1f5b3f', 'Green'], ['#1d4fa0', 'Blue'],
    ['#b4566a', 'Rose'], ['#5b3a8c', 'Purple'], ['#111111', 'Black'], ['#6b6f76', 'Gray'], ['#f3e6c4', 'Cream'], ['#ffffff', 'White']];
  function colourRow(box) {
    var k = box.dataset.k;
    COLOURS.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'cdot' + (c[0] ? '' : ' cdef'); b.dataset.c = c[0];
      b.title = c[1]; b.setAttribute('aria-label', c[1]);
      if (c[0]) b.style.background = c[0]; else b.textContent = c[1];
      b.addEventListener('click', function () { state[k] = c[0]; touched[k] = true; syncMore(); render(); });
      box.appendChild(b);
    });
    var pick = document.createElement('input'); pick.type = 'color'; pick.className = 'cpick'; pick.title = 'Any color'; pick.setAttribute('aria-label', 'Pick any color');
    pick.value = '#a8802c';
    pick.addEventListener('input', function () { state[k] = pick.value; touched[k] = true; syncMore(); render(); });
    box.appendChild(pick);
  }
  colourRow($('hcRow')); colourRow($('tcRow'));
  function pct(v) { var n = parseInt(v, 10); return isFinite(n) && n ? n : 100; }
  // move the words up or down on the card (−20 … 20, 0 = where the design puts them)
  document.querySelectorAll('.stepper.sty').forEach(function (st) {
    var k = st.dataset.k;
    st.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = Math.max(-16, Math.min(16, (parseInt(state[k], 10) || 0) + parseInt(b.dataset.d, 10)));
        state[k] = v ? String(v) : ''; syncMore(); render();
      });
    });
  });
  document.querySelectorAll('.pshape .chip').forEach(function (b) {
    b.addEventListener('click', function () { state.ps = b.dataset.ps; syncMore(); render(); });
  });
  document.querySelectorAll('.stepper[data-k]:not(.sty)').forEach(function (st) {
    var k = st.dataset.k;
    st.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = Math.max(70, Math.min(140, pct(state[k]) + parseInt(b.dataset.d, 10)));
        state[k] = v === 100 ? '' : String(v); syncMore(); render();
        var c = cardMount.querySelector('.fc-card');
        if (k === 'ts' && b.dataset.d > 0 && c && +c.getAttribute('data-fit') < 1) toast('That is as big as it fits on the card');
      });
    });
  });
  function syncMore() {
    $('o-ts').textContent = pct(state.ts) + '%'; $('o-ns').textContent = pct(state.ns) + '%';
    $('o-ns2').textContent = pct(state.ns) + '%'; $('o-tz').textContent = pct(state.tz) + '%'; $('o-bz').textContent = pct(state.bz) + '%';
    $('partsReset').hidden = !(state.tf || state.bf || state.nf || state.tz || state.bz || (state.ns && state.ns !== '100'));
    $('o-ls').textContent = pct(state.ls) + '%'; $('o-pz').textContent = pct(state.pz) + '%';
    var tyv = parseInt(state.ty, 10) || 0; $('o-ty').textContent = tyv ? (tyv < 0 ? '↑ ' + (-tyv / 2) : '↓ ' + (tyv / 2)) : '0';
    document.querySelectorAll('.pshape .chip').forEach(function (b) { b.setAttribute('aria-pressed', String((state.ps || '') === b.dataset.ps)); });
    $('photoOpts').hidden = !photo;
    ['hcRow', 'tcRow'].forEach(function (id) {
      var k = $(id).dataset.k, v = state[k] || '';
      $(id).querySelectorAll('.cdot').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.c === v)); });
      var pk = $(id).querySelector('.cpick'); var custom = v && !COLOURS.some(function (c) { return c[0] === v; });
      pk.classList.toggle('on', !!custom); if (custom) pk.value = v;
    });
    $('f-to').checked = state.to === '1';
    $('f-eve').checked = state.ev === '1';
    $('f-gray').checked = !!popts.gray;
    $('f-bv').checked = state.bv !== '0';
    $('bgClear').hidden = !bgRaw; $('bgVeilW').hidden = !bgRaw;
    $('f-paper').value = popts.paper || 'card'; $('f-hq').checked = !!popts.hq; $('f-marks').checked = !!popts.marks;
  }
  $('f-to').addEventListener('change', function (e) { state.to = e.target.checked ? '1' : ''; render(); });
  $('f-gray').addEventListener('change', function (e) { popts.gray = e.target.checked; render(); });
  $('f-paper').addEventListener('change', function (e) { popts.paper = e.target.value; saveSoon(); });
  $('f-hq').addEventListener('change', function (e) { popts.hq = e.target.checked; saveSoon(); });
  $('f-marks').addEventListener('change', function (e) { popts.marks = e.target.checked; saveSoon(); });
  window.FreeCardDownload.setOptions(function () { return { gray: !!popts.gray, paper: popts.paper || 'card', hq: !!popts.hq, marks: !!popts.marks }; });

  // your own background: cut to the card's 2:3 shape in the browser (no picture addresses needed)
  function decodeBlob(blob) {
    if (!window.createImageBitmap) return Promise.reject(new Error('no createImageBitmap'));
    return createImageBitmap(blob, { imageOrientation: 'from-image' }).catch(function () { return createImageBitmap(blob); });
  }
  function dataUrlToBlob(u) {
    var i = u.indexOf(','), bin = atob(u.slice(i + 1)), a = new Uint8Array(bin.length);
    for (var k = 0; k < bin.length; k++) a[k] = bin.charCodeAt(k);
    return new Blob([a], { type: (u.slice(5, i).split(';')[0]) || 'image/jpeg' });
  }
  var bgBitmap = null;
  function bakeBg() {
    if (!bgBitmap) { bg = null; return; }
    var W = 1080, H = 1620, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d'), iw = bgBitmap.width, ih = bgBitmap.height, s = Math.max(W / iw, H / ih);
    ctx.drawImage(bgBitmap, (W - iw * s) / 2, (H - ih * s) / 2, iw * s, ih * s);
    if (state.bv !== '0') { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(0, 0, W, H); }
    bg = cv.toDataURL('image/jpeg', 0.86);
    if (!bgRaw) {
      var raw = document.createElement('canvas'); raw.width = W; raw.height = H;
      raw.getContext('2d').drawImage(bgBitmap, (W - iw * s) / 2, (H - ih * s) / 2, iw * s, ih * s);
      bgRaw = raw.toDataURL('image/jpeg', 0.84);
    }
  }
  function useBgBlob(blob, fresh) {
    return decodeBlob(blob).then(function (b) { bgBitmap = b; if (fresh) bgRaw = null; bakeBg(); syncMore(); render(); },
      function () { alert('Sorry, this picture could not be opened. Please try a JPG or PNG.'); });
  }
  $('f-bg').addEventListener('change', function (e) { var f = e.target.files && e.target.files[0]; if (f) useBgBlob(f, true); });
  $('f-bv').addEventListener('change', function (e) { state.bv = e.target.checked ? '' : '0'; bakeBg(); render(); });
  $('bgClear').addEventListener('click', function () { bgBitmap = null; bgRaw = null; bg = null; $('f-bg').value = ''; syncMore(); render(); });

  /* ---------- the card is kept on this device as you go (a refresh does not lose it) ---------- */
  var KEEPK = 'fc_keep_words'; // v20261106c: '0' = the user turned "Keep my words" off
  function keepOn() { try { return localStorage.getItem(KEEPK) !== '0'; } catch (e) { return true; } }
  function tr0(s) { return window.FCi18n && window.FCi18n.t ? window.FCi18n.t(s) : s; }
  var DKEY = 'fc_draft_v2', saveTimer = null, restoring = true, cloud = null; // cloud: the account card this draft is ({id, name}), v20261103m
  function saveSoon() { if (restoring) return; clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 400); }
  function saveNow() {
    var d = { v: 2, at: Date.now(), state: state, touched: touched, popts: popts, photo: photo, bg: bgRaw, cloud: cloud };
    try { localStorage.setItem(DKEY, JSON.stringify(d)); }
    catch (e) { try { d.photo = null; d.bg = null; localStorage.setItem(DKEY, JSON.stringify(d)); } catch (e2) {} }
  }
  function restore() {
    // v20261106c "keep my words": opening another design or simcha (a link with ?design= or ?type=) keeps the lines you typed,
    // and your lettering, sizes and colors, when "Keep my words" is on (the default). Only "Start from scratch" (?blank) starts empty.
    var carry = false;
    if (params.get('blank')) return false;
    if (params.get('design')) { if (!keepOn()) return false; carry = true; } // a picked design (from the designs page or a home tile)
    else if (params.get('type')) return false; // a simcha link from the home page starts that simcha's ready-made card
    var d = null; try { d = JSON.parse(localStorage.getItem(DKEY) || 'null'); } catch (e) { d = null; }
    if (!d || !d.state || !F.TYPES[d.state.t]) return false;
    if (carry) {
      var dt0 = d.touched || {};
      if (!Object.keys(dt0).some(function (k) { return dt0[k]; }) && !d.state.pe) return false; // nothing of theirs to keep
      var newD = state.d, newT = params.get('type') && F.TYPES[params.get('type')] ? state.t : d.state.t;
      Object.keys(d.state).forEach(function (k) {
        if (typeof d.state[k] !== 'string' || k === 'd' || k === 't') return;
        if (FIELDS.indexOf(k) >= 0 && !dt0[k]) return; // a ready-made line they never changed follows the new simcha
        state[k] = d.state[k];
      });
      state.t = newT; state.d = newD;
      if (!F.DESIGNS[state.d]) state.d = F.designsFor(state.t).first[0];
      touched = dt0;
      if (!touched.x) state.x = state.w === 'short' ? '' : tplFor(state.t, state.w);
      if (!touched.i) state.i = F.TYPES[state.t].intro[state.w === 'en' || state.w === 'short' ? 'en' : 'he'];
      if (d.cloud && typeof d.cloud.id === 'string') cloud = { id: d.cloud.id, name: String(d.cloud.name || '') };
      if (d.popts) Object.keys(popts).forEach(function (k) { if (d.popts[k] != null) popts[k] = d.popts[k]; });
      if (typeof d.photo === 'string' && /^data:image\//.test(d.photo)) { photo = d.photo; $('photoClear').hidden = false; }
      $('draftMsg').textContent = tr0('Your words were kept on the new design.');
      return true;
    }
    Object.keys(d.state).forEach(function (k) { if (typeof d.state[k] === 'string') state[k] = d.state[k]; });
    if (!F.DESIGNS[state.d]) state.d = F.designsFor(state.t).first[0];
    touched = d.touched || {};
    if (d.cloud && typeof d.cloud.id === 'string') cloud = { id: d.cloud.id, name: String(d.cloud.name || '') };
    if (d.popts) Object.keys(popts).forEach(function (k) { if (d.popts[k] != null) popts[k] = d.popts[k]; });
    if (typeof d.photo === 'string' && /^data:image\//.test(d.photo)) { photo = d.photo; $('photoClear').hidden = false; }
    if (typeof d.bg === 'string' && /^data:image\//.test(d.bg)) { bgRaw = d.bg; useBgBlob(dataUrlToBlob(d.bg), false); }
    $('draftMsg').textContent = 'Welcome back! We kept your last card.';
    return true;
  }
  $('startOver').addEventListener('click', function () {
    if (!confirm(window.FCi18n ? window.FCi18n.t('Start a new card? This clears what you filled in.') : 'Start a new card? This clears what you filled in.')) return;
    try { localStorage.removeItem(DKEY); } catch (e) {}
    restoring = true; location.href = 'make.html?type=' + encodeURIComponent(state.t) + '&lang=' + encodeURIComponent(state.w);
  });

  /* ---------- my cards: copies kept on this device (no account, nothing uploaded) ---------- */
  var SKEY = 'fc_saved_v1';
  function savedList() { try { var l = JSON.parse(localStorage.getItem(SKEY) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } }
  function putList(l) { localStorage.setItem(SKEY, JSON.stringify(l)); }
  function tr(s) { return window.FCi18n ? window.FCi18n.t(s) : s; }
  function cardsCount() { var n = savedList().length; $('myCards').textContent = tr('Copies on this device') + (n ? ' (' + n + ')' : ''); }
  function renderCards() {
    var box = $('cardsList'), l = savedList(); box.innerHTML = '';
    if (!l.length) { var p = document.createElement('p'); p.className = 'hint'; p.textContent = tr('No saved cards yet. Tap “Save a copy” to keep this card here.'); box.appendChild(p); }
    l.forEach(function (it) {
      var row = document.createElement('div'); row.className = 'mc-row';
      var t = document.createElement('div'); t.className = 'mc-t'; t.setAttribute('dir', 'auto');
      var T = F.TYPES[it.d && it.d.state && it.d.state.t] || {};
      t.textContent = (T.en || 'Card') + (it.names ? ' · ' + it.names : '');
      var dt = document.createElement('div'); dt.className = 'mc-d'; dt.textContent = new Date(it.at).toLocaleString();
      var info = document.createElement('div'); info.className = 'mc-i'; info.appendChild(t); info.appendChild(dt);
      var op = document.createElement('button'); op.type = 'button'; op.className = 'btn gold mc-b'; op.textContent = tr('Open');
      op.addEventListener('click', function () {
        if (!confirm(tr('Open this saved card? The card you have now is replaced (save a copy first if you need it).'))) return;
        clearTimeout(saveTimer); restoring = true;
        try { localStorage.setItem(DKEY, JSON.stringify(it.d)); } catch (e) { alert(tr('Sorry, this card could not be opened.')); restoring = false; return; }
        location.href = 'make.html';
      });
      var del = document.createElement('button'); del.type = 'button'; del.className = 'btn ghost mc-b'; del.textContent = tr('Delete');
      del.addEventListener('click', function () {
        if (!confirm(tr('Delete this saved card?'))) return;
        try { putList(savedList().filter(function (x) { return x.id !== it.id; })); } catch (e) {}
        renderCards(); cardsCount();
      });
      row.appendChild(info); row.appendChild(op); row.appendChild(del); box.appendChild(row);
    });
  }
  $('saveCopy').addEventListener('click', function () {
    var l = savedList(), d = { v: 2, at: Date.now(), state: JSON.parse(JSON.stringify(state)), touched: JSON.parse(JSON.stringify(touched)), popts: JSON.parse(JSON.stringify(popts)), photo: photo, bg: bgRaw };
    var it = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), at: Date.now(), names: F.namesLine(state) || '', d: d };
    l.unshift(it); l = l.slice(0, 40);
    try { putList(l); toast(tr('Saved on this device')); }
    catch (e) {
      it.d = Object.assign({}, d, { photo: null, bg: null });
      try { putList(l); toast(tr('Saved without the photo (not enough room on this device)')); }
      catch (e2) { toast(tr('Could not save: this device is out of room')); return; }
    }
    cardsCount(); if (!$('cardsBox').hidden) renderCards();
  });
  $('myCards').addEventListener('click', function () { var b = $('cardsBox'); b.hidden = !b.hidden; if (!b.hidden) renderCards(); });
  $('cardsClose').addEventListener('click', function () { $('cardsBox').hidden = true; });
  cardsCount();

  /* ---------- v20261103m: hooks for "Save to my account" (account.js) — the same draft, minus your own photo ---------- */
  window.FCEditor = {
    snapshot: function () { return { v: 2, at: Date.now(), state: JSON.parse(JSON.stringify(state)), touched: JSON.parse(JSON.stringify(touched)), popts: JSON.parse(JSON.stringify(popts)), photo: null, bg: null }; },
    cloud: function () { return cloud; },
    setCloud: function (c) { cloud = c; clearTimeout(saveTimer); saveNow(); },
    hasOwnPicture: function () { return !!(photo || bgRaw); },
    autoName: function () {
      // the names line with the simcha ("Moshe & Sara · Chasuna"); the card's top line is usually the same opening words on every card
      var names = String(F.namesLine(state) || '').replace(/\s+/g, ' ').trim(), head = String(state.h || '').replace(/\s+/g, ' ').trim();
      return (names ? F.titleOf(state) : (head || (F.TYPES[state.t] || {}).en || 'My card')).slice(0, 80);
    }
  };


  /* ---------- v20261102b: tap a design → an enlarged preview with every tool laid out beside it ----------
     Desktop: the card large on the left with a strip of designs under it, the tools in a panel on the right.
     Phone: the card stays in view at the top, the strip under it, then the tools — nothing hidden in a menu.
     The strip shows this simcha's designs first; one tap switches the design and keeps everything typed. */
  var edPhone = window.matchMedia ? window.matchMedia('(max-width: 900px)') : { matches: false };
  var edStripEl = null, edHeadEl = null, edStageEl = null;
  function edEls() {
    var strip = edStripEl;
    if (!strip) {
      strip = document.createElement('div'); strip.id = 'edStrip'; strip.className = 'ed-strip';
      strip.setAttribute('role', 'group'); strip.setAttribute('aria-label', 'Switch design'); edStripEl = strip;
    }
    var head = edHeadEl;
    if (!head) {
      head = document.createElement('div'); head.id = 'edHead'; head.className = 'ed-head';
      head.innerHTML = '<button type="button" class="ed-back" id="edBack">‹ All designs</button><span class="ed-name" id="edName"></span>';
      head.querySelector('#edBack').addEventListener('click', function () { edExit(true); }); edHeadEl = head;
    }
    var stage = edStageEl;
    if (!stage) { stage = document.createElement('div'); stage.id = 'edStage'; stage.className = 'ed-stage'; edStageEl = stage; }
    return { strip: strip, head: head, stage: stage };
  }
  function edBuildStrip(g) {
    var e = edEls(); e.strip.innerHTML = '';
    var lab = document.createElement('div'); lab.className = 'ed-strip-l'; lab.textContent = 'More designs — tap to switch, your words stay';
    var row = document.createElement('div'); row.className = 'ed-row';
    g = g || F.designsFor(state.t);
    g.first.concat(g.rest).forEach(function (k) { var b = swatch(k); b.classList.add('ed-tile'); b.title = F.DESIGNS[k].name; row.appendChild(b); });
    e.strip.appendChild(lab); e.strip.appendChild(row);
    row.addEventListener('scroll', function () { clearTimeout(edDrawT); edDrawT = setTimeout(edDrawVisible, 120); }, { passive: true });
    if (document.body.classList.contains('ed-mode')) { watchTiles(e.strip); applyUI(); edCenter(); }
  }
  // v20261102g: draw every strip tile that is on screen right away (does not wait on the in-view watcher)
  var edDrawT = null;
  function edDrawVisible() {
    var row = document.querySelector('#edStrip .ed-row'); if (!row || !row.isConnected) return;
    var rr = row.getBoundingClientRect(), pad = rr.width;
    row.querySelectorAll('.sw-card:not(.drawn)').forEach(function (w) { var r = w.getBoundingClientRect(); if (r.right > rr.left - pad && r.left < rr.right + pad && r.width > 0) { if (tileObs) tileObs.unobserve(w); drawTile(w); } });
  }
  /* v20261102g: beside the opened design only the editing tools show (lettering, size, colors, matching set, download).
     The words, the details and the photo open in their own drawer from one button (and from "Change in the form" on a
     tapped line); the same fields move into the drawer and back, so nothing typed is lost and switching designs keeps it. */
  var DR_SEL = ['.panel.p-words', '.panel.p-details', '.panel.p-photo'], drMarks = [];
  function edDrawerIsOpen() { var d = $('edDrawer'); return !!(d && !d.hidden); }
  function edDrawerOpen(target) {
    var dr = $('edDrawer'), body = $('edDrBody'); if (!dr || !body) return;
    if (dr.hidden) {
      drMarks = [];
      DR_SEL.forEach(function (sel) { var p = form.querySelector(sel); if (!p || p.parentNode === body) return; var m = document.createComment('ed-drawer'); p.parentNode.insertBefore(m, p); body.appendChild(p); drMarks.push([p, m]); });
      dr.hidden = false; document.body.classList.add('ed-dr-open'); var bt = $('edDetailsBtn'); if (bt) bt.setAttribute('aria-expanded', 'true');
      body.scrollTop = 0;
    }
    if (target && body.contains(target)) { try { target.scrollIntoView({ block: 'center' }); } catch (x) {} if (target.focus && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) setTimeout(function () { try { target.focus({ preventScroll: true }); } catch (x) {} }, 200); }
  }
  function edDrawerClose() {
    var dr = $('edDrawer'); if (!dr || dr.hidden) return;
    drMarks.forEach(function (pm) { if (pm[1].parentNode) { pm[1].parentNode.insertBefore(pm[0], pm[1]); pm[1].parentNode.removeChild(pm[1]); } }); drMarks = [];
    dr.hidden = true; document.body.classList.remove('ed-dr-open'); var bt = $('edDetailsBtn'); if (bt) bt.setAttribute('aria-expanded', 'false');
  }
  function edReveal(target) { // a field of the words/details/photo: in the editor it lives in the drawer
    if (!target || !document.body.classList.contains('ed-mode')) return false;
    if (!(target.closest && target.closest(DR_SEL.join(',')))) return false;
    edDrawerOpen(target); return true;
  }
  if ($('edDetailsBtn')) $('edDetailsBtn').addEventListener('click', function () { if (edDrawerIsOpen()) edDrawerClose(); else edDrawerOpen(); });
  if ($('edDrDone')) $('edDrDone').addEventListener('click', function () { edDrawerClose(); });
  function edPlace() {
    var e = edEls(), card = $('card'), pv = $('preview'), grid = document.querySelector('.maker-grid');
    if (document.body.classList.contains('ed-mode') && edPhone.matches) {
      if (e.stage.parentNode !== grid) grid.insertBefore(e.stage, grid.firstChild);
      e.stage.appendChild(e.head); e.stage.appendChild(card); e.stage.appendChild(e.strip);
    } else {
      pv.insertBefore(card, pv.querySelector('.fontbar'));
      if (document.body.classList.contains('ed-mode')) { pv.insertBefore(e.head, card); card.parentNode.insertBefore(e.strip, card.nextSibling); }
      else { if (e.head.parentNode) e.head.parentNode.removeChild(e.head); if (e.strip.parentNode) e.strip.parentNode.removeChild(e.strip); }
      if (e.stage.parentNode) e.stage.parentNode.removeChild(e.stage);
    }
  }
  function edCenter() {
    var nm = $('edName'); if (nm && F.DESIGNS[state.d]) nm.textContent = F.DESIGNS[state.d].name;
    var row = document.querySelector('#edStrip .ed-row'), t = row && row.querySelector('.swatch[aria-pressed="true"]');
    if (row && t) { try { row.scrollTo({ left: t.offsetLeft - row.offsetLeft - (row.clientWidth - t.offsetWidth) / 2, behavior: 'smooth' }); } catch (x) { row.scrollLeft = t.offsetLeft - row.offsetLeft - 40; } }
  }
  function edEnter() {
    var was = document.body.classList.contains('ed-mode');
    document.body.classList.add('ed-mode'); edPlace(); watchTiles(edEls().strip); applyUI(); edCenter(); setTimeout(edDrawVisible, 60); setTimeout(edDrawVisible, 700);
    if (!was) { try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (x) { window.scrollTo(0, 0); } }
  }
  function edExit(toDesigns) {
    edDrawerClose(); document.body.classList.remove('ed-mode'); edPlace();
    if (toDesigns) { var p = $('swFirst'); if (p) try { p.closest('.panel').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (x) {} }
  }
  if (edPhone.addEventListener) edPhone.addEventListener('change', edPlace); else if (edPhone.addListener) edPhone.addListener(edPlace);
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && document.body.classList.contains('ed-mode') && !document.body.classList.contains('pe-open')) { if (edDrawerIsOpen()) edDrawerClose(); else edExit(false); } });
  window.__fcEd = { enter: edEnter, exit: edExit, reveal: edReveal, openDetails: edDrawerOpen, closeDetails: edDrawerClose };


  /* ---------- v20261103f: + Add line, Clear all text, Start from scratch, plain backgrounds ---------- */
  // An added line is one more line of the wording ([LINE] until words are typed), so it has every part control
  // (words, font, size, colour, bold, align, spacing, move, delete), is saved with the card and drawn in every download.
  // An empty [LINE] shows a "Tap to write" mark on the preview only (drawn beside the card, never inside it).
  var BLANK_TPL = '# [LINE]\n[LINE]\n[LINE]\n[LINE]';
  function curTpl() {
    var pk = pieceOn();
    if (pk) { var v = state['pw_' + pk]; return typeof v === 'string' && v.trim() ? v : F.pieceTemplate(Object.assign({}, state, { w: state.w === 'short' ? 'en' : state.w }), pk); }
    return F.templateOf(state) || '';
  }
  function setTpl(v) {
    var pk = pieceOn();
    if (pk) { state['pw_' + pk] = v; var pw = $('f-pw'); if (pw) pw.value = v; return; }
    state.x = v; touched.x = true; form.elements.x.value = v;
  }
  function leaveShort() { // the short English layout has no lines of its own: it becomes the English wording first
    if (state.w !== 'short' || pieceOn()) return;
    state.w = 'en'; state.x = tplFor(state.t, 'en'); state.i = F.TYPES[state.t].intro.en; fillForm(); applyUI();
  }
  function openLine(idx) {
    setTimeout(function () {
      var e = cardMount.querySelector('.fc-card [data-pl="' + idx + '"]');
      if (!e || !window.FCPartEdit) return;
      window.FCPartEdit.open(e.getAttribute('data-pe'));
      var w = $('peWords'); if (w) try { w.focus({ preventScroll: true }); } catch (er) { w.focus(); }
    }, 80);
  }
  /* ---------- v20261103i: add a line exactly where you want it (Benz Nov 3, 2026) ----------
     The line last tapped on the card (or picked in the Words list) is the selected line: "+ Add line" puts the new line
     right under it (with nothing selected, at the end as before). Every row of the Words list has + above, + below,
     move up / down and delete. A new line takes the look of the line it is added next to (a title stays a title,
     a names line keeps the names look, its own font / size / colour / bold / align), and every part edit follows
     its own line when lines are added, moved or deleted, so saved cards keep their order and looks. */
  var selLine = null; // { pk: piece or '', idx: wording line }
  function selIdx() {
    if (!selLine || selLine.pk !== (pieceOn() || '')) return null;
    var raws = curTpl().split(/\r?\n/); return raws[selLine.idx] != null ? selLine.idx : null;
  }
  function selectLine(idx) {
    selLine = idx == null || !isFinite(idx) ? null : { pk: pieceOn() || '', idx: idx };
    markList();
    if (window.FCPartEdit && window.FCPartEdit.mark) try { window.FCPartEdit.mark(); } catch (e) {}
  }
  function edScope() { var pk = pieceOn(); return pk ? pk + '/' : ''; }
  // write new wording lines; map[old line] = its new line (or -1 when deleted); add = { new line: part edits }
  function relayout(oldRaws, newRaws, map, add) {
    var ed = F.peRelayout(F.peParse(state), edScope(), oldRaws, newRaws, map, add);
    if (Object.keys(ed).length) state.pe = JSON.stringify(ed); else delete state.pe;
    setTpl(newRaws.join('\n'));
  }
  // the look a new line takes from the line it is added next to
  function lookOf(raws, n) {
    var raw = raws[n] || '', ed = F.peParse(state), res = F.peLines(ed, edScope(), raws), own = res[n] ? F.peClean(res[n].e) : {}, o = {};
    ['f', 'z', 'c', 'b', 'a', 'l', 'kd'].forEach(function (k) { if (own[k] != null) o[k] = own[k]; });
    var title = /^#\s+/.test(raw), e = cardMount.querySelector('.fc-card [data-pl="' + n + '"]');
    if (!title && !o.kd && e && e.classList.contains('fc-n') && !e.classList.contains('fc-title')) o.kd = 'n';
    return { raw: title ? '# [LINE]' : '[LINE]', edits: o };
  }
  function lineRaws() {
    var raws = curTpl().replace(/\s+$/, '').split(/\r?\n/);
    if (raws.length === 1 && !raws[0].trim()) raws = [];
    return raws;
  }
  // insert a new empty line above (where = 0) or below (where = 1) line n; returns the new line's number
  function insertLine(n, where) {
    leaveShort();
    var raws = lineRaws();
    if (n == null || raws[n] == null) { raws.push('[LINE]'); setTpl(raws.join('\n')); return raws.length - 1; }
    var look = lookOf(raws, n), r = F.lineInsert(raws, n, where, look.raw), add = {};
    add[r.at] = look.edits;
    relayout(raws, r.raws, r.map, add);
    return r.at;
  }
  // move line n up (d = -1) or down (d = 1), past the next line that has words
  function moveLine(n, d) {
    var raws = lineRaws(), r = F.lineMove(raws, n, d);
    if (!r) return n;
    relayout(raws, r.raws, r.map);
    return r.at;
  }
  function removeLine(n) {
    var raws = lineRaws(); if (raws[n] == null) return;
    var r = F.lineRemove(raws, n);
    relayout(raws, r.raws, r.map);
  }
  function afterLines(newIdx, openIt) {
    if (window.FCPartEdit) try { window.FCPartEdit.close(); } catch (e) {}
    selLine = newIdx == null ? null : { pk: pieceOn() || '', idx: newIdx };
    render(); warmSoon(); buildList(true);
    if (openIt) openLine(newIdx);
  }
  function addLine() {
    var n = selIdx();
    if (n == null) { // nothing selected: at the end, as before
      leaveShort();
      var raws = curTpl().replace(/\s+$/, '').split(/\r?\n/);
      if (raws.length === 1 && !raws[0].trim()) raws = [];
      raws.push('[LINE]');
      setTpl(raws.join('\n'));
      afterLines(raws.length - 1, true);
      return;
    }
    afterLines(insertLine(n, 1), true);
  }

  /* the Words list: one row per line with its own controls */
  if (window.FCi18n && window.FCi18n.add) window.FCi18n.add({ // v20261106c keep my words
    'Keep my words when I change the design': ['לשמור את המילים שלי כשמחליפים עיצוב', 'האלטן מיינע ווערטער ווען איך טויש דעם דיזיין'],
    'Your words were kept on the new design.': ['המילים שלכם נשמרו בעיצוב החדש.', 'אייערע ווערטער זענען געבליבן אויפן נייעם דיזיין.'],
    'Your words will stay when you change the design': ['המילים יישארו כשתחליפו עיצוב', 'די ווערטער בלייבן ווען איר טוישט דעם דיזיין'],
    'A new design will bring its own ready-made words': ['עיצוב חדש יביא את הנוסח המוכן שלו', 'א נייער דיזיין ברענגט זיין אייגענעם גרייטן נוסח']
  });
  if (window.FCi18n && window.FCi18n.add) window.FCi18n.add({
    'Lines': ['שורות', 'שורות'], 'Add a line above': ['הוספת שורה מעל', 'צולייגן א שורה אויבן'], 'Add a line below': ['הוספת שורה מתחת', 'צולייגן א שורה אונטן'],
    'Move up': ['הזזה למעלה', 'רירן ארויף'], 'Move down': ['הזזה למטה', 'רירן אראפ'], 'Delete this line': ['מחיקת השורה', 'אויסמעקן די שורה'],
    'above': ['מעל', 'אויבן'], 'below': ['מתחת', 'אונטן'], 'New line: type here': ['שורה חדשה: כתבו כאן', 'נייע שורה: שרייבט דא'],
    'Tap a line to pick it; + Add line goes right under it.': ['הקישו על שורה כדי לבחור אותה; ״הוספת שורה״ תוסיף מתחתיה.', 'דריקט אויף א שורה; ״צולייגן א שורה״ לייגט צו דערונטער.'],
    'Line': ['שורה', 'שורה'], 'No lines yet.': ['אין עדיין שורות.', 'נאך נישטא קיין שורות.']
  });
  var llTyping = false; // a row is being typed in (also by the on-screen Hebrew keyboard): keep its box
  var lineList = document.createElement('div'); lineList.className = 'line-list'; lineList.id = 'lineList';
  function placeList() {   // right under the wording box's label (the box itself may sit inside the keyboard's wrapper)
    var lab = document.querySelector('label[for="' + (pieceOn() ? 'f-pw' : 'f-x') + '"]');
    if (!lab || !lab.parentNode || lineList.previousSibling === lab) return;
    lab.parentNode.insertBefore(lineList, lab.nextSibling);
  }
  function markList() {
    var n = selIdx();
    [].forEach.call(lineList.querySelectorAll('.ll-row'), function (r) { var on = parseInt(r.getAttribute('data-i'), 10) === n; r.classList.toggle('on', on); r.setAttribute('aria-current', on ? 'true' : 'false'); });
  }
  function llBtn(cls, label, html) { var b = document.createElement('button'); b.type = 'button'; b.className = 'll-b ' + cls; b.setAttribute('aria-label', tr(label)); b.title = tr(label); b.innerHTML = html; return b; }
  function buildList(force) {
    placeList();
    var a = document.activeElement;
    if (!force && (llTyping || (a && lineList.contains(a) && a.tagName === 'INPUT'))) { markList(); return; }
    var short = state.w === 'short' && !pieceOn();
    lineList.hidden = short; lineList.innerHTML = '';
    if (short) return;
    lineList.dir = (document.documentElement.getAttribute('dir') || getComputedStyle(document.body).direction) === 'rtl' ? 'rtl' : 'ltr';   // the page's own direction; each line's box follows its own words
    var head = document.createElement('div'); head.className = 'll-head';
    head.innerHTML = '<b></b> <span></span>'; head.querySelector('b').textContent = tr('Lines'); head.querySelector('span').textContent = tr('Tap a line to pick it; + Add line goes right under it.');
    lineList.appendChild(head);
    var raws = curTpl().split(/\r?\n/), count = 0;
    raws.forEach(function (raw, i) {
      if (!raw.trim()) return;
      count++;
      var row = document.createElement('div'); row.className = 'll-row' + (/^#\s+/.test(raw) ? ' ll-title' : ''); row.setAttribute('data-i', String(i));
      var inp = document.createElement('input'); inp.type = 'text'; inp.className = 'll-t'; inp.dir = 'auto'; inp.setAttribute('aria-label', tr('Line') + ' ' + count);
      inp.value = /^(#\s+)?\s*\[LINE\]\s*$/i.test(raw) ? '' : raw.replace(/^#\s+/, '').replace(/\u2028/g, ' / ');
      inp.placeholder = tr('New line: type here');
      var bt = document.createElement('div'); bt.className = 'll-btns';
      bt.appendChild(llBtn('ll-ab', 'Add a line above', '<span aria-hidden="true">＋</span>' + tr('above')));
      bt.appendChild(llBtn('ll-bl', 'Add a line below', '<span aria-hidden="true">＋</span>' + tr('below')));
      bt.appendChild(llBtn('ll-up', 'Move up', '<span aria-hidden="true">↑</span>'));
      bt.appendChild(llBtn('ll-dn', 'Move down', '<span aria-hidden="true">↓</span>'));
      bt.appendChild(llBtn('ll-del', 'Delete this line', '<span aria-hidden="true">🗑</span>'));
      row.appendChild(inp); row.appendChild(bt); lineList.appendChild(row);
    });
    if (!count) { var p = document.createElement('p'); p.className = 'll-none'; p.textContent = tr('No lines yet.'); lineList.appendChild(p); }
    markList();
  }
  function focusRow(i) {
    setTimeout(function () { var inp = lineList.querySelector('.ll-row[data-i="' + i + '"] .ll-t'); if (inp) { try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); } try { inp.scrollIntoView({ block: 'nearest' }); } catch (e2) {} } }, 30);
  }
  lineList.addEventListener('click', function (ev) {
    var row = ev.target.closest('.ll-row'); if (!row) return;
    var i = parseInt(row.getAttribute('data-i'), 10), b = ev.target.closest('.ll-b');
    if (!b) { selectLine(i); return; }
    var n;
    if (b.classList.contains('ll-ab')) n = insertLine(i, 0);
    else if (b.classList.contains('ll-bl')) n = insertLine(i, 1);
    else if (b.classList.contains('ll-up')) n = moveLine(i, -1);
    else if (b.classList.contains('ll-dn')) n = moveLine(i, 1);
    else if (b.classList.contains('ll-del')) { removeLine(i); afterLines(null, false); return; }
    afterLines(n, false);
    if (b.classList.contains('ll-ab') || b.classList.contains('ll-bl')) focusRow(n);
    else { var nb = lineList.querySelector('.ll-row[data-i="' + n + '"] .' + (b.classList.contains('ll-up') ? 'll-up' : 'll-dn')); if (nb) try { nb.focus({ preventScroll: true }); } catch (e) {} }
  });
  lineList.addEventListener('focusin', function (ev) { var row = ev.target.closest('.ll-row'); if (row && ev.target.classList.contains('ll-t')) selectLine(parseInt(row.getAttribute('data-i'), 10)); });
  lineList.addEventListener('input', function (ev) {
    if (!ev.target.classList.contains('ll-t')) return;
    var row = ev.target.closest('.ll-row'), i = parseInt(row.getAttribute('data-i'), 10), raws = curTpl().split(/\r?\n/);
    if (raws[i] == null) return;
    var v = ev.target.value.replace(/[\r\n]+/g, ' '), title = /^#\s+/.test(raws[i]);
    if (raws[i].indexOf('\u2028') >= 0) v = v.replace(/ \/ /g, '\u2028');
    var nr = raws.slice(), map = {}; nr[i] = (title ? '# ' : '') + (v.trim() === '' ? '[LINE]' : v);
    raws.forEach(function (r, k) { map[k] = k; });
    llTyping = true; try { relayout(raws, nr, map); render(); } finally { llTyping = false; } warmSoon();
  });
  lineList.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter' || !ev.target.classList.contains('ll-t')) return;
    ev.preventDefault(); var i = parseInt(ev.target.closest('.ll-row').getAttribute('data-i'), 10), n = insertLine(i, 1); afterLines(n, false); focusRow(n);
  });
  buildList();
  function blankWords() {
    leaveShort();
    setTpl(BLANK_TPL);
    if (!pieceOn()) {
      state.h = ''; touched.h = true; state.ex = ''; touched.ex = true; state.nt = ''; touched.nt = true;
      var ed = F.peParse(state); Object.keys(ed).forEach(function (k) { if (k.indexOf('/') < 0 && k !== 'bsd') delete ed[k]; });
      ed.ft = { t: '' }; // the simcha's closing words (e.g. מזל טוב) go too; a blank card starts with nothing but בס״ד
      state.pe = JSON.stringify(ed);
      fillForm();
    }
  }
  function clearText() {
    if (!confirm(tr('Clear all the words on the card? You can then write your own lines.'))) return;
    if (window.FCPartEdit) try { window.FCPartEdit.close(); } catch (e) {}
    blankWords(); applyUI(); render(); warmSoon();
    toast(tr('Tap a line on the card to write it, or add more lines.'));
  }
  function startBlank(ask) {
    if (ask && !confirm(tr('Start a card from scratch? The words on this card will be cleared.'))) return;
    if (window.FCPartEdit) try { window.FCPartEdit.close(); } catch (e) {}
    state.pk = '';
    blankWords(); applyUI(); render(); warmSoon();
    toast(tr('Blank card: pick a design or a plain background, then tap a line to write.'));
  }
  $('addLine').addEventListener('click', addLine);
  $('addLine2').addEventListener('click', addLine);
  $('clearText').addEventListener('click', clearText);
  $('startBlank').addEventListener('click', function () { startBlank(true); });
  // the "Tap to write" marks for empty lines, laid over the preview (outside the card, so no download shows them)
  function blankHints() {
    [].slice.call(cardMount.querySelectorAll('.fc-blank-hint')).forEach(function (h) { h.remove(); });
    var c = cardMount.querySelector('.fc-card'); if (!c) return;
    var bl = c.querySelectorAll('.fc-blank'); if (!bl.length) return;
    var m = cardMount.getBoundingClientRect();
    [].forEach.call(bl, function (e) {
      var r = e.getBoundingClientRect(); if (!r.width && !r.height) return;
      var h = document.createElement('div'); h.className = 'fcx-ov fc-blank-hint'; h.setAttribute('aria-hidden', 'true');
      h.textContent = tr('Tap to write');
      var w = Math.max(r.width, m.width * 0.5);
      h.style.left = (r.left - m.left + (r.width - w) / 2) + 'px'; h.style.top = (r.top - m.top) + 'px';
      h.style.width = w + 'px'; h.style.height = Math.max(r.height - 2, 10) + 'px'; h.style.fontSize = Math.max(9, Math.min(13, r.height * 0.55)) + 'px';
      cardMount.appendChild(h);
    });
  }
  var hintTimer = null;
  function hintsSoon() { clearTimeout(hintTimer); hintTimer = setTimeout(blankHints, 60); setTimeout(blankHints, 500); setTimeout(blankHints, 1100); }
  window.addEventListener('resize', hintsSoon);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(hintsSoon).observe(cardMount);
  cardMount.addEventListener('transitionend', hintsSoon);
  document.addEventListener('click', function () { setTimeout(hintsSoon, 450); }, true);
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', hintsSoon);
  // plain backgrounds: one tap, any simcha
  (function () {
    var box = $('plainDots'); if (!box || !F.PLAIN) return;
    F.PLAIN.forEach(function (p) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'plain-dot'; b.dataset.design = p[0];
      b.style.background = p[2]; b.title = p[1]; b.setAttribute('aria-label', p[1]); b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { state.d = p[0]; applyUI(); render(); warmSoon(); });
      box.appendChild(b);
    });
  })();

  (function () { // v20261106c: the "Keep my words" checkbox (on by default; remembered on this device)
    var kb = $('keepWords'); if (!kb) return;
    kb.checked = keepOn();
    kb.addEventListener('change', function () { try { localStorage.setItem(KEEPK, kb.checked ? '1' : '0'); } catch (e) {} toast(tr0(kb.checked ? 'Your words will stay when you change the design' : 'A new design will bring its own ready-made words')); });
  })();
  var restored = restore();
  if (restored) { setTypeQuiet(); }
  if (params.get('blank') === '1') blankWords();
  buildSwatches(); buildTokens(); fillForm(); applyUI(); render();
  restoring = false;
  try { if (window.FreeCardPaint) window.FreeCardPaint.watchPreview(cardMount); } catch (e) { console.warn(e); }
  function setTypeQuiet() { /* the restored card keeps its own words; only the screen is brought in line */ }
  window.__fcState = state;
  window.__fcOpts = popts;
  window.__fcApi = { state: state, form: form, render: render, pieceOn: pieceOn, syncSet: syncSet, addLine: addLine, insertLine: insertLine, moveLine: moveLine, removeLine: removeLine, selectLine: selectLine, selLine: selIdx, clearText: clearText, startBlank: startBlank };
})();
