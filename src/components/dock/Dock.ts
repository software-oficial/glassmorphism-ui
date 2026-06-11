import { UIComponent } from '../../core/component';
import { AppIcon } from './AppIcon';
import { PanelManager } from '../../core/panel-manager';
import { platformBridge } from '../../core/platform';

interface DockState {
  apps: Array<{ id: string; type: string }>;
}

export class Dock extends UIComponent<DockState> {
  private items: HTMLElement[] = [];
  private mouseX = -1000;
  private isAnimating = false;
  private panelManager: PanelManager;
  
  private cachedDockLeft = 0;
  private cachedItemCenters: number[] = [];

  constructor(panelManager: PanelManager) {
    super({
      apps: Dock.resolveAppsByPlatform()
    });
    this.panelManager = panelManager;
  }

  /**
   * Define qué aplicaciones aparecen en el dock según la plataforma y el propósito.
   * Esto evita que la interfaz sea un "SO" genérico y la convierte en una herramienta de gestión.
   */
  private static resolveAppsByPlatform(): Array<{ id: string; type: string }> {
    const platform = platformBridge.getPlatform();
    
    // Configuración base enfocada en el negocio, no en el sistema
    const baseApps = [
      { id: 'stock', type: 'inventory' },
      { id: 'whatsapp', type: 'communication' },
      { id: 'payments', type: 'finance' },
      { id: 'admin', type: 'management' }
    ];

    // Adaptación según dispositivo (ejemplo: en móvil podríamos simplificar o cambiar el orden)
    if (platform === 'android' || platform === 'ios') {
      return baseApps.filter(app => app.id !== 'admin'); // Ejemplo: Ocultar admin en móvil por seguridad/espacio
    }

    return baseApps;
  }

  protected createElement(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'os-dock';
    return div;
  }

  protected render(): void {
    this.element.innerHTML = '';
    this.items = [];
    
    this.state.apps.forEach(app => {
      const icon = new AppIcon({ 
        appId: app.id, 
        iconType: app.type, 
        active: false 
      });
      
      icon.domElement.onclick = async (e) => {
        e.stopPropagation();
        await this.panelManager.openPanel(app.id);
        icon.setState({ active: true });
      };

      icon.mount(this.element);
      this.items.push(icon.domElement);
    });

    this.cacheDimensions();
    this.initEvents();
    this.startRenderLoop();
  }

  private cacheDimensions(): void {
    const rect = this.element.getBoundingClientRect();
    this.cachedDockLeft = rect.left;
    
    this.cachedItemCenters = this.items.map(item => {
      const itemRect = item.getBoundingClientRect();
      return itemRect.left + itemRect.width / 2 - this.cachedDockLeft;
    });
  }

  private initEvents(): void {
    window.addEventListener('resize', () => this.cacheDimensions(), { passive: true });

    this.element.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX - this.cachedDockLeft;
    }, { passive: true });

    this.element.addEventListener('mouseleave', () => {
      this.mouseX = -1000;
    }, { passive: true });

    this.element.addEventListener('touchmove', (e) => {
      this.mouseX = e.touches[0].clientX - this.cachedDockLeft;
    }, { passive: true });

    this.element.addEventListener('touchend', () => {
      this.mouseX = -1000;
    }, { passive: true });
  }

  private startRenderLoop(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const loop = () => {
      if (!this.isAnimating) return;
      this.updateScales();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private updateScales(): void {
    if (this.mouseX === -1000) {
      for (let i = 0; i < this.items.length; i++) {
        this.items[i].style.transform = 'scale(1)';
      }
      return;
    }

    for (let i = 0; i < this.items.length; i++) {
      const itemCenter = this.cachedItemCenters[i];
      const distance = Math.abs(this.mouseX - itemCenter);
      
      const scale = Math.max(1, 1.4 - distance / 120);
      this.items[i].style.transform = `scale(${scale})`;
    }
  }

  public destroy(): void {
    this.isAnimating = false;
    window.removeEventListener('resize', () => this.cacheDimensions());
    super.destroy();
  }
}
