import './styles/main.css';
import { dispatcher } from './core/dispatcher';
import { systemCommands } from './commands';
import { Dock } from './components/dock/Dock';
import { BootPanel } from './components/glass/BootPanel';
import { sentinel } from './core/sentinel';
import { store } from './core/store';
import { platformBridge } from './core/platform';
import { auditLogger } from './core/audit-logger';
import { remoteControlBridge } from './core/remote-bridge';
import { svgAssetManager } from './core/svg-asset-manager';
import { GlassMenu } from './components/menu/GlassMenu';

// Exposición para diagnósticos y debugging (Enterprise Debug Mode)
(window as any).dispatcher = dispatcher;
(window as any).sentinel = sentinel;
(window as any).store = store;
(window as any).auditLogger = auditLogger;
(window as any).remoteControl = remoteControlBridge;
(window as any).svgAssetManager = svgAssetManager;

console.log('🛡️ [SYSTEM] Initializing Enterprise Grade Engine...');

try {
  // 0. Detección de Plataforma y Configuración de Hardware
  const platform = platformBridge.getPlatform();
  const tier = platformBridge.getPerformanceTier();

  store.setState('system', { 
    platform, 
    performanceTier: tier 
  });

  console.log(`🌐 [SYSTEM] Detected Platform: ${platform.toUpperCase()} | Tier: ${tier.toUpperCase()}`);

  // 1. Carga de Assets Críticos (SVGs)
  await svgAssetManager.loadManifest();
  await svgAssetManager.injectSprites();
  console.log('📦 [SYSTEM] SVG Manifest loaded and sprites injected.');

  // 1. Registro de comandos
  Object.entries(systemCommands).forEach(([name, cmd]) => {
    dispatcher.registerCommand(name, cmd);
  });

  const app = document.getElementById('app');
  if (!app) throw new Error('Critical: App container not found');

  // 2. Montaje del Dock
  const dock = new Dock({
    apps: [
      { id: 'menu', type: 'menu' },
      { id: 'browser', type: 'browser' },
      { id: 'terminal', type: 'terminal' },
      { id: 'files', type: 'folder' },
      { id: 'settings', type: 'settings' },
      { id: 'profile', type: 'user' },
    ]
  });
  dock.mount(app);

  // Botón de activación del menú
  setInterval(() => {
    const menuIcon = document.querySelector('.dock-item:first-child');
    if (menuIcon) {
      menuIcon.onclick = async () => {
        await dispatcher.execute('system.toggle-menu');
      };
    }
  }, 1000);

  // 3. Montaje del Menú Adaptativo
  const menu = new GlassMenu();
  menu.mount(app);

  // 4. Panel Principal (Sustituyendo innerHTML por construcción segura)
  const mainPanel = document.createElement('div');
  mainPanel.className = 'glass-panel';
  mainPanel.style.cssText = `
    position: relative;
    padding: 3rem;
    text-align: center;
    min-width: 320px;
    max-width: 500px;
    z-index: 100;
  `;
  
  // Componentes internos del panel
  const badge = document.createElement('div');
  badge.className = 'hp-badge';
  
  const title = document.createElement('h1');
  title.textContent = 'Glassmorphism OS';
  
  const desc = document.createElement('p');
  desc.className = 'text-secondary';
  desc.textContent = 'Arquitectura de Alto Rendimiento & Resiliencia';
  desc.style.color = 'var(--text-secondary)';
  desc.style.marginBottom = '2rem';
  
  const monitor = document.createElement('div');
  monitor.id = 'perf-monitor';
  monitor.style.cssText = 'font-family: monospace; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 12px; margin-bottom: 2rem; text-align: left;';
  
  const fpsDiv = document.createElement('div');
  const fpsVal = document.createElement('span');
  fpsDiv.appendChild(document.createTextNode('FPS: '));
  fpsDiv.appendChild(fpsVal);
  
  const ramDiv = document.createElement('div');
  const ramVal = document.createElement('span');
  ramDiv.appendChild(document.createTextNode('RAM: '));
  ramDiv.appendChild(ramVal);
  
  const statusDiv = document.createElement('div');
  const statusVal = document.createElement('span');
  statusDiv.appendChild(document.createTextNode('STATUS: '));
  statusDiv.appendChild(statusVal);
  
  monitor.append(fpsDiv, ramDiv, statusDiv);
  
  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = 'display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;';
  
  const btnTheme = document.createElement('button');
  btnTheme.className = 'btn-glass';
  btnTheme.textContent = 'Tema';
  btnTheme.onclick = async () => {
    const currentTheme = store.getState('system').theme;
    store.setState('system', { theme: currentTheme === 'dark' ? 'light' : 'dark' });
    await dispatcher.execute('system.toggle-theme');
  };

  const btnHP = document.createElement('button');
  btnHP.className = 'btn-glass';
  btnHP.textContent = 'Alto Rendimiento';
  btnHP.style.border = '1px solid var(--accent-color)';
  btnHP.onclick = async () => {
    const currentHP = store.getState('system').hpMode;
    store.setState('system', { hpMode: !currentHP });
    await dispatcher.execute('system.toggle-hp');
  };

  const btnAudit = document.createElement('button');
  btnAudit.className = 'btn-glass';
  btnAudit.textContent = 'Auditoría';
  btnAudit.onclick = async () => {
    const logs = await dispatcher.execute('system.audit-log');
    console.table(logs);
    alert('Log de auditoría exportado a la consola (F12)');
  };

  const btnToasts = document.createElement('button');
  btnToasts.className = 'btn-glass';
  btnToasts.textContent = 'Test Toasts';
  btnToasts.onclick = async () => {
    await dispatcher.execute('system.notify', { message: 'Sincronización iniciada...', type: 'INFO' });
    await dispatcher.execute('system.notify', { message: 'Carga de módulos completada', type: 'SUCCESS' });
    await dispatcher.execute('system.notify', { message: 'Memoria RAM al 80%', type: 'WARNING' });
    await dispatcher.execute('system.notify', { message: 'CRITICAL: Fallo en el Kernel', type: 'ERROR', priority: 'HIGH' });
  };

  const btnStress = document.createElement('button');
  btnStress.className = 'btn-glass';
  btnStress.textContent = 'Stress Test';
  btnStress.style.borderColor = 'red';
  btnStress.onclick = async () => {
    const isStressing = store.getState('system').isStressing;
    await dispatcher.execute('system.stress-test', { 
      intensity: store.getState('system').performanceTier === 'low' ? 'low' : 'medium' 
    });
    btnStress.textContent = isStressing ? 'Iniciar Estrés' : 'Detener Estrés';
    btnStress.style.background = isStressing ? 'rgba(255,255,255,0.1)' : 'rgba(255,0,0,0.3)';
  };

  btnContainer.append(btnTheme, btnHP, btnAudit, btnToasts, btnStress);
  mainPanel.append(badge, title, desc, monitor, btnContainer);
  app.appendChild(mainPanel);

  // 4. Suscripción al Store para actualizaciones atómicas
  store.subscribe('system', (systemState) => {
    document.body.setAttribute('data-theme', systemState.theme);
    document.body.setAttribute('data-tier', systemState.performanceTier);
    document.body.classList.toggle('hp-mode', systemState.hpMode);
    
    btnHP.classList.toggle('btn-active', systemState.hpMode);
    badge.innerText = systemState.hpMode ? 'Modo HP Activo' : 'Modo Estándar';
    badge.className = systemState.hpMode ? 'hp-badge active' : 'hp-badge';
  });

  store.subscribe('metrics', (metricsState) => {
    fpsVal.innerText = metricsState.fps.toString();
    ramVal.innerText = (metricsState.ram?.toString() || 'N/A') + ' MB';
    statusVal.innerText = metricsState.status;
    statusVal.style.color = metricsState.status === 'HEALTHY' ? '#00ff00' : '#ff0000';
  });

  console.log('🚀 [SYSTEM] Enterprise Engine Operational');

} catch (error) {
  console.error('🔴 [SYSTEM] CRITICAL BOOT FAILURE:', error);
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `<div style="color: red; padding: 20px; font-family: monospace;">
      <h1>System Failure</h1>
      <p>${error instanceof Error ? error.message : String(error)}</p>
    </div>`;
  }
}
