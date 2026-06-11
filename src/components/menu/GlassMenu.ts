import { UIComponent } from '../../core/component';
import { store } from '../../core/store';
import { dispatcher } from '../../core/dispatcher';
import { platformBridge } from '../../core/platform';
import { Icon } from '../icon/Icon';

interface MenuState {
  isOpen: boolean;
  platform: string;
}

export class GlassMenu extends UIComponent<MenuState> {
  constructor() {
    super({ 
      isOpen: store.getState('system').menuOpen,
      platform: platformBridge.getPlatform() 
    });

    // Suscribirse al estado del menú para reaccionar instantáneamente
    store.subscribe('system', (systemState) => {
      this.setState({ isOpen: systemState.menuOpen });
    });
  }

  protected createElement(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'glass-menu';
    return div;
  }

  protected render(): void {
    this.element.innerHTML = '';
    const { isOpen, platform } = this.state;

    if (!isOpen) {
      this.element.classList.add('menu-hidden');
      this.element.classList.remove('menu-visible');
      return;
    }

    this.element.classList.remove('menu-hidden');
    this.element.classList.add('menu-visible');

    // Determinar layout según plataforma
    const isMobile = ['android', 'ios'].includes(platform);
    this.element.className = `glass-menu ${isMobile ? 'menu-mobile' : 'menu-pc'}`;

    const grid = document.createElement('div');
    grid.className = 'menu-grid';

    // Definir aplicaciones disponibles en el menú
    const apps = [
      { id: 'browser', label: 'Navegador', icon: 'browser' },
      { id: 'terminal', label: 'Terminal', icon: 'terminal' },
      { id: 'settings', label: 'Ajustes', icon: 'settings' },
      { id: 'profile', label: 'Perfil', icon: 'user' },
      { id: 'files', label: 'Archivos', icon: 'folder' },
    ];

    apps.forEach(app => {
      const item = document.createElement('div');
      item.className = 'menu-item';
      
      const icon = new Icon(app.icon, { size: 32 });
      const label = document.createElement('span');
      label.textContent = app.label;
      label.className = 'menu-label';

      item.append(icon.element, label);
      
      item.onclick = async () => {
        await dispatcher.execute('system.open-panel', app.id);
      };

      grid.appendChild(item);
    });

    this.element.appendChild(grid);
  }
}
