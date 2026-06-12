import { BasePanel } from '../../core/base-panel';

interface PaymentLink {
    id: string;
    amount: number;
    status: string;
    origin_entity: string;
    created_at: string;
}

interface GatewayConfig {
    name: string;
    api_key: string;
    active: boolean;
}

interface PaymentState extends PanelState {
    links: PaymentLink[];
    gateways: GatewayConfig[];
    isGenerating: boolean;
}

export class PaymentPanel extends BasePanel<PaymentState> {
    constructor() {
        super('payments', {
            links: [],
            gateways: [],
            isGenerating: false
        });
    }

    protected async loadInitialData(): Promise<void> {
        await this.refreshLinks();
    }

    async refreshLinks(): Promise<void> {
        // Usamos el comando de status para listar links (simplificación)
        // En una versión real, habría un 'payments.list'
        const links = await this.callApi<PaymentLink[]>('payments.status', { list_all: true });
        if (links) this.setState({ links });
    }

    private async generateQuickLink(amount: number, origin: string) {
        this.setState({ isGenerating: true });
        const res = await this.callApi('payments.generate_link', { 
            amount, 
            origin 
        });
        
        if (res) {
            alert(`Link generado: ${res.url}
Origen: ${origin}`);
        }
        this.setState({ isGenerating: false });
        await this.refreshLinks();
    }

    protected renderContent(): HTMLElement {
        return this.h('div', { className: 'payments-container' }, [
            this.h('div', { className: 'payments-header' }, [
                this.h('h2', {}, ['Centro de Pagos']),
                this.h('div', { className: 'quick-actions' }, [
                    this.h('button', { 
                        className: 'btn-glass btn-active', 
                        onclick: () => this.generateQuickLink(10, 'manual') 
                    }, ['+ Link Rápido ($10)'])
                ])
            ]),
            this.renderPaymentList()
        ]);
    }

    private renderPaymentList(): HTMLElement {
        if (this.state.links.length === 0) {
            return this.h('div', { className: 'empty-state' }, ['No hay transacciones recientes.']);
        }

        return this.h('div', { className: 'payment-list' }, [
            ...this.state.links.map(link => this.createPaymentRow(link))
        ]);
    }

    private createPaymentRow(link: PaymentLink): HTMLElement {
        const statusClass = link.status === 'paid' ? 'status-paid' : 'status-pending';
        
        return this.h('div', { className: 'payment-row' }, [
            this.h('div', { className: 'pay-info' }, [
                this.h('div', { className: 'pay-id' }, [`#${link.id.slice(-6)}`]),
                this.h('div', { className: 'pay-origin' }, [`Origen: ${link.origin_entity}`])
            ]),
            this.h('div', { className: 'pay-details' }, [
                this.h('span', { className: 'pay-amount' }, [`$${link.amount}`]),
                this.h('span', { className: `pay-status ${statusClass}` }, [link.status])
            ])
        ]);
    }
}
