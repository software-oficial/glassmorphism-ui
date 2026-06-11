import { BasePanel } from '../../core/base-panel';

interface StockProduct {
    codigo: string;
    nombre: string;
    precio: number;
    cantidad: number;
    categoria: string;
}

interface StockState extends PanelState {
    products: StockProduct[];
    searchQuery: string;
}

export class StockPanel extends BasePanel<StockState> {
    constructor() {
        super('stock', {
            products: [],
            searchQuery: ''
        });
    }

    protected async loadInitialData(): Promise<void> {
        const products = await this.callApi<StockProduct[]>('stock.list_products', {});
        if (products) {
            this.setState({ products, isLoading: false });
        }
    }

    private async handleSearch(query: string): Promise<void> {
        this.setState({ searchQuery: query });
        const products = await this.callApi<StockProduct[]>('stock.list_products', { 
            filter_text: query 
        });
        if (products) {
            this.setState({ products });
        }
    }

    protected renderContent(): HTMLElement {
        return this.h('div', { className: 'stock-container' }, [
            this.h('div', { className: 'stock-toolbar' }, [
                this.h('input', { 
                    type: 'text', 
                    placeholder: 'Buscar producto...', 
                    className: 'stock-search',
                    oninput: (e: any) => this.handleSearch(e.target.value)
                }),
                this.h('button', { 
                    className: 'btn-glass', 
                    onclick: () => this.openAddModal() 
                }, ['+ Agregar'])
            ]),
            this.h('div', { className: 'stock-grid' }, [
                ...this.state.products.map(p => this.createProductRow(p))
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
                    style: p.cantidad < 5 ? 'color: #ff4d4d; font-weight: bold;' : ''
                }, [`Stock: ${p.cantidad}`])
            ])
        ]);
    }

    private openAddModal() {
        // TODO: Implementar modal de agregar producto
        console.log("Abriendo modal de agregar producto...");
    }
}
