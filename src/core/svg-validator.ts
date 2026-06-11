/**
 * SVGValidator: Guardián de la Norma SVG.
 * Asegura que los SVGs no comprometan el rendimiento ni la estabilidad.
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class SVGValidator {
  private static readonly MAX_NODES = 200; // Límite para evitar congelar CPUs débiles
  private static readonly REQUIRED_VIEWBOX = '0 0 24 24';

  public static validate(path: string): ValidationResult {
    // 1. Verificación de longitud básica (Anti-Payloads masivos)
    if (path.length > 5000) {
      return { isValid: false, error: 'SVG path is too long. Potential performance risk.' };
    }

    // 2. Detección de etiquetas prohibidas (Filtros pesados, foreignObjects, y la etiqueta <svg> misma)
    const forbiddenTerms = ['<svg', '<filter', '<foreignObject', 'url(#', 'linearGradient'];
    for (const term of forbiddenTerms) {
      if (path.includes(term)) {
        return { isValid: false, error: `Forbidden element detected: ${term}. Only raw path data is allowed.` };
      }
    }

    // 3. Verificación de complejidad (Conteo de comandos de dibujo)
    // Contamos cuántas veces aparecen letras de comando (M, L, H, V, C, S, Q, T, A, Z)
    const nodeCount = (path.match(/[MLHVCSQTAZ]/gi) || []).length;
    if (nodeCount > this.MAX_NODES) {
      return { isValid: false, error: `Too many nodes (${nodeCount}). Limit is ${this.MAX_NODES}.` };
    }

    return { isValid: true };
  }
}
