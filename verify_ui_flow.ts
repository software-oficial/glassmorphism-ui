import { chromium } from 'playwright';

async function runEnterpriseTest() {
  console.log('🚀 Starting Enterprise E2E Certification...');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  let browserErrors = 0;
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`[BROWSER ERROR] ${msg.text()}`);
      browserErrors++;
    }
  });
  page.on('pageerror', err => {
    console.error(`[BROWSER CRASH] ${err.message}`);
    browserErrors++;
  });

  try {
    // 1. LOGIN FLOW
    console.log('🌐 Step 1: Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173');

    console.log('🔐 Step 1.1: Attempting Login...');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');

    console.log('⏳ Step 1.2: Validating transition to Main View...');
    await page.waitForSelector('.contextual-dock', { timeout: 5000 });
    console.log('✅ Login and Main View transition successful.');

    // 2. DOCK SYNCHRONIZATION
    console.log('📊 Step 2: Verifying initial Dock state (Stock)...');
    const initialDockText = await page.innerText('.dock-tools');
    if (initialDockText.includes('Seleccione un módulo')) {
      throw new Error('FAILED: Dock is in placeholder state instead of showing Stock tools.');
    }
    console.log('✅ Initial Dock synchronization verified.');

    // 3. CONTEXT SWITCHING
    console.log('🔄 Step 3: Testing module switch (Stock -> WhatsApp)...');
    await page.click('.portal-btn');
    await page.click('.portal-item[data-module="whatsapp"]');

    console.log('⏳ Step 3.1: Waiting for WhatsApp Dock tools...');
    await page.waitForFunction(
      () => {
        const el = document.querySelector('.dock-tools');
        return el && (el as any).innerText && !(el as any).innerText.includes('Stock');
      }, 
      { timeout: 5000 }
    );
    console.log('✅ Module switch synchronization verified.');

    // 4. PANEL VISIBILITY
    console.log('📦 Step 4: Verifying Panel visibility...');
    const panelVisible = await page.isVisible('.module-view');
    if (!panelVisible) {
      throw new Error('FAILED: Active panel is not visible in the DOM.');
    }
    console.log('✅ Panel visibility verified.');

    // 5. FINAL AUDIT
    console.log('🏁 Step 5: Final Browser Audit...');
    if (browserErrors > 0) {
      throw new Error(`FAILED: Certification failed with ${browserErrors} browser errors.`);
    }
    console.log('✅ Zero-Error Certification achieved.');

  } catch (error: any) {
    console.error('💥 Certification Failure:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runEnterpriseTest().catch(err => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});
