// Zero-dependency static site generator: node build.js -> dist/
const fs = require('fs'), path = require('path');
const root = __dirname, out = path.join(root, 'dist');
const swords = JSON.parse(fs.readFileSync(path.join(root, 'data', 'swords.json'), 'utf8'));
const S = 5, CY = 90; // 5 px per cm, same scale for every drawing

function drawing(s, i = 0) {
  const gx = 56 + s.grip * S, x0 = gx + 8, L = s.blade * S, xe = x0 + L;
  const w = (s.width * S) / 2, gh = (s.guard * S) / 2, d = s.curve || 0;
  const blade = s.hook
    ? `M${x0} ${CY - w}L${x0 + L * 0.45} ${CY - w}Q${xe + 34} ${CY - w - 14} ${xe} ${CY + 44}Q${xe - 30} ${CY + 6} ${x0 + L * 0.45} ${CY + w}L${x0} ${CY + w}Z`
    : `M${x0} ${CY - w}Q${x0 + L * 0.55} ${CY - w} ${xe} ${CY + d}Q${x0 + L * 0.55} ${CY + w} ${x0} ${CY + w}Z`;
  return `<svg viewBox="0 0 760 192" role="img" aria-label="Blueprint drawing of a ${s.name}, blade ${s.blade} cm" style="--i:${i}">
<path class="axis" d="M20 ${CY}H${xe + 30}"/>
<circle cx="44" cy="${CY}" r="9"/><rect x="56" y="${CY - 6}" width="${s.grip * S}" height="12"/>
<rect x="${gx}" y="${CY - gh}" width="8" height="${gh * 2}"/>
<path class="draw" pathLength="1" d="${blade}"/>
<g class="dim"><path d="M${x0} 152V168M${xe} 152V168M${x0} 160H${xe}"/><text x="${(x0 + xe) / 2}" y="186" text-anchor="middle">blade ${s.blade} cm</text></g>
</svg>`;
}

const shell = (title, desc, body, p = '') => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="description" content="${desc}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Zen+Kaku+Gothic+New:wght@400;500&display=swap">
<link rel="stylesheet" href="${p}style.css"></head><body>
<header class="top"><a href="${p}index.html">Sword Atlas</a></header>
${body}
<footer>Measurements are typical ranges. Individual swords vary.</footer></body></html>`;

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'swords'), { recursive: true });
fs.copyFileSync(path.join(root, 'src', 'style.css'), path.join(out, 'style.css'));

// Home
const rows = swords.map((s, i) => `<a class="row" href="swords/${s.slug}.html">
<div><h2>${s.name}</h2><p class="meta">${s.native}<br>${s.origin}, ${s.era}</p></div>${drawing(s, i)}</a>`).join('\n');
fs.writeFileSync(path.join(out, 'index.html'), shell('Sword Atlas: eight swords at one scale',
  'A visual reference to eight historical swords, drawn at the same scale.',
  `<main class="wrap"><section class="hero"><h1>Eight swords, one scale.</h1>
<p>Every drawing below uses 5 px per centimetre, so a gladius sits next to a claymore at its true proportion. Choose a sword for its history and measurements.</p></section>
<section class="sheet">${rows}</section></main>`));

// Detail pages
swords.forEach((s, i) => {
  const prev = swords[(i + swords.length - 1) % swords.length], next = swords[(i + 1) % swords.length];
  const facts = [['Origin', s.origin], ['Period', s.era], ['Blade', s.blade + ' cm'], ['Weight', s.weight], ['Edge', s.edge], ['Grip', s.hand]]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  fs.writeFileSync(path.join(out, 'swords', s.slug + '.html'), shell(`${s.name} | Sword Atlas`,
    `${s.name}: ${s.origin}, ${s.era}. History and measurements.`,
    `<main class="wrap detail"><h1>${s.name}</h1><p class="meta">${s.native}</p>
<div class="plate">${drawing(s, 0)}</div>
<dl class="facts">${facts}</dl>
<div class="prose">${s.history.map(p => `<p>${p}</p>`).join('')}</div>
<nav class="pager"><a href="${prev.slug}.html">Previous: ${prev.name}</a><a href="${next.slug}.html">Next: ${next.name}</a></nav></main>`, '../'));
});

// S3 error document
fs.writeFileSync(path.join(out, 'error.html'), shell('Page not found | Sword Atlas', 'Page not found',
  `<main class="wrap"><section class="hero"><h1>Page not found.</h1><p><a href="index.html">Return to the atlas</a> and pick a sword from the list.</p></section></main>`));
console.log(`Built ${swords.length + 2} pages into dist/`);
