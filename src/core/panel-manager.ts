import { BasePanel } from './base-panel';
import { store } from './store';

export class PanelManager {
  private activePanels: Map<string, BasePanel> = new Map();
  private rootContainer: HTMLElement;
  private highestZIndex = 100;

  constructor(rootId: string) {
    this.rootContainer = document.getElementById(rootId) || document.body;
  }

  /**
   * Monta un panel en la pantalla. Si ya existe, lo trae al frente.
   */
  public async mountPanel(panelId: string, PanelClass: new (id: string) => BasePanel): Promise<void> {
    if (this.activePanels.has(panelId)) {
      this.focusPanel(panelId);
      return;
    }

    const panel = new PanelClass(panelId);
    panel.render();
    
    this.rootContainer.appendChild(panel.element);
    this.activePanels.set(panelId, panel);
    this.focusPanel(panelId);
    
    console.log(`[PanelManager] Panel ${panelId} mounted and focused.`);
  }

  /**
   * Trae el panel al frente y marca los demás como desenfocados.
   */
  public focusPanel(panelId: string): void {
    const panel = this.activePanels.get(panelId);
    if (!panel) return;

    this.highestZIndex++;
    panel.element.style.zIndex = this.highestZIndex.toString();
    
    // Actualizar clases de enfoque para optimización de GPU (CSS)
    this.activePanels.forEach((p, id) => {
      p.element.classList.toggle('panel-focused', id === panelId);
      p.element.classList.toggle('panel-blurred', id !== panelId);
    });

    store.setState('system', { activePanel: panelId });
  }

  public unmountPanel(panelId: string): void {
    const panel = this.activePanels.get(panelId);
    if (panel) {
      panel.destroy();
      this.activePanels.delete(panelId);
      console.log(`[PanelManager] Panel ${panelId} unmounted and memory freed.`);
    }
  }

  public clearAll(): void {
    this.activePanels.forEach((_, id) => this.unmountPanel(id));
  }
}

export const panelManager = new PanelManager('app');
