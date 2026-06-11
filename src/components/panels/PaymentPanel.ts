import { BasePanel } from '../../core/base-panel';

interface Transaction {
    id: string;
    client: string;
    total: number;
    method: string;
    status: 'pendiente' | 'aprobado' | 'rechazado';
    created_at: string;
}

interface PaymentState extends PanelState {
    transactions: Transaction[];
    cashBoxOpen: boolean;
    cashBoxBalance: number;
}

export class PaymentPanel extends BasePanel<PaymentState> {
    constructor() {
        super('payments', {
            transactions: [],
            cashBoxOpen: false,
            cashBoxBalance: 0
        });
    }

    protected async loadInitialData(): Promise<void> {
        await this.refreshTransactions();
        await this.checkCashBox();
    }

    async refreshTransactions(): Promise<void> {
        const txs = await this.callApi<Transaction[]>('payments.list_transactions', {});
        if (txs) {
            this.setState({ transactions: txs });
        }
    }

    async checkCashBox(): Promise<void> {
        const state = await this.callApi<{ abierta: boolean, saldo: number }>('payments.get_cash_box_status', {});
        if (state) {
            this.setState({ 
                cashBoxOpen: state.abierta, 
                cashBoxBalance: state.saldo 
            });
        }
    }

    private async toggleCashBox(): Promise<void> {
        const command = this.state.cashBoxOpen ? 'payments.close_cash_box' : 'payments.open_cash_box';
        const res = await this.callApi(command, { 
            cash_box_id: 1, 
            monto_inicial: 0 
        });
        
        if (res) {
            await this.checkCashBox();
            await this.refreshTransactions();
        }
    }

    protected renderContent(): HTMLElement {
        return this.h('div', { className: 'payments-container' }, [
            this.h('div', { className: 'payments-header' }, [
                this.h('div', { className: 'cash-box-widget' }, [
                    this.h('span', { className: 'widget-label' }, ['Caja Diaria: ']),
                    this.h('span', { 
                        className: this.state.cashBoxOpen ? 'status-open' : 'status-closed',
                        style: `color: ${this.state.cashBoxOpen ? '#2ecc71' : '#e74c3c'}`
                    }, [this.state.cashBoxOpen ? 'ABIERTA' : 'CERRADA']),
                    this.h('button', { 
                        className: 'btn-glass', 
                        onclick: () => this.toggleCashBox() 
                    }, [this.state.cashBoxOpen ? 'Cerrar Caja' : 'Abrir Caja'])
                ]),
                this.h('div', { className: 'balance-widget' }, [
                    this.h('span', { className: 'widget-label' }, ['Balance: ']),
                    this.h('strong', { style: 'font-size: 1.2rem' }, [`$${this.state.cashBoxBalance}`])
                ])
            ]),
            this.h('div', { className: 'transactions-list' }, [
                this.h('div', { className: 'list-header' }, ['Transacciones Recientes']),
                ...this.state.transactions.map(tx => this.createTransactionRow(tx))
            ])
        ]);
    }

    private createTransactionRow(tx: Transaction): HTMLElement {
        return this.h('div', { className: 'tx-row' }, [
            this.h('div', { className: 'tx-info' }, [
                this.h('strong', {}, [tx.client]),
                this.h('span', { className: 'tx-method' }, [tx.method])
            ]),
            this.h('div', { className: 'tx-amount' }, [
                this.h('span', { style: 'font-weight: bold' }, [`$${tx.total}`])
            ]),
            this.h('div', { 
                className: `tx-status status-${tx.status}`,
                style: `background: ${this.getStatusColor(tx.status)}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;`
            }, [tx.status.toUpperCase()])
        ]);
    }

    private getStatusColor(status: string): string {
        switch(status) {
            case 'aprobado': return '#2ecc71';
            case 'pendiente': return '#f1c40f';
            case 'rechazado': return '#e74c3c';
            default: return '#95a5a6';
        }
    }
}
