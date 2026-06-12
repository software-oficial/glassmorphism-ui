import { UIComponent } from '../../core/component';
import { AppIcon } from './AppIcon';
import { ModuleManager } from '../../core/module-manager';
import { platformBridge } from '../../core/platform';

interface DockContext {
  activeModule: string | null;
  portalOpen: boolean;
}

export class Dock extends UIComponent<DockContext> {
  private portalElement!: HTMLElement;
  private toolsElement!: HTMLElement;
  private configElement!: HTMLElement;
  private moduleManager: ModuleManager;
  
  private readonly CONTEXT_MAP: Record<string, {
    icons: Array<{ id: string, icon: string, action: string }>,
    configAction: string
  }> = {
    'stock': {
      icons: [
        { id: 'add', icon: 'plus.svg', action: 'stock.add' },
        { id: 'import', icon: 'upload.svg', action: 'stock.import' },
        { id: 'alerts', icon: 'alert.svg', action: 'stock.alerts' },
        { id: 'list', icon: 'list.svg', action: 'stock.list' },
      ],
      configAction: 'stock.settings'
    },
    'whatsapp': {
      icons: [
        { id: 'chats', icon: 'message.svg', action: 'whatsapp.chats' },
        { id: 'bot', icon: 'cpu.svg', action: 'whatsapp.bot' },
        { id: 'vars', icon: 'settings.svg', action: 'whatsapp.vars' },
        { id: 'status', icon: 'activity.svg', action: 'whatsapp.status' },
      ],
      configAction: 'whatsapp.settings'
    },
    'payments': {
      icons: [
        { id: 'link', icon: 'link.svg', action: 'payments.link' },
        { id: 'qr', icon: 'qr.svg', action: 'payments.qr' },
        { id: 'history', icon: 'history.svg', action: 'payments.history' },
        { id: 'gateways', icon: 'credit-card.svg', action: 'payments.gateways' },
      ],
      configAction: 'payments.settings'
    },
    'saas': {
      icons: [
        { id: 'clients', icon: 'user.svg', action: 'saas.clients' },
        { id: 'plans', icon: 'package.svg', action: 'saas.plans' },
        { id: 'billing', icon: 'dollar.svg', action: 'saas.billing' },
        { id: 'support', icon: 'headphones.svg', action: 'saas.support' },
      ],
      configAction: 'saas.settings'
    }
  };

  constructor(moduleManager: ModuleManager, initialModule: string | null = null) {
    super({
      activeModule: initialModule,
      portalOpen: false
    });
    this.moduleManager = moduleManager;
  }

  protected createElement(): HTMLElement {
    const dock = document.createElement('div');
    dock.className = 'contextual-dock';
    
    this.portalElement = document.createElement('div');
    this.portalElement.className = 'dock-portal';
    this.portalElement.innerHTML = `
      <button class="portal-btn">
        <img src="/assets/icons/folder.svg" alt="Switch" />
      </button>
      <div class="portal-menu" style="display: none">
        <div class="portal-item" data-module="saas">SaaS Core</div>
        <div class="portal-item" data-module="stock">Business Hub</div>
        <div class="portal-item" data-module="whatsapp">WhatsApp Center</div>
        <div class="portal-item" data-module="payments">Payment Gateway</div>
      </div>
    `;

    this.toolsElement = document.createElement('div');
    this.toolsElement.className = 'dock-tools';

    this.configElement = document.createElement('div');
    this.configElement.className = 'dock-config';
    this.configElement.innerHTML = `
      <button class="config-btn">
        <img src="/assets/icons/settings.svg" alt="Settings" />
      </button>
    `;

    dock.appendChild(this.portalElement);
    dock.appendChild(this.toolsElement);
    dock.appendChild(this.configElement);
    
    return dock;
  }

  protected render(): void {
    this.setupPortalEvents();
    this.setupConfigEvents();
    this.updateTools();
  }

  private setupPortalEvents(): void {
    const btn = this.portalElement.querySelector('.portal-btn');
    const menu = this.portalElement.querySelector('.portal-menu');
    
    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setState({ portalOpen: !this.state.portalOpen });
    });

    this.portalElement.querySelectorAll('.portal-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        const moduleId = (item as HTMLElement).dataset.module;
        if (moduleId) {
          await this.moduleManager.switchModule(moduleId);
          this.setState({ 
            activeModule: moduleId, 
            portalOpen: false 
          });
        }
      });
    });
  }

  private setupConfigEvents(): void {
    this.configElement.querySelector('.config-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentModule = this.state.activeModule;
      if (currentModule && this.CONTEXT_MAP[currentModule]) {
        const action = this.CONTEXT_MAP[currentModule].configAction;
        console.log(`[Dock] Opening advanced config for ${currentModule}: ${action}`);
      }
    });
  }

  private updateTools(): void {
    this.toolsElement.innerHTML = '';
    const currentModule = this.state.activeModule;
    
    if (!currentModule || !this.CONTEXT_MAP[currentModule]) {
      this.toolsElement.innerHTML = '<span class="dock-placeholder">Seleccione un módulo</span>';
      return;
    }

    const config = this.CONTEXT_MAP[currentModule];
    config.icons.forEach(tool => {
      const icon = new AppIcon({ 
        appId: tool.id, 
        iconType: tool.icon, 
        active: false 
      });
      
      icon.domElement.onclick = (e) => {
        e.stopPropagation();
        console.log(`[Dock] Tool Action: ${tool.action}`);
      };

      icon.mount(this.toolsElement);
    });
  }

  public setState(newState: Partial<DockContext>): void {
    super.setState(newState);
    
    // SAFE ACCESS: Validamos que los elementos existan antes de manipularlos
    if (!this.portalElement || !this.toolsElement) return;

    const menu = this.portalElement.querySelector('.portal-menu');
    if (menu) {
      menu.style.display = this.state.portalOpen ? 'flex' : 'none';
    }

    if ('activeModule' in newState) {
      this.updateTools();
    }
  }

  public destroy(): void {
    super.destroy();
  }
}
