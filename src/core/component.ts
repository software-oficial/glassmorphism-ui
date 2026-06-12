export abstract class UIComponent<TState = any> {
  protected element: HTMLElement;
  protected state: TState;

  constructor(initialState: TState) {
    this.state = initialState;
    this.element = this.createElement();
    this.render(); // Se llama una sola vez al inicio
  }

  protected abstract createElement(): HTMLElement;
  
  /**
   * Construye la estructura inicial del componente. 
   * DEBE llamarse una sola vez. No debe usar innerHTML = '' si se desea mantener el foco.
   */
  protected abstract render(): void;

  /**
   * Método opcional para actualizar partes específicas del DOM cuando el estado cambia.
   * Evita la reconstrucción total del componente.
   */
  protected update(): void {
    // Implementación opcional en las subclases
  }

  public setState(newState: Partial<TState>): void {
    const hasChanged = Object.entries(newState).some(
      ([key, value]) => this.state[key] !== value
    );

    if (hasChanged) {
      this.state = { ...this.state, ...newState };
      this.update(); // Actualización quirúrgica en lugar de renderizado total
    }
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  public destroy(): void {
    this.element.remove();
    // Limpieza de referencias para ayudar al Garbage Collector
    (this.element as any) = null;
  }

  public get domElement(): HTMLElement {
    return this.element;
  }

  protected h(tag: string, props: Record<string, any> = {}, children: (HTMLElement | string | any[])[] = []): HTMLElement {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === 'className') el.className = value;
      else if (key === 'style' && typeof value === 'string') el.style.cssText = value;
      else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.toLowerCase().substring(2);
        el.addEventListener(eventName, value);
      } else {
        (el as any)[key] = value;
      }
    }
    
    const flattenChildren = (items: any[]): (HTMLElement | string)[] => {
      return items.reduce((acc, item) => {
        if (Array.isArray(item)) {
          acc.push(...flattenChildren(item));
        } else if (item === null || item === undefined) {
          // Skip
        } else {
          acc.push(item);
        }
        return acc;
      }, [] as (HTMLElement | string)[]);
    };

    flattenChildren(children).forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        el.appendChild(child);
      }
    });
    return el;
  }
}
