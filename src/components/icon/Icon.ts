import { svgAssetManager } from '../../core/svg-asset-manager';

export interface IconOptions {
  size?: number | string;
  className?: string;
}

export class Icon {
  private element: SVGElement;
  private options: IconOptions;

  constructor(private id: string, options: IconOptions = {}) {
    this.options = {
      size: 24,
      color: 'currentColor',
      ...options
    };

    this.element = this.createIconElement();
  }

  private createIconElement(): SVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const size = typeof this.options.size === 'number' ? `${this.options.size}px` : this.options.size;
    
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('style', `color: ${this.options.color};`);
    
    if (this.options.className) {
      svg.setAttribute('class', this.options.className);
    }

    // Aplicar clase de rendimiento según el hardware
    const config = svgAssetManager.getRenderConfig();
    svg.setAttribute('class', `${config.cssClass} ${this.options.className || ''}`);

    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#icon-${this.id}`);
    
    svg.appendChild(use);
    return svg;
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  public get element() {
    return this.element;
  }
}
