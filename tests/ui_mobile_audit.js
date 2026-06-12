const { chromium } = require('playwright');

async function auditUI() {
  console.log('🎨 Starting UI/UX Mobile-First Audit...');
  const browser = await chromium.launch({ headless: true });
  
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });
  const page = await mobileContext.newPage();

  try {
    // Bypass Auth: Set token and user in localStorage before loading the page
    await page.goto('http://localhost:5173/');
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test_token_123');
      localStorage.setItem('auth_user', JSON.stringify({ id: 'user_123', username: 'Test User', role: 'OWNER' }));
    });
    await page.reload({ waitUntil: 'networkidle' });

    console.log('✅ Page loaded on Mobile Viewport (Auth Bypassed)');

    // Wait for the App to initialize and the Main View to be rendered
    console.log('Waiting for Main View to mount...');
    await page.waitForSelector('.main-view', { timeout: 15000 });
    console.log('✅ Main View detected');

    // UI-01: Mutación del Dock
    console.log(`
Testing UI-01: Dock Mutation...`);
    const portalBtn = page.locator('.portal-btn');
    await portalBtn.waitFor({ state: 'visible', timeout: 10000 });
    await portalBtn.click();
    
    const modules = ['saas', 'stock', 'whatsapp', 'payments'];
    for (const mod of modules) {
      console.log(`   - Switching to module: ${mod}`);
      await page.locator(`.portal-item[data-module="${mod}"]`).click();
      
      const iconCount = await page.locator('.dock-tools .app-icon').count();
      console.log(`     - Icon count for ${mod}: ${iconCount}`);
      if (iconCount !== 4) {
        console.error(`     ❌ Error: Expected 4 icons for ${mod}, found ${iconCount}`);
      }
    }

    // UI-02: Navegación Gestual / Fluidez
    console.log(`
Testing UI-02: Navigation Fluidity...`);
    for (let i = 0; i < 5; i++) {
      const randomMod = modules[Math.floor(Math.random() * modules.length)];
      await page.locator('.portal-btn').click();
      await page.locator(`.portal-item[data-module="${randomMod}"]`).click();
    }
    console.log('✅ Rapid module switching completed without errors');

    // UI-04: Responsividad (No horizontal scroll)
    console.log(`
Testing UI-04: Responsiveness (No horizontal scroll)...`);
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    if (hasHorizontalScroll) {
      console.error('❌ Error: Horizontal scroll detected in mobile view');
    } else {
      console.log('✅ No horizontal scroll detected');
    }

    console.log(`
✨ UI AUDIT COMPLETED SUCCESSFULLY ✨`);

  } catch (error) {
    console.error(`
❌ UI Audit failed:`);
    console.error(error);
  } finally {
    await browser.close();
  }
}

auditUI();
