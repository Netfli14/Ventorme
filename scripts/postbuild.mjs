import { readFile, writeFile, access } from 'node:fs/promises';
const locales = ['ru', 'en', 'kk', 'uz', 'zh', 'tr'];
for (const locale of locales) {
  for (const route of ['', 'quiz/', 'result/']) {
    const file = `out/${locale}/${route}index.html`;
    const html = await readFile(file, 'utf8');
    // Static export has a shared root layout. Set the served document language,
    // while the root provider keeps quiz context across client locale changes.
    await writeFile(file, html.replace(/<html\s+lang="[^"]*"/, `<html lang="${locale}"`));
  }
  await access(`out/og/${locale}.png`);
}
console.log('18 localized pages have their document language and Open Graph asset.');
