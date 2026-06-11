import { SVGValidator } from './svg-validator';
import { platformBridge } from './platform';

export class SVGAssetManager {
  private static instance: SVGAssetManager;
  private cache: Map<string, string> = new Map();
  private manifest: Record<string, string> = {};

  private constructor() {}

  public static getInstance(): SVGAssetManager {
    if (!SVGAssetManager.instance) {
      SVGAssetManager.instance = new SVGAssetManager();
    }
    return SVGAssetManager.instance;
  }

  public getRenderConfig() {
    const tier = platformBridge.getPerformanceTier();
    return {
      cssClass: tier === 'low' ? 'svg-lite' : 'svg-full',
      useFilters: tier !== 'low',
      quality: tier === 'high' ? 'high' : 'standard'
    };
  }

  public async loadManifest(): Promise<void> {
    try {
      const response = await fetch('/assets/icons-manifest.json');
      this.manifest = await response.json();
      console.log('📚 [SVGAssetManager] Manifest loaded successfully.');
    } catch (error) {
      console.error('❌ [SVGAssetManager] Failed to load manifest:', error);
    }
  }

  public async injectSprites(): Promise<void> {
    const spriteContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    spriteContainer.setAttribute('style', 'display: none;');
    spriteContainer.setAttribute('id', 'system-sprite-sheet');

    // Cargamos y procesamos cada icono del manifiesto
    for (const [id, fileName] of Object.entries(this.manifest)) {
      const content = await this.getIcon(id);
      if (content) {
        const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
        symbol.setAttribute('id', `icon-${id}`);
        symbol.setAttribute('viewBox', '0 0 24 24');
        
        symbol.innerHTML = content;
        spriteContainer.appendChild(symbol);
      }
    }

    document.body.prepend(spriteContainer);
    console.log('✨ [SVGAssetManager] Sprite sheet injected into DOM.');
  }

  public async getIcon(id: string): Promise<string | null> {
    if (this.cache.has(id)) return this.cache.get(id)!;

    const fileName = this.manifest[id];
    if (!fileName) {
      console.warn(`⚠️ [SVGAssetManager] Icon ID '${id}' not found in manifest.`);
      return null;
    }

    try {
      const response = await fetch(`/assets/icons/${fileName}`);
      const svgContent = await response.text();
      
      // Extraer todo el contenido dentro de la etiqueta <svg>...</svg>
      const contentMatch = svgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
      if (!contentMatch) throw new Error('Invalid SVG format: No <svg> tag found');
      
      const innerSVG = contentMatch[1].trim();

      // Validar que el contenido no esté vacío
      if (!innerSVG) throw new Error('SVG content is empty');

      this.cache.set(id, innerSVG);
      return innerSVG;
    } catch (error) {
      console.error(`❌ [SVGAssetManager] Error loading icon '${id}':`, error);
      return null;
    }
  }
}

export const svgAssetManager = SVGAssetManager.getInstance();
