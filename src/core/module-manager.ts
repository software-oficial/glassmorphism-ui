import { BasePanel } from './base-panel';

export class ModuleManager {
    private modules: Map<string, BasePanel> = new Map();
    private activeModuleId: string | null = null;
    private container: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    public registerModule(module: BasePanel): void {
        const moduleId = (module as any).panelId || module.constructor.name;
        console.log(`[ModuleManager] Registering module: ${moduleId}`);
        this.modules.set(moduleId, module);
        module.mount(this.container);
    }

    public async switchModule(moduleId: string): Promise<void> {
        console.log(`[ModuleManager] Attempting to switch to module: ${moduleId}`);
        if (this.activeModuleId === moduleId) return;

        if (this.activeModuleId) {
            const current = this.modules.get(this.activeModuleId);
            if (current) current.close();
        }

        const module = this.modules.get(moduleId);
        if (!module) {
            console.error(`[ModuleManager] ERROR: Module ${moduleId} not registered. Available:`, Array.from(this.modules.keys()));
            return;
        }

        this.activeModuleId = moduleId;
        console.log(`[ModuleManager] Activating module: ${moduleId}...`);
        await module.open();
        console.log(`[ModuleManager] Module ${moduleId} is now active.`);
    }

    public getActiveModuleId(): string | null {
        return this.activeModuleId;
    }

    public closeAll(): void {
        this.modules.forEach(module => module.close());
        this.activeModuleId = null;
    }
}
