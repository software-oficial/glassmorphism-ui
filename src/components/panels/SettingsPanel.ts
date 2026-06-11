import { BasePanel } from '../../core/base-panel';
import { dispatcher } from '../../core/dispatcher';
import { store } from '../../core/store';
import { Icon } from '../icon/Icon';

export class SettingsPanel extends BasePanel {
  public render(): void {
    this.container.innerHTML = `
      <div class="panel-content" style="padding: 2rem; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
          <h2 style="margin: 0;">⚙️ Configuración</h2>
          <button id="close-settings" class="btn-glass" style="padding: 5px 10px;">✕</button>
        </div>
        
        <div class="settings-group" style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px;">
            <span>Tema del Sistema</span>
            <button id="toggle-theme" class="btn-glass">Cambiar</button>
          </div>
          
          <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px;">
            <span>Modo Alto Rendimiento</span>
            <button id="toggle-hp" class="btn-glass">Activar/Desactivar</button>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#close-settings')?.addEventListener('click', () => {
      dispatcher.execute('system.close-panel', this.id);
    });

    this.container.querySelector('#toggle-theme')?.addEventListener('click', () => {
      dispatcher.execute('system.toggle-theme');
    });

    this.container.querySelector('#toggle-hp')?.addEventListener('click', () => {
      dispatcher.execute('system.toggle-hp');
    });
  }
}
