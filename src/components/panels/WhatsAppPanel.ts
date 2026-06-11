import { BasePanel } from '../../core/base-panel';

interface Conversation {
    phone_number: string;
    is_human_intervening: boolean;
    last_message: string;
    updated_at: string;
}

interface WhatsAppState extends PanelState {
    conversations: Conversation[];
    selectedChat: string | null;
}

export class WhatsAppPanel extends BasePanel<WhatsAppState> {
    constructor() {
        super('whatsapp', {
            conversations: [],
            selectedChat: null
        });
    }

    protected async loadInitialData(): Promise<void> {
        await this.refreshConversations();
    }

    async refreshConversations(): Promise<void> {
        const convs = await this.callApi<Conversation[]>('bot.list_conversations', {});
        if (convs) {
            this.setState({ conversations: convs });
        }
    }

    private async toggleHumanMode(phone: string, currentMode: boolean): Promise<void> {
        const command = currentMode ? 'bot.set_bot_mode' : 'bot.set_human_mode';
        const res = await this.callApi('bot.set_human_mode', { phone }); 
        
        if (res) {
            await this.refreshConversations();
        }
    }

    protected renderContent(): HTMLElement {
        return this.h('div', { className: 'whatsapp-container' }, [
            this.h('div', { className: 'chat-list' }, [
                this.h('div', { className: 'list-header' }, ['Conversaciones Activas']),
                ...this.state.conversations.map(c => this.createChatItem(c))
            ]),
            this.h('div', { className: 'chat-detail' }, [
                this.state.selectedChat 
                    ? this.renderChatDetails(this.state.selectedChat) 
                    : this.h('div', { className: 'empty-state' }, ['Selecciona un chat para gestionar'])
            ])
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
                this.h('div', { className: 'chat-last-msg' }, [c.last_message || 'Sin mensajes'])
            ]),
            this.h('div', { className: 'chat-status' }, [
                c.is_human_intervening ? '👤 Humano' : '🤖 Bot'
            ])
        ]);
    }

    private renderChatDetails(phone: string): HTMLElement {
        const conv = this.state.conversations.find(c => c.phone_number === phone);
        if (!conv) return this.h('div', {}, ['Error: Chat no encontrado']);

        return this.h('div', { className: 'details-container' }, [
            this.h('div', { className: 'details-header' }, [
                this.h('h3', {}, [phone]),
                this.h('button', { 
                    className: `btn-glass ${conv.is_human_intervening ? 'btn-active' : ''}`,
                    onclick: () => this.toggleHumanMode(phone, conv.is_human_intervening)
                }, [conv.is_human_intervening ? 'Pasar a Bot' : 'Intervención Humana'])
            ]),
            this.h('div', { className: 'details-body' }, [
                this.h('p', {}, ['Historial de mensajes y estado del bot en tiempo real...']),
                this.h('div', { className: 'status-badge' }, [
                    conv.is_human_intervening ? 'Intervenido por agente' : 'Gestionado por BotEngine'
                ])
            ])
        ]);
    }
}
