import { UIComponent } from './component';
import { api, ApiResponse } from './api-client';

export interface PanelState {
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
    data: any;
}

export abstract class BasePanel extends UIComponent<PanelState> {
    protected panelId: string;
    protected wrapperElement!: HTMLElement;
    protected contentElement!: HTMLElement;
    protected errorElement!: HTMLElement;
    protected loaderElement!: HTMLElement;

    constructor(id: string, initialState: Partial<PanelState> = {}) {
        super({
            isOpen: false,
            isLoading: false,
            error: null,
            data: null,
            ...initialState
        });
        this.panelId = id;
    }

    private initElements(): void {
        if (this.wrapperElement) return;

        this.wrapperElement = this.h('div', { 
            className: 'module-view',
            style: 'display: none'
        }, []);
        
        this.loaderElement = this.h('div', { className: 'loader' }, ['Cargando...']);
        this.errorElement = this.h('div', { className: 'module-error' }, []);
        this.contentElement = this.h('div', { className: 'module-content' }, []);

        this.wrapperElement.appendChild(this.loaderElement);
        this.wrapperElement.appendChild(this.contentElement);
        this.wrapperElement.appendChild(this.errorElement);
    }

    public async open(): Promise<void> {
        console.log(`[BasePanel] Opening panel: ${this.panelId}`);
        this.setState({ isOpen: true, isLoading: true, error: null });
        
        try {
            await this.loadInitialData();
            console.log(`[BasePanel] ${this.panelId} loaded successfully.`);
        } catch (e: any) {
            console.error(`[BasePanel] Error loading ${this.panelId}:`, e);
            this.setState({ error: e.message, isLoading: false });
        }
    }

    public close(): void {
        this.setState({ isOpen: false });
    }

    protected abstract loadInitialData(): Promise<void>;

    protected async callApi<T>(command: string, params: any = {}, retries: number = 2): Promise<T | null> {
        console.log(`[BasePanel] Calling API command: ${command} for panel ${this.panelId} (Retries left: ${retries})`);
        this.setState({ isLoading: true });
        
        try {
            const res = await api.executeCommand<T>(command, params);
            console.log(`[BasePanel] API response for ${command}:`, res);
            if (!res.success) {
                throw new Error(res.message);
            }
            this.setState({ isLoading: false });
            return res.data;
        } catch (e: any) {
            console.error(`[BasePanel] API Error in ${command}:`, e);
            
            if (retries > 0) {
                console.log(`[BasePanel] Retrying ${command}...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1s antes de reintentar
                return this.callApi(command, params, retries - 1);
            }

            this.setState({ error: e.message, isLoading: false });
            return null;
        }
    }

    protected render(): void {
        if (!this.wrapperElement) return;

        this.wrapperElement.style.display = this.state.isOpen ? 'flex' : 'none';
        
        this.loaderElement.style.display = this.state.isLoading ? 'flex' : 'none';
        this.errorElement.style.display = this.state.error ? 'flex' : 'none';
        if (this.state.error) {
            this.errorElement.textContent = this.state.error;
        }
        
        this.contentElement.style.display = (this.state.isLoading || this.state.error) ? 'none' : 'block';
        
        if (!this.state.isLoading && !this.state.error) {
            const newContent = this.renderContent();
            if (this.contentElement.firstChild !== newContent) {
                this.contentElement.innerHTML = '';
                this.contentElement.appendChild(newContent);
            }
        }
    }

    protected abstract renderContent(): HTMLElement;

    protected createElement(): HTMLElement {
        this.initElements();
        return this.wrapperElement;
    }
}
