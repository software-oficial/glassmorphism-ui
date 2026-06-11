import { chromium, Browser, Page } from 'playwright';

async function runStressTest() {
  console.log('🔥 Starting Automated Stress Test Analysis...');
  
  const browser: Browser = await chromium.launch();
  const page: Page = await browser.newPage();
  
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    
    console.log('🎯 Locating Stress Test button...');
    // Buscamos el botón que contiene el texto "Stress Test"
    const stressBtn = page.locator('button:has-text("Stress Test")');
    await stressBtn.click();
    
    console.log('🚀 Stress Test Triggered! Monitoring for 10 seconds...');
    
    // Esperamos a que el sistema procese la carga y genere logs
    await page.waitForTimeout(10000);
    
    // Obtenemos las métricas finales del Store
    const finalMetrics = await page.evaluate(() => {
      return (window as any).store.getState().metrics;
    });
    
    console.log('📊 Final Metrics during stress:', JSON.stringify(finalMetrics, null, 2));
    
    console.log('❄️ Stopping stress test...');
    await stressBtn.click();
    
  } catch (error) {
    console.error('❌ Stress Test Error:', error);
  } finally {
    await browser.close();
  }
}

runStressTest();
