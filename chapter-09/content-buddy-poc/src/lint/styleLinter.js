// Basic style linter and readability check.
export function lintStyle(text, stylePack) {
  const report = { banned: [], missingRequired: [], readingLevelOk: true, readingLevel: null };

  const banned = stylePack.must_avoid || [];
  const required = stylePack.must_use || [];

  const lower = text.toLowerCase();
  for (const b of banned) {
    if (lower.includes(b.toLowerCase())) report.banned.push(b);
  }
  for (const r of required) {
    if (!lower.includes(r.toLowerCase())) report.missingRequired.push(r);
  }

  report.readingLevel = fleschKincaidGrade(text);
  const [minLvl, maxLvl] = parseReadingBand(stylePack.reading_level || 'Grade 8-10');
  report.readingLevelOk = report.readingLevel >= minLvl && report.readingLevel <= maxLvl;

  return report;
}

// Flesch-Kincaid Grade approximation
export function fleschKincaidGrade(text) {
  const sentences = Math.max(1, (text.match(/[.!?]+/g) || []).length);
  const words = Math.max(1, (text.match(/\b\w+\b/g) || []).length);
  const syllables = countSyllables(text);
  const grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  return Math.max(0, Math.round(grade * 10) / 10);
}

function countSyllables(text) {
  const words = (text.toLowerCase().match(/[a-z]+/g) || []);
  let count = 0;
  for (const w of words) {
    // naive syllable count
    const syl = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/,'').replace(/^y/,'');
    const m = syl.match(/[aeiouy]{1,2}/g);
    count += (m ? m.length : 1);
  }
  return count;
}

function parseReadingBand(band) {
  const m = band.match(/(\d+)[^\d]+(\d+)/);
  if (!m) return [0, 20];
  return [parseInt(m[1],10), parseInt(m[2],10)];
}
