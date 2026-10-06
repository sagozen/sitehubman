const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

console.log('Using browser at:', chromePath);

async function run() {
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

  console.log('Navigating to http://localhost:8081 ...');
  try {
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle2', timeout: 60000 });
  } catch (e) {
    console.log('Navigation wait warning:', e.message);
  }

  // wait an extra 3 seconds for animations
  await new Promise(r => setTimeout(r, 3000));

  const outPath = path.resolve('screenshots/customer/01_customer_home.png');
  await page.screenshot({ path: outPath, fullPage: false });
  console.log('Saved screenshot to:', outPath);

  await browser.close();
}

run().catch(err => {
  console.error('Error running test screenshot:', err);
  process.exit(1);
});
