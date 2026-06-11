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
    protected wrapperElement: HTMLElement;
    protected contentElement: HTMLElement;
    protected headerElement: HTMLElement;
    protected errorElement: HTMLElement;
    protected loaderElement: HTMLElement;

    constructor(id: string, initialState: Partial<PanelState> = {}) {
        super({
            isOpen: false,
            isLoading: false,
            error: null,
            data: null,
            ...initialState
        });
        this.panelId = id;
        
        // Crear elementos persistentes para evitar innerHTML
        this.wrapperElement = this.h('div', { 
            className: 'glass-panel',
            style: 'display: none'
        }, []);
        
        this.headerElement = this.h('div', { className: 'panel-header' }, [
            this.h('span', { className: 'panel-title' }, [(this.panelId || 'Panel').toUpperCase()]),
            this.h('button', { 
                className: 'btn-close', 
                onclick: () => this.close() 
            }, ['✕'])
        ]);

        this.loaderElement = this.h('div', { className: 'loader' }, ['Cargando...']);
        this.errorElement = this.h('div', { className: 'panel-error' }, []);
        this.contentElement = this.h('div', { className: 'panel-content' }, []);

        this.wrapperElement.appendChild(this.headerElement);
        this.wrapperElement.appendChild(this.loaderElement);
        this.wrapperElement.appendChild(this.contentElement);
        this.wrapperElement.appendChild(this.errorElement);
    }

    public async open(): Promise<void> {
        this.setState({ isOpen: true, isLoading: true, error: null });
        
        try {
            await this.loadInitialData();
        } catch (e: any) {
            this.setState({ error: e.message, isLoading: false });
        }
    }

    public close(): void {
        this.setState({ isOpen: false });
    }

    protected abstract loadInitialData(): Promise<void>;

    protected async callApi<T>(command: string, params: any = {}): Promise<T | null> {
        console.log(`[Panel:${this.panelId}] Executing: ${command}`, params);
        this.setState({ isLoading: true });
        
        try {
            const res = await api.executeCommand<T>(command, params);
            if (!res.success) {
                throw new Error(res.message);
            }
            this.setState({ isLoading: false });
            return res.data;
        } catch (e: any) {
            console.error(`[Panel:${this.panelId}] API Error: ${e.message}`);
            this.setState({ error: e.message, isLoading: false });
            return null;
        }
    }

    /**
     * Implementación optimizada de render que solo actualiza lo necesario.
     */
    protected render(): void {
        // 1. Visibilidad
        this.wrapperElement.style.display = this.state.isOpen ? 'block' : 'none';
        
        // 2. Estados de enfoque (maneja el PanelManager, pero aseguramos la clase)
        if (this.state.isOpen) {
            this.wrapperElement.classList.add('panel-focused');
        } else {
            this.wrapperElement.classList.remove('panel-focused');
        }

        // 3. Cargando / Error / Contenido
        this.loaderElement.style.display = this.state.isLoading ? 'block' : 'none';
        this.errorElement.style.display = this.state.error ? 'block' : 'none';
        if (this.state.error) {
            this.errorElement.textContent = this.state.error;
        }
        
        this.contentElement.style.display = (this.state.isLoading || this.state.error) ? 'none' : 'block';
        
        // Solo actualizamos el contenido interno si no estamos cargando y no hay error
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
        return this.wrapperElement;
    }
}
