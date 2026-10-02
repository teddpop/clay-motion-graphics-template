/* Desktop screen kit (laptop hero device, ≈1004×624 screen). Same contract as screens/phone.js:
 *   html(spec, P) → inner HTML of one .scr      animate(el, spec, { t0, t1 }, { MG, tw, E, soft, clamp, ev })
 * Every screen sits in an app shell: sidebar (brand + nav) + top bar (title + avatars).
 * Types: board (kanban; ev.move moves a card), summary (auto-written doc that types itself; ev.badge = "seen" chip),
 *        calendar (week grid; ev.clear strikes out cancellable events), table (rows + status pills; ev.badge flips one).
 */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const av = (a, i = 0) => `<i class="dav" style="background:${a.c || ['#F2B935', '#5B8DEF', '#E9724C', '#3E9B5F'][i % 4]};z-index:${9 - i}">${esc(a.i || '')}</i>`;
const shell = (s, P, body) => `<div class="dapp"><aside><div class="dbrand"><svg class="brandmark" viewBox="0 0 48 48"></svg>${esc(P.name)}</div>
  ${(s.nav || ['Home', 'Board', 'Updates', 'Calendar']).map((n, i) => `<div class="dnav${i === (s.navOn ?? 1) ? ' on' : ''}">${esc(n)}</div>`).join('')}</aside>
  <main><div class="dtop"><b>${esc(s.title || '')}</b><span class="davs">${(s.people || []).map(av).join('')}</span></div><div class="dbody">${body}</div></main></div>`;
