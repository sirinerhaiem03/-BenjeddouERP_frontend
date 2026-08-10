/**
 * Auto-translation script using MyMemory API (free, no key required)
 * Usage: node translate-i18n.js
 *
 * Reads fr.json → translates all string values to EN and AR → writes en.json / ar.json
 * Only translates keys that are MISSING in the target file (safe to re-run)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const I18N_DIR = path.join(__dirname, 'src', 'assets', 'i18n');
const FR_FILE  = path.join(I18N_DIR, 'fr.json');
const EN_FILE  = path.join(I18N_DIR, 'en.json');
const AR_FILE  = path.join(I18N_DIR, 'ar.json');

// --- Helpers ----------------------------------------------------------------

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function translateMyMemory(text, from, to) {
  return new Promise((resolve) => {
    const q   = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=${from}|${to}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const json       = JSON.parse(data);
          const translated = json.responseData.translatedText;
          if (!translated || translated.trim() === '') {
            resolve(text);
          } else {
            resolve(translated);
          }
        } catch {
          resolve(text);
        }
      });
    }).on('error', () => resolve(text));
  });
}

/**
 * Recursively traverse a JSON object.
 * For every string value, translate it if the same key path is missing in target.
 */
async function translateObject(source, target, from, to, keyPath, stats) {
  keyPath = keyPath || '';
  stats   = stats   || { done: 0, skip: 0 };
  const result = Object.assign({}, target);

  for (const key of Object.keys(source)) {
    const value       = source[key];
    const currentPath = keyPath ? (keyPath + '.' + key) : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = await translateObject(
        value,
        result[key] || {},
        from,
        to,
        currentPath,
        stats
      );
    } else if (typeof value === 'string') {
      if (result[key] !== undefined && result[key] !== '') {
        stats.skip++;
      } else {
        process.stdout.write('  [' + to.toUpperCase() + '] ' + currentPath + ' ... ');
        const translated = await translateMyMemory(value, from, to);
        result[key] = translated;
        stats.done++;
        process.stdout.write('"' + translated + '"\n');
        await sleep(180);
      }
    }
  }

  return result;
}

// --- Main -------------------------------------------------------------------

async function main() {
  console.log('\n=== Auto-translation script (MyMemory API) ===\n');

  const source = JSON.parse(fs.readFileSync(FR_FILE, 'utf8'));
  let   enData = JSON.parse(fs.readFileSync(EN_FILE, 'utf8'));
  let   arData = JSON.parse(fs.readFileSync(AR_FILE, 'utf8'));

  // English
  console.log('--- Translating FR -> EN ---\n');
  const enStats = { done: 0, skip: 0 };
  enData = await translateObject(source, enData, 'fr', 'en', '', enStats);
  fs.writeFileSync(EN_FILE, JSON.stringify(enData, null, 2) + '\n', 'utf8');
  console.log('\n[EN] done: ' + enStats.done + ' translated, ' + enStats.skip + ' skipped\n');

  // Arabic
  console.log('--- Translating FR -> AR ---\n');
  const arStats = { done: 0, skip: 0 };
  arData = await translateObject(source, arData, 'fr', 'ar', '', arStats);
  fs.writeFileSync(AR_FILE, JSON.stringify(arData, null, 2) + '\n', 'utf8');
  console.log('\n[AR] done: ' + arStats.done + ' translated, ' + arStats.skip + ' skipped\n');

  console.log('=== All translations complete! ===\n');
}

main().catch(function(err) {
  console.error('Fatal error:', err);
  process.exit(1);
});
