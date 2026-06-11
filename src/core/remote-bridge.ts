export class RemoteControlBridge {
  private static instance: RemoteControlBridge;

  private constructor() {
    this.initEventListener();
  }

  public static getInstance(): RemoteControlBridge {
    if (!RemoteControlBridge.instance) {
      RemoteControlBridge.instance = new RemoteControlBridge();
    }
    return RemoteControlBridge.instance;
  }

  private initEventListener(): void {
    // Escucha eventos personalizados del navegador que pueden ser disparados por el CLI o Scripts
    window.addEventListener('system-command', async (event: any) => {
      const { command, payload } = event.detail;
      console.log(`📡 [RemoteControl] Executing external command: ${command}`);
      
      try {
        const result = await (window as any).dispatcher.execute(command, payload);
        // Respondemos al evento con el resultado
        window.dispatchEvent(new CustomEvent('system-command-response', {
          detail: { command, result, status: 'SUCCESS' }
        }));
      } catch (error) {
        window.dispatchEvent(new CustomEvent('system-command-response', {
          detail: { command, error, status: 'FAILURE' }
        }));
      }
    });
  }

  /**
   * Método para ejecutar un comando programáticamente desde la consola del navegador
   * o desde un script de automatización.
   */
  public async sendCommand(command: string, payload?: any): Promise<any> {
    return await (window as any).dispatcher.execute(command, payload);
  }
}

export const remoteControlBridge = RemoteControlBridge.getInstance();
