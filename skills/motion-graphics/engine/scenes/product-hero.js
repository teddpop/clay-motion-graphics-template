// A physical product as the hero: it rises, turns slowly, and labelled callouts point at what matters.
export default {
  name: 'product-hero',
  about: 'Hardware / physical products (or a 3D icon of the product). Lines: 1–2. Needs video.json product.object.',
  params: {
    at: '[x,y] (1400,560)', size: 'px (380)', callouts: '[{ text, line, at (cue), anchor: [dx,dy] px from centre, side: left|right, dist }]',
    kicker: 'text', caption: 'text', hi: 'highlight', bg: 'background', pose: 'bubble pose (present)',
  },
  build(S, sc) {
    const { E, MG } = S, id = sc.lines[0];
    if (!S.product) throw new Error('product-hero needs video.json product.object');
    const [x, y] = sc.at || [1400, 560], size = sc.size ?? 380;
    if (sc.bg) S.bg(sc.t0, sc.bg, [x, y]);
    S.product.to(sc.t0 + 0.15, { x, y, size }, 0.8, 'pop');
    S.burst(x, y, sc.t0 + 0.6, { r: size * 0.7, color: S.P.hi, n: 12, w: 8, sound: 'pop' });
    if (sc.kicker) S.caption(sc.kicker, S.line(id).start - 0.1, { slot: 'kicker', until: sc.t1 - 0.1, ...(sc.bg === 'hi' ? { ink: S.P.kickInk, muted: S.P.kickMuted } : {}) });
    if (sc.caption) S.caption(sc.caption, S.line(id).start - 0.05, { slot: sc.kicker ? 'idea' : 'main', hi: sc.hi, until: sc.t1 - 0.1 });
    S.host.pose(S.line(id).start - 0.1, sc.pose || 'present').look(S.line(id).start + 0.3, 14).look(S.line(id).start + 1.4, 0);
    const NS = 'http://www.w3.org/2000/svg', over = S.layers.over;
    (sc.callouts || []).forEach((c, k) => {
      const t = S.at(c.line || id, c.at ?? 0.6 + k * 0.6), side = c.side || (k % 2 ? 'left' : 'right'), [dx, dy] = c.anchor || [0, -40 + k * 60];
      const ax = x + dx, ay = y + dy, bx = ax + (side === 'right' ? 1 : -1) * (c.dist ?? 190), by = ay + (c.dy ?? -30);
      const ln = document.createElementNS(NS, 'path'); ln.setAttribute('d', `M${ax} ${ay} L${bx} ${by}`); ln.setAttribute('stroke', S.P.ink); ln.setAttribute('stroke-width', '4');
      ln.setAttribute('stroke-dasharray', '400'); ln.setAttribute('fill', 'none'); over.appendChild(ln);
      const dot = document.createElementNS(NS, 'circle'); dot.setAttribute('cx', ax); dot.setAttribute('cy', ay); dot.setAttribute('r', '8'); dot.setAttribute('fill', S.P.ink); over.appendChild(dot);
      const box = document.createElement('div'); box.className = 'callout'; box.textContent = c.text; S.layers.chips.appendChild(box);
      box.style.top = (by - box.offsetHeight / 2) + 'px'; box.style.left = (side === 'right' ? bx : bx - box.offsetWidth) + 'px';
      const t1 = sc.t1 - 0.15;
      MG.call(-1, 1e9, (p, tt) => { const u = S.clamp((tt - t) / 0.3), out = S.clamp((tt - t1) / 0.2); ln.setAttribute('stroke-dashoffset', (400 * (1 - u)).toFixed(1)); ln.style.opacity = dot.style.opacity = (u > 0 ? 1 - out : 0); });
      S.soft(box, t + 0.2, { from: 0.6, y: 0, sound: 'tick', gain: 0.6 }); MG.out(box, t1, 0.2);
    });
  },
};
