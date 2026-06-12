import { UIComponent } from '../../core/component';
import { api } from '../../core/api-client';
import { store } from '../../core/store';

interface AuthState {
  mode: 'login' | 'register';
  loading: boolean;
  error: string | null;
  formData: {
    username: string;
    password: string;
    business_name: string;
  };
}

export class AuthPanel extends UIComponent<AuthState> {
  constructor() {
    super({
      mode: 'login',
      loading: false,
      error: null,
      formData: {
        username: '',
        password: '',
        business_name: ''
      }
    });
  }

  protected createElement(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'auth-container';
    return div;
  }

  protected render(): void {
    this.element.innerHTML = '';
    
    const card = document.createElement('div');
    card.className = 'auth-card glass-panel';
    
    const title = document.createElement('h1');
    title.textContent = this.state.mode === 'login' ? 'Welcome Back' : 'Create Account';
    card.appendChild(title);

    const form = document.createElement('form');
    form.className = 'auth-form';
    form.onsubmit = (e) => {
      e.preventDefault();
      this.handleSubmit();
    };

    // Username field
    form.appendChild(this.createInput('username', 'Username', 'text'));
    
    // Business Name field (only for register)
    if (this.state.mode === 'register') {
      form.appendChild(this.createInput('business_name', 'Business Name', 'text'));
    }
    
    // Password field
    form.appendChild(this.createInput('password', 'Password', 'password'));

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn-glass btn-active';
    submitBtn.textContent = this.state.loading ? 'Processing...' : (this.state.mode === 'login' ? 'Sign In' : 'Register');
    submitBtn.disabled = this.state.loading;
    form.appendChild(submitBtn);

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn-glass toggle-auth';
    toggleBtn.textContent = this.state.mode === 'login' 
      ? "Don't have an account? Register" 
      : "Already have an account? Login";
    toggleBtn.onclick = () => this.setState({ 
      mode: this.state.mode === 'login' ? 'register' : 'login',
      error: null 
    });
    
    card.appendChild(form);
    card.appendChild(toggleBtn);

    if (this.state.error) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'auth-error';
      errorDiv.textContent = this.state.error;
      card.appendChild(errorDiv);
    }

    this.element.appendChild(card);
  }

  protected update(): void {
    this.render();
  }

private createInput(name: string, label: string, type: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'input-group';

  const lbl = document.createElement('label');
  lbl.textContent = label;

  const input = document.createElement('input');
  input.type = type;
  input.name = name;
  input.placeholder = `Enter ${label.toLowerCase()}...`;
  input.value = this.state.formData[name as keyof AuthState['formData']];

  // CORRECCIÓN: Actualizamos el estado directamente sin llamar a setState()
  // para evitar que UIComponent.setState() dispare render() y borre el foco.
  input.oninput = (e) => {
    const target = e.target as HTMLInputElement;
    this.state.formData[name as keyof AuthState['formData']] = target.value;
  };

  wrapper.appendChild(lbl);
  wrapper.appendChild(input);
  return wrapper;
}


  private async handleSubmit(): Promise<void> {
    console.log('AuthPanel: handleSubmit triggered', { mode: this.state.mode, formData: this.state.formData });
    this.setState({ loading: true, error: null });
    
    const { username, password, business_name } = this.state.formData;
    const endpoint = this.state.mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = this.state.mode === 'login' 
      ? { username, password, entity: 'WEB' } 
      : { username, password, business_name };

    console.log('AuthPanel: Sending request to', endpoint, 'with payload:', payload);

    try {
      const res = await api.post(endpoint, payload);
      console.log('AuthPanel: API Response:', res);

      if (res.success) {
        if (this.state.mode === 'login') {
          const token = res.data.token;
          api.setToken(token);
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user', JSON.stringify(res.data.user));

          store.setState('user', res.data.user);

          // Disparamos un evento personalizado para que App.ts sepa que debe cambiar de vista
          window.dispatchEvent(new CustomEvent('auth-success'));
        } else {
          this.setState({ 
            mode: 'login', 
            loading: false, 
            error: 'Account created! Please login.' 
          });
        }
      } else {
        console.error('AuthPanel: Login failed response:', res);
        this.setState({ 
          loading: false, 
          error: res?.message || `Error: ${JSON.stringify(res)}` 
        });
      }
    } catch (e) {
      console.error('AuthPanel: Unexpected error during handleSubmit:', e);
      this.setState({ loading: false, error: 'An unexpected error occurred' });
    }
  }
}
