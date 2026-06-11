import { Command } from '../core/dispatcher';
import { sentinel } from '../core/sentinel';
import { dispatcher } from '../core/dispatcher';
import { stressTestCommand } from './stress-test';
import { panelManager } from '../core/panel-manager';
import { panelRegistry } from '../core/panel-registry';
import { store } from '../core/store';

/**
 * Comando para alternar el menú desplegable del Dock.
 */
class ToggleMenuCommand implements Command {
  public execute(): boolean {
    const current = store.getState('system').menuOpen;
    store.setState('system', { menuOpen: !current });
    return !current;
  }
}

/**
 * Comando para abrir un panel específico.
 */
class OpenPanelCommand implements Command {
  public async execute(panelId: string): Promise<void> {
    const PanelClass = panelRegistry[panelId];
    if (!PanelClass) {
      throw new Error(`[OpenPanelCommand] No panel registered for ID: ${panelId}`);
    }
    
    // Cerramos el menú al abrir un panel
    store.setState('system', { menuOpen: false });
    await panelManager.mountPanel(panelId, PanelClass);
    return `Panel ${panelId} opened`;
  }
}

/**
 * Comando para cerrar un panel específico.
 */
class ClosePanelCommand implements Command {
  public execute(panelId: string): void {
    panelManager.unmountPanel(panelId);
    return `Panel ${panelId} closed`;
  }
}

/**
 * Comando para alternar entre modo Estándar y Alto Rendimiento.
 */
class ToggleHPModeCommand implements Command {
  public execute(): boolean {
    const body = document.body;
    const isHP = body.classList.toggle('hp-mode');
    console.log(`[Command] Modo Alto Rendimiento: ${isHP ? 'Activado' : 'Desactivado'}`);
    return isHP;
  }
}

/**
 * Comando para cambiar el tema del sistema.
 */
class ToggleThemeCommand implements Command {
  public execute(): void {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    console.log(`[Command] Tema cambiado a: ${newTheme}`);
    return newTheme;
  }
}

/**
 * Comando para lanzar una aplicación simulada.
 */
class LaunchAppCommand implements Command {
  public execute(appId: string): string {
    console.log(`[Command] Lanzando aplicación: ${appId}`);
    return `App ${appId} launched successfully`;
  }
}

/**
 * Comando para obtener las métricas actuales del sistema Sentinel.
 */
class GetMetricsCommand implements Command {
  public execute() {
    return sentinel.getMetrics();
  }
}

/**
 * Comando para obtener el log de auditoría completo.
 */
class GetAuditLogCommand implements Command {
  public execute() {
    return dispatcher.getAuditLog();
  }
}

/**
 * Comando para disparar notificaciones Toast.
 */
class NotifyCommand implements Command {
  public async execute(payload?: { message: string; type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'; priority?: 'LOW' | 'HIGH'; duration?: number }) {
    if (!payload?.message) throw new Error('[NotifyCommand] Message is required');
    
    const { toastManager } = await import('../core/toast-manager');
    return await toastManager.notify(payload);
  }
}

// Registro central de comandos
export const systemCommands = {
  'system.toggle-menu': new ToggleMenuCommand(),
  'system.open-panel': new OpenPanelCommand(),
  'system.close-panel': new ClosePanelCommand(),
  'system.toggle-theme': new ToggleThemeCommand(),
  'system.toggle-hp': new ToggleHPModeCommand(),
  'app.launch': new LaunchAppCommand(),
  'system.metrics': new GetMetricsCommand(),
  'system.audit-log': new GetAuditLogCommand(),
  'system.stress-test': stressTestCommand,
  'system.notify': new NotifyCommand(),
};

