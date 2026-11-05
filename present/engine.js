/*
 * Kinetic Deck engine
 * - Semua slide = <section class="slide"> di dalam #stage (1920x1080, diskalakan ke layar).
 * - Elemen beranimasi: data-anim="up|down|left|right|scale|pop|blur|fade|draw", data-split (per kata),
 *   data-count="60" (angka naik). data-step="n" = muncul pada klik ke-n (default 0 = saat slide masuk).
 *   style="--d:.3s" = jeda.
 * - Mode:  ?presenter           → buat ruang baru, kirim posisi slide
 *          ?room=XXXX           → audiens, mengikuti presenter
 *          (tanpa parameter)    → mode mandiri
 * - Relay sinkron: ntfy.sh (pub/sub publik, tanpa akun). Yang dikirim hanya {s,f}.
 */
(() => {
  'use strict';
  const RELAY = window.KDECK_RELAY || 'https://ntfy.sh'; // bisa diganti ke server ntfy sendiri
  const W = 1920, H = 1080;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];

  const stage = $('#stage');
  const slides = $$('.slide', stage);
  const params = new URLSearchParams(location.search);
  const isPresenter = params.has('presenter');
  let room = (params.get('room') || '').replace(/[^a-z0-9]/gi, '').slice(0, 24);
  const sid = Math.random().toString(36).slice(2, 10);

  if (isPresenter && !room) {
    room = Array.from(crypto.getRandomValues(new Uint8Array(6)), b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('');
    params.set('room', room);
    history.replaceState(null, '', location.pathname + '?' + params.toString().replace('presenter=&', 'presenter&').replace(/presenter=$/, 'presenter'));
  }
  const deckId = (document.body.dataset.deck || 'deck').replace(/[^a-z0-9-]/gi, '');
  const topic = room ? `kdeck-${deckId}-${room}` : null;
  const mode = isPresenter ? 'presenter' : room ? 'audience' : 'solo';
  document.body.classList.add('mode-' + mode);

  /* ---------- Skala stage ---------- */
  function fit() {
    const k = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = `translate(-50%,-50%) scale(${k})`;
  }
  addEventListener('resize', fit); fit();

  /* ---------- Siapkan slide ---------- */
  $$('[data-split]', stage).forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const wm = document.createElement('span'); wm.className = 'wm';
            const w = document.createElement('span'); w.className = 'w'; w.style.setProperty('--i', i++);
            w.textContent = part; wm.appendChild(w); frag.appendChild(wm);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
  });
  const ANIM = '[data-anim],[data-split],[data-count]';
  slides.forEach(s => {
    s._els = $$(ANIM, s);
    s._steps = Math.max(0, ...s._els.map(e => +e.dataset.step || 0));
  });

  /* ---------- Chrome ---------- */
  const chrome = document.createElement('div'); chrome.id = 'chrome';
  chrome.innerHTML = `<span>${document.body.dataset.footer || ''}</span><span><b id="pg">01</b> / ${String(slides.length).padStart(2, '0')}</span>`;
  const progress = document.createElement('div'); progress.id = 'progress';
  stage.append(chrome, progress);

  /* ---------- Angka naik ---------- */
  function runCount(el, instant) {
    const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    const fmt = v => v.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    cancelAnimationFrame(el._raf); clearTimeout(el._t);
    if (instant) { el.textContent = fmt(to); return; }
    el.textContent = fmt(0);
    const delay = parseFloat(getComputedStyle(el).getPropertyValue('--d')) * 1000 || 0;
    const dur = +(el.dataset.dur || 1600);
    el._t = setTimeout(() => {
      const t0 = performance.now();
      const tick = now => {
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(2, -10 * p);
        el.textContent = fmt(p >= 1 ? to : to * e);
        if (p < 1) el._raf = requestAnimationFrame(tick);
      };
      el._raf = requestAnimationFrame(tick);
    }, delay);
  }

  /* ---------- Render ---------- */
  let cur = { s: -1, f: 0 };
  function render(s, f, instant = false) {
    s = Math.max(0, Math.min(slides.length - 1, s));
    f = Math.max(0, Math.min(slides[s]._steps, f));
    const prev = cur.s;
    if (instant) { document.body.classList.add('instant'); }
    slides.forEach((sl, i) => {
      if (i === s) {
        sl.classList.add('active');
        sl._els.forEach(el => {
          const show = (+el.dataset.step || 0) <= f;
          const was = el.classList.contains('in');
          el.classList.toggle('in', show);
          if (el.dataset.count != null && show && !was) runCount(el, instant);
        });
      } else if (sl.classList.contains('active')) {
        sl.classList.remove('active');
        clearTimeout(sl._reset);
        sl._reset = setTimeout(() => { if (!sl.classList.contains('active')) sl._els.forEach(e => e.classList.remove('in')); }, instant ? 0 : 600);
      }
    });
    cur = { s, f };
    $('#pg').textContent = String(s + 1).padStart(2, '0');
    progress.style.width = ((s + 1) / slides.length * 100) + '%';
    if (instant) { stage.offsetHeight; requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('instant'))); }
    if (prev !== s) onSlideChange();
  }

  function next() {
    const { s, f } = cur;
    if (f < slides[s]._steps) go(s, f + 1);
    else if (s < slides.length - 1) go(s + 1, 0);
  }
  function prev() {
    const { s, f } = cur;
    if (f > 0) go(s, f - 1, true);
    else if (s > 0) go(s - 1, slides[s - 1]._steps, true);
  }

  /* ---------- Aksi lokal vs sinkron ---------- */
  let lastRemote = null;
  function go(s, f, instant = false, origin = 'local') {
    if (mode === 'audience' && origin === 'local') return; // audiens tidak bisa pindah slide sendiri
    render(s, f, instant);
    if (mode === 'presenter' && origin === 'local') publish();
    if (mode !== 'audience') saveHash();
  }
  function saveHash() { history.replaceState(null, '', location.pathname + location.search + `#${cur.s + 1}.${cur.f}`); }
  function applyRemote(st) {
    lastRemote = st;
    const jump = st.s !== cur.s ? Math.abs(st.s - cur.s) > 1 || st.s < cur.s || st.f > 0 : Math.abs(st.f - cur.f) > 1 || st.f < cur.f;
    render(st.s, st.f, jump);
  }

  /* ---------- Relay (ntfy.sh) ---------- */
  let sendTimer = null, lastSent = 0, pubState = 'idle';
  function publish() {
    clearTimeout(sendTimer);
    const wait = Math.max(0, 250 - (Date.now() - lastSent));
    sendTimer = setTimeout(async () => {
      lastSent = Date.now();
      const body = JSON.stringify({ s: cur.s, f: cur.f, t: Date.now(), id: sid });
      try {
        const r = await fetch(`${RELAY}/${topic}`, { method: 'POST', body });
        setStatus(r.ok ? 'ok' : 'err', r.ok ? 'LIVE' : 'Gagal kirim (' + r.status + ')');
      } catch { setStatus('err', 'Relay tidak terjangkau'); }
    }, wait);
  }
  function parseMsg(raw) {
    try { const d = JSON.parse(raw); if (Number.isInteger(d.s) && Number.isInteger(d.f)) return d; } catch {}
    return null;
  }
  async function pollLatest() {
    for (const since of ['latest', '12h']) {
      try {
        const r = await fetch(`${RELAY}/${topic}/json?poll=1&since=${since}`);
        if (!r.ok) continue;
        const lines = (await r.text()).trim().split('\n').filter(Boolean);
        for (let i = lines.length - 1; i >= 0; i--) {
          const ev = JSON.parse(lines[i]);
          if (ev.event === 'message') { const st = parseMsg(ev.message); if (st) return st; }
        }
        return null;
      } catch {}
    }
    return null;
  }
  function subscribe() {
    let es, errs = 0;
    const open = () => {
      es = new EventSource(`${RELAY}/${topic}/sse`);
      es.onopen = async () => {
        errs = 0; setStatus('ok', mode === 'presenter' ? 'LIVE' : 'Terhubung');
        if (mode === 'audience') { const st = await pollLatest(); if (st) { hideWaiting(); applyRemote(st); } }
      };
      es.onmessage = e => {
        let ev; try { ev = JSON.parse(e.data); } catch { return; }
        if (ev.event !== 'message') return;
        const st = parseMsg(ev.message); if (!st) return;
        if (mode === 'presenter') { if (st.id !== sid) render(st.s, st.f); return; } // remote kedua (mis. HP)
        hideWaiting(); applyRemote(st);
      };
      es.onerror = () => {
        errs++;
        setStatus(errs > 3 ? 'err' : 'warn', errs > 3 ? 'Relay terblokir? Navigasi manual' : 'Menyambung ulang…');
      };
    };
    open();
  }

  /* ---------- HUD ---------- */
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
  let statusDot, statusText;
  function setStatus(kind, text) {
    if (!statusDot) return;
    statusDot.className = 'dot ' + kind; statusText.textContent = text;
  }
  const toast = el('<div id="toast" class="hud pill"></div>'); document.body.append(toast);
  function say(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => toast.classList.remove('show'), 2200); }

  const audienceURL = () => `${location.origin}${location.pathname}?room=${room}`;
  let waiting;
  function hideWaiting() { if (waiting) { waiting.remove(); waiting = null; } }


  let notesEl;
  function onSlideChange() {
    if (!notesEl) return;
    const s = slides[cur.s], n = slides[cur.s + 1];
    const notes = $('.notes', s);
    notesEl.innerHTML = `<h4>Catatan · slide ${cur.s + 1}</h4>${notes ? notes.innerHTML : '<p class="mute">—</p>'}` +
      `<div class="next">Berikutnya: ${n ? (n.dataset.title || 'slide ' + (cur.s + 2)) : 'selesai'}</div>`;
  }

  if (mode === 'presenter') {
    const hud = el(`<div id="pres-hud" class="hud">
      <span class="pill"><span class="dot"></span><span id="st">Menyambung…</span></span>
      <span class="pill" title="Kode ruang">Ruang <b>${room}</b></span>
      <button class="pill primary" id="copy">Salin link audiens</button>
      <button class="pill" id="tm" title="Klik untuk reset"><span id="timer">00:00</span></button>
      <button class="pill" id="nt" title="Catatan (N)">Catatan</button>
      <button class="pill" id="fs" title="Layar penuh (F)">⛶</button>
    </div>`);
    notesEl = el('<div id="notes"></div>');
    document.body.append(hud, notesEl);
    statusDot = $('.dot', hud); statusText = $('#st', hud);
    $('#copy').onclick = async e => {
      e.stopPropagation();
      try { await navigator.clipboard.writeText(audienceURL()); say('Link audiens disalin'); }
      catch { prompt('Salin link audiens:', audienceURL()); }
    };
    let t0 = Date.now();
    $('#tm').onclick = e => { e.stopPropagation(); t0 = Date.now(); };
    setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); $('#timer').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }, 500);
    $('#nt').onclick = e => { e.stopPropagation(); notesEl.classList.toggle('show'); };
    $('#fs').onclick = e => { e.stopPropagation(); toggleFS(); };
    let idle;
    const wake = () => { hud.classList.remove('hide'); clearTimeout(idle); idle = setTimeout(() => { if (!hud.matches(':hover')) hud.classList.add('hide'); }, 3500); };
    addEventListener('mousemove', wake); wake();
    subscribe();
  } else if (mode === 'audience') {
    const hud = el(`<div id="aud-hud" class="hud">
      <span class="pill"><span class="dot"></span><span id="st">Menyambung…</span></span>
      <button class="pill" id="fs" title="Layar penuh (F)">⛶</button>
    </div>`);
    document.body.append(hud);
    statusDot = $('.dot', hud); statusText = $('#st', hud);
    $('#fs').onclick = e => { e.stopPropagation(); toggleFS(); };
    waiting = el('<div id="waiting" class="hud pill">Menunggu presenter memulai…</div>');
    document.body.append(waiting);
    subscribe();
  } else {
    const hud = el(`<div id="aud-hud" class="hud">
      <a class="pill" href="?presenter" style="text-decoration:none;color:inherit">▶ Mulai sebagai presenter</a>
      <button class="pill" id="fs">⛶</button></div>`);
    document.body.append(hud);
    $('#fs').onclick = e => { e.stopPropagation(); toggleFS(); };
    let idle; const wake = () => { hud.style.opacity = 1; clearTimeout(idle); idle = setTimeout(() => hud.style.opacity = 0, 2500); };
    hud.style.transition = 'opacity .4s'; addEventListener('mousemove', wake); wake();
  }

  function toggleFS() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  /* ---------- Input ---------- */
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); prev(); }
    else if (k === 'Home') go(0, 0, true);
    else if (k === 'End') go(slides.length - 1, slides[slides.length - 1]._steps, true);
    else if (k === 'f' || k === 'F') toggleFS();
    else if ((k === 'n' || k === 'N') && notesEl) notesEl.classList.toggle('show');
    else if ((k === 'h' || k === 'H') && $('#pres-hud')) $('#pres-hud').classList.toggle('hide');
  });
  addEventListener('click', e => {
    if (e.target.closest('.hud,#notes,a,button')) return;
    if (e.clientX < innerWidth * 0.3) prev(); else next();
  });
  // Sentuh: geser = pindah, ketuk = sama seperti klik (ditangani di sini agar tidak dobel)
  let tx = null;
  addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  addEventListener('touchend', e => {
    if (tx == null || e.target.closest('.hud,#notes,a,button')) { tx = null; return; }
    const x = e.changedTouches[0].clientX, dx = x - tx; tx = null;
    e.preventDefault();
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    else if (Math.abs(dx) < 12) (x < innerWidth * 0.3 ? prev() : next());
  }, { passive: false });

  /* ---------- Mulai ---------- */
  const m = location.hash.match(/^#(\d+)(?:\.(\d+))?$/);
  const start = m && mode !== 'audience' ? [+m[1] - 1, +(m[2] || 0)] : [0, 0];
  render(start[0], start[1], start[0] > 0 || start[1] > 0);
  if (mode === 'presenter') setTimeout(publish, 400);
  document.fonts?.ready.then(fit);
})();
