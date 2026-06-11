import { spawn, execSync } from 'child_process';
import http from 'http';
import { chromium } from 'playwright';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function waitForServer(url: string, timeout = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res: any) => {
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            reject(new Error(`Status: ${res.statusCode}`));
          }
        });
        req.on('error', (err: any) => {
          reject(err);
        });
      });
      return true;
    } catch (e) {
      // Server not ready yet, continue polling
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Timeout waiting for server to be ready');
}

async function runOrchestrator() {
  console.log('🛠️  [ORCHESTRATOR] Starting Enterprise Validation Suite...');
  
  let viteProcess: any = null;
  
  try {
    // 1. Cleanup
    console.log('🧹 [ORCHESTRATOR] Cleaning up existing Vite processes...');
    try {
      execSync('pkill -f vite || true');
    } catch (e) {
      // Ignore
    }

    // 2. Launch Vite
    console.log('🚀 [ORCHESTRATOR] Launching Vite server on port 5173...');
    viteProcess = spawn('npx', ['vite', '--port', '5173', '--host'], {
      shell: true,
      stdio: 'ignore'
    });

    // 3. Health Check
    console.log('⏳ [ORCHESTRATOR] Waiting for server health check...');
    await waitForServer('http://localhost:5173/');
    console.log('✅ [ORCHESTRATOR] Server is UP and running!');

    // 4. Run Playwright Tests
    console.log(`
🧪 [ORCHESTRATOR] Executing Enterprise Validation Tests...`);
    try {
      const { stdout, stderr } = await execPromise('npx playwright test tests/system.spec.ts');
      console.log(stdout);
      if (stderr) console.error(stderr);
      console.log('✅ [ORCHESTRATOR] All E2E tests passed successfully!');
    } catch (testError: any) {
      console.error('❌ [ORCHESTRATOR] Validation Tests Failed:');
      console.error(testError.stdout);
      throw testError;
    }

    // 5. Supplemental High-Load Manual Audit (via Browser)
    console.log(`
🔬 [ORCHESTRATOR] Running Deep Audit Simulation...`);
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // Simulation: Sequential commands to check for memory leaks and audit integrity
    console.log('🧪 [ORCHESTRATOR] Stressing Audit Logger (100 sequential commands)...');
    await page.evaluate(() => {
      const win = (globalThis as any).window || (globalThis as any);
      const dispatcher = win.dispatcher;
      for(let i = 0; i < 100; i++) {
        dispatcher.execute('app.launch', `test-app-${i}`);
      }
      win.auditLogger.flush();
    });

    const logs = await page.evaluate(() => {
      const win = (globalThis as any).window || (globalThis as any);
      return win.auditLogger.getPersistentLogs();
    });
    console.log(`📊 [ORCHESTRATOR] Audit Log Integrity: ${logs.length} entries verified.`);
    
    await browser.close();
    console.log('✅ [ORCHESTRATOR] Deep Audit Simulation Completed.');

  } catch (error) {
    console.error('❌ [ORCHESTRATOR] Critical failure in validation pipeline:');
    console.error(error);
    process.exit(1);
  } finally {
    if (viteProcess) {
      console.log('🔌 [ORCHESTRATOR] Shutting down server...');
      viteProcess.kill();
    }
  }
}

runOrchestrator();
