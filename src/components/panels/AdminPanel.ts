import { BasePanel } from '../../core/base-panel';

interface TenantInfo {
    id: string;
    business_name: string;
    plan_name: string;
    status: 'active' | 'blocked' | 'suspended' | 'deleted';
    plan_id?: number;
}

interface SaaSState extends PanelState {
    tenants: TenantInfo[];
    selectedTenant: TenantInfo | null;
}

export class AdminPanel extends BasePanel<SaaSState> {
    constructor() {
        super('saas', {
            tenants: [],
            selectedTenant: null
        });
    }

    protected async loadInitialData(): Promise<void> {
        await this.loadTenants();
    }

    private async loadTenants(): Promise<void> {
        const tenants = await this.callApi<TenantInfo[]>('saas.list_tenants', {});
        if (tenants) {
            this.setState({ tenants });
        }
    }

    protected renderContent(): HTMLElement {
        return this.h('div', { className: 'saas-container' }, [
            this.h('div', { className: 'saas-header' }, [
                this.h('h2', {}, ['Gestión de Clientes SaaS']),
                this.h('span', { 
                    className: `status-badge ${this.state.tenants.length > 0 ? 'online' : 'empty'}` 
                }, [`${this.state.tenants.length} Clientes`])
            ]),
            this.renderTenantList()
        ]);
    }

    private renderTenantList(): HTMLElement {
        if (this.state.tenants.length === 0) {
            return this.h('div', { className: 'empty-state' }, ['No hay clientes registrados.']);
        }

        return this.h('div', { className: 'tenant-list' }, [
            ...this.state.tenants.map(t => this.createTenantRow(t))
        ]);
    }

    private createTenantRow(t: TenantInfo): HTMLElement {
        const statusClass = t.status === 'active' ? 'status-active' : 'status-danger';
        
        return this.h('div', { 
            className: 'tenant-row',
            onclick: () => this.viewTenantDetails(t)
        }, [
            this.h('div', { className: 'tenant-main' }, [
                this.h('div', { className: 'tenant-avatar' }, [t.business_name.charAt(0).toUpperCase()]),
                this.h('div', { className: 'tenant-details' }, [
                    this.h('span', { className: 'tenant-name' }, [t.business_name]),
                    this.h('span', { className: 'tenant-plan' }, [t.plan_name || 'Plan Free'])
                ])
            ]),
            this.h('div', { className: 'tenant-status-zone' }, [
                this.h('span', { className: `status-dot ${statusClass}` }, []),
                this.h('button', { 
                    className: 'btn-status-toggle',
                    onclick: (e) => {
                        e.stopPropagation();
                        this.toggleStatus(t);
                    }
                }, [t.status === 'active' ? 'Bloquear' : 'Activar'])
            ])
        ]);
    }

    private async toggleStatus(t: TenantInfo) {
        const newStatus = t.status === 'active' ? 'blocked' : 'active';
        const res = await this.callApi('saas.set_status', { 
            tenant_id: t.id, 
            status: newStatus 
        });
        
        if (res) {
            await this.loadTenants();
        }
    }

    private async viewTenantDetails(t: TenantInfo) {
        const billing = await this.callApi('saas.billing_status', { tenant_id: t.id });
        if (billing) {
            alert(`Cliente: ${t.business_name}
Plan: ${billing.plan}
Precio: ${billing.price}
Estado: ${billing.status}`);
            // En el futuro, esto abrirá un modal detallado de facturación.
        }
    }
}