const TICK = '<svg viewBox="0 0 20 20" width="14"><path d="M4 10.5 L8.5 15 L16 6" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export const SCREENS = {
  board: {
    html: (s, P) => shell(s, P, `<div class="cols">${(s.cols || []).map((c, ci) => `<div class="col"><div class="colh">${esc(c.t)} <span>${c.cards.length}</span></div>
      ${c.cards.map((k, ki) => `<div class="kc" data-c="${ci}" data-k="${ki}"><span class="tag" style="background:${k.c || 'var(--tint)'}">${esc(k.tag || '')}</span><div>${esc(k.t)}</div>${k.who ? av(k.who) : ''}<i class="kok">${TICK}</i></div>`).join('')}
      <div class="slotk"></div></div>`).join('')}</div>${s.toast ? `<div class="toast"><i class="ok">${TICK}</i>${esc(s.toast)}</div>` : ''}`),
    animate(el, s, w, { tw, E, MG, soft, ev }) {
      el.querySelectorAll('.kc').forEach((k, i) => tw(k, w.t0 + 0.15 + i * 0.06, 0.35, { opacity: 0, y: 20 }, { opacity: 1, y: 0 }, 'outCubic'));
      const mv = s.move; if (!mv) return;
      const card = el.querySelector(`.kc[data-c="${mv.from[0]}"][data-k="${mv.from[1]}"]`), slot = el.querySelectorAll('.slotk')[mv.to];
      if (!card || !slot) return;
      const a = card.getBoundingClientRect(), b = slot.getBoundingClientRect(), t = ev.move ?? w.t0 + 1.2;
      tw(card, t - 0.15, 0.15, { scale: 1, rotate: 0 }, { scale: 1.06, rotate: -3 }, 'outCubic');
      tw(card, t, 0.6, { x: 0, y: 0 }, { x: b.left - a.left, y: b.top - a.top }, 'inOutCubic');
      tw(card, t + 0.55, 0.3, { scale: 1.06, rotate: -3 }, { scale: 1, rotate: 0 }, (p) => E.outBack(p, 2));
      tw(card.querySelector('.kok'), t + 0.65, 0.3, { scale: 0 }, { scale: 1 }, (p) => E.outBack(p, 2.4));
      MG.sfx(t, 'tap', 0.6); MG.sfx(t + 0.65, 'tick', 0.7);
      const toast = el.querySelector('.toast'); if (toast) soft(toast, ev.toast ?? t + 1.0, { from: 0.8, y: 40, sound: 'ding', gain: 0.5 });
    },
  },
  summary: {
    html: (s, P) => shell(s, P, `<div class="doc"><div class="dmeta"><span class="pill hi">${esc(s.pill || 'Auto-drafted')}</span> ${esc(s.meta || '')}</div>
      <h2>${esc(s.heading || 'Weekly update')}</h2>${(s.paras || []).map((p) => `<p class="tp" data-text="${esc(p)}"></p>`).join('')}
      <ul>${(s.bullets || []).map((b) => `<li><i class="ok">${TICK}</i>${esc(b)}</li>`).join('')}</ul>
      ${s.seen ? `<div class="seen">${(s.seenBy || []).map(av).join('')}<span>${esc(s.seen)}</span></div>` : ''}</div>`),
    animate(el, s, w, { MG, tw, E, soft, ev }) {
      let t = w.t0 + 0.3;
      el.querySelectorAll('.tp').forEach((p) => { const txt = p.dataset.text, d = Math.min(1.4, txt.length * 0.018); MG.type(p, txt, t, d); t += d + 0.1; });
      el.querySelectorAll('li').forEach((li, k) => { tw(li, t + k * 0.15, 0.3, { opacity: 0, x: 20 }, { opacity: 1, x: 0 }, 'outCubic'); MG.sfx(t + k * 0.15, 'tick', 0.5); });
      const seen = el.querySelector('.seen'); if (seen) soft(seen, ev.badge ?? t + 0.8, { from: 0.8, y: 20, sound: 'ding', gain: 0.5 });
    },
  },
  calendar: {
    html: (s, P) => shell(s, P, `<div class="wcal">${(s.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).map((d, i) => `<div class="wday"><b>${esc(d)}</b>${(s.events || []).filter((e) => e.d === i).map((e) =>
      `<i class="wev${e.cancel ? ' cx' : ''}" style="top:${(e.top ?? 0.2) * 100}%;height:${(e.h ?? 0.12) * 100}%;background:${e.c || 'var(--hi2)'}">${esc(e.label || '')}<s></s></i>`).join('')}</div>`).join('')}</div>
      ${s.badge ? `<div class="wbadge"><span class="pill dark">${esc(s.badge)}</span></div>` : ''}`),
    animate(el, s, w, { tw, E, MG, soft, ev }) {
      el.querySelectorAll('.wev').forEach((e, k) => tw(e, w.t0 + 0.2 + k * 0.05, 0.3, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1 }, (p) => E.outBack(p, 1.8)));
      const t = ev.clear ?? w.t0 + 1.3;
      el.querySelectorAll('.wev.cx').forEach((e, k) => {
        tw(e.querySelector('s'), t + k * 0.18, 0.25, { scaleX: 0 }, { scaleX: 1 }, 'outCubic');
        tw(e, t + k * 0.18 + 0.3, 0.35, { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.8 }, 'inOutCubic'); MG.sfx(t + k * 0.18, 'tick', 0.6);
      });
      const b = el.querySelector('.wbadge .pill'); if (b) soft(b, ev.badge ?? t + 0.9, { from: 0.4, y: 0, sound: 'ding', gain: 0.6 });
    },
  },
  table: {
    html: (s, P) => shell(s, P, `<div class="dtab">${(s.rows || []).map((r, i) => `<div class="dtr"><span class="n">${esc(r.n)}</span><span class="m">${esc(r.m || '')}</span><span class="pill ${r.ok ? 'hi' : 'dark'} dst" data-to="${esc(r.to || '')}">${esc(r.s || '')}</span></div>`).join('')}</div>`),
    animate(el, s, w, { tw, MG, ev }) {
      el.querySelectorAll('.dtr').forEach((r, k) => tw(r, w.t0 + 0.2 + k * 0.1, 0.35, { opacity: 0, x: 30 }, { opacity: 1, x: 0 }, 'outCubic'));
      const flip = el.querySelector('.dst[data-to]:not([data-to=""])'); if (!flip) return;
      const t = ev.badge ?? w.t0 + 1.4;
      const orig = flip.textContent, cls = flip.className;
      MG.call(-1, 1e9, (p, tt) => { const on = tt >= t; flip.textContent = on ? flip.dataset.to : orig; flip.className = on ? 'pill hi dst' : cls; });
      tw(flip, t, 0.35, { scale: 1.3 }, { scale: 1 }, (p) => MG.E.outBack(p, 2)); MG.sfx(t, 'ding', 0.5);
    },
  },
};
