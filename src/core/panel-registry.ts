import { BasePanel } from './base-panel';
import { BrowserPanel } from '../components/panels/BrowserPanel';
import { TerminalPanel } from '../components/panels/TerminalPanel';
import { SettingsPanel } from '../components/panels/SettingsPanel';

/**
 * Panel genérico para pruebas y fallback.
 */
export class GenericPanel extends BasePanel {
  public render(): void {
    this.container.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h2 style="margin-bottom: 1rem;">Panel ${this.id}</h2>
        <p style="color: var(--text-secondary);">Este es un panel genérico de prueba.</p>
        <button id="close-panel-btn" class="btn-glass" style="margin-top: 2rem;">Cerrar Panel</button>
      </div>
    `;

    const closeBtn = this.container.querySelector('#close-panel-btn');
    closeBtn?.addEventListener('click', () => {
      // @ts-ignore
      window.dispatcher.execute('system.close-panel', this.id);
    });
  }
}

export type PanelConstructor = new (id: string) => BasePanel;

export const panelRegistry: Record<string, PanelConstructor> = {
  'browser': BrowserPanel,
  'terminal': TerminalPanel,
  'settings': SettingsPanel,
  'profile': GenericPanel, // Pendiente de implementación
  'files': GenericPanel,   // Pendiente de implementación
};
