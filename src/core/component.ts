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
  protected h(tag: string, props: Record<string, any> = {}, children: (HTMLElement | string)[] = []): HTMLElement {
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
    children.forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else {
        el.appendChild(child);
      }
    });
    return el;
  }
}
