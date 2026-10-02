/* Clay Story screen kit: parameterised phone screens, generated from video.json → screens.<id> = { type, ...copy }.
 * The Director writes realistic copy for every screen; the user is never asked for screenshots.
 *
 *   html(spec, P)                     → inner HTML of one .scr (styled by style/clay-story/style.css from the palette vars)
 *   animate(el, spec, win, ctx)       → registers the screen's own motion while it's on screen
 *        win = { t0, t1 }  screen fully in / starts leaving      ctx = { MG, tw, soft, ev }  (ev = beat event times)
 *
 * Types: home-actions, camera-scan, result-card, step-timer, list-plan, home-card, dashboard-stat, goal-progress,
 *        chat-reply, calendar-week, form-success, map-route, player, checkout, lock-notify.   Preview: engine/test/screens.html
 * Anchors other modules use: .vf (viewfinder), .hero / .slot (prop lands here), .wk (list rows), .cta (tappable).
 */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const br = (s) => esc(s).replace(/\n/g, '<br>');
const CHECK = '<svg viewBox="0 0 20 20" width="16"><path d="M4 10.5 L8.5 15 L16 6" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const okDot = (id = '', w = 16) => `<span class="ok"${id ? ` id="${id}"` : ''}>${CHECK.replace('width="16"', `width="${w}"`)}</span>`;

