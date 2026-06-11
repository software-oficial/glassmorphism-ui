import { UIComponent } from '../../core/component';
import { dispatcher } from '../../core/dispatcher';
import { store } from '../../core/store';

interface BootPanelState {
  isStressing: boolean;
}

export class BootPanel extends UIComponent<BootPanelState> {
  private fpsVal!: HTMLElement;
  private ramVal!: HTMLElement;
  private statusVal!: HTMLElement;
  private btnStress!: HTMLElement;
  private badge!: HTMLElement;
  private btnHP!: HTMLElement;

  constructor() {
    super({ isStressing: false });
  }

  protected createElement(): HTMLElement {
    const div = this.h('div', {
      className: 'glass-panel',
      style: `
        position: relative;
        padding: 3rem;
        text-align: center;
        min-width: 320px;
        max-width: 500px;
        z-index: 100;
      `
    });
    return div;
  }

  protected render(): void {
    this.element.innerHTML = '';

    this.badge = this.h('div', { className: 'hp-badge' });

    const title = this.h('h1', {}, ['Glassmorphism OS']);
    
    const desc = this.h('p', {
      className: 'text-secondary',
      style: 'color: var(--text-secondary); margin-bottom: 2rem;'
    }, ['Arquitectura de Alto Rendimiento & Resiliencia']);

    const monitor = this.h('div', {
      id: 'perf-monitor',
      style: 'font-family: monospace; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 12px; margin-bottom: 2rem; text-align: left;'
    }, [
      this.h('div', {}, ['FPS: ', this.createSpan('fps-val')]),
      this.h('div', {}, ['RAM: ', this.createSpan('ram-val')]),
      this.h('div', {}, ['STATUS: ', this.createSpan('status-val')])
    ]);

    const btnContainer = this.h('div', {
      style: 'display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;'
    }, [
      this.h('button', {
        className: 'btn-glass',
        textContent: 'Tema',
        onclick: async () => {
          const currentTheme = store.getState('system').theme;
          store.setState('system', { theme: currentTheme === 'dark' ? 'light' : 'dark' });
          await dispatcher.execute('system.toggle-theme');
        }
      }),
      this.h('button', {
        className: 'btn-glass',
        textContent: 'Alto Rendimiento',
        style: 'border: 1px solid var(--accent-color)',
        onclick: async () => {
          const currentHP = store.getState('system').hpMode;
          store.setState('system', { hpMode: !currentHP });
          await dispatcher.execute('system.toggle-hp');
        }
      }),
      this.h('button', {
        className: 'btn-glass',
        textContent: 'Auditoría',
        onclick: async () => {
          const logs = await dispatcher.execute('system.audit-log');
          console.table(logs);
          alert('Log de auditoría exportado a la consola (F12)');
        }
      }),
      this.h('button', {
        className: 'btn-glass',
        textContent: 'Stress Test',
        style: 'border-color: red',
        onclick: async () => {
          const wasStressing = this.state.isStressing;
          await dispatcher.execute('system.stress-test', { 
            intensity: store.getState('system').performanceTier === 'low' ? 'low' : 'medium' 
          });
          this.setState({ isStressing: !wasStressing });
        }
      })
    ]);

    this.element.append(this.badge, title, desc, monitor, btnContainer);

    // Asignar referencias para actualizaciones rápidas
    this.fpsVal = this.element.querySelector('#fps-val') as HTMLElement;
    this.ramVal = this.element.querySelector('#ram-val') as HTMLElement;
    this.statusVal = this.element.querySelector('#status-val') as HTMLElement;
    this.btnStress = btnContainer.lastElementChild as HTMLElement;
    this.btnHP = btnContainer.children[1] as HTMLElement;

    this.updateVisuals();
  }

  private createSpan(id: string): HTMLElement {
    return this.h('span', { id });
  }

  private updateVisuals(): void {
    const { hpMode } = store.getState('system');
    
    this.badge.innerText = hpMode ? 'Modo HP Activo' : 'Modo Estándar';
    this.badge.className = hpMode ? 'hp-badge active' : 'hp-badge';
    this.btnHP.classList.toggle('btn-active', hpMode);

    const isStressing = this.state.isStressing;
    this.btnStress.textContent = isStressing ? 'Detener Estrés' : 'Iniciar Estrés';
    this.btnStress.style.background = isStressing ? 'rgba(255,0,0,0.3)' : 'rgba(255,255,255,0.1)';
  }

  public updateMetrics(metrics: any): void {
    this.fpsVal.innerText = metrics.fps.toString();
    this.ramVal.innerText = (metrics.ram?.toString() || 'N/A') + ' MB';
    this.statusVal.innerText = metrics.status;
    this.statusVal.style.color = metrics.status === 'HEALTHY' ? '#00ff00' : '#ff0000';
  }

  public updateSystemState(): void {
    this.updateVisuals();
  }
}
