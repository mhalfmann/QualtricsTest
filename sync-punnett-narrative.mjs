/**
 * Build Punnett objects: p1 = left (rows), p2 = top (cols), o = combine.
 */
function combine(a, b) {
  if (a.toLowerCase() === b.toLowerCase()) {
    if (a === b) return a + b;
    return (a === a.toUpperCase() ? a : b) + (a === a.toLowerCase() ? a : b);
  }
  return [a, b].sort((x, y) => x.localeCompare(y, 'en')).join('');
}

function P(leftGenotype, topGenotype) {
  const p1a1 = leftGenotype[0];
  const p1a2 = leftGenotype[1];
  const p2a1 = topGenotype[0];
  const p2a2 = topGenotype[1];
  return {
    p2a1,
    p2a2,
    p1a1,
    o1: combine(p1a1, p2a1),
    o2: combine(p1a1, p2a2),
    p1a2,
    o3: combine(p1a2, p2a1),
    o4: combine(p1a2, p2a2),
  };
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'answerKeyDE.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// --- Level 4 enige_hulp + alles_zelf Augenfarbe: P BB×Bb; F1×bb cases; P again ---
const l4AugenStep4 = [
  P('BB', 'Bb'),
  P('Bb', 'bb'),
  P('BB', 'bb'),
  P('BB', 'Bb'),
];
data.level4.enige_hulp.Augenfarbe.step4 = l4AugenStep4;
data.level4.alles_zelf.Augenfarbe.step4 = l4AugenStep4.map((o) => ({ ...o }));

// --- Level 4 veel_hulp Albinismus: P AA×Aa; F1 Aa×aa; F1 AA×aa (no aa kids); P repeat ---
data.level4.veel_hulp.Albinismus.step4 = [
  P('AA', 'Aa'),
  P('Aa', 'aa'),
  P('AA', 'aa'),
  P('AA', 'Aa'),
];

// --- Level 5 Augenfarbe (×3): P BB×Bb; F1 branches × bb; Bb×Bb; bb excluded path ---
const l5AugenStep4 = [
  P('BB', 'Bb'),
  P('Bb', 'bb'),
  P('BB', 'bb'),
  P('Bb', 'Bb'),
  P('bb', 'bb'),
  P('BB', 'Bb'),
];
['veel_hulp', 'enige_hulp', 'alles_zelf'].forEach((h) => {
  data.level5[h].Augenfarbe.step4 = l5AugenStep4.map((o) => ({ ...o }));
});

// --- Level 5 Depression veel_hulp: remove duplicate junk; P DD×(Dd/dd); F1×dd; Dd×Dd ---
data.level5.veel_hulp.Depression.step4 = [
  P('DD', 'Dd'),
  P('DD', 'dd'),
  P('Dd', 'dd'),
  P('Dd', 'Dd'),
  P('dd', 'dd'),
  P('DD', 'Dd'),
];

function innerFormat(obj) {
  let s = JSON.stringify(obj);
  s = s.replace(/,/g, ', ');
  s = s.replace(/\{/g, '{ ');
  s = s.replace(/\}/g, ' }');
  s = s.replace(/\[/g, '[ ');
  s = s.replace(/\]/g, ' ]');
  s = s.replace(/\[ "/g, '["');
  s = s.replace(/" \]/g, '"]');
  s = s.replace(/":/g, '": ');
  return s;
}

const levelKeys = ['level1', 'level2', 'level3', 'level4', 'level5'];
const helpKeys = ['veel_hulp', 'enige_hulp', 'alles_zelf'];

const lines = ['{'];
for (let li = 0; li < levelKeys.length; li++) {
  const lk = levelKeys[li];
  lines.push(`    "${lk}": {`);
  for (let hi = 0; hi < helpKeys.length; hi++) {
    const hk = helpKeys[hi];
    lines.push(`      "${hk}": {`);
    const group = data[lk][hk];
    const taskNames = Object.keys(group);
    for (let ti = 0; ti < taskNames.length; ti++) {
      const tk = taskNames[ti];
      const comma = ti < taskNames.length - 1 ? ',' : '';
      lines.push(`        "${tk}": ${innerFormat(group[tk])}${comma}`);
    }
    const hComma = hi < helpKeys.length - 1 ? ',' : '';
    lines.push(`      }${hComma}`);
  }
  const lComma = li < levelKeys.length - 1 ? ',' : '';
  lines.push(`    }${lComma}`);
}
lines.push('  }');
lines.push('');

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Updated punnett step4 for: l4 Augen (enige+alles), l4 Albinismus, l5 Augen×3, l5 Depression veel_hulp');
