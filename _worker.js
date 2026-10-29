// FreeCard server: saved cards with short links, RSVP, Mazel Tov wall, host dashboard.
// Static files are served from ASSETS; data lives in the D1 database bound as DB.
const ALPHA = 'abcdefghjkmnpqrstuvwxyz23456789';
const TOKA = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const CARD_KEYS = ['t','d','w','f','h','i','x','n1','n2','p1','p2','dt','hd','tm','tl','sc','hl','ad','ex','ph','hn','nt','rs','wl'];
const LIMITS = { create: [40, 3600], update: [400, 3600], og: [120, 3600], rsvp: [25, 600], wish: [12, 600], open: [120, 600], guests: [60, 3600] };
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|skype|discord|embedly|vkshare|pinterest|headless|curl|wget|python|go-http/i;

let schemaReady = null;
function schema(db) {
  if (!schemaReady) {
    schemaReady = db.batch([
      db.prepare("CREATE TABLE IF NOT EXISTS cards (id TEXT PRIMARY KEY, tok TEXT NOT NULL, data TEXT NOT NULL, title TEXT, descr TEXT, og BLOB, ogv INTEGER DEFAULT 0, guests TEXT, created INTEGER, updated INTEGER, views INTEGER DEFAULT 0, ip TEXT)"),
      db.prepare("CREATE TABLE IF NOT EXISTS rsvps (id INTEGER PRIMARY KEY AUTOINCREMENT, card TEXT NOT NULL, gk TEXT NOT NULL, name TEXT, coming INTEGER, total INTEGER, men INTEGER, women INTEGER, kids INTEGER, note TEXT, guest TEXT, created INTEGER, updated INTEGER, ip TEXT, hidden INTEGER DEFAULT 0)"),
      db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS rsvps_gk ON rsvps (card, gk)"),
      db.prepare("CREATE TABLE IF NOT EXISTS wishes (id INTEGER PRIMARY KEY AUTOINCREMENT, card TEXT NOT NULL, name TEXT, msg TEXT, created INTEGER, ip TEXT, hidden INTEGER DEFAULT 0)"),
      db.prepare("CREATE INDEX IF NOT EXISTS wishes_card ON wishes (card, created)"),
      db.prepare("CREATE TABLE IF NOT EXISTS opens (card TEXT NOT NULL, guest TEXT, vk TEXT, ts INTEGER)"),
      db.prepare("CREATE INDEX IF NOT EXISTS opens_card ON opens (card, ts)"),
      db.prepare("CREATE TABLE IF NOT EXISTS hits (ip TEXT, kind TEXT, ts INTEGER)"),
      db.prepare("CREATE INDEX IF NOT EXISTS hits_k ON hits (ip, kind, ts)")
    ]).catch((e) => { schemaReady = null; throw e; });
  }
  return schemaReady;
}

const now = () => Math.floor(Date.now() / 1000);
function rand(n, alpha) {
  const b = new Uint8Array(n); crypto.getRandomValues(b);
  let s = ''; for (let i = 0; i < n; i++) s += alpha[b[i] % alpha.length]; return s;
}
async function ipKey(req) {
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'local';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('fc1:' + ip));
  return [...new Uint8Array(d).slice(0, 8)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra } });
}
const bad = (msg, status = 400) => json({ ok: false, error: msg }, status);
function str(v, max) { if (v == null) return ''; return String(v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max); }
function int(v, lo, hi) { const n = parseInt(v, 10); if (!Number.isFinite(n)) return null; return Math.max(lo, Math.min(hi, n)); }
function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

async function limited(env, ip, kind) {
  const [max, win] = LIMITS[kind];
  const t = now();
  const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM hits WHERE ip = ? AND kind = ? AND ts > ?').bind(ip, kind, t - win).first();
  if (r && r.n >= max) return true;
  await env.DB.prepare('INSERT INTO hits (ip, kind, ts) VALUES (?, ?, ?)').bind(ip, kind, t).run();
  if (Math.random() < 0.02) await env.DB.prepare('DELETE FROM hits WHERE ts < ?').bind(t - 86400).run();
  return false;
}

