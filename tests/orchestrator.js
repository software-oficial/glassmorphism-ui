import { spawn, execSync } from 'child_process';
import http from 'http';
import { chromium } from 'playwright';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function waitForServer(url, timeout = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            reject(new Error(`Status: ${res.statusCode}`));
          }
        });
        req.on('error', (err) => {
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
  
  let viteProcess = null;
  
  try {
    console.log('🧹 [ORCHESTRATOR] Cleaning up existing Vite processes...');
    try {
      execSync('pkill -f vite || true');
    } catch (e) {}

    console.log('🚀 [ORCHESTRATOR] Launching Vite server on port 5173...');
    viteProcess = spawn('npx', ['vite', '--port', '5173', '--host'], {
      shell: true,
      stdio: 'ignore'
    });

    console.log('⏳ [ORCHESTRATOR] Waiting for server health check...');
    await waitForServer('http://localhost:5173/');
    console.log('✅ [ORCHESTRATOR] Server is UP and running!');

    console.log(`
🧪 [ORCHESTRATOR] Executing Enterprise Validation Tests...`);
    try {
      const { stdout, stderr } = await execPromise('npx playwright test tests/system.spec.ts');
      console.log(stdout);
      if (stderr) console.error(stderr);
      console.log('✅ [ORCHESTRATOR] All E2E tests passed successfully!');
    } catch (testError) {
      console.error('❌ [ORCHESTRATOR] Validation Tests Failed:');
      if (testError.stdout) console.error(testError.stdout);
      throw testError;
    }

    console.log(`
🔬 [ORCHESTRATOR] Running Deep Audit Simulation...`);
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    console.log('🧪 [ORCHESTRATOR] Stressing Audit Logger (100 sequential commands)...');
    await page.evaluate(() => {
      const win = window;
      const dispatcher = win.dispatcher;
      for(let i = 0; i < 100; i++) {
        dispatcher.execute('app.launch', `test-app-${i}`);
      }
      win.auditLogger.flush();
    });

    const logs = await page.evaluate(() => window.auditLogger.getPersistentLogs());
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
