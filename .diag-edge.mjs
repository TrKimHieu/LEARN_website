import { chromium } from 'playwright';

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const contexts = browser.contexts();
console.log('số context:', contexts.length);

for (const [i, ctx] of contexts.entries()) {
  const pages = ctx.pages();
  console.log(`\n[context ${i}] số tab đang mở: ${pages.length}`);
  for (const p of pages) console.log('   tab:', p.url().slice(0, 110));

  const cookies = await ctx.cookies('https://quizlet.com').catch(() => []);
  console.log(`   cookie domain quizlet.com: ${cookies.length}`);
  for (const c of cookies) console.log(`     - ${c.name} (${c.domain}) expires=${c.expires}`);

  const all = await ctx.cookies().catch(() => []);
  const domains = [...new Set(all.map((c) => c.domain))];
  console.log(`   tổng cookie: ${all.length}, domain: ${domains.join(', ')}`);
}

await browser.close();
