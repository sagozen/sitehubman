const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const BASE_URL = 'http://localhost:8081';

const guestRoutes = [
  { name: '01_guest_choice', path: '/guest-post-login-choice' },
  { name: '02_guest_home_preview', path: '/preview-guest' },
  { name: '03_guest_choose_card', path: '/guest-choose-card' },
  { name: '04_guest_design_studio', path: '/guest-design' },
  { name: '05_guest_checkout', path: '/guest-checkout' },
  { name: '06_guest_track_order', path: '/guest-track-order' },
  { name: '07_guest_analytics', path: '/guest-analytics' },
  { name: '08_onboarding_purpose', path: '/onboarding/purpose' },
  { name: '09_onboarding_card_style', path: '/onboarding/card-style' },
];

const customerRoutes = [
  { name: '01_customer_home_dashboard', path: '/' },
  { name: '02_customer_digital_cards', path: '/share' },
  { name: '03_customer_nfc_management', path: '/profile' },
  { name: '04_customer_orders_store', path: '/orders' },
  { name: '05_customer_me_settings', path: '/settings' },
  { name: '06_customer_leads_crm', path: '/leads' },
  { name: '07_customer_share_profile', path: '/share-profile' },
  { name: '08_customer_qr_customize', path: '/qr/customize' },
  { name: '09_customer_contact_vcard', path: '/contact-card' },
  { name: '10_customer_nfc_connect', path: '/nfc/connect' },
  { name: '11_customer_nfc_write', path: '/nfc/write' },
  { name: '12_customer_nfc_direct_mode', path: '/nfc/direct-mode' },
  { name: '13_customer_nfc_test', path: '/nfc/test' },
  { name: '14_customer_nfc_success', path: '/nfc/success' },
  { name: '15_customer_nfc_troubleshoot', path: '/nfc/error' },
  { name: '16_customer_design_proof', path: '/orders/proof' },
  { name: '17_customer_order_track', path: '/orders/track' },
  { name: '18_customer_shop_cart', path: '/shop/cart' },
  { name: '19_customer_account_settings', path: '/account/settings' },
  { name: '20_customer_notifications', path: '/account/notifications' },
  { name: '21_customer_security', path: '/account/security' },
  { name: '22_customer_subscription', path: '/account/subscription' },
  { name: '23_customer_delete_account', path: '/account/delete-account' },
  { name: '24_customer_about', path: '/account/about' },
  { name: '25_customer_analytics', path: '/analytics' },
];

async function captureRoutes(page, routes, folder) {
  const dir = path.resolve('screenshots', folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  for (let i = 0; i < routes.length; i++) {
    const r = routes[i];
    const url = `${BASE_URL}${r.path}`;
    const outFile = path.join(dir, `${r.name}.png`);
    console.log(`[${i + 1}/${routes.length}] Capturing ${folder}: ${r.name} from ${url}...`);

    try {
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      // Wait for content
      try {
        await page.waitForFunction(() => {
          const root = document.getElementById('root');
          return root && root.children.length > 0;
        }, { timeout: 15000 });
      } catch (e) {
        // continue
      }
      // Small pause for rendering/fonts
      await new Promise(res => setTimeout(res, 1200));

      await page.screenshot({ path: outFile });
      const stats = fs.statSync(outFile);
      console.log(`  -> Saved ${r.name}.png (${Math.round(stats.size / 1024)} KB)`);
    } catch (err) {
      console.warn(`  -> Failed ${r.name}: ${err.message}`);
    }
  }
}

async function run() {
  console.log('Launching browser for batch screenshots...');
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

  console.log('\n=== CAPTURING CUSTOMER PAGES ===');
  await captureRoutes(page, customerRoutes, 'customer');

  console.log('\n=== CAPTURING GUEST PAGES ===');
  await captureRoutes(page, guestRoutes, 'guest');

  await browser.close();
  console.log('\nALL SCREENSHOTS COMPLETED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('Fatal batch screenshot error:', err);
  process.exit(1);
});
