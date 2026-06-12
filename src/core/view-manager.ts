import { UIComponent } from './component';

export type ViewId = 'auth' | 'main';

interface ViewConfig {
  component: UIComponent;
  id: ViewId;
}

class ViewManager {
  private currentView: ViewConfig | null = null;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Cambia la vista actual, destruyendo la anterior para liberar RAM.
   */
  public async switchView(id: ViewId, component: UIComponent): Promise<void> {
    if (this.currentView?.id === id) return;

    // 1. Destrucción agresiva de la vista anterior para liberar memoria (Crucial para <100MB RAM)
    if (this.currentView) {
      this.currentView.component.destroy();
      this.currentView = null;
      this.container.innerHTML = ''; 
    }

    // 2. Montaje de la nueva vista
    this.currentView = { id, component };
    component.mount(this.container);
    
    console.log(`🌐 [ViewManager] Switched to view: ${id}`);
  }

  public getCurrentViewId(): ViewId | null {
    return this.currentView?.id || null;
  }

  public destroyCurrentView(): void {
    if (this.currentView) {
      this.currentView.component.destroy();
      this.currentView = null;
      this.container.innerHTML = '';
    }
  }
}

// Inicializamos con el body por defecto, pero App.ts puede cambiarlo si es necesario.
export const viewManager = new ViewManager(document.body);
