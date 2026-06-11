// tests/logic-auditor.ts
// Este script valida la LÓGICA del motor enterprise sin necesidad de navegador ni servidor.
// Simulamos el entorno del navegador para probar el núcleo del sistema.

import { dispatcher } from '../src/core/dispatcher';
import { store } from '../src/core/store';
import { auditLogger } from '../src/core/audit-logger';

// --- MOCKS DEL ENTORNO DEL NAVEGADOR ---
const mockLocalStorage = new Map<string, string>();
(global as any).localStorage = {
    getItem: (key: string) => mockLocalStorage.get(key) || null,
    setItem: (key: string, value: string) => mockLocalStorage.set(key, value),
    removeItem: (key: string) => mockLocalStorage.delete(key),
    clear: () => mockLocalStorage.clear(),
};

(global as any).crypto = {
    randomUUID: () => Math.random().toString(36).substring(2, 15),
    subtle: {
        digest: async (algo: string, data: ArrayBuffer) => {
            // Simulación de hash SHA-256 para el entorno de Node
            return new ArrayBuffer(32); 
        }
    }
};

(global as any).performance = {
    now: () => Date.now(),
    mark: () => {},
};

(global as any).TextEncoder = require('util').TextEncoder;

// Mock del Worker para que no falle al instanciar AuditLogger y Sentinel
(global as any).Worker = class {
    postMessage() {}
    terminate() {}
    onmessage = null;
};

// Importamos los componentes después de los mocks
// Nota: Como ya están instanciados en sus archivos, usaremos los exports.

async function runLogicAudit() {
    console.log('⚖️  [LOGIC AUDITOR] Starting Core Engine Validation...');
    const results: any[] = [];

    try {
        // --- CHECKPOINT 1: INTEGRIDAD DE AUDITORÍA Y CADENA ---
        console.log('🔎 Testing Audit Integrity...');
        // Forzamos el registro de comandos
        for(let i = 0; i < 10; i++) {
            await dispatcher.execute('app.launch', `logic-test-${i}`);
        }
        await auditLogger.flush();

        const logs = auditLogger.getPersistentLogs();
        let chainIntact = logs.length >= 10;
        for (let i = 1; i < logs.length; i++) {
            if (!logs[i].previousHash || !logs[i-1].hash) {
                chainIntact = false;
                break;
            }
        }
        results.push({ id: 'AUDIT_INTEGRITY', pass: chainIntact, msg: chainIntact ? 'Chain intact' : 'Chain broken' });

        // --- CHECKPOINT 2: ESTABILIDAD DE CONCURRENCIA ---
        console.log('🔎 Testing Concurrency Stability...');
        const concurrentCommands = 50;
        const promises = [];
        for(let i = 0; i < concurrentCommands; i++) {
            promises.push(dispatcher.execute('app.launch', `conc-logic-${i}`));
        }
        await Promise.all(promises);
        await auditLogger.flush();

        const concLogs = auditLogger.getPersistentLogs().filter((l: any) => l.payload?.startsWith('conc-logic-'));
        results.push({ id: 'CONCURRENCY_STABILITY', pass: concLogs.length === concurrentCommands, msg: `Captured ${concLogs.length}/${concurrentCommands}` });

        // --- CHECKPOINT 3: LÍMITE DE MEMORIA (OVERFLOW) ---
        console.log('🔎 Testing Log Overflow (Memory Ceiling)...');
        // Generamos 1200 logs para probar el slice(-1000)
        for(let i = 0; i < 1200; i++) {
            await dispatcher.execute('app.launch', `overflow-logic-${i}`);
        }
        await auditLogger.flush();
        const overflowLogs = auditLogger.getPersistentLogs();
        results.push({ id: 'MEMORY_CEILING', pass: overflowLogs.length === 1000, msg: `Capped at ${overflowLogs.length}` });

        // --- CHECKPOINT 4: TRANSICIONES DE ESTADO ---
        console.log('🔎 Testing State Transitions...');
        store.setState('system', { hpMode: true });
        const isHP = store.getState('system').hpMode;
        results.push({ id: 'STATE_TRANSITION', pass: isHP === true, msg: 'State updated correctly' });

    } catch (error) {
        console.error('❌ CRITICAL LOGIC FAILURE:', error);
        process.exit(1);
    }

    // FINAL REPORT
    console.log(`
${'='.repeat(50)}
⚖️  FINAL LOGIC AUDIT REPORT
${'='.repeat(50)}`);
    let allPassed = true;
    results.forEach(r => {
        const icon = r.pass ? '✅' : '❌';
        if (!r.pass) allPassed = false;
        console.log(`${icon} ${r.id.padEnd(25)} | ${r.pass ? 'PASSED' : 'FAILED'} | ${r.msg}`);
    });
    console.log('='.repeat(50));
    console.log(allPassed ? '🏆 CORE ENGINE CERTIFIED: LOGICALLY SOUND' : '🚨 CORE ENGINE REJECTED: LOGIC ERRORS FOUND');
    console.log('='.repeat(50));

    if (!allPassed) process.exit(1);
}

runLogicAudit();
