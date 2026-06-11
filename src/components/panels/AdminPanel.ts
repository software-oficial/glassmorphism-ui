import { BasePanel } from '../../core/base-panel';

interface TenantInfo {
    id: string;
    name: string;
    plan: string;
    status: 'activo' | 'suspendido';
}

interface UserInfo {
    id: string;
    name: string;
    role: 'MASTER' | 'OWNER' | 'EMPLOYEE';
    permissions: string[];
}

interface AdminState extends PanelState {
    currentUser: UserInfo | null;
    tenants: TenantInfo[];
    employees: UserInfo[];
    viewMode: 'MASTER' | 'TENANT';
}

export class AdminPanel extends BasePanel<AdminState> {
    constructor() {
        super('admin', {
            currentUser: null,
            tenants: [],
            employees: [],
            viewMode: 'TENANT'
        });
    }

    protected async loadInitialData(): Promise<void> {
        const user = await this.callApi<UserInfo>('auth.get_current_user', {});
        if (user) {
            this.setState({ 
                currentUser: user,
                viewMode: user.role === 'MASTER' ? 'MASTER' : 'TENANT'
            });
        }

        if (this.state.viewMode === 'MASTER') {
            await this.loadMasterData();
        } else {
            await this.loadTenantData();
        }
    }

    private async loadMasterData(): Promise<void> {
        const tenants = await this.callApi<TenantInfo[]>('admin.list_all_tenants', {});
        if (tenants) {
            this.setState({ tenants });
        }
    }

    private async loadTenantData(): Promise<void> {
        const employees = await this.callApi<UserInfo[]>('admin.list_employees', {});
        if (employees) {
            this.setState({ employees });
        }
    }

    protected renderContent(): HTMLElement {
        const { viewMode, currentUser } = this.state;

        return this.h('div', { className: 'admin-container' }, [
            this.h('div', { className: 'admin-welcome' }, [
                this.h('h2', {}, [`Panel de Control ${viewMode}`]),
                this.h('span', { className: 'user-badge' }, [`Usuario: ${currentUser?.name || 'Desconocido'} (${currentUser?.role})`])
            ]),
            viewMode === 'MASTER' 
                ? this.renderMasterView() 
                : this.renderTenantView()
        ]);
    }

    private renderMasterView(): HTMLElement {
        return this.h('div', { className: 'master-view' }, [
            this.h('div', { className: 'view-section' }, [
                this.h('h3', {}, ['Gestión de Clientes (Tenants)']),
                this.h('div', { className: 'tenant-grid' }, [
                    ...this.state.tenants.map(t => this.createTenantCard(t))
                ])
            ]),
            this.h('button', { 
                className: 'btn-glass btn-active', 
                onclick: () => this.createTenant() 
            }, ['+ Crear Nuevo Cliente'])
        ]);
    }

    private renderTenantView(): HTMLElement {
        return this.h('div', { className: 'tenant-view' }, [
            this.h('div', { className: 'view-section' }, [
                this.h('h3', {}, ['Gestión de Equipo']),
                this.h('div', { className: 'employee-list' }, [
                    ...this.state.employees.map(e => this.createEmployeeRow(e))
                ])
            ]),
            this.h('button', { 
                className: 'btn-glass', 
                onclick: () => this.createEmployee() 
            }, ['+ Agregar Empleado'])
        ]);
    }

    private createTenantCard(t: TenantInfo): HTMLElement {
        return this.h('div', { className: 'tenant-card' }, [
            this.h('div', { className: 'tenant-info' }, [
                this.h('strong', {}, [t.name]),
                this.h('span', { className: 'tenant-plan' }, [t.plan])
            ]),
            this.h('div', { className: 'tenant-actions' }, [
                this.h('button', { 
                    className: 'btn-glass', 
                    onclick: () => this.toggleTenantStatus(t.id) 
                }, [t.status === 'activo' ? 'Suspender' : 'Activar'])
            ])
        ]);
    }

    private createEmployeeRow(e: UserInfo): HTMLElement {
        return this.h('div', { className: 'employee-row' }, [
            this.h('div', { className: 'emp-info' }, [
                this.h('span', {}, [e.name]),
                this.h('span', { className: 'emp-role' }, [e.role])
            ]),
            this.h('button', { 
                className: 'btn-glass', 
                onclick: () => this.removeEmployee(e.id) 
            }, ['Eliminar'])
        ]);
    }

    private async createTenant() {
        await this.callApi('admin.create_tenant', { name: 'Nuevo Cliente' });
        await this.loadMasterData();
    }

    private async toggleTenantStatus(id: string) {
        await this.callApi('admin.toggle_tenant_status', { tenant_id: id });
        await this.loadMasterData();
    }

    private async createEmployee() {
        await this.callApi('admin.create_employee', { name: 'Nuevo Empleado', role: 'EMPLOYEE' });
        await this.loadTenantData();
    }

    private async removeEmployee(id: string) {
        await this.callApi('admin.remove_employee', { user_id: id });
        await this.loadTenantData();
    }
}
