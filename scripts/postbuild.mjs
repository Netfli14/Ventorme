import { readFile, writeFile, access } from 'node:fs/promises';
const locales = ['ru', 'en', 'kk', 'uz', 'zh', 'tr'];
let updated = 0;
await access('.next/BUILD_ID');
for (const locale of locales) {
  for (const route of ['', 'quiz/', 'result/', 'sat/']) {
    const pathname = `${locale}${route ? `/${route.slice(0, -1)}` : ''}`;
    // Patch only HTML actually emitted by the build. A hosting adapter may keep
    // prerendered pages elsewhere; the root layout also sets lang before paint.
    for (const file of [
      `.next/server/app/${pathname}.html`,
      `.next/server/app/${pathname}/index.html`,
      `out/${pathname}/index.html`,
    ]) {
      let html;
      try {
        html = await readFile(file, 'utf8');
      } catch (error) {
        if (error.code === 'ENOENT') continue;
        throw error;
      }
      await writeFile(file, html.replace(/<html\s+lang="[^"]*"/, `<html lang="${locale}"`));
      updated++;
    }
  }
  await access(`public/og/${locale}.png`);
}
console.log(`${updated} localized HTML files updated; all 6 Open Graph assets verified.`);
