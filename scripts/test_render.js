const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testRoot() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to http://localhost:8081...');
  await page.goto('http://localhost:8081', { timeout: 120000 });

  console.log('Waiting for root content...');
  try {
    await page.waitForFunction(() => {
      const root = document.getElementById('root');
      return root && root.children.length > 0 && root.innerText.trim().length > 0;
    }, { timeout: 120000 });
    console.log('Root content rendered successfully!');
  } catch (e) {
    console.log('Wait warning:', e.message);
  }

  await new Promise(r => setTimeout(r, 2000));
  const outPath = path.resolve('screenshots/customer/01_customer_home.png');
  await page.screenshot({ path: outPath });
  console.log('Screenshot saved to:', outPath);

  const stats = fs.statSync(outPath);
  console.log('File size:', stats.size, 'bytes');

  await browser.close();
}

testRoot().catch(e => {
  console.error(e);
  process.exit(1);
});
