#!/usr/bin/env node
// Downloads store logos and saves them as PNG files
// Sources tried in order: Brandfetch CDN, Google Favicons
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const STORES = [
  ['albert', 'albert.cz'], ['billa', 'billa.cz'], ['kaufland', 'kaufland.cz'],
  ['lidl', 'lidl.cz'], ['penny', 'penny.cz'], ['tesco', 'tesco.cz'],
  ['globus', 'globus.cz'], ['coop', 'coop.cz'], ['norma', 'norma.de'],
  ['dm', 'dm.cz'], ['rossmann', 'rossmann.cz'], ['teta', 'tetadrogerie.cz'],
  ['drmax', 'drmax.cz'], ['benu', 'benu.cz'], ['pilulka', 'pilulka.cz'],
  ['lekarnacz', 'lekarna.cz'], ['obi', 'obi.cz'], ['bauhaus', 'bauhaus.cz'],
  ['hornbach', 'hornbach.cz'], ['alza', 'alza.cz'], ['czc', 'czc.cz'],
  ['datart', 'datart.cz'], ['electroworld', 'electroworld.cz'],
  ['decathlon', 'decathlon.cz'], ['sportisimo', 'sportisimo.cz'], ['hervis', 'hervis.cz'],
  ['hm', 'hm.com'], ['zara', 'zara.com'], ['reserved', 'reserved.com'],
  ['primark', 'primark.com'], ['ccc', 'ccc.eu'], ['deichmann', 'deichmann.com'],
  ['newyorker', 'newyorker.de'], ['pepco', 'pepco.com'],
  ['mcdonalds', 'mcdonalds.cz'], ['kfc', 'kfc.cz'], ['burgerking', 'burgerking.cz'],
  ['subway', 'subway.com'], ['pizzahut', 'pizzahut.cz'], ['starbucks', 'starbucks.cz'],
  ['costacoffee', 'costacoffee.cz'], ['bageterie', 'bageterie.com'],
  ['ikea', 'ikea.cz'], ['okay', 'okay.cz'], ['kika', 'kika.cz'],
  ['zoot', 'zoot.cz'], ['tchibo', 'tchibo.cz'], ['action', 'action.com'],
  ['flyingtiger', 'flyingtiger.com'],
];

const OUT_DIR = path.join(__dirname, '..', 'custom_components', 'loyalty_cards', 'www', 'logos');
fs.mkdirSync(OUT_DIR, { recursive: true });

function fetchUrl(url, redirects = 8) {
  return new Promise((resolve, reject) => {
    if (redirects === 0) { reject(new Error('Too many redirects')); return; }
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; logo-fetcher/1.0)',
        'Accept': 'image/png,image/jpeg,image/webp,image/*',
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        return fetchUrl(next, redirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function sourceUrls(domain) {
  return [
    // Brandfetch CDN – high quality logos
    `https://cdn.brandfetch.io/${domain}/w/400/h/400`,
    // Google Favicons – reliable fallback, smaller but decent
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];
}

async function main() {
  let ok = 0, skip = 0, fail = 0;
  for (const [key, domain] of STORES) {
    const outFile = path.join(OUT_DIR, `${key}.png`);
    if (fs.existsSync(outFile) && fs.statSync(outFile).size > 200) {
      process.stdout.write(`SKIP ${key}\n`);
      skip++;
      continue;
    }
    let downloaded = false;
    for (const url of sourceUrls(domain)) {
      try {
        const data = await fetchUrl(url);
        if (data.length < 200) throw new Error('Response too small');
        fs.writeFileSync(outFile, data);
        process.stdout.write(`OK   ${key} via ${new URL(url).hostname} (${data.length} B)\n`);
        ok++;
        downloaded = true;
        break;
      } catch (e) {
        process.stdout.write(`     ${key} ${new URL(url).hostname}: ${e.message}\n`);
      }
      await sleep(200);
    }
    if (!downloaded) {
      process.stdout.write(`FAIL ${key} (${domain}): all sources failed\n`);
      fail++;
    }
    await sleep(300);
  }
  process.stdout.write(`\nDone: ${ok} downloaded, ${skip} skipped, ${fail} failed\n`);
}

main().catch(console.error);
