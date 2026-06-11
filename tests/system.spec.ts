import { test, expect } from '@playwright/test';

test('should persist audit logs in localStorage', async ({ page }) => {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.click('button:has-text("Tema")');
  await page.evaluate(() => (window as any).auditLogger.flush());
  
  const logs = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('system_audit_log') || '[]');
  });
  
  expect(logs.length).toBeGreaterThan(0);
  expect(logs[0]).toHaveProperty('hash');
  expect(logs[0]).toHaveProperty('previousHash');
});

test('should detect critical performance during stress test', async ({ page }) => {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.click('button:has-text("Stress Test")');
  
  await expect.poll(async () => {
    return await page.evaluate(() => (window as any).store.getState('metrics').status);
  }, {
    message: 'Sentinel should detect performance drop',
    timeout: 10000,
  }).not.toBe('HEALTHY');

  await page.click('button:has-text("Detener Estrés")');
  
  await expect.poll(async () => {
    return await page.evaluate(() => (window as any).store.getState('metrics').status);
  }, {
    timeout: 5000,
  }).toBe('HEALTHY');
});

test('should disable glass effects in HP Mode', async ({ page }) => {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.click('button:has-text("Alto Rendimiento")');
  
  const bodyClass = await page.evaluate(() => document.body.classList.contains('hp-mode'));
  expect(bodyClass).toBe(true);
  
  const blurValue = await page.evaluate(() => {
    return getComputedStyle(document.body).getPropertyValue('--glass-blur');
  });
  
  expect(blurValue.trim()).toBe('0px');
});
