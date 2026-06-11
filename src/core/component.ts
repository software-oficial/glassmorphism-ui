export abstract class UIComponent<TState = any> {
  protected element: HTMLElement;
  protected state: TState;

  constructor(initialState: TState) {
    this.state = initialState;
    this.element = this.createElement();
    this.render();
  }

  protected abstract createElement(): HTMLElement;
  protected abstract render(): void;

  public setState(newState: Partial<TState>): void {
    const hasChanged = Object.entries(newState).some(
      ([key, value]) => this.state[key] !== value
    );

    if (hasChanged) {
      this.state = { ...this.state, ...newState };
      this.render();
    }
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  public destroy(): void {
    this.element.remove();
  }

  public get domElement(): HTMLElement {
    return this.element;
  }

  /**
   * Helper para crear elementos de forma segura evitando innerHTML
   */
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
          // Skip null/undefined children
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
      } else {
        console.warn(`[UIComponent] Invalid child type provided to h(): ${typeof child}`, child);
      }
    });
    return el;
  }
}
