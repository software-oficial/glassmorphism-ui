import { BasePanel } from '../../core/base-panel';

interface Conversation {
    phone_number: string;
    is_human_intervening: boolean;
    last_message_at: string;
}

interface BotConfig {
    bot_name: string;
    welcome_message: string;
    active: boolean;
    variables: any;
}

interface WhatsAppState extends PanelState {
    conversations: Conversation[];
    selectedChat: string | null;
    botConfig: BotConfig | null;
    viewMode: 'chats' | 'config';
}

export class WhatsAppPanel extends BasePanel<WhatsAppState> {
    constructor() {
        super('whatsapp', {
            conversations: [],
            selectedChat: null,
            botConfig: null,
            viewMode: 'chats'
        });
    }

    protected async loadInitialData(): Promise<void> {
        await this.refreshData();
    }

    async refreshData(): Promise<void> {
        const [convs, config] = await Promise.all([
            this.callApi<Conversation[]>('whatsapp.list_chats', {}),
            this.callApi<BotConfig>('whatsapp.get_config', {})
        ]);
        
        if (convs) this.setState({ conversations: convs });
        if (config) this.setState({ botConfig: config });
    }

    private async toggleHumanMode(phone: string, currentMode: boolean): Promise<void> {
        const res = await this.callApi('whatsapp.set_human', { 
            phone, 
            active: !currentMode 
        });
        
        if (res) {
            await this.refreshData();
        }
    }

    private async updateBotConfig(config: Partial<BotConfig>) {
        const updated = { ...this.state.botConfig, ...config };
        const res = await this.callApi('whatsapp.update_config', { config: updated });
        if (res) {
            await this.refreshData();
        }
    }

    protected renderContent(): HTMLElement {
        return this.h('div', { className: 'whatsapp-container' }, [
            this.renderTabNavigation(),
            this.state.viewMode === 'chats' ? this.renderChatsView() : this.renderConfigView()
        ]);
    }

    private renderTabNavigation(): HTMLElement {
        return this.h('div', { className: 'tab-nav' }, [
            this.h('button', { 
                className: `tab-btn ${this.state.viewMode === 'chats' ? 'active' : ''}`,
                onclick: () => this.setState({ viewMode: 'chats' })
            }, ['💬 Chats']),
            this.h('button', { 
                className: `tab-btn ${this.state.viewMode === 'config' ? 'active' : ''}`,
                onclick: () => this.setState({ viewMode: 'config' })
            }, ['⚙️ Bot Config'])
        ]);
    }

    private renderChatsView(): HTMLElement {
        return this.h('div', { className: 'view-content' }, [
            this.h('div', { className: 'view-header' }, [
                this.h('h3', {}, ['Conversaciones Activas'])
            ]),
            this.h('div', { className: 'chat-list' }, [
                ...this.state.conversations.map(c => this.createChatItem(c))
            ]),
            this.state.selectedChat ? this.renderChatDetails(this.state.selectedChat) : null
        ]);
    }

    private createChatItem(c: Conversation): HTMLElement {
        return this.h('div', { 
            className: `chat-item ${this.state.selectedChat === c.phone_number ? 'active' : ''}`,
            onclick: () => this.setState({ selectedChat: c.phone_number })
        }, [
            this.h('div', { className: 'chat-avatar' }, [c.phone_number.slice(-4)]),
            this.h('div', { className: 'chat-info' }, [
                this.h('div', { className: 'chat-name' }, [c.phone_number]),
                this.h('div', { className: 'chat-last-msg' }, [`Último mensaje: ${c.last_message_at}`])
            ]),
            this.h('div', { className: 'chat-status' }, [
                c.is_human_intervening ? '👤 Humano' : '🤖 Bot'
            ])
        ]);
    }

    private renderChatDetails(phone: string): HTMLElement {
        const conv = this.state.conversations.find(c => c.phone_number === phone);
        if (!conv) return this.h('div', {}, ['Error: Chat no encontrado']);

        return this.h('div', { className: 'chat-detail-panel' }, [
            this.h('div', { className: 'details-header' }, [
                this.h('h3', {}, [phone]),
                this.h('button', { 
                    className: `btn-glass ${conv.is_human_intervening ? 'btn-active' : ''}`,
                    onclick: () => this.toggleHumanMode(phone, conv.is_human_intervening)
                }, [conv.is_human_intervening ? 'Pasar a Bot' : 'Intervención Humana'])
            ]),
            this.h('div', { className: 'details-body' }, [
                this.h('p', {}, ['Gestión de conversación en tiempo real...']),
                this.h('div', { className: 'status-badge' }, [
                    conv.is_human_intervening ? 'Intervenido por agente' : 'Gestionado por BotEngine'
                ])
            ])
        ]);
    }

    private renderConfigView(): HTMLElement {
        const config = this.state.botConfig;
        if (!config) return this.h('div', { className: 'empty-state' }, ['Cargando configuración...']);

        return this.h('div', { className: 'view-content' }, [
            this.h('div', { className: 'view-header' }, [
                this.h('h3', {}, ['Configuración del Bot'])
            ]),
            this.h('div', { className: 'config-form' }, [
                this.h('div', { className: 'form-group' }, [
                    this.h('label', {}, ['Nombre del Bot']),
                    this.h('input', { 
                        type: 'text', 
                        value: config.bot_name,
                        onchange: (e: any) => this.updateBotConfig({ bot_name: e.target.value })
                    })
                ]),
                this.h('div', { className: 'form-group' }, [
                    this.h('label', {}, ['Mensaje de Bienvenida']),
                    this.h('textarea', { 
                        value: config.welcome_message,
                        onchange: (e: any) => this.updateBotConfig({ welcome_message: e.target.value })
                    })
                ]),
                this.h('div', { className: 'form-group' }, [
                    this.h('label', {}, ['Estado del Bot']),
                    this.h('button', { 
                        className: `btn-glass ${config.active ? 'btn-active' : ''}`,
                        onclick: () => this.updateBotConfig({ active: !config.active })
                    }, [config.active ? 'Desactivar Bot' : 'Activar Bot'])
                ])
            ])
        ]);
    }
}
