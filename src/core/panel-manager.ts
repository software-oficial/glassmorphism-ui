import { BasePanel } from './base-panel';

export class PanelManager {
    private panels: Map<string, BasePanel> = new Map();
    private activePanelId: string | null = null;
    private container: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    /**
     * Registra un panel en el sistema para que pueda ser gestionado.
     */
    public registerPanel(panel: BasePanel): void {
        // Usamos el ID interno del panel en lugar del nombre de la clase para evitar problemas con la minificación
        const panelId = (panel as any).panelId || panel.constructor.name;
        this.panels.set(panelId, panel);
        // Montamos el panel en el DOM pero inicialmente oculto (manejado por BasePanel)
        panel.mount(this.container);
    }

    /**
     * Abre un panel y lo pone al frente (enfocado).
     */
    public async openPanel(panelId: string): Promise<void> {
        const panel = this.panels.get(panelId);
        if (!panel) {
            console.error(`[PanelManager] Panel ${panelId} not registered.`);
            return;
        }

        // 1. Desenfocar paneles actuales
        this.updateZIndices();

        // 2. Abrir el panel solicitado
        this.activePanelId = panelId;
        await panel.open();
        
        // 3. Forzar el enfoque visual (estilo macOS)
        this.updateZIndices();
    }

    public closeAll(): void {
        this.panels.forEach(panel => panel.close());
        this.activePanelId = null;
    }

    private updateZIndices(): void {
        this.panels.forEach((panel, id) => {
            const el = panel.domElement;
            if (id === this.activePanelId) {
                el.style.zIndex = '1000';
                el.classList.add('panel-focused');
            } else {
                el.style.zIndex = '1';
                el.classList.remove('panel-focused');
            }
        });
    }
}