// 24×24 line icons (stroke = currentColor)
const ICON = {
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  chart: '<path d="M5 19V11M12 19V6M19 19v-9"/>',
  chat: '<path d="M4 5h16v11H10l-4 3v-3H4z"/>',
  card: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5h4"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  heart: '<path d="M12 19s-7-4.4-7-9.5A4 4 0 0 1 12 7a4 4 0 0 1 7 2.5C19 14.6 12 19 12 19z"/>',
  star: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>',
  pin: '<path d="M12 21s-6-6.2-6-11a6 6 0 0 1 12 0c0 4.8-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
  bolt: '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10c0-1 1-1.6 2.5-1.6s2.5.6 2.5 1.6-1 1.4-2.5 1.6-2.5.8-2.5 1.8 1 1.6 2.5 1.6 2.5-.6 2.5-1.6"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8"/>',
  run: '<circle cx="14" cy="5" r="1.8"/><path d="M8 21l3-6 3 2v4M6 12l3-3h4l2 3 3 1"/>',
  home: '<path d="M4 11l8-6 8 6v9H4z"/><path d="M10 20v-5h4v5"/>',
};
export const icon = (name, color = 'currentColor', size = 28, sw = 2.4) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICON[name] || ICON.star}</svg>`;

const appbar = (P, title) => `<div class="appbar"><svg class="brandmark" viewBox="0 0 48 48"></svg>${esc(title ?? P.name)}</div>`;
const cta = (c, cls = '') => c ? `<div class="cta ${cls}">${esc(c)}<i class="ripple"></i></div>` : '';
const money = (v, pre = '', suf = '', dp = 0) => pre + Number(v).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }) + suf;

export const SCREENS = {
  // greeting + 3 action cards (first one highlighted). Shown in the hand-off / big-idea pop-up.
  'home-actions': {
    html: (s, P) => `${appbar(P, s.appbar)}
      <div class="h" style="font-size:42px;margin-top:22px">${br(s.greeting || 'Hello.')}</div>
      <div class="actions">${(s.actions || []).slice(0, 3).map((a, i) => `<div class="action ${i === 0 ? 'hi' : ''}">
        <span class="ic" style="${i === 0 ? '' : `background:${a.tile || (i === 1 ? 'var(--tint2)' : 'var(--tint)')}`}">${i === 0 ? icon(a.icon || 'camera', 'var(--hi)') : (a.icon ? icon(a.icon, 'var(--ink)', 26) : '')}</span>${esc(a.label)}</div>`).join('')}</div>`,
    animate(el, s, w, { tw, E }) {
      el.querySelectorAll('.action').forEach((a, k) => tw(a, w.t0 + 0.15 + k * 0.1, 0.4, { opacity: 0, y: 24 }, { opacity: 1, y: 0 }, (p) => E.outBack(p, 1.4)));
    },
  },
  // viewfinder with corner brackets, shutter, scan line, flash; CTA appears after the shot (ev.shot)
  'camera-scan': {
    html: (s, P) => `${appbar(P, s.appbar)}<div class="h">${br(s.title || 'Point and shoot')}</div>
      <div class="vf"><i class="br tl"></i><i class="br tr"></i><i class="br bl"></i><i class="br rb"></i><div class="scanline"></div><div class="flash"></div></div>
      <div class="shutter"></div>${cta(s.cta, 'hi go')}`,
    animate(el, s, w, { tw, E, MG, soft, ev }) {
      el.querySelectorAll('.br').forEach((b, k) => tw(b, w.t0 + 0.55 + k * 0.05, 0.4, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1 }, (p) => E.outBack(p, 2)));
      const shot = ev.shot; if (shot == null) return;
      const sh = el.querySelector('.shutter'), sc = el.querySelector('.scanline');
      tw(el.querySelector('.flash'), shot, 0.35, { opacity: 0.95 }, { opacity: 0 }, 'outCubic');
      MG.sfx(shot, 'shutter', 0.9);
      tw(sh, shot - 0.08, 0.1, { scale: 1 }, { scale: 0.86 }, 'outCubic');
      tw(sh, shot + 0.02, 0.2, { scale: 0.86 }, { scale: 1 }, (p) => E.outBack(p, 2));
      const vh = el.querySelector('.vf').offsetHeight - 4;
      MG.call(shot + 0.1, shot + 0.7, (p) => { sc.style.opacity = p > 0 && p < 1 ? 1 : 0; sc.style.top = (p * vh) + 'px'; });
      tw(sh, shot + 0.75, 0.25, { opacity: 1 }, { opacity: 0 }, 'linear');
      const go = el.querySelector('.cta'); if (go) soft(go, shot + 0.85, { from: 0.8, y: 20 });
    },
  },
  // hero area (a 3D prop pops out of it) + pill + title + meta + checklist + CTA
  'result-card': {
    html: (s) => `<div class="hero"></div><div class="body">
      ${s.pill ? `<span class="pill hi">${esc(s.pill)}</span>` : ''}
      <div class="h" style="font-size:40px;margin-top:12px">${br(s.title)}</div>
      ${s.meta ? `<div class="sub">${esc(s.meta)}</div>` : ''}
      <div style="margin-top:16px">${(s.checks || []).slice(0, 4).map((c, i, a) => `<div class="ing"${i === a.length - 1 ? ' style="border:0"' : ''}>${okDot()}${esc(c)}</div>`).join('')}</div></div>${cta(s.cta)}`,
    style: 'padding-top:0',
    animate(el, s, w, { tw, E, MG }) {
      el.querySelectorAll('.ok').forEach((o, k) => { tw(o, w.t0 + 0.65 + k * 0.15, 0.3, { scale: 0 }, { scale: 1 }, (p) => E.outBack(p, 2.4)); MG.sfx(w.t0 + 0.65 + k * 0.15, 'tick', 0.6); });
    },
  },
  // mode pill + step counter + progress dots + instruction + countdown ring
  'step-timer': {
    html: (s) => { const n = s.steps || 4, c = s.current || 2;
      return `<div style="display:flex;justify-content:space-between;align-items:center"><span class="pill dark">${esc(s.mode || 'Step by step')}</span><span style="font:700 18px var(--mono)">STEP ${c} OF ${n}</span></div>
      <div class="dots">${Array.from({ length: n }, (_, i) => `<i class="${i < c ? 'on' : ''}${i === c - 1 ? ' cur' : ''}"></i>`).join('')}</div>
      <div class="h" style="font-size:38px;margin-top:26px">${br(s.text)}</div>
      <svg class="ring" viewBox="0 0 260 260"><circle cx="130" cy="130" r="112" fill="none" stroke="var(--line2)" stroke-width="18"/><circle class="arc" cx="130" cy="130" r="112" fill="none" stroke="var(--hi)" stroke-width="18" stroke-linecap="round" transform="rotate(-90 130 130)" stroke-dasharray="703.7" stroke-dashoffset="0"/><text class="clock" x="130" y="145" text-anchor="middle" font-family="JetBrains Mono" font-weight="800" font-size="46" fill="var(--ink)">${esc(s.timer || '20:00')}</text></svg>
      ${s.note ? `<div class="note">${esc(s.note)}</div>` : ''}${cta(s.cta || 'Next step →')}`; },
    animate(el, s, w, { tw, MG, clamp }) {
      const [mm, ss] = String(s.timer || '20:00').split(':').map(Number), total = mm * 60 + (ss || 0), drain = s.drain ?? Math.round(total * 0.27);
      const clock = el.querySelector('.clock'), arc = el.querySelector('.arc');
      MG.call(w.t0 - 0.05, w.t1 + 1, (p, t) => {
        const u = clamp((t - w.t0 - 0.25) / Math.max(0.5, w.t1 - w.t0)), secs = Math.round(total - u * drain);
        clock.textContent = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
        arc.setAttribute('stroke-dashoffset', (703.7 * (1 - secs / total)).toFixed(1));
      });
      const cur = el.querySelector('.dots .cur'); if (cur) tw(cur, w.t0 + 0.5, 0.3, { scaleX: 0.3 }, { scaleX: 1 }, 'outCubic');
    },
  },
  // titled list of rows (thumb · title · meta) + a "learned" pill that pops on ev.badge
  'list-plan': {
    html: (s, P) => `${appbar(P, s.title)}${s.badge ? `<div style="margin-top:10px"><span class="pill dark badge">${esc(s.badge)}</span></div>` : ''}
      <div style="margin-top:12px">${(s.rows || []).slice(0, 6).map((r, i, a) => `<div class="wk"${i === a.length - 1 ? ' style="border:0"' : ''}>${r.d ? `<span class="d">${esc(r.d)}</span>` : ''}<i class="th" style="background:${r.c || 'var(--tint)'}"></i><span class="n">${esc(r.n)}</span><span class="m${r.alert ? ' alert' : ''}">${esc(r.m || '')}</span></div>`).join('')}</div>${cta(s.cta)}`,
    animate(el, s, w, { tw, soft, ev }) {
      el.querySelectorAll('.wk').forEach((r, k) => tw(r, w.t0 + 0.4 + k * 0.14, 0.35, { opacity: 0, x: 30 }, { opacity: 1, x: 0 }, 'outCubic'));
      const b = el.querySelector('.badge'); if (b && ev.badge != null) soft(b, ev.badge, { from: 0.4, y: 0, sound: 'ding', gain: 0.6 });
    },
  },
  // end-card home: greeting + sub + featured card with a .slot for a 3D prop + CTA (tapped on the tagline)
  'home-card': {
    html: (s, P) => `${appbar(P, s.appbar)}<div class="h" style="font-size:40px;margin-top:22px">${br(s.greeting || 'Welcome back.')}</div>
      ${s.sub ? `<div class="sub">${esc(s.sub)}</div>` : ''}
      <div class="feat">${s.pill ? `<span class="pill hi">${esc(s.pill)}</span>` : ''}<div style="font:720 28px var(--sans);margin-top:10px">${br(s.title)}</div><div class="slot"></div></div>${cta(s.cta, 'hi')}`,
  },
  // big number that counts up + delta pill + spark bars + up to 3 category rows
  'dashboard-stat': {
    html: (s, P) => `${appbar(P, s.appbar)}<div class="lbl">${esc(s.label || 'This month')}</div>
      <div class="big"><span class="num">${money(s.value, s.prefix, s.suffix, s.dp)}</span></div>
      ${s.delta ? `<span class="pill ${s.deltaTone === 'dark' ? 'dark' : 'hi'} delta">${esc(s.delta)}</span>` : ''}
      <div class="spark">${(s.bars || [4, 6, 5, 8, 7, 9, 6]).map((v, i, a) => `<i style="height:${(v / Math.max(...a)) * 100}%;${i === a.length - 1 ? 'background:var(--hi)' : ''}"></i>`).join('')}</div>
      <div class="hero slot-sm"></div>
      <div>${(s.cats || []).slice(0, 3).map((c, i, a) => `<div class="wk cat"${i === a.length - 1 ? ' style="border:0"' : ''}><i class="th" style="background:${c.c || 'var(--tint)'};width:34px;height:34px;border-radius:10px"></i><span class="n">${esc(c.n)}</span><span class="m">${esc(c.v)}</span></div>`).join('')}</div>${cta(s.cta)}`,
    animate(el, s, w, { tw, E, MG, soft }) {
      const num = el.querySelector('.num');
      MG.count(num, s.from ?? 0, s.value, w.t0 + 0.2, 1.1, (v) => money(v, s.prefix, s.suffix, s.dp));
      el.querySelectorAll('.spark i').forEach((b, k) => tw(b, w.t0 + 0.25 + k * 0.06, 0.45, { scaleY: 0 }, { scaleY: 1 }, (p) => E.outBack(p, 1.6)));
      const d = el.querySelector('.delta'); if (d) soft(d, w.t0 + 1.35, { from: 0.5, y: 0, sound: 'tick', gain: 0.6 });
      el.querySelectorAll('.cat').forEach((r, k) => tw(r, w.t0 + 0.6 + k * 0.14, 0.35, { opacity: 0, x: 30 }, { opacity: 1, x: 0 }, 'outCubic'));
    },
  },
  // savings / streak / habit goal: title, big progress bar that fills, amount counting, milestone pill
  'goal-progress': {
    html: (s, P) => `${appbar(P, s.appbar)}<div class="lbl">${esc(s.label || 'Your goal')}</div>
      <div class="h" style="font-size:40px;margin-top:6px">${br(s.goal)}</div>
      <div class="miles">${(s.milestones || ['Flights', 'Hotel', 'Food', 'Fun']).slice(0, 4).map((m, i, a) => `<div class="mile"><i class="${(i + 1) / a.length <= s.saved / s.target ? 'on' : ''}">${(i + 1) / a.length <= s.saved / s.target ? CHECK : ''}</i><span>${esc(m)}</span></div>`).join('')}</div>
      <div class="big" style="font-size:64px"><span class="num">${money(s.saved, s.prefix, '', s.dp)}</span><span class="of"> / ${money(s.target, s.prefix, '', s.dp)}</span></div>
      <div class="bar"><i></i></div>
      ${s.badge ? `<div style="margin-top:16px"><span class="pill dark badge">${esc(s.badge)}</span></div>` : ''}
      ${s.note ? `<div class="sub" style="margin-top:12px">${esc(s.note)}</div>` : ''}${cta(s.cta)}`,
    animate(el, s, w, { tw, MG, soft, ev }) {
      const f0 = s.from ?? Math.round(s.saved * 0.6);
      MG.count(el.querySelector('.num'), f0, s.saved, w.t0 + 0.3, Math.max(1, (w.t1 - w.t0) * 0.6), (v) => money(v, s.prefix, '', s.dp));
      el.querySelectorAll('.mile i.on').forEach((m, k) => { tw(m, w.t0 + 0.4 + k * 0.15, 0.3, { scale: 0 }, { scale: 1 }, (p) => MG.E.outBack(p, 2.4)); MG.sfx(w.t0 + 0.4 + k * 0.15, 'tick', 0.5); });
      tw(el.querySelector('.bar i'), w.t0 + 0.3, Math.max(1, (w.t1 - w.t0) * 0.6), { scaleX: f0 / s.target }, { scaleX: s.saved / s.target }, 'inOutCubic');
      const b = el.querySelector('.badge'); if (b && ev.badge != null) soft(b, ev.badge, { from: 0.4, y: 0, sound: 'ding', gain: 0.6 });
    },
  },
  // user message → typing dots → assistant reply types in
  'chat-reply': {
    html: (s, P) => `${appbar(P, s.appbar)}<div class="chat"><div class="bub me">${esc(s.user)}</div><div class="bub bot typing"><i></i><i></i><i></i></div><div class="bub bot reply"><span class="rt"></span></div></div>${cta(s.cta)}`,
    animate(el, s, w, { tw, MG, soft, clamp }) {
      soft(el.querySelector('.me'), w.t0 + 0.15, { from: 0.8, y: 20 });
      const ty = el.querySelector('.typing'), rp = el.querySelector('.reply');
      tw(ty, w.t0 + 0.5, 0.2, { opacity: 0 }, { opacity: 1 }, 'linear'); tw(ty, w.t0 + 1.2, 0.15, { opacity: 1 }, { opacity: 0 }, 'linear');
      ty.querySelectorAll('i').forEach((d, k) => MG.call(w.t0 + 0.5, w.t0 + 1.3, (p, t) => { d.style.transform = `translateY(${(-Math.max(0, Math.sin(t * 9 - k)) * 6).toFixed(1)}px)`; }));
      soft(rp, w.t0 + 1.3, { from: 0.9, y: 12, sound: 'pop', gain: 0.4 });
      MG.type(rp.querySelector('.rt'), s.reply || '', w.t0 + 1.35, Math.min(1.6, (s.reply || '').length * 0.025));
    },
  },
  // 7-day strip; events pop into their slots
  'calendar-week': {
    html: (s, P) => `${appbar(P, s.title)}<div class="cal">${(s.days || ['M', 'T', 'W', 'T', 'F', 'S', 'S']).map((d, i) => `<div class="day${i === (s.today ?? 2) ? ' today' : ''}"><b>${esc(d)}</b>${(s.events || []).filter((e) => e.d === i).map((e) => `<i class="ev" style="top:${(e.top ?? 0.2) * 100}%;height:${(e.h ?? 0.18) * 100}%;background:${e.c || 'var(--hi)'}">${esc(e.label || '')}</i>`).join('')}</div>`).join('')}</div>
      ${s.badge ? `<div style="margin-top:14px"><span class="pill dark badge">${esc(s.badge)}</span></div>` : ''}${cta(s.cta)}`,
    animate(el, s, w, { tw, E, MG, soft, ev }) {
      el.querySelectorAll('.ev').forEach((e, k) => { tw(e, w.t0 + 0.3 + k * 0.12, 0.35, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1 }, (p) => E.outBack(p, 2)); MG.sfx(w.t0 + 0.3 + k * 0.12, 'tick', 0.4); });
      const b = el.querySelector('.badge'); if (b && ev.badge != null) soft(b, ev.badge, { from: 0.4, y: 0, sound: 'ding', gain: 0.6 });
    },
  },
  // big check draws, title + sub
  'form-success': {
    html: (s) => `<div class="succ"><svg viewBox="0 0 160 160" width="190"><circle cx="80" cy="80" r="70" fill="var(--hi)"/><path class="tick" d="M48 82 L71 104 L114 58" fill="none" stroke="var(--ink)" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="110" stroke-dashoffset="110"/></svg>
      <div class="h" style="font-size:40px;text-align:center">${br(s.title || 'Done!')}</div>${s.sub ? `<div class="sub" style="text-align:center">${esc(s.sub)}</div>` : ''}</div>${cta(s.cta)}`,
    animate(el, s, w, { tw, E, MG }) {
      tw(el.querySelector('.succ svg'), w.t0 + 0.1, 0.5, { scale: 0 }, { scale: 1 }, (p) => E.outBack(p, 2));
      const tk = el.querySelector('.tick'); MG.call(w.t0 + 0.35, w.t0 + 0.75, (p) => tk.setAttribute('stroke-dashoffset', (110 * (1 - E.outCubic(p))).toFixed(1)));
      MG.sfx(w.t0 + 0.4, 'ding', 0.5);
    },
  },
  // stylised map with a route that draws itself + pin + ETA card
  'map-route': {
    html: (s, P) => `${appbar(P, s.appbar)}<div class="map"><svg viewBox="0 0 382 470" width="100%" height="100%"><g stroke="var(--paper)" stroke-width="16" fill="none"><path d="M0 120 H382 M0 330 H382 M90 0 V470 M270 0 V470 M0 30 L382 420"/></g>
      <path class="route" d="M60 420 C 90 330, 160 360, 190 260 S 300 140, 320 70" fill="none" stroke="var(--hi)" stroke-width="12" stroke-linecap="round" stroke-dasharray="520" stroke-dashoffset="520"/><circle cx="60" cy="420" r="12" fill="var(--ink)"/>
      <g class="pinG" transform="translate(320 70)"><path d="M0 0 C -14 -18 -18 -26 -18 -34 A18 18 0 0 1 18 -34 C 18 -26 14 -18 0 0Z" fill="var(--ink)"/><circle cy="-34" r="7" fill="var(--hi)"/></g></svg></div>
      <div class="eta"><span class="pill hi">${esc(s.eta || '12 min')}</span><div style="font:700 26px var(--sans);margin-top:8px">${esc(s.to || 'Destination')}</div>${s.from ? `<div class="sub">${esc(s.from)}</div>` : ''}</div>${cta(s.cta)}`,
    animate(el, s, w, { tw, E, MG, soft }) {
      const r = el.querySelector('.route'); MG.call(w.t0 + 0.2, w.t0 + 1.4, (p) => r.setAttribute('stroke-dashoffset', (520 * (1 - E.inOutCubic(p))).toFixed(1)));
      const pg = el.querySelector('.pinG'); MG.call(-1, 1e9, (p, t) => { const u = MG.clamp((t - w.t0 - 1.3) / 0.4); pg.setAttribute('transform', `translate(320 70) scale(${u <= 0 ? 0.0001 : E.outBack(u, 2.2)})`); });
      MG.sfx(w.t0 + 1.35, 'pop', 0.5);
      soft(el.querySelector('.eta'), w.t0 + 0.5, { from: 0.9, y: 30 });
    },
  },
  // media player: cover tile (.hero for a prop), title/artist, progress, eq bars
  'player': {
    html: (s) => `<div class="hero cover" style="background:${s.cover || 'var(--tint)'}"></div><div class="body"><div class="h" style="font-size:36px">${br(s.title)}</div><div class="sub">${esc(s.artist || '')}</div>
      <div class="prog"><i></i></div><div class="eq">${Array.from({ length: 14 }, () => '<i></i>').join('')}</div></div>${cta(s.cta || '❚❚  Playing')}`,
    style: 'padding-top:0',
    animate(el, s, w, { MG }) {
      const pr = el.querySelector('.prog i'), bars = [...el.querySelectorAll('.eq i')];
      MG.call(w.t0, w.t1 + 1, (p, t) => { pr.style.transform = `scaleX(${(0.18 + (t - w.t0) * 0.04).toFixed(3)})`; bars.forEach((b, k) => { b.style.transform = `scaleY(${(0.25 + Math.abs(Math.sin(t * (5 + k % 4) + k * 1.7)) * 0.75).toFixed(3)})`; }); });
    },
  },
  // lock screen: big clock + date, notifications drop in (first at ev.badge or t0 + 0.5, then 0.7 s apart)
  'lock-notify': {
    html: (s, P) => `<div class="lock" style="background:linear-gradient(170deg, ${s.wall || 'var(--hi2)'}, var(--paper) 75%)"><div class="lt">${esc(s.time || '9:41')}</div><div class="ld">${esc(s.date || 'Saturday, June 14')}</div>
      ${(s.notes || []).map((n) => `<div class="ln"><span class="ap"><svg class="brandmark" viewBox="0 0 48 48"></svg></span><div><b>${esc(n.title || P.name)}</b><span>${esc(n.text)}</span></div><em>${esc(n.when || 'now')}</em></div>`).join('')}</div>`,
    style: 'padding:0',
    animate(el, s, w, { tw, E, MG, ev }) {
      el.querySelectorAll('.ln').forEach((n, k) => { const t = (ev.badge ?? w.t0 + 0.5) + k * 0.7;
        tw(n, t, 0.5, { y: -60, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1 }, (p) => E.outBack(p, 1.5)); MG.sfx(t, 'ding', 0.55); });
    },
  },
  // basket rows + total + pay button → success overlay (ev.badge or t0 + 1.6)
  'checkout': {
    html: (s, P) => `${appbar(P, s.title || 'Checkout')}<div style="margin-top:14px">${(s.items || []).slice(0, 4).map((r) => `<div class="wk"><i class="th" style="background:${r.c || 'var(--tint)'}"></i><span class="n">${esc(r.n)}</span><span class="m">${esc(r.p)}</span></div>`).join('')}</div>
      <div class="total"><span>Total</span><span>${esc(s.total)}</span></div>${cta(s.cta || 'Pay now', 'hi')}
      <div class="paid"><svg viewBox="0 0 160 160" width="150"><circle cx="80" cy="80" r="70" fill="var(--hi)"/><path d="M48 82 L71 104 L114 58" fill="none" stroke="var(--ink)" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="h" style="font-size:36px">${esc(s.done || 'Paid!')}</div></div>`,
    animate(el, s, w, { tw, E, MG, ev }) {
      el.querySelectorAll('.wk').forEach((r, k) => tw(r, w.t0 + 0.2 + k * 0.12, 0.35, { opacity: 0, x: 30 }, { opacity: 1, x: 0 }, 'outCubic'));
      const t = ev.badge ?? w.t0 + 1.6, pd = el.querySelector('.paid');
      tw(pd, t, 0.3, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1 }, (p) => E.outBack(p, 1.6)); MG.sfx(t, 'ding', 0.5);
    },
  },
};

// the clay phone prop in the mascot's hand: a tiny drawn version of the intro screen
export function phonePropScreen(P, spec = {}) {
  return (g, w, h) => {
    g.fillStyle = P.paper; g.fillRect(0, 0, w, h);
    g.fillStyle = P.hi; g.fillRect(0, 0, w, 150);
    g.fillStyle = P.ink; g.font = '700 34px Inter, sans-serif'; g.fillText(P.name, 22, 70);
    g.font = '700 26px Inter, sans-serif'; String(spec.greeting || '').split('\n').slice(0, 2).forEach((t, i) => g.fillText(t.slice(0, 15), 22, 112 + i * 28));
    const acts = (spec.actions || []).slice(0, 3);
    [[175, '#FFFFFF'], [290, '#FFFFFF'], [405, P.ink]].forEach(([y, c], i) => { g.fillStyle = c; g.beginPath(); g.roundRect(18, y, 220, 95, 18); g.fill(); g.strokeStyle = P.ink; g.lineWidth = 5; g.stroke();
      if (i < 2) { g.fillStyle = i ? P.tint2 : P.tint; g.fillRect(32, y + 15, 64, 64); }
      const lab = (acts[i]?.label || '').split(' ').slice(0, 2).join(' ');
      g.fillStyle = i === 2 ? P.hi : P.ink; g.font = '700 22px Inter, sans-serif'; g.fillText(lab.slice(0, 13), i === 2 ? 40 : 108, y + 55); });
  };
}