function cleanCard(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const o = {};
  for (const k of CARD_KEYS) {
    if (d[k] == null) continue;
    const v = str(d[k], k === 'x' ? 4000 : k === 'ex' || k === 'nt' || k === 'i' ? 600 : 200);
    if (v) o[k] = v;
  }
  if (!o.t) return null;
  return o;
}
async function readJson(req, max = 32000) {
  const t = await req.text();
  if (t.length > max) throw new Error('too big');
  return JSON.parse(t || '{}');
}
async function getCard(env, id) {
  if (!/^[a-z0-9]{4,12}$/.test(id || '')) return null;
  return env.DB.prepare('SELECT id, tok, data, title, descr, ogv, guests, created, updated, views FROM cards WHERE id = ?').bind(id).first();
}
function tokenOk(card, k) {
  if (!card || !k || typeof k !== 'string' || k.length !== card.tok.length) return false;
  let diff = 0; for (let i = 0; i < k.length; i++) diff |= k.charCodeAt(i) ^ card.tok.charCodeAt(i);
  return diff === 0;
}

async function assetHtml(env, url, path) {
  let r = await env.ASSETS.fetch(new Request(new URL(path, url).toString()));
  for (let i = 0; i < 3 && r.status >= 300 && r.status < 400 && r.headers.get('location'); i++) {
    r = await env.ASSETS.fetch(new Request(new URL(r.headers.get('location'), url).toString()));
  }
  return r.text();
}
function setMeta(html, prop, value, attr = 'property') {
  const re = new RegExp('<meta ' + attr + '="' + prop + '" content="[^"]*">');
  const tag = '<meta ' + attr + '="' + prop + '" content="' + escAttr(value) + '">';
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', tag + '\n</head>');
}
function htmlResp(html) {
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' } });
}

