import { BasePanel } from '../../core/base-panel';
import { dispatcher } from '../../core/dispatcher';

export class TerminalPanel extends BasePanel {
  private outputElement: HTMLElement;
  private inputElement: HTMLInputElement;

  public render(): void {
    this.container.innerHTML = `
      <div class="terminal-container" style="height: 100%; display: flex; flex-direction: column; background: rgba(0,0,0,0.8); color: #00ff00; font-family: monospace; padding: 1rem; border-radius: var(--radius-md); overflow: hidden;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #333; padding-bottom: 0.5rem;">
          <span style="font-size: 0.8rem;">ROOT@GLASS-SHELL:~#</span>
          <button id="close-term" class="btn-glass" style="padding: 2px 8px; font-size: 0.7rem;">✕</button>
        </div>
        <div id="term-output" style="flex-grow: 1; overflow-y: auto; margin-bottom: 1rem; font-size: 0.9rem; line-height: 1.4;">
          <div>Welcome to Glass Shell Terminal v1.0.0...</div>
          <div>Type 'help' to see available commands.</div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <span>></span>
          <input id="term-input" style="background: transparent; border: none; color: #00ff00; outline: none; flex-grow: 1; font-family: monospace;" autofocus />
        </div>
      </div>
    `;

    this.outputElement = this.container.querySelector('#term-output') as HTMLElement;
    this.inputElement = this.container.querySelector('#term-input') as HTMLInputElement;

    this.container.querySelector('#close-term')?.addEventListener('click', () => {
      dispatcher.execute('system.close-panel', this.id);
    });

    this.inputElement.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        const cmd = this.inputElement.value.trim();
        this.log(`root@glass-shell:~# ${cmd}`);
        this.inputElement.value = '';
        await this.handleCommand(cmd);
      }
    });
  }

  private async handleCommand(cmd: string) {
    if (cmd === 'help') {
      this.log('Available commands: help, clear, status, stress, theme');
    } else if (cmd === 'clear') {
      this.outputElement.innerHTML = '';
    } else if (cmd === 'status') {
      const metrics = await dispatcher.execute('system.metrics');
      this.log(`CPU Status: HEALTHY | FPS: ${metrics.fps} | RAM: ${metrics.ram}MB`);
    } else if (cmd === 'stress') {
      await dispatcher.execute('system.stress-test');
      this.log('Stress test initiated. Watch the FPS monitor!');
    } else if (cmd === 'theme') {
      await dispatcher.execute('system.toggle-theme');
      this.log('Theme toggled successfully.');
    } else if (cmd === '') {
      // No op
    } else {
      this.log(`Command not found: ${cmd}`);
    }
  }

  private log(msg: string) {
    const div = document.createElement('div');
    div.textContent = msg;
    this.outputElement.appendChild(div);
    this.outputElement.scrollTop = this.outputElement.scrollHeight;
  }
}
