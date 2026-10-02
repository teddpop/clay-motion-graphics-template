#!/usr/bin/env python3
"""Re-tone a style palette to a new hue while keeping the reference's perceived saturation.

usage: retone.py <hue_deg_oklch> [name=hex ...]
  default palette = highlighter-explainer reference (sampled from the demo video)
  hue examples (OKLCH): coral 30, tangerine 55, gold 85, lime 120 (original), mint 165, teal 195, cobalt 260, violet 300, pink 350

Method: convert each colour to OKLCH, swap the hue, keep chroma (saturation) first and lower lightness only
as much as the sRGB gamut requires (lime is the only hue that can be that bright *and* that saturated,
so other hues get slightly darker to keep the same punch). Light variants ('hiLight') keep lightness instead.
"""
import json, math, sys

REF = {'paper': 'F5F5F0', 'sage': 'D4D8CA', 'hi': 'C7EA1A', 'ink': '151817', 'hiLight': 'E2F86C', 'mid': 'A7BF57'}
KEEP_LIGHT = {'hiLight'}

def s2l(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def l2s(c): return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055

def to_oklch(h):
    r, g, b = [s2l(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)]
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
    a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
    bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    return L, math.hypot(a, bb)

def rgb(L, C, H):
    a, b = C * math.cos(math.radians(H)), C * math.sin(math.radians(H))
    l, m, s = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s]

def in_gamut(v): return all(-1e-4 <= x <= 1 + 1e-4 for x in v)
def max_c(L, H):
    C = 0.4
    while C > 0 and not in_gamut(rgb(L, C, H)): C -= 0.002
    return C
def hexo(L, C, H): return '#%02X%02X%02X' % tuple(round(l2s(min(1, max(0, x))) * 255) for x in rgb(L, C, H))

def retone(hexcol, H, keep_light=False):
    L0, C0 = to_oklch(hexcol)
    if keep_light: L0 -= 0.08; return hexo(L0, min(C0, max_c(L0, H)), H)  # light step, still clearly tinted
    best = (L0, 0)
    for i in range(81):
        L = L0 - i * 0.002
        c = max_c(L, H)
        if c >= C0: return hexo(L, C0, H)
        if c > best[1]: best = (L, c)
    return hexo(best[0], best[1], H)

if __name__ == '__main__':
    H = float(sys.argv[1])
    pal = dict(REF, **{k: v.strip('#') for k, v in (a.split('=') for a in sys.argv[2:])})
    print(json.dumps({k: retone(v, H, k in KEEP_LIGHT) for k, v in pal.items()}, indent=1))
