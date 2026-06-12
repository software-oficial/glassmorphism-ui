import { Dock } from './components/dock/Dock';
import { ModuleManager } from './core/module-manager';
import { StockPanel } from './components/panels/StockPanel';
import { WhatsAppPanel } from './components/panels/WhatsAppPanel';
import { PaymentPanel } from './components/panels/PaymentPanel';
import { AdminPanel } from './components/panels/AdminPanel';
import { UIComponent } from './core/component';
import { platformBridge } from './core/platform';
import { AuthPanel } from './components/auth/AuthPanel';
import { api } from './core/api-client';
import { store } from './core/store';
import { viewManager, ViewId } from './core/view-manager';

class MainViewComponent extends UIComponent<{ element: HTMLElement }> {
    protected createElement(): HTMLElement {
        return this.state.element;
    }
    protected render(): void {
        // No requiere renderizado interno ya que el elemento es el contenedor completo
    }
}

class App {
    private moduleManager: ModuleManager;
    private dock: Dock;
    private shell: HTMLElement;

    constructor() {
        console.log('[App] Constructor initialized');
        this.shell = this.createShell();
        // ASIGNACIÓN CRÍTICA: El viewManager debe conocer su contenedor antes de inicializar la app
        (viewManager as any).container = this.shell;
        console.log('[App] ViewManager container assigned');
        
        this.initializeApp();
        this.setupEventListeners();
    }

    private createShell(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'app-shell';
        document.body.appendChild(container);
        return container;
    }

    private setupEventListeners(): void {
        console.log('[App] Setting up event listeners...');
        window.addEventListener('auth-success', async () => {
            console.log('[App] EVENT RECEIVED: auth-success. Triggering showMainView...');
            await this.showMainView();
        });
    }

    private async initializeApp(): Promise<void> {
        const token = localStorage.getItem('auth_token');
        const user = localStorage.getItem('auth_user');

        if (token && user) {
            api.setToken(token);
            store.setState('user', JSON.parse(user));
            await this.showMainView();
        } else {
            this.showAuthView();
        }
    }

    private showAuthView(): void {
        const authPanel = new AuthPanel();
        viewManager.switchView('auth', authPanel);
    }

    private async showMainView(): Promise<void> {
        const tier = platformBridge.getPerformanceTier();
        document.body.dataset.tier = tier;
        if (tier === 'low') {
            document.body.classList.add('hp-mode');
        }

        const modulesContainer = document.createElement('div');
        modulesContainer.id = 'modules-layer';
        modulesContainer.className = 'modules-layer';
        modulesContainer.style.position = 'absolute';
        modulesContainer.style.top = '0';
        modulesContainer.style.left = '0';
        modulesContainer.style.width = '100%';
        modulesContainer.style.height = '100%';
        modulesContainer.style.zIndex = '10';

        // 1. INSTANCIAR MODULE MANAGER
        this.moduleManager = new ModuleManager(modulesContainer);
        
        // 2. REGISTRAR TODOS LOS MÓDULOS
        this.moduleManager.registerModule(new StockPanel('stock'));
        this.moduleManager.registerModule(new WhatsAppPanel('whatsapp'));
        this.moduleManager.registerModule(new PaymentPanel('payments'));
        this.moduleManager.registerModule(new AdminPanel('saas'));

        // 3. ACTIVAR MÓDULO INICIAL (BLOQUEANTE)
        // Esperamos a que el módulo inicial esté listo antes de seguir
        await this.moduleManager.switchModule('stock');

        // 4. CREAR EL DOCK (Sincronizado con el estado actual del ModuleManager)
        this.dock = new Dock(this.moduleManager, 'stock');

        const mainView = document.createElement('div');
        mainView.className = 'main-view';
        mainView.appendChild(modulesContainer);
        mainView.appendChild(this.dock.domElement);

        const mainComponent = new MainViewComponent({ element: mainView });
        await viewManager.switchView('main', mainComponent);

        try {
            const { svgAssetManager } = await import('./core/svg-asset-manager');
            await svgAssetManager.loadManifest();
            await svgAssetManager.injectSprites();
        } catch (e) {
            console.error('❌ UI assets fail:', e);
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const app = new App();
});
