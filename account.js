/* FreeCard accounts (optional, v20261103m): sign up / sign in, a "My Cards" page with cards saved to the account,
   and "Save to my account" in the editor. Talks to the Simcha Card accounts server (Cloudflare Worker + D1).
   Only the email and each card's words & settings are stored — no photos, nothing else. Making and downloading
   cards keeps working without an account. */
(function (global) {
  'use strict';
  var API = 'https://freecard-api.drinfo-site.workers.dev';
  var SK = 'fc_acct_v1', DKEY = 'fc_draft_v2', MAX = 200;
  var L = {
    'Sign in': ['כניסה', 'אריינגיין'],
    'My Cards': ['הכרטיסים שלי', 'מיינע קארטלעך'],
    'Create account': ['יצירת חשבון', 'מאכן א חשבון'],
    'Your Simcha Card account': ['החשבון שלך ב-Simcha Card', 'אייער Simcha Card חשבון'],
    'Email': ['אימייל', 'אימעיל'],
    'Password': ['סיסמה', 'פאסווארט'],
    'New password': ['סיסמה חדשה', 'נייער פאסווארט'],
    'At least 8 characters': ['לפחות 8 תווים', 'כאטש 8 אותיות'],
    'Show password': ['הצגת הסיסמה', 'ווייזן דעם פאסווארט'],
    'Forgot password?': ['שכחת סיסמה?', 'פארגעסן דעם פאסווארט?'],
    'Back to sign in': ['חזרה לכניסה', 'צוריק צום אריינגיין'],
    'Recovery code': ['קוד שחזור', 'צוריקקריג קאד'],
    'Set new password': ['קביעת סיסמה חדשה', 'שטעלן א נייעם פאסווארט'],
    'Enter your email, the recovery code you got when you signed up, and a new password.': ['הזינו את האימייל, את קוד השחזור שקיבלתם בהרשמה, וסיסמה חדשה.', 'שרייבט אריין אייער אימעיל, דעם צוריקקריג קאד וואס איר האט באקומען ביים איינשרייבן, און א נייעם פאסווארט.'],
    'Your recovery code': ['קוד השחזור שלך', 'אייער צוריקקריג קאד'],
    'Simcha Card does not send emails. If you forget your password, this code is the only way back into your account. Write it down or take a screenshot now. It is shown only once.': ['Simcha Card לא שולח אימיילים. אם תשכחו את הסיסמה, הקוד הזה הוא הדרך היחידה לחזור לחשבון. רשמו אותו או צלמו מסך עכשיו. הוא מוצג פעם אחת בלבד.', 'Simcha Card שיקט נישט קיין אימעילס. אויב איר פארגעסט דעם פאסווארט, איז דער קאד דער איינציגער וועג צוריק אין חשבון. שרייבט אים אויף אדער מאכט א סקרינשאט יעצט. ער ווערט געוויזן נאר איין מאל.'],
    'Copy code': ['העתקת הקוד', 'קאפירן דעם קאד'],
    'Copied': ['הועתק', 'קאפירט'],
    'I saved it': ['שמרתי אותו', 'איך האב עס אפגעהיטן'],
    'Accounts are optional: you can make and download cards without one.': ['החשבון לא חובה: אפשר לעצב ולהוריד הזמנות גם בלעדיו.', 'א חשבון איז נישט קיין מוז: מען קען מאכן און אראפנעמען קארטלעך אן דעם.'],
    'Privacy: we keep only your email and your cards’ words and settings, no photos. The site owner can see account emails and saved cards. Your password is stored scrambled, never as typed.': ['פרטיות: אנחנו שומרים רק את האימייל ואת הנוסח וההגדרות של הכרטיסים, בלי תמונות. בעל האתר יכול לראות את כתובות האימייל של החשבונות ואת הכרטיסים השמורים. הסיסמה נשמרת מוצפנת, אף פעם לא כפי שהוקלדה.', 'פריוואטקייט: מיר היטן נאר אייער אימעיל און די ווערטער און איינשטעלונגען פון אייערע קארטלעך, קיין בילדער. דער בעל הבית פון דעם זייטל קען זען די אימעילס פון די חשבונות און די אפגעהיטענע קארטלעך. דער פאסווארט ווערט געהאלטן פארמישט, קיינמאל נישט ווי איר האט אים געשריבן.'],
    'Save to my account': ['שמירה בחשבון שלי', 'אפהיטן אין מיין חשבון'],
    'Saving…': ['שומר…', 'היט אפ…'],
    'Saved to your account': ['נשמר בחשבון שלך', 'אפגעהיטן אין אייער חשבון'],
    'Sign in or create a free account to save this card.': ['היכנסו או צרו חשבון חינם כדי לשמור את הכרטיס.', 'גייט אריין אדער מאכט א פרייען חשבון צו אפהיטן דעם קארטל.'],
    'Sign in to see the cards you saved.': ['היכנסו כדי לראות את הכרטיסים ששמרתם.', 'גייט אריין צו זען די קארטלעך וואס איר האט אפגעהיטן.'],
    'Saved in your account as': ['שמור בחשבון שלך בשם', 'אפגעהיטן אין אייער חשבון אלס'],
    'Your own photo is not saved to your account, only the words, design and settings.': ['התמונה שהעליתם לא נשמרת בחשבון, רק הנוסח, העיצוב וההגדרות.', 'אייער אייגן בילד ווערט נישט אפגעהיטן אין חשבון, נאר די ווערטער, דיזיין און איינשטעלונגען.'],
    'Signed in as': ['מחובר בתור', 'אריינגעגאנגען אלס'],
    'Sign out': ['יציאה', 'ארויסגיין'],
    'Open': ['פתיחה', 'עפענען'],
    'Rename': ['שינוי שם', 'טוישן נאמען'],
    'Duplicate': ['שכפול', 'קאפירן'],
    'Delete': ['מחיקה', 'אויסמעקן'],
    'Saved': ['נשמר', 'אפגעהיטן'],
    'No cards in your account yet. Make a card and tap “Save to my account”.': ['עדיין אין כרטיסים בחשבון. עצבו הזמנה והקישו “שמירה בחשבון שלי”.', 'נאך נישטא קיין קארטלעך אין חשבון. מאכט א קארטל און דריקט “אפהיטן אין מיין חשבון”.'],
    'Make a card': ['ליצירת הזמנה', 'מאכן א קארטל'],
    'New name for this card:': ['שם חדש לכרטיס:', 'נייער נאמען פאר דעם קארטל:'],
    'Delete this card from your account?': ['למחוק את הכרטיס מהחשבון?', 'אויסמעקן דעם קארטל פון אייער חשבון?'],
    'Open this card? It replaces the card you have open in the editor now.': ['לפתוח את הכרטיס? הוא יחליף את הכרטיס שפתוח כעת בעורך.', 'עפענען דעם קארטל? ער וועט פארביטן דעם קארטל וואס איז יעצט אפן.'],
    '(copy)': ['(עותק)', '(קאפיע)'],
    'Account settings': ['הגדרות חשבון', 'חשבון איינשטעלונגען'],
    'Type your password to confirm:': ['הקלידו את הסיסמה לאישור:', 'שרייבט אייער פאסווארט צו באשטעטיגן:'],
    'Get a new recovery code': ['קבלת קוד שחזור חדש', 'באקומען א נייעם צוריקקריג קאד'],
    'Delete my account and all my cards': ['מחיקת החשבון וכל הכרטיסים', 'אויסמעקן מיין חשבון און אלע קארטלעך'],
    'Delete your account and every card in it? This cannot be undone.': ['למחוק את החשבון ואת כל הכרטיסים שבו? אי אפשר לבטל.', 'אויסמעקן דעם חשבון און אלע קארטלעך? מען קען עס נישט צוריקמאכן.'],
    'Your account was deleted.': ['החשבון נמחק.', 'דער חשבון איז אויסגעמעקט.'],
    'cards saved': ['כרטיסים שמורים', 'קארטלעך אפגעהיטן'],
    'Loading…': ['טוען…', 'לאדט…'],
    'Wrong email or password.': ['אימייל או סיסמה שגויים.', 'אומריכטיגע אימעיל אדער פאסווארט.'],
    'There is already an account with this email. Sign in instead.': ['כבר יש חשבון עם האימייל הזה. היכנסו במקום.', 'עס איז שוין דא א חשבון מיט דעם אימעיל. גייט אריין אנשטאט.'],
    'Please enter a valid email.': ['נא להזין אימייל תקין.', 'ביטע שרייבט א ריכטיגע אימעיל.'],
    'The password needs at least 8 characters.': ['הסיסמה צריכה לפחות 8 תווים.', 'דער פאסווארט דארף האבן כאטש 8 אותיות.'],
    'Too many tries. Please wait a few minutes and try again.': ['יותר מדי ניסיונות. נא לחכות כמה דקות ולנסות שוב.', 'צו פיל פרואוון. ביטע ווארט עטליכע מינוט און פרובירט נאכאמאל.'],
    'That recovery code is not right for this email.': ['קוד השחזור לא מתאים לאימייל הזה.', 'דער צוריקקריג קאד פאסט נישט פאר דעם אימעיל.'],
    'Please enter your email and the 20-character recovery code.': ['נא להזין את האימייל ואת קוד השחזור בן 20 התווים.', 'ביטע שרייבט אייער אימעיל און דעם 20-אותיות צוריקקריג קאד.'],
    'Your account holds 200 cards, the most it can keep. Delete one to save a new one.': ['בחשבון יש 200 כרטיסים, המקסימום. מחקו אחד כדי לשמור חדש.', 'אין חשבון זענען דא 200 קארטלעך, די מערסטע. מעקט אויס איינס צו אפהיטן א נייעם.'],
    'This card is too big to save to your account.': ['הכרטיס גדול מדי לשמירה בחשבון.', 'דער קארטל איז צו גרויס צו אפהיטן אין חשבון.'],
    'Please sign in again.': ['נא להיכנס שוב.', 'ביטע גייט ווידער אריין.'],
    'Could not reach the server. Check your internet and try again.': ['אין חיבור לשרת. בדקו את האינטרנט ונסו שוב.', 'מען קען נישט דערגרייכן דעם סערווער. טשעקט אייער אינטערנעט און פרובירט נאכאמאל.'],
    'Something went wrong. Please try again.': ['משהו השתבש. נסו שוב.', 'עפעס איז נישט געגאנגען. פרובירט נאכאמאל.'],
    'Copies on this device': ['עותקים במכשיר הזה', 'קאפיעס אויף דעם מכשיר'],
    'Your account': ['החשבון שלך', 'אייער חשבון'],
    'Cards you saved to your account. Open them on any phone or computer.': ['כרטיסים ששמרתם בחשבון. אפשר לפתוח אותם בכל טלפון או מחשב.', 'קארטלעך וואס איר האט אפגעהיטן אין חשבון. עפנט זיי אויף יעדן טעלעפאן אדער קאמפיוטער.'],
    'PH:you@example.com': ['you@example.com', 'you@example.com'],
    'Close': ['סגירה', 'צומאכן']
  };
  if (global.FCi18n) global.FCi18n.add(L);
  function t(s) { return global.FCi18n ? global.FCi18n.t(s) : s; }
  var ERR = {
    wrong_login: 'Wrong email or password.', bad_login: 'Wrong email or password.',
    email_taken: 'There is already an account with this email. Sign in instead.',
    bad_email: 'Please enter a valid email.', bad_password: 'The password needs at least 8 characters.',
    rate_limited: 'Too many tries. Please wait a few minutes and try again.',
    wrong_code: 'That recovery code is not right for this email.', bad_reset: 'Please enter your email and the 20-character recovery code.',
    too_many_cards: 'Your account holds 200 cards, the most it can keep. Delete one to save a new one.',
    card_too_large: 'This card is too big to save to your account.', signed_out: 'Please sign in again.',
    network: 'Could not reach the server. Check your internet and try again.'
  };
  function errText(e) { return t(ERR[e && e.code] || 'Something went wrong. Please try again.'); }

  /* ---------- session (token kept on this device) ---------- */
  function sess() { try { var s = JSON.parse(localStorage.getItem(SK) || 'null'); if (s && s.token && s.expires > Date.now()) return s; } catch (e) {} return null; }
  var listeners = [];
  function setSess(s) { try { if (s) localStorage.setItem(SK, JSON.stringify(s)); else localStorage.removeItem(SK); } catch (e) {} listeners.forEach(function (f) { try { f(); } catch (e) {} }); }
  function api(method, path, body) {
    var s = sess(), h = { 'Content-Type': 'application/json' };
    if (s) h.Authorization = 'Bearer ' + s.token;
    return fetch(API + path, { method: method, headers: h, body: body == null ? undefined : JSON.stringify(body) }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) {
          if (r.status === 401 && j.error === 'signed_out' && s) setSess(null);
          var e = new Error(j.error || 'http_' + r.status); e.code = j.error || 'http'; e.status = r.status; throw e;
        }
        return j;
      });
    }, function () { var e = new Error('network'); e.code = 'network'; throw e; });
  }
  function startSession(j) { setSess({ token: j.token, expires: j.expires, email: j.user.email }); }
  function newId() { var a = new Uint8Array(12); (global.crypto || global.msCrypto).getRandomValues(a); return 'c' + Array.prototype.map.call(a, function (b) { return ('0' + b.toString(36)).slice(-2); }).join('').slice(0, 20); }

  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function btn(cls, text, fn) { var b = h('button', cls, text); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; }

  /* ---------- the sign in / create account / forgot password window ---------- */
  var ov = null, after = null;
  function closeModal() { if (ov) { ov.remove(); ov = null; document.documentElement.classList.remove('acct-lock'); } }
  function openModal(mode, then, why) {
    closeModal(); after = then || null;
    ov = h('div', 'acct-ov'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'acctTitle');
    var box = h('div', 'acct-box'); ov.appendChild(box);
    ov.addEventListener('click', function (e) { if (e.target === ov) closeModal(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', esc); } });
    document.body.appendChild(ov); document.documentElement.classList.add('acct-lock');
    draw(box, mode || 'in', why);
  }
  function field(label, type, name, ph, ac) {
    var w = h('label', 'acct-f'); w.appendChild(h('span', 'acct-l', label));
    var i = document.createElement('input'); i.type = type; i.name = name; i.required = true; if (ph) i.placeholder = ph; if (ac) i.autocomplete = ac;
    if (type === 'email') { i.inputMode = 'email'; i.autocapitalize = 'off'; i.spellcheck = false; i.dir = 'ltr'; }
    if (type === 'password' || name === 'code') i.dir = 'ltr';
    w.appendChild(i); return w;
  }
  function draw(box, mode, why) {
    box.innerHTML = '';
    var x = btn('acct-x', '✕', closeModal); x.setAttribute('aria-label', 'Close'); box.appendChild(x);
    var title = h('h2', 'acct-h', mode === 'code' ? 'Your recovery code' : mode === 'reset' ? 'Set new password' : 'Your Simcha Card account'); title.id = 'acctTitle'; box.appendChild(title);
    if (mode === 'code') return drawCode(box, why);
    if (why && mode !== 'reset') box.appendChild(h('p', 'acct-why', why));
    if (mode !== 'reset') {
      var tabs = h('div', 'acct-tabs'); tabs.setAttribute('role', 'tablist');
      [['in', 'Sign in'], ['up', 'Create account']].forEach(function (m) {
        var b = btn('acct-tab', m[1], function () { draw(box, m[0], why); }); b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(mode === m[0])); tabs.appendChild(b);
      });
      box.appendChild(tabs);
    } else box.appendChild(h('p', 'acct-why', 'Enter your email, the recovery code you got when you signed up, and a new password.'));
    var f = document.createElement('form'); f.className = 'acct-form'; f.noValidate = true;
    f.appendChild(field('Email', 'email', 'email', 'you@example.com', 'email'));
    if (mode === 'reset') f.appendChild(field('Recovery code', 'text', 'code', 'XXXXX-XXXXX-XXXXX-XXXXX', 'off'));
    var pw = field(mode === 'reset' ? 'New password' : 'Password', 'password', 'password', mode === 'in' ? '' : 'At least 8 characters', mode === 'in' ? 'current-password' : 'new-password');
    f.appendChild(pw);
    var sh = h('label', 'acct-show'); var cb = document.createElement('input'); cb.type = 'checkbox';
    cb.addEventListener('change', function () { f.password.type = cb.checked ? 'text' : 'password'; });
    sh.appendChild(cb); sh.appendChild(h('span', '', 'Show password')); f.appendChild(sh);
    var msg = h('p', 'acct-err'); msg.setAttribute('role', 'alert'); f.appendChild(msg);
    var go = h('button', 'btn gold acct-go', mode === 'in' ? 'Sign in' : mode === 'up' ? 'Create account' : 'Set new password'); go.type = 'submit'; f.appendChild(go);
    f.addEventListener('submit', function (e) {
      e.preventDefault(); msg.textContent = '';
      var email = f.email.value.trim(), p = f.password.value;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = errText({ code: 'bad_email' }); return; }
      if (mode !== 'in' && p.length < 8) { msg.textContent = errText({ code: 'bad_password' }); return; }
      go.disabled = true;
      var req = mode === 'in' ? api('POST', '/login', { email: email, password: p })
        : mode === 'up' ? api('POST', '/signup', { email: email, password: p })
        : api('POST', '/reset', { email: email, recovery_code: f.code.value, new_password: p });
      req.then(function (j) {
        startSession(j);
        if (j.recovery_code) draw(box, 'code', j.recovery_code); else done();
      }, function (er) { go.disabled = false; msg.textContent = errText(er); });
    });
    box.appendChild(f);
    if (mode === 'in') box.appendChild(btn('linkbtn acct-forgot', 'Forgot password?', function () { draw(box, 'reset'); }));
    if (mode === 'reset') box.appendChild(btn('linkbtn acct-forgot', 'Back to sign in', function () { draw(box, 'in'); }));
    box.appendChild(h('p', 'acct-priv', 'Accounts are optional: you can make and download cards without one.'));
    box.appendChild(h('p', 'acct-priv', 'Privacy: we keep only your email and your cards’ words and settings, no photos. The site owner can see account emails and saved cards. Your password is stored scrambled, never as typed.'));
    setTimeout(function () { try { f.email.focus(); } catch (e) {} }, 30);
  }
  function drawCode(box, code) {
    box.appendChild(h('p', 'acct-why', 'Simcha Card does not send emails. If you forget your password, this code is the only way back into your account. Write it down or take a screenshot now. It is shown only once.'));
    var c = h('div', 'acct-code', code); c.setAttribute('data-noi18n', ''); c.dir = 'ltr'; box.appendChild(c);
    var row = h('div', 'acct-row');
    var cp = btn('btn ghost', 'Copy code', function () {
      var ok = function () { cp.textContent = t('Copied'); };
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(ok, function () {}); else ok();
    });
    row.appendChild(cp); row.appendChild(btn('btn gold acct-saved', 'I saved it', done)); box.appendChild(row);
  }
  function done() { closeModal(); var f = after; after = null; if (f) f(); }

  /* ---------- header button ---------- */
  function header() {
    var nav = document.querySelector('.top .wrap .nav'); if (!nav) return;
    var a = nav.querySelector('.acct-link');
    if (!a) {
      a = h('a', 'plain acct-link'); a.href = 'mycards.html';
      a.addEventListener('click', function (e) { if (!sess() && !document.getElementById('acctPage')) { e.preventDefault(); openModal('in', function () { location.href = 'mycards.html'; }); } });
      var mk = nav.querySelector('.btn.sm'); nav.insertBefore(a, mk || null);
    }
    var s = sess();
    a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>';
    var lab = h('span', 'acct-lt', s ? 'My Cards' : 'Sign in'); a.appendChild(lab);
    a.setAttribute('aria-label', s ? 'My Cards' : 'Sign in'); a.classList.toggle('on', !!s);
  }

  /* ---------- editor: Save to my account ---------- */
  function editor() {
    var E = global.FCEditor, spot = document.querySelector('.preview-col .dl-hint') || document.querySelector('.preview-col .dl-main');
    if (!E || !spot) return;
    var wrap = h('div', 'acct-save'); wrap.id = 'acctSave';
    var b = btn('btn ghost acct-savebtn', '', save); b.id = 'acctSaveBtn';
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.34 9.1 4 4 0 0 0 6.5 19z"/><path d="M12 12v6M9.5 14.5 12 12l2.5 2.5"/></svg><span>Save to my account</span>';
    var st = h('p', 'acct-st'); st.id = 'acctStatus'; st.setAttribute('aria-live', 'polite');
    wrap.appendChild(b); wrap.appendChild(st);
    spot.parentNode.insertBefore(wrap, spot.nextSibling);
    function showCur() {
      st.innerHTML = ''; var c = E.cloud(); if (!c || !sess()) return;
      st.appendChild(h('span', '', 'Saved in your account as')); st.appendChild(document.createTextNode(' '));
      var n = h('b', 'acct-nm', '“' + c.name + '”'); n.setAttribute('data-noi18n', ''); n.dir = 'auto'; st.appendChild(n);
      st.appendChild(document.createTextNode(' · ')); var a = h('a', '', 'My Cards'); a.href = 'mycards.html'; st.appendChild(a);
    }
    function save() {
      if (!sess()) { openModal('in', save, t('Sign in or create a free account to save this card.')); return; }
      var cur = E.cloud(), snap = E.snapshot(), id = cur && cur.id || newId();
      var body = { design_id: snap.state.d, thumbnail: snap.state.t, data: snap };
      if (!cur) body.name = E.autoName();
      b.disabled = true; st.textContent = t('Saving…');
      api('PUT', '/cards/' + encodeURIComponent(id), body).then(function (j) {
        b.disabled = false; E.setCloud({ id: id, name: j.card.name });
        showCur(); var ok = h('span', 'acct-ok', ' ✓ ' + t('Saved to your account')); st.insertBefore(ok, st.firstChild); st.insertBefore(document.createElement('br'), ok.nextSibling);
        if (E.hasOwnPicture()) { st.appendChild(document.createElement('br')); st.appendChild(h('small', '', 'Your own photo is not saved to your account, only the words, design and settings.')); }
      }, function (er) {
        b.disabled = false; st.textContent = errText(er);
        if (er.code === 'signed_out') openModal('in', save, t('Please sign in again.'));
      });
    }
    showCur(); listeners.push(showCur);
  }

  /* ---------- My Cards page ---------- */
  function fmtDate(ms) { try { var lg = global.FCi18n && global.FCi18n.lang(); return new Date(ms).toLocaleDateString(lg === 'he' || lg === 'yi' ? 'he-IL' : undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } }
  function thumb(mount, type, design) { // the design's own tile picture (no text); drawn designs are drawn without words
    var F = global.FreeCard; if (!F || !F.renderCard) return;
    var D = F.DESIGNS[design];
    if (D && D.kind === 'img') {
      var im = document.createElement('img'); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.className = 'acct-img';
      im.src = 'img/' + (D.thumb || 'p/' + (D.file || design)) + '.webp';
      im.onerror = function () { if (!im._fb) { im._fb = 1; im.src = 'img/' + (D.file || design) + '.webp'; } };
      if (D.vars && D.vars.bg) mount.style.backgroundColor = D.vars.bg;
      mount.appendChild(im); return;
    }
    try {
      var c = F.sampleCard(F.TYPES[type] ? type : 'chasuna', F.DESIGNS[design] ? design : undefined, 'en');
      Object.keys(c).forEach(function (k) { if (k !== 't' && k !== 'd' && k !== 'w' && k !== 'f') c[k] = ''; });
      F.renderCard(c, mount, { thumb: true });
    } catch (e) {}
  }
  function page() {
    var root = document.getElementById('acctPage'); if (!root) return;
    function render() {
      root.innerHTML = '';
      var s = sess();
      if (!s) {
        var p = h('div', 'acct-panel');
        p.appendChild(h('p', 'acct-lead', 'Sign in to see the cards you saved.'));
        var r = h('div', 'acct-row');
        r.appendChild(btn('btn gold', 'Sign in', function () { openModal('in', render); }));
        r.appendChild(btn('btn ghost', 'Create account', function () { openModal('up', render); }));
        p.appendChild(r);
        p.appendChild(h('p', 'acct-priv', 'Accounts are optional: you can make and download cards without one.'));
        p.appendChild(h('p', 'acct-priv', 'Privacy: we keep only your email and your cards’ words and settings, no photos. The site owner can see account emails and saved cards. Your password is stored scrambled, never as typed.'));
        root.appendChild(p); return;
      }
      var bar = h('div', 'acct-bar');
      var who = h('div', 'acct-who'); who.appendChild(h('span', '', 'Signed in as')); who.appendChild(document.createTextNode(' '));
      var em = h('b', '', s.email); em.setAttribute('data-noi18n', ''); em.dir = 'ltr'; who.appendChild(em);
      bar.appendChild(who);
      var cnt = h('span', 'acct-cnt'); bar.appendChild(cnt);
      bar.appendChild(btn('btn ghost sm acct-out', 'Sign out', function () { api('POST', '/logout').catch(function () {}).then(function () { setSess(null); render(); }); }));
      root.appendChild(bar);
      var grid = h('div', 'acct-grid'); grid.id = 'acctGrid'; root.appendChild(grid);
      var msg = h('p', 'acct-err'); msg.setAttribute('role', 'alert'); root.appendChild(msg);
      grid.appendChild(h('p', 'hint', 'Loading…'));
      api('GET', '/cards').then(function (j) {
        grid.innerHTML = '';
        cnt.innerHTML = ''; var nn = h('b', '', j.cards.length + ' / ' + MAX); nn.setAttribute('data-noi18n', ''); nn.dir = 'ltr'; cnt.appendChild(nn); cnt.appendChild(document.createTextNode(' ')); cnt.appendChild(h('span', '', 'cards saved'));
        if (!j.cards.length) {
          var em2 = h('div', 'acct-empty'); em2.appendChild(h('p', '', 'No cards in your account yet. Make a card and tap “Save to my account”.'));
          var mk = h('a', 'btn gold', 'Make a card'); mk.href = 'make.html'; em2.appendChild(mk); grid.appendChild(em2);
        }
        j.cards.forEach(function (c) { grid.appendChild(item(c)); });
      }, function (er) { grid.innerHTML = ''; msg.textContent = errText(er); if (er.code === 'signed_out') render(); });
      root.appendChild(settings(s));
      function item(c) {
        var it = h('div', 'acct-item'); it.dataset.id = c.id;
        var th = h('div', 'fc-wrap g-card acct-th'); it.appendChild(th); thumb(th, c.thumbnail, c.design_id);
        var cap = h('div', 'acct-cap');
        var nm = h('div', 'acct-name', c.name); nm.setAttribute('data-noi18n', ''); nm.dir = 'auto'; cap.appendChild(nm);
        var F = global.FreeCard, T = F && F.TYPES[c.thumbnail];
        var meta = h('div', 'acct-meta'); if (T) { meta.appendChild(h('span', '', T.en)); meta.appendChild(document.createTextNode(' · ')); }
        var dt = h('span', '', fmtDate(c.updated_at)); dt.setAttribute('data-noi18n', ''); meta.appendChild(dt); cap.appendChild(meta);
        it.appendChild(cap);
        var acts = h('div', 'acct-acts');
        acts.appendChild(btn('btn gold sm', 'Open', function () { open(c.id); }));
        acts.appendChild(btn('btn ghost sm', 'Rename', function () {
          var n = prompt(t('New name for this card:'), c.name); if (n == null) return; n = n.trim(); if (!n) return;
          api('PATCH', '/cards/' + encodeURIComponent(c.id), { name: n }).then(function (r) { c.name = r.name; nm.textContent = r.name; fixDraftName(c.id, r.name); }, function (er) { msg.textContent = errText(er); });
        }));
        acts.appendChild(btn('btn ghost sm', 'Duplicate', function () {
          api('GET', '/cards/' + encodeURIComponent(c.id)).then(function (r) {
            var nid = newId();
            return api('PUT', '/cards/' + nid, { name: (r.card.name + ' ' + t('(copy)')).slice(0, 120), design_id: r.card.design_id, thumbnail: r.card.thumbnail, data: r.card.data });
          }).then(function () { render(); }, function (er) { msg.textContent = errText(er); });
        }));
        acts.appendChild(btn('btn ghost sm acct-del', 'Delete', function () {
          if (!confirm(t('Delete this card from your account?'))) return;
          api('DELETE', '/cards/' + encodeURIComponent(c.id)).then(function () { it.remove(); fixDraftName(c.id, null); render(); }, function (er) { msg.textContent = errText(er); });
        }));
        it.appendChild(acts);
        return it;
      }
    }
    function open(id) {
      var had = null; try { had = JSON.parse(localStorage.getItem(DKEY) || 'null'); } catch (e) {}
      if (had && had.state && !(had.cloud && had.cloud.id === id) && !confirm(t('Open this card? It replaces the card you have open in the editor now.'))) return;
      api('GET', '/cards/' + encodeURIComponent(id)).then(function (r) {
        var d = r.card.data || {}; d.at = Date.now(); d.cloud = { id: r.card.id, name: r.card.name }; d.photo = null; d.bg = null;
        localStorage.setItem(DKEY, JSON.stringify(d));
        location.href = 'make.html';
      }, function (er) { alert(errText(er)); });
    }
    function fixDraftName(id, name) { // keep the editor's draft in step when its card is renamed or deleted here
      try { var d = JSON.parse(localStorage.getItem(DKEY) || 'null'); if (d && d.cloud && d.cloud.id === id) { if (name) d.cloud.name = name; else delete d.cloud; localStorage.setItem(DKEY, JSON.stringify(d)); } } catch (e) {}
    }
    function settings(s) {
      var det = h('details', 'acct-set'); det.appendChild(h('summary', '', 'Account settings'));
      var f = h('div', 'acct-set-in');
      var lab = h('label', 'acct-f'); lab.appendChild(h('span', 'acct-l', 'Type your password to confirm:'));
      var pw = document.createElement('input'); pw.type = 'password'; pw.autocomplete = 'current-password'; pw.dir = 'ltr'; lab.appendChild(pw); f.appendChild(lab);
      var out = h('div', 'acct-set-out'); var m = h('p', 'acct-err'); m.setAttribute('role', 'alert');
      var r = h('div', 'acct-row');
      r.appendChild(btn('btn ghost sm', 'Get a new recovery code', function () {
        m.textContent = ''; api('POST', '/me/recovery', { password: pw.value }).then(function (j) {
          pw.value = ''; out.innerHTML = ''; out.appendChild(h('p', 'acct-why', 'Simcha Card does not send emails. If you forget your password, this code is the only way back into your account. Write it down or take a screenshot now. It is shown only once.'));
          var c = h('div', 'acct-code', j.recovery_code); c.setAttribute('data-noi18n', ''); c.dir = 'ltr'; out.appendChild(c);
        }, function (er) { m.textContent = errText(er); });
      }));
      r.appendChild(btn('btn ghost sm acct-del', 'Delete my account and all my cards', function () {
        m.textContent = ''; if (!pw.value) { pw.focus(); return; }
        if (!confirm(t('Delete your account and every card in it? This cannot be undone.'))) return;
        api('DELETE', '/me', { password: pw.value }).then(function () { setSess(null); alert(t('Your account was deleted.')); render(); }, function (er) { m.textContent = errText(er); });
      }));
      f.appendChild(r); f.appendChild(m); f.appendChild(out);
      f.appendChild(h('p', 'acct-priv', 'Privacy: we keep only your email and your cards’ words and settings, no photos. The site owner can see account emails and saved cards. Your password is stored scrambled, never as typed.'));
      det.appendChild(f); return det;
    }
    render(); listeners.push(function () { if (!ov) render(); });
  }

  function init() { header(); editor(); page(); listeners.push(header); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  global.FCAccount = { api: API, request: api, errText: errText, onChange: function (f) { listeners.push(f); }, signedIn: function () { return !!sess(); }, email: function () { var s = sess(); return s && s.email; }, open: openModal, signOut: function () { setSess(null); } };
})(window);
