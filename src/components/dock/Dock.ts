import { UIComponent } from '../../core/component';
import { AppIcon } from './AppIcon';

interface DockState {
  apps: Array<{ id: string; type: string }>;
}

export class Dock extends UIComponent<DockState> {
  private items: HTMLElement[] = [];
  private mouseX = -1000;
  private isAnimating = false;
  
  // Caché de dimensiones para evitar Layout Thrashing
  private cachedDockLeft = 0;
  private cachedItemCenters: number[] = [];

  protected createElement(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'os-dock';
    return div;
  }

  protected render(): void {
    this.element.innerHTML = '';
    this.items = [];
    
    this.state.apps.forEach(app => {
      const icon = new AppIcon({ appId: app.id, iconType: app.type, active: false });
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
    // Actualizamos la caché si la ventana cambia de tamaño
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
