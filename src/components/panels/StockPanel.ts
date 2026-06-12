import { BasePanel } from '../../core/base-panel';

interface StockProduct {
    codigo: string;
    nombre: string;
    precio: number;
    cantidad: number;
    categoria: string;
}

interface AuditLog {
    user_id: string;
    command: string;
    status: string;
    created_at: string;
}

interface BusinessState extends PanelState {
    activeTab: 'stock' | 'sales' | 'team';
    products: StockProduct[];
    logs: AuditLog[];
    salesSummary: { total: number; count: number } | null;
}

export class StockPanel extends BasePanel<BusinessState> {
    constructor() {
        super('stock', {
            activeTab: 'stock',
            products: [],
            logs: [],
            salesSummary: null
        });
    }

    protected async loadInitialData(): Promise<void> {
        await this.refreshCurrentTab();
    }

    private async refreshCurrentTab(): Promise<void> {
        if (this.state.activeTab === 'stock') {
            const products = await this.callApi<StockProduct[]>('stock.list', {});
            if (products) this.setState({ products });
        } else if (this.state.activeTab === 'team') {
            const logs = await this.callApi<AuditLog[]>('audit.employee_activity', {});
            if (logs) this.setState({ logs });
        }
        // El resumen de ventas se carga siempre al inicio
        this.loadSalesSummary();
    }

    private async loadSalesSummary(): Promise<void> {
        // Simulamos un resumen rápido ya que no hay comando 'sales.summary' aún
        this.setState({ salesSummary: { total: 1250.50, count: 14 } });
    }

    private async switchTab(tab: 'stock' | 'sales' | 'team'): Promise<void> {
        this.setState({ activeTab: tab });
        await this.refreshCurrentTab();
    }

    protected renderContent(): HTMLElement {
        return this.h('div', { className: 'business-container' }, [
            // Header de Resumen Rápido
            this.renderQuickSummary(),
            
            // Navegación de Pestañas (Mobile Friendly)
            this.renderTabNavigation(),
            
            // Contenido Dinámico
            this.renderActiveTabContent()
        ]);
    }

    private renderQuickSummary(): HTMLElement {
        const { salesSummary } = this.state;
        return this.h('div', { className: 'business-summary' }, [
            this.h('div', { className: 'summary-item' }, [
                this.h('span', { className: 'summary-label' }, ['Ventas Hoy']),
                this.h('span', { className: 'summary-value' }, [`$${salesSummary?.total || 0}`])
            ]),
            this.h('div', { className: 'summary-item' }, [
                this.h('span', { className: 'summary-label' }, ['Pedidos']),
                this.h('span', { className: 'summary-value' }, [`${salesSummary?.count || 0}`])
            ])
        ]);
    }

    private renderTabNavigation(): HTMLElement {
        const tabs: Array<{ id: string, label: string }> = [
            { id: 'stock', label: '📦 Stock' },
            { id: 'sales', label: '💰 Ventas' },
            { id: 'team', label: '👥 Equipo' },
        ];

        return this.h('div', { className: 'tab-nav' }, [
            ...tabs.map(tab => this.h('button', { 
                className: `tab-btn ${this.state.activeTab === tab.id ? 'active' : ''}`,
                onclick: () => this.switchTab(tab.id as any)
            }, [tab.label]))
        ]);
    }

    private renderActiveTabContent(): HTMLElement {
        switch (this.state.activeTab) {
            case 'stock': return this.renderStockView();
            case 'sales': return this.renderSalesView();
            case 'team': return this.renderTeamView();
            default: return this.h('div', {}, ['Vista no disponible']);
        }
    }

    private renderStockView(): HTMLElement {
        return this.h('div', { className: 'view-content' }, [
            this.h('div', { className: 'view-header' }, [
                this.h('h3', {}, ['Inventario']),
                this.h('button', { className: 'btn-glass', onclick: () => alert('Agregar Producto') }, ['+'])
            ]),
            this.h('div', { className: 'stock-list' }, [
                ...this.state.products.map(p => this.createProductRow(p))
            ])
        ]);
    }

    private renderSalesView(): HTMLElement {
        return this.h('div', { className: 'view-content' }, [
            this.h('div', { className: 'view-header' }, [
                this.h('h3', {}, ['Historial de Ventas'])
            ]),
            this.h('div', { className: 'sales-placeholder' }, [
                'Cargando historial de transacciones...'
            ])
        ]);
    }

    private renderTeamView(): HTMLElement {
        return this.h('div', { className: 'view-content' }, [
            this.h('div', { className: 'view-header' }, [
                this.h('h3', {}, ['Actividad del Equipo'])
            ]),
            this.h('div', { className: 'audit-list' }, [
                ...this.state.logs.map(log => this.createLogRow(log))
            ])
        ]);
    }

    private createProductRow(p: StockProduct): HTMLElement {
        return this.h('div', { className: 'product-row' }, [
            this.h('div', { className: 'prod-info' }, [
                this.h('strong', {}, [p.nombre]),
                this.h('span', { className: 'prod-code' }, [`${p.codigo}`])
            ]),
            this.h('div', { className: 'prod-details' }, [
                this.h('span', {}, [`$${p.precio}`]),
                this.h('span', { 
                    className: p.cantidad < 5 ? 'stock-low' : '',
                }, [`Stock: ${p.cantidad}`])
            ])
        ]);
    }

    private createLogRow(log: AuditLog): HTMLElement {
        return this.h('div', { className: 'log-row' }, [
            this.h('div', { className: 'log-main' }, [
                this.h('span', { className: 'log-user' }, [log.user_id]),
                this.h('span', { className: 'log-cmd' }, [log.command])
            ]),
            this.h('span', { className: 'log-status' }, [log.status])
        ]);
    }
}
