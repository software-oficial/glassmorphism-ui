import { UIComponent } from '../../core/component';
import { dispatcher } from '../../core/dispatcher';
import { Icon } from '../icon/Icon';

interface AppIconState {
  appId: string;
  iconType: string;
  active: boolean;
}

export class AppIcon extends UIComponent<AppIconState> {
  protected createElement(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'dock-item';
    return div;
  }

  protected render(): void {
    this.element.innerHTML = '';
    
    const icon = new Icon(this.state.iconType, {
      size: 32,
      className: 'dock-icon'
    });
    
    icon.mount(this.element);
    this.element.classList.toggle('active', this.state.active);
    
    this.element.onclick = async () => {
      if (this.state.appId === 'menu') {
        await dispatcher.execute('system.toggle-menu');
      } else {
        await dispatcher.execute('app.launch', this.state.appId);
      }
      this.setState({ active: !this.state.active });
    };
  }
}
