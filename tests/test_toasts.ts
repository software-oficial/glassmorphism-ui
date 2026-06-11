
import { chromium } from 'playwright';

async function testToastSystem() {
  console.log('🚀 [TOAST TEST] Starting Notification System Validation...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('✅ Page loaded');

    // 1. Test: Trigger multiple notifications
    console.log('Testing: Burst notifications...');
    await page.evaluate(() => {
      const dispatcher = (window as any).dispatcher;
      dispatcher.execute('system.notify', { message: 'T1', type: 'INFO' });
      dispatcher.execute('system.notify', { message: 'T2', type: 'SUCCESS' });
      dispatcher.execute('system.notify', { message: 'T3', type: 'WARNING' });
      dispatcher.execute('system.notify', { message: 'T4', type: 'ERROR' });
    });

    // 2. Verify MAX_VISIBLE limit (Only 3 should be present)
    await new Promise(resolve => setTimeout(resolve, 500));
    const toastCount = await page.evaluate(() => {
      return document.querySelectorAll('.toast-item').length;
    });
    console.log(`   - Visible Toasts: ${toastCount} (Expected <= 3)`);
    
    if (toastCount > 3) {
      console.error('❌ FAIL: Too many toasts visible at once!');
    } else {
      console.log('✅ PASS: Queue limit respected.');
    }

    // 3. Verify Priority (HIGH priority should appear faster or be present)
    console.log('Testing: High Priority Jump...');
    await page.evaluate(() => {
      const dispatcher = (window as any).dispatcher;
      dispatcher.execute('system.notify', { message: 'URGENT', type: 'ERROR', priority: 'HIGH' });
    });

    await new Promise(resolve => setTimeout(resolve, 500));
    const hasUrgent = await page.evaluate(() => {
      return document.body.innerText.includes('URGENT');
    });
    console.log(`   - Urgent Toast visible: ${hasUrgent ? '✅ Yes' : '❌ No'}`);

    console.log('\n✨ TOAST SYSTEM VALIDATION COMPLETE ✨');

  } catch (error) {
    console.error('❌ Test failed:');
    console.error(error);
  } finally {
    await browser.close();
  }
}

testToastSystem();
