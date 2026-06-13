#!/usr/bin/env node
// Downloads store logos and saves them as PNG/ICO files.
// Sources tried in order per domain until one succeeds.
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
  ['newyorker', 'newyorker.de'], ['pepco', 'pepco.com'], ['kik', 'kik.cz'],
  ['mcdonalds', 'mcdonalds.cz'], ['kfc', 'kfc.cz'], ['burgerking', 'burgerking.cz'],
  ['subway', 'subway.com'], ['pizzahut', 'pizzahut.cz'], ['starbucks', 'starbucks.cz'],
  ['costacoffee', 'costacoffee.cz'], ['bageterie', 'bageterie.com'],
  ['ikea', 'ikea.cz'], ['okay', 'okay.cz'], ['kika', 'kika-home.cz'],
  ['zoot', 'zoot.cz'], ['tchibo', 'tchibo.cz'], ['action', 'action.com'],
  ['flyingtiger', 'flyingtiger.com'],
  ['sparkys', 'sparkys.cz'], ['bambule', 'bambule.cz'], ['hamleys', 'hamleys.cz'],
  ['dracik', 'dracik.cz'],
];

const OUT_DIR = path.join(__dirname, '..', 'custom_components', 'loyalty_cards', 'www', 'logos');
fs.mkdirSync(OUT_DIR, { recursive: true });

function fetchUrl(url, redirects = 10) {
  return new Promise((resolve, reject) => {
    if (redirects === 0) { reject(new Error('Too many redirects')); return; }
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'image/png,image/jpeg,image/webp,image/gif,image/*,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
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
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

const MIN_IMAGE_SIZE = 2000; // reject tiny favicons (< 2 KB)

function isValidImage(buf) {
  if (buf.length < MIN_IMAGE_SIZE) return false;
  // PNG magic
  if (buf[0] === 0x89 && buf[1] === 0x50) return true;
  // JPEG magic
  if (buf[0] === 0xFF && buf[1] === 0xD8) return true;
  // GIF magic
  if (buf[0] === 0x47 && buf[1] === 0x49) return true;
  // WebP
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[8] === 0x57) return true;
  // ICO – only accept if large enough (embedded 256px icon)
  if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01) return true;
  return false;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function sourceUrls(domain) {
  return [
    // Clearbit Logo API – proper brand logos
    `https://logo.clearbit.com/${domain}`,
    // Brandfetch CDN – high quality brand logos
    `https://cdn.brandfetch.io/${domain}/w/400/h/400/format/png`,
    `https://cdn.brandfetch.io/${domain}/w/400/h/400`,
    // Favicon.im larger – user-confirmed good source for CZ stores
    `https://favicon.im/${domain}?larger=true`,
    // Google Favicons HD
    `https://www.google.com/s2/favicons?domain=https://${domain}&sz=256`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    // DuckDuckGo
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://favicon.im/${domain}`,
    // Direct from website as last resort
    `https://www.${domain}/favicon.ico`,
    `https://${domain}/favicon.ico`,
  ];
}

async function main() {
  let ok = 0, skip = 0, fail = 0;
  for (const [key, domain] of STORES) {
    const outFile = path.join(OUT_DIR, `${key}.png`);
    // Skip only if file exists AND is a valid image (not an HTML error page)
    if (fs.existsSync(outFile)) {
      const existing = fs.readFileSync(outFile);
      if (isValidImage(existing)) {
        process.stdout.write(`SKIP ${key} (${existing.length} B)\n`);
        skip++;
        continue;
      }
      // Invalid file — delete and re-download
      fs.unlinkSync(outFile);
    }

    let downloaded = false;
    for (const url of sourceUrls(domain)) {
      try {
        const data = await fetchUrl(url);
        if (!isValidImage(data)) throw new Error(`Not an image (${data.length}B, starts: ${data.slice(0,4).toString('hex')})`);
        fs.writeFileSync(outFile, data);
        process.stdout.write(`OK   ${key} via ${new URL(url).hostname} (${data.length} B)\n`);
        ok++;
        downloaded = true;
        break;
      } catch (e) {
        process.stdout.write(`     ${key} ${new URL(url).hostname}: ${e.message}\n`);
      }
      await sleep(150);
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