async function cardPage(env, url, id) {
  const card = await getCard(env, id);
  let html = await assetHtml(env, url, '/card.html');
  html = html.replace('<head>', '<head>\n<base href="/">');
  if (!card) {
    html = html.replace('</head>', '<script>window.__FC_SAVED={missing:true,id:' + JSON.stringify(id) + '};</script>\n</head>');
    return new Response(html, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  }
  const origin = url.origin;
  const title = card.title || "You're invited";
  const descr = card.descr || "You're invited! Tap to open the invitation, RSVP and get directions.";
  const img = card.ogv ? origin + '/c/' + id + '/og.jpg?v=' + card.ogv : origin + '/og.jpg';
  html = html.replace(/<title>[^<]*<\/title>/, '<title>' + escAttr(title) + '</title>');
  html = setMeta(html, 'og:title', title);
  html = setMeta(html, 'og:description', descr);
  html = setMeta(html, 'description', descr, 'name');
  html = setMeta(html, 'og:image', img);
  html = setMeta(html, 'og:url', origin + '/c/' + id);
  html = setMeta(html, 'og:type', 'website');
  if (card.ogv) { html = setMeta(html, 'og:image:width', '1200'); html = setMeta(html, 'og:image:height', '630'); }
  html = setMeta(html, 'twitter:card', 'summary_large_image', 'name');
  const saved = { id, data: JSON.parse(card.data), v: card.updated };
  html = html.replace('</head>', '<script>window.__FC_SAVED=' + JSON.stringify(saved).replace(/</g, '\\u003c') + ';</script>\n</head>');
  return htmlResp(html);
}

async function api(req, env, url, ctx) {
  const parts = url.pathname.split('/').filter(Boolean); // api, ...
  const m = req.method;
  const ip = await ipKey(req);

  // POST /api/cards  -> create
  if (parts.length === 2 && parts[1] === 'cards' && m === 'POST') {
    let body; try { body = await readJson(req); } catch (e) { return bad('bad request'); }
    const data = cleanCard(body.data); if (!data) return bad('missing card');
    if (await limited(env, ip, 'create')) return bad('Too many new cards from here, try again later', 429);
    const tok = rand(20, TOKA), t = now();
    for (let i = 0; i < 6; i++) {
      const id = rand(i < 3 ? 5 : 6, ALPHA);
      try {
        await env.DB.prepare('INSERT INTO cards (id, tok, data, title, descr, created, updated, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(id, tok, JSON.stringify(data), str(body.title, 140), str(body.descr, 240), t, t, ip).run();
        return json({ ok: true, id, k: tok, url: url.origin + '/c/' + id, host: url.origin + '/h/' + id + '?k=' + tok });
      } catch (e) { if (!/UNIQUE|constraint/i.test(String(e))) throw e; }
    }
    return bad('could not save, try again', 500);
  }
  if (parts[1] !== 'cards' || !parts[2]) return bad('not found', 404);
  const id = parts[2], sub = parts[3] || '';
  const card = await getCard(env, id);
  if (!card) return bad('This card was not found', 404);
  const k = url.searchParams.get('k') || req.headers.get('x-fc-key') || '';

  // GET /api/cards/:id  -> public card data
  if (!sub && m === 'GET') return json({ ok: true, id, data: JSON.parse(card.data), v: card.updated, host: tokenOk(card, k) });

  // PUT /api/cards/:id  -> host edits the card
  if (!sub && (m === 'PUT' || m === 'POST')) {
    if (!tokenOk(card, k)) return bad('This edit link is not valid', 403);
    let body; try { body = await readJson(req); } catch (e) { return bad('bad request'); }
    const data = cleanCard(body.data); if (!data) return bad('missing card');
    if (await limited(env, ip, 'update')) return bad('Too many saves, wait a few minutes', 429);
    const t = Math.max(now(), (card.updated || 0) + 1);
    await env.DB.prepare('UPDATE cards SET data = ?, title = ?, descr = ?, updated = ? WHERE id = ?')
      .bind(JSON.stringify(data), str(body.title, 140), str(body.descr, 240), t, id).run();
    return json({ ok: true, id, v: t });
  }

  // PUT /api/cards/:id/og  -> preview picture (JPEG bytes)
  if (sub === 'og' && (m === 'PUT' || m === 'POST')) {
    if (!tokenOk(card, k)) return bad('not allowed', 403);
    if (await limited(env, ip, 'og')) return bad('slow down', 429);
    const buf = new Uint8Array(await req.arrayBuffer());
    if (buf.length < 1000 || buf.length > 450000 || buf[0] !== 0xff || buf[1] !== 0xd8) return bad('bad image');
    const v = now();
    await env.DB.prepare('UPDATE cards SET og = ?, ogv = ? WHERE id = ?').bind(buf, v, id).run();
    return json({ ok: true, v });
  }

  // POST /api/cards/:id/open -> guest opened the card
  if (sub === 'open' && m === 'POST') {
    if (BOT.test(req.headers.get('user-agent') || '')) return json({ ok: true, skipped: true });
    let body = {}; try { body = await readJson(req, 2000); } catch (e) {}
    if (await limited(env, ip, 'open')) return json({ ok: true });
    await env.DB.batch([
      env.DB.prepare('INSERT INTO opens (card, guest, vk, ts) VALUES (?, ?, ?, ?)').bind(id, str(body.to, 80) || null, str(body.vk, 24) || ip, now()),
      env.DB.prepare('UPDATE cards SET views = views + 1 WHERE id = ?').bind(id)
    ]);
    return json({ ok: true });
  }

  // POST /api/cards/:id/rsvp
  if (sub === 'rsvp' && m === 'POST') {
    let b; try { b = await readJson(req, 4000); } catch (e) { return bad('bad request'); }
    const name = str(b.name, 80); if (!name) return bad('Please write your name');
    const gk = str(b.gk, 32); if (!/^[A-Za-z0-9]{8,32}$/.test(gk)) return bad('bad request');
    const coming = b.coming ? 1 : 0;
    let men = coming ? int(b.men, 0, 99) : null, women = coming ? int(b.women, 0, 99) : null, kids = coming ? int(b.kids, 0, 99) : null;
    let total = coming ? int(b.total, 1, 99) : 0;
    const split = (men || 0) + (women || 0) + (kids || 0);
    if (coming && split > 0) total = split;
    if (coming && !total) total = 1;
    const note = str(b.note, 300), guest = str(b.to, 80) || null;
    const prev = await env.DB.prepare('SELECT id FROM rsvps WHERE card = ? AND gk = ?').bind(id, gk).first();
    if (await limited(env, ip, 'rsvp')) return bad('Too many answers from here, try again in a few minutes', 429);
    const t = now();
    if (prev) {
      await env.DB.prepare('UPDATE rsvps SET name = ?, coming = ?, total = ?, men = ?, women = ?, kids = ?, note = ?, guest = COALESCE(?, guest), updated = ?, hidden = 0 WHERE id = ?')
        .bind(name, coming, total, men, women, kids, note, guest, t, prev.id).run();
    } else {
      const c = await env.DB.prepare('SELECT COUNT(*) AS n FROM rsvps WHERE card = ?').bind(id).first();
      if (c && c.n >= 3000) return bad('This card has too many answers', 429);
      await env.DB.prepare('INSERT INTO rsvps (card, gk, name, coming, total, men, women, kids, note, guest, created, updated, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, gk, name, coming, total, men, women, kids, note, guest, t, t, ip).run();
    }
    return json({ ok: true, updated: !!prev });
  }
  // GET /api/cards/:id/rsvp?gk=  -> a guest's own answer
  if (sub === 'rsvp' && m === 'GET') {
    const gk = url.searchParams.get('gk') || '';
    const r = await env.DB.prepare('SELECT name, coming, total, men, women, kids, note FROM rsvps WHERE card = ? AND gk = ? AND hidden = 0').bind(id, gk).first();
    return json({ ok: true, rsvp: r || null });
  }

  // wishes
  if (sub === 'wishes' && m === 'GET') {
    const r = await env.DB.prepare('SELECT id, name, msg, created FROM wishes WHERE card = ? AND hidden = 0 ORDER BY created DESC LIMIT 200').bind(id).all();
    return json({ ok: true, wishes: r.results || [] });
  }
  if (sub === 'wishes' && m === 'POST') {
    let b; try { b = await readJson(req, 4000); } catch (e) { return bad('bad request'); }
    const name = str(b.name, 60), msg = str(b.msg, 400);
    if (!name || !msg) return bad('Please write your name and a wish');
    if (await limited(env, ip, 'wish')) return bad('Too many wishes from here, try again in a few minutes', 429);
    const c = await env.DB.prepare('SELECT COUNT(*) AS n FROM wishes WHERE card = ?').bind(id).first();
    if (c && c.n >= 2000) return bad('This wall is full', 429);
    const t = now();
    const r = await env.DB.prepare('INSERT INTO wishes (card, name, msg, created, ip) VALUES (?, ?, ?, ?, ?)').bind(id, name, msg, t, ip).run();
    return json({ ok: true, wish: { id: r.meta && r.meta.last_row_id, name, msg, created: t } });
  }

  // ---- host only below ----
  if (!tokenOk(card, k)) return bad('This host link is not valid', 403);

  if (sub === 'host' && m === 'GET') {
    const [rs, ws, op] = await env.DB.batch([
      env.DB.prepare('SELECT id, name, coming, total, men, women, kids, note, guest, created, updated, hidden FROM rsvps WHERE card = ? ORDER BY updated DESC').bind(id),
      env.DB.prepare('SELECT id, name, msg, created, hidden FROM wishes WHERE card = ? ORDER BY created DESC LIMIT 1000').bind(id),
      env.DB.prepare('SELECT guest, COUNT(*) AS n, COUNT(DISTINCT vk) AS u, MAX(ts) AS last FROM opens WHERE card = ? GROUP BY guest').bind(id)
    ]);
    let opens = 0, unique = 0; const byGuest = {};
    for (const o of op.results || []) { opens += o.n; unique += o.u; if (o.guest) byGuest[o.guest] = { n: o.n, last: o.last }; }
    return json({ ok: true, id, data: JSON.parse(card.data), title: card.title, created: card.created, updated: card.updated,
      ogv: card.ogv, guests: card.guests ? JSON.parse(card.guests) : [], views: card.views, opens, unique, openedBy: byGuest,
      rsvps: rs.results || [], wishes: ws.results || [] });
  }
  if (sub === 'guests' && (m === 'PUT' || m === 'POST')) {
    let b; try { b = await readJson(req, 40000); } catch (e) { return bad('bad request'); }
    if (await limited(env, ip, 'guests')) return bad('slow down', 429);
    const list = Array.isArray(b.guests) ? b.guests.map((g) => str(g, 80)).filter(Boolean).slice(0, 500) : [];
    const uniq = [...new Set(list)];
    await env.DB.prepare('UPDATE cards SET guests = ? WHERE id = ?').bind(JSON.stringify(uniq), id).run();
    return json({ ok: true, guests: uniq });
  }
  if (sub === 'wish' && parts[4] && m === 'POST') {
    let b = {}; try { b = await readJson(req, 500); } catch (e) {}
    await env.DB.prepare('UPDATE wishes SET hidden = ? WHERE id = ? AND card = ?').bind(b.hidden === false ? 0 : 1, int(parts[4], 0, 1e12), id).run();
    return json({ ok: true });
  }
  if (sub === 'rsvp-hide' && parts[4] && m === 'POST') {
    let b = {}; try { b = await readJson(req, 500); } catch (e) {}
    await env.DB.prepare('UPDATE rsvps SET hidden = ? WHERE id = ? AND card = ?').bind(b.hidden === false ? 0 : 1, int(parts[4], 0, 1e12), id).run();
    return json({ ok: true });
  }
  if (sub === 'rsvps.csv' && m === 'GET') {
    const rs = await env.DB.prepare('SELECT name, coming, total, men, women, kids, note, guest, updated FROM rsvps WHERE card = ? AND hidden = 0 ORDER BY coming DESC, name').bind(id).all();
    const q = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const rows = [['Name', 'Answer', 'People', 'Men', 'Women', 'Kids', 'Note', 'Invited as', 'Answered (UTC)']];
    for (const r of rs.results || []) rows.push([r.name, r.coming ? 'Coming' : 'Not coming', r.coming ? r.total : 0, r.men ?? '', r.women ?? '', r.kids ?? '', r.note, r.guest || '', new Date(r.updated * 1000).toISOString().slice(0, 16).replace('T', ' ')]);
    const csv = '\ufeff' + rows.map((r) => r.map(q).join(',')).join('\r\n') + '\r\n';
    return new Response(csv, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="guest-list-' + id + '.csv"', 'cache-control': 'no-store' } });
  }
  if (sub === 'delete' && m === 'POST') {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM rsvps WHERE card = ?').bind(id), env.DB.prepare('DELETE FROM wishes WHERE card = ?').bind(id),
      env.DB.prepare('DELETE FROM opens WHERE card = ?').bind(id), env.DB.prepare('DELETE FROM cards WHERE id = ?').bind(id)
    ]);
    return json({ ok: true });
  }
  return bad('not found', 404);
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const p = url.pathname;
    try {
      if (p.startsWith('/api/')) { await schema(env.DB); return await api(req, env, url, ctx); }
      let m = p.match(/^\/c\/([a-z0-9]{4,12})\/og\.jpg$/);
      if (m) {
        await schema(env.DB);
        const r = await env.DB.prepare('SELECT og FROM cards WHERE id = ?').bind(m[1]).first();
        if (r && r.og) return new Response(new Uint8Array(r.og), { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=300' } });
        return env.ASSETS.fetch(new Request(url.origin + '/og.jpg'));
      }
      m = p.match(/^\/c\/([a-z0-9]{4,12})\/?$/);
      if (m) { await schema(env.DB); return await cardPage(env, url, m[1]); }
      m = p.match(/^\/h\/([a-z0-9]{4,12})\/?$/);
      if (m) {
        let html = await assetHtml(env, url, '/host.html');
        html = html.replace('<head>', '<head>\n<base href="/">');
        return htmlResp(html);
      }
      return env.ASSETS.fetch(req);
    } catch (e) {
      console.error(e && e.stack || e);
      if (p.startsWith('/api/')) return json({ ok: false, error: 'Something went wrong on our side, please try again' }, 500);
      return new Response('Something went wrong, please try again.', { status: 500 });
    }
  }
};
