export type PlatformType = 'web' | 'android' | 'ios' | 'mac' | 'windows' | 'linux' | 'unknown';

export interface IPlatformBridge {
  getPlatform(): PlatformType;
  getPerformanceTier(): 'low' | 'medium' | 'high';
  getHardwareMetrics(): Promise<{ ram: number | null; cpu: number | null }>;
}

class WebPlatformBridge implements IPlatformBridge {
  public getPlatform(): PlatformType {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android')) return 'android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
    if (ua.includes('macintosh')) return 'mac';
    if (ua.includes('windows')) return 'windows';
    if (ua.includes('linux')) return 'linux';
    return 'web';
  }

  public getPerformanceTier(): 'low' | 'medium' | 'high' {
    // Lógica simple de detección de tier basada en hardware del navegador
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4; // GB
    
    if (cores <= 2 || memory <= 2) return 'low';
    if (cores <= 4 || memory <= 4) return 'medium';
    return 'high';
  }

  public async getHardwareMetrics(): Promise<{ ram: number | null; cpu: number | null }> {
    // En web, el acceso es limitado. Simulamos valores basados en el tier para feedback visual.
    const tier = this.getPerformanceTier();
    const ramMap = {
      'low': Math.floor(Math.random() * (128 - 64) + 64),    // 64MB - 128MB
      'medium': Math.floor(Math.random() * (4096 - 2048) + 2048), // 2GB - 4GB
      'high': Math.floor(Math.random() * (16384 - 8192) + 8192), // 8GB - 16GB
    };
    
    return { 
      ram: ramMap[tier], 
      cpu: Math.floor(Math.random() * 100) 
    };
  }
}

class NativePlatformBridge implements IPlatformBridge {
  public getPlatform(): PlatformType {
    // Esto será implementado cuando integremos Tauri/Capacitor
    return 'unknown';
  }

  public getPerformanceTier(): 'low' | 'medium' | 'high' {
    return 'high';
  }

  public async getHardwareMetrics(): Promise<{ ram: number | null; cpu: number | null }> {
    // Aquí llamaremos a las APIs nativas (Tauri/Capacitor)
    return { ram: null, cpu: null };
  }
}

export const platformBridge = new WebPlatformBridge();
// En el futuro, se puede cambiar el bridge basándose en la detección de entorno.
