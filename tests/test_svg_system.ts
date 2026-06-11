
import { chromium } from 'playwright';

async function testSVGSystem() {
  console.log('🚀 [SVG TEST] Starting System Validation...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('✅ Page loaded');

    // 1. Verify Standard Icons are rendered
    console.log('Testing: Standard Icons...');
    const standardIcons = ['browser', 'terminal', 'folder', 'settings', 'user'];
    for (const id of standardIcons) {
      const exists = await page.evaluate((iconId) => {
        return !!document.getElementById(`icon-${iconId}`);
      }, id);
      console.log(`   - Icon ${id}: ${exists ? '✅ Rendered' : '❌ Missing'}`);
    }

    // 2. Verify Malformed Icons are REJECTED
    console.log('\nTesting: Validator Rejection...');
    const riskyIcons = ['risk-complex', 'risk-filter', 'risk-full-svg', 'risk-long', 'risk-foreign'];
    for (const id of riskyIcons) {
      const exists = await page.evaluate((iconId) => {
        return !!document.getElementById(`icon-${iconId}`);
      }, id);
      console.log(`   - Icon ${id}: ${!exists ? '✅ Correctly Rejected' : '❌ Erroneously Rendered'}`);
    }

    // 3. Verify Hardware-Aware CSS Classes
    console.log('\nTesting: Performance Tiers...');
    const tierClass = await page.evaluate(() => {
      const icon = document.querySelector('.dock-icon');
      return icon ? icon.className : 'none';
    });
    console.log(`   - Applied CSS Class: ${tierClass}`);

    console.log('\n✨ SVG SYSTEM VALIDATION COMPLETE ✨');

  } catch (error) {
    console.error('❌ Test failed:');
    console.error(error);
  } finally {
    await browser.close();
  }
}

testSVGSystem();
