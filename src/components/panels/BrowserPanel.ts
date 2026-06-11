import { BasePanel } from '../../core/base-panel';
import { dispatcher } from '../../core/dispatcher';

export class BrowserPanel extends BasePanel {
  public render(): void {
    this.container.innerHTML = `
      <div class="browser-container" style="height: 100%; display: flex; flex-direction: column; background: white; color: #333; border-radius: var(--radius-md); overflow: hidden;">
        <div class="browser-toolbar" style="background: #f1f3f4; padding: 8px; display: flex; gap: 10px; align-items: center; border-bottom: 1px solid #ccc;">
          <div style="display: flex; gap: 5px;">
            <div style="width: 12px; height: 12px; background: #ff5f56; border-radius: 50%;"></div>
            <div style="width: 12px; height: 12px; background: #ffbd2e; border-radius: 50%;"></div>
            <div style="width: 12px; height: 12px; background: #27c93f; border-radius: 50%;"></div>
          </div>
          <div style="flex-grow: 1; background: white; border: 1px solid #ddd; border-radius: 20px; padding: 4px 15px; font-size: 0.8rem; color: #666; display: flex; align-items: center;">
            <span style="margin-right: 8px;">🔒</span> https://glassmorphism-shell.io/dashboard
          </div>
          <button id="close-browser" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;">✕</button>
        </div>
        <div class="browser-content" style="flex-grow: 1; padding: 2rem; overflow-y: auto; background: #fff; color: #333; font-family: sans-serif;">
          <h1 style="margin-bottom: 1rem;">Welcome to the Glass Browser</h1>
          <p style="color: #666; line-height: 1.6;">This is a simulated browser environment. You can integrate real iframes or API-driven content here.</p>
          <div style="margin-top: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="border: 1px solid #eee; padding: 1rem; border-radius: 12px; background: #fafafa;">
              <h3 style="margin-top: 0;">Network Status</h3>
              <p style="font-size: 0.9rem;">Latency: 24ms<br>Packet Loss: 0%</p>
            </div>
            <div style="border: 1px solid #eee; padding: 1rem; border-radius: 12px; background: #fafafa;">
              <h3 style="margin-top: 0;">Session Info</h3>
              <p style="font-size: 0.9rem;">User: Admin<br>Session: Active</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#close-browser')?.addEventListener('click', () => {
      dispatcher.execute('system.close-panel', this.id);
    });
  }
}
