import { UIComponent } from '../../core/component';
import { ToastNotification } from '../../core/toast-manager';
import { Icon } from '../icon/Icon';
import { svgAssetManager } from '../../core/svg-asset-manager';

export class Toast extends UIComponent<{ notification: ToastNotification }> {
  private timeoutId: any = null;

  constructor(notification: ToastNotification) {
    super({ notification });
    this.render(); // Force initial render
  }

  protected createElement(): HTMLElement {
    const div = document.createElement('div');
    div.className = `toast-item toast-${this.state.notification.type.toLowerCase()}`;
    return div;
  }

  protected render(): void {
    this.element.innerHTML = '';
    const { notification } = this.state;

    // 1. Icono según el tipo
    const iconId = this.getIconForType(notification.type);
    const icon = new Icon(iconId, { size: 20 });
    
    const iconContainer = document.createElement('div');
    iconContainer.className = 'toast-icon-container';
    icon.mount(iconContainer);

    // 2. Contenido
    const content = document.createElement('div');
    content.className = 'toast-content';
    content.textContent = notification.message;

    // 3. Barra de progreso (Solo si el hardware lo permite)
    const progress = document.createElement('div');
    progress.className = 'toast-progress';
    const config = svgAssetManager.getRenderConfig();
    if (config.quality === 'standard') {
      progress.style.display = 'none'; // Deshabilitar en hardware limitado
    }

    this.element.append(iconContainer, content, progress);
    
    // Iniciar animación de progreso
    this.animateProgress(notification.duration);
  }

  private getIconForType(type: ToastNotification['type']): string {
    switch (type) {
      case 'SUCCESS': return 'activity';
      case 'ERROR': return 'alert';
      case 'WARNING': return 'alert';
      default: return 'browser'; // Usaremos 'browser' como fallback genérico
    }
  }

  private animateProgress(duration: number): void {
    const progress = this.element.querySelector('.toast-progress') as HTMLElement;
    if (!progress) return;

    progress.style.transition = `width ${duration}ms linear`;
    // Forzar reflow
    void progress.offsetWidth; 
    progress.style.width = '0%';
  }

  public async dismiss(): Promise<void> {
    this.element.classList.add('toast-exit');
    
    return new Promise(resolve => {
      this.element.addEventListener('transitionend', () => {
        this.element.remove();
        resolve();
      }, { once: true });
      
      // Fallback por si la transición falla
      setTimeout(() => {
        this.element.remove();
        resolve();
      }, 500);
    });
  }
}
