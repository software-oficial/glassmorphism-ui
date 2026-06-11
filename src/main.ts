import { Dock } from './components/dock/Dock';
import { PanelManager } from './core/panel-manager';
import { StockPanel } from './components/panels/StockPanel';
import { WhatsAppPanel } from './components/panels/WhatsAppPanel';
import { PaymentPanel } from './components/panels/PaymentPanel';
import { AdminPanel } from './components/panels/AdminPanel';
import { UIComponent } from './core/component';
import { platformBridge } from './core/platform';

class App extends UIComponent {
    private panelManager: PanelManager;
    private dock: Dock;

    constructor() {
        super({});
        this.initializeApp();
    }

    private async initializeApp(): Promise<void> {
        await this.init();
        this.render();
    }

    private async init(): Promise<void> {
        // 0. Performance Tier Detection & Application
        const tier = platformBridge.getPerformanceTier();
        document.body.dataset.tier = tier;
        if (tier === 'low') {
            document.body.classList.add('hp-mode');
            console.log('🚀 Low-tier device detected: HP Mode activated.');
        }

        // 1. Create the panels layer INSIDE the app-shell
        const panelsContainer = document.createElement('div');
        panelsContainer.id = 'panels-layer';
        panelsContainer.style.position = 'absolute';
        panelsContainer.style.top = '0';
        panelsContainer.style.left = '0';
        panelsContainer.style.width = '100%';
        panelsContainer.style.height = '100%';
        panelsContainer.style.zIndex = '10';
        panelsContainer.style.pointerEvents = 'none';

        this.element.appendChild(panelsContainer);

        this.panelManager = new PanelManager(panelsContainer);

        this.panelManager.registerPanel(new StockPanel());
        this.panelManager.registerPanel(new WhatsAppPanel());
        this.panelManager.registerPanel(new PaymentPanel());
        this.panelManager.registerPanel(new AdminPanel());

        this.dock = new Dock(this.panelManager);
        this.element.appendChild(this.dock.domElement);

        try {
            const { svgAssetManager } = await import('./core/svg-asset-manager');
            await svgAssetManager.loadManifest();
            await svgAssetManager.injectSprites();
            console.log('🎨 UI assets initialized successfully.');
        } catch (e) {
            console.error('❌ Failed to initialize UI assets:', e);
        }

        // Launch default panel so the screen isn't empty
        await this.panelManager.openPanel('stock');
    }

    protected createElement(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'app-shell';
        return container;
    }

    protected render(): void {
        // In the new structure, init() handles the mounting
    }

    public mount(parent: HTMLElement): void {
        super.mount(parent);
        if (this.dock) {
            this.dock.render();
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.mount(document.body);
});

