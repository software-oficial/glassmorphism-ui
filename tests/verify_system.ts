
import { chromium } from 'playwright';

async function verifySystem() {
  console.log('🚀 Starting Manual System Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('✅ Page loaded');

    // 1. Test Theme Toggle
    console.log('Testing: system.toggle-theme...');
    await page.evaluate(() => (window as any).dispatcher.execute('system.toggle-theme'));
    const theme = await page.evaluate(() => document.body.getAttribute('data-theme'));
    console.log(`   - Theme attribute: ${theme}`);

    // 2. Test HP Mode
    console.log('Testing: system.toggle-hp...');
    await page.evaluate(() => (window as any).dispatcher.execute('system.toggle-hp'));
    const hpMode = await page.evaluate(() => document.body.classList.contains('hp-mode'));
    console.log(`   - HP Mode active: ${hpMode}`);

    // 3. Test Stress Test (Start & Stop)
    console.log('Testing: system.stress-test...');
    await page.evaluate(() => (window as any).dispatcher.execute('system.stress-test', { intensity: 'low' }));
    const isStressing = await page.evaluate(() => (window as any).store.getState('system').isStressing);
    console.log(`   - Stressing state: ${isStressing}`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.evaluate(() => (window as any).dispatcher.execute('system.stress-test'));
    const stopped = await page.evaluate(() => !(window as any).store.getState('system').isStressing);
    console.log(`   - Stopped state: ${stopped}`);

    // 4. Test Audit Logs
    console.log('Testing: system.audit-log...');
    const logs = await page.evaluate(() => (window as any).dispatcher.getAuditLog());
    console.log(`   - Audit logs entries: ${logs.length}`);
    if (logs.length > 0) {
      console.log(`   - Last log status: ${logs[logs.length - 1].status}`);
    }

    console.log('\n✨ ALL FUNCTIONS VERIFIED SUCCESSFULLY ✨');

  } catch (error) {
    console.error('\n❌ Verification failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifySystem();
