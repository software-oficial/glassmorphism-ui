import { store } from './store';

export abstract class BasePanel {
  protected container: HTMLElement;
  protected id: string;
  private unsubscribeFunctions: Array<() => void> = [];

  constructor(id: string) {
    this.id = id;
    this.container = this.createContainer();
  }

  private createContainer(): HTMLElement {
    const el = document.createElement('div');
    el.id = `panel-${this.id}`;
    el.className = 'glass-panel';
    // El estilo base se maneja vía CSS para optimizar la GPU
    return el;
  }

  /**
   * Método para suscribirse al store de forma segura.
   * Al destruir el panel, todas las suscripciones se limpian automáticamente para evitar memory leaks.
   */
  protected subscribeToStore<K extends keyof any>(
    slice: K, 
    listener: (state: any) => void
  ): void {
    const unsubscribe = store.subscribe(slice, listener);
    this.unsubscribeFunctions.push(unsubscribe);
  }

  /**
   * Renderiza el contenido del panel. Debe ser implementado por cada panel específico.
   */
  public abstract render(): void;

  /**
   * Retorna el elemento DOM del panel para ser montado.
   */
  public get element(): HTMLElement {
    return this.container;
  }

  /**
   * Limpia todos los recursos, suscripciones y referencias al panel.
   * Crítico para dispositivos con 50MB de RAM.
   */
  public destroy(): void {
    console.log(`[PanelManager] Destroying panel ${this.id} and cleaning memory...`);
    this.unsubscribeFunctions.forEach(unsub => unsub());
    this.unsubscribeFunctions = [];
    this.container.remove();
  }
}
