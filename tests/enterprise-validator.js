const { spawn, execSync } = require('child_process');
const http = require('http');
const { chromium } = require('playwright');

async function waitForServer(url, timeout = 60000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            await new Promise((resolve, reject) => {
                const req = http.get(url, (res) => {
                    if (res.statusCode >= 200 && res.statusCode < 500) resolve(true);
                    else reject(new Error(`Status: ${res.statusCode}`));
                });
                req.on('error', reject);
            });
            return true;
        } catch (e) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    throw new Error('Timeout waiting for server');
}

async function runValidator() {
    console.log('⚖️  [THE JUDGE] Starting Absolute Enterprise Validation...');
    
    let viteProcess = null;
    const results = [];

    try {
        try {
            execSync('pkill -f vite || true', { stdio: 'ignore' });
        } catch (e) {
            // Ignore
        }
        viteProcess = spawn('npx', ['vite', '--port', '5173', '--host'], { shell: true, stdio: 'ignore' });
        await waitForServer('http://localhost:5173/');
        console.log('✅ Server Ready.');
        const browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // ESPERA CRÍTICA: Esperar a que el script de main.ts se ejecute y exponga los objetos al window
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
        await page.waitForFunction(() => window.dispatcher !== undefined, { timeout: 10000 });
        console.log('✅ System Objects Exposed to Window.');

        // --- CHECKPOINT 1: AUDIT INTEGRITY & CHAINING ---
        console.log('🔎 Testing Audit Integrity...');
        await page.evaluate(async () => {
            const dispatcher = window.dispatcher;
            for(let i = 0; i < 5; i++) {
                await dispatcher.execute('app.launch', `audit-test-${i}`);
            }
            await window.auditLogger.flush();
        });

        const auditCheck = await page.evaluate(() => {
            const logs = window.auditLogger.getPersistentLogs();
            if (logs.length < 5) return { pass: false, msg: 'Not enough logs' };
            
            for (let i = 1; i < logs.length; i++) {
                if (logs[i].previousHash !== logs[i-1].hash) {
                    return { pass: false, msg: `Chain broken at index ${i}` };
                }
            }
            return { pass: true, msg: 'Hash chain intact' };
        });
        results.push({ id: 'AUDIT_INTEGRITY', ...auditCheck });

        // --- CHECKPOINT 2: SENTINEL REACTION (STRESS) ---
        console.log('🔎 Testing Sentinel Reaction...');
        await page.click('button:has-text("Stress Test")');
        
        let statusDetected = false;
        for(let i = 0; i < 10; i++) {
            const status = await page.evaluate(() => window.store.getState('metrics').status);
            if (status === 'CRITICAL' || status === 'WARNING') {
                statusDetected = true;
                break;
            }
            await new Promise(r => setTimeout(r, 500));
        }
        
        await page.click('button:has-text("Detener Estrés")');
        const recovered = await page.evaluate(() => window.store.getState('metrics').status === 'HEALTHY');
        
        results.push({ 
            id: 'SENTINEL_REACTION', 
            pass: statusDetected && recovered, 
            msg: statusDetected ? (recovered ? 'Detected & Recovered' : 'Detected but failed recovery') : 'Failed to detect stress'
        });

        // --- CHECKPOINT 3: RESOURCE OPTIMIZATION (LOW-END) ---
        console.log('🔎 Testing Low-End Optimization...');
        await page.evaluate(() => {
            window.store.setState('system', { performanceTier: 'low' });
            document.body.setAttribute('data-tier', 'low');
        });

        const blurValue = await page.evaluate(() => {
            return getComputedStyle(document.body).getPropertyValue('--glass-blur').trim();
        });
        
        results.push({ 
            id: 'LOW_END_OPTIMIZATION', 
            pass: blurValue === '0px', 
            msg: `Blur value: ${blurValue}` 
        });

        // --- CHECKPOINT 4: CONCURRENCY STABILITY ---
        console.log('🔎 Testing Concurrency Stability...');
        await page.evaluate(async () => {
            const dispatcher = window.dispatcher;
            const promises = [];
            for(let i = 0; i < 50; i++) {
                promises.push(dispatcher.execute('app.launch', `conc-test-${i}`));
            }
            await Promise.all(promises);
            await window.auditLogger.flush();
        });

        const concLogs = await page.evaluate(() => {
            const logs = window.auditLogger.getPersistentLogs();
            return logs.filter(l => l.payload?.startsWith('conc-test-')).length;
        });

        results.push({ 
            id: 'CONCURRENCY_STABILITY', 
            pass: concLogs === 50, 
            msg: `Recorded ${concLogs}/50 concurrent commands` 
        });

        await browser.close();

        // FINAL REPORT
        console.log(`
${'='.repeat(50)}
⚖️  FINAL ENTERPRISE VALIDATION REPORT
${'='.repeat(50)}`);
        let allPassed = true;
        results.forEach(r => {
            const icon = r.pass ? '✅' : '❌';
            if (!r.pass) allPassed = false;
            console.log(`${icon} ${r.id.padEnd(25)} | ${r.pass ? 'PASSED' : 'FAILED'} | ${r.msg}`);
        });
        console.log('='.repeat(50));
        console.log(allPassed ? '🏆 SYSTEM CERTIFIED: READY FOR PRODUCTION' : '🚨 SYSTEM REJECTED: FIXES REQUIRED');
        console.log('='.repeat(50));

        if (!allPassed) process.exit(1);

    } catch (error) {
        console.error('❌ CRITICAL VALIDATION FAILURE:', error);
        process.exit(1);
    } finally {
        if (viteProcess) viteProcess.kill();
    }
}

runValidator();
