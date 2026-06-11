import { Toast } from '../components/toast/Toast';

export type ToastType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
export type ToastPriority = 'LOW' | 'HIGH';

export interface ToastNotification {
  id: string;
  message: string;
  type: ToastType;
  priority: ToastPriority;
  duration: number;
  timestamp: number;
}

export class ToastManager {
  private static instance: ToastManager;
  private queue: ToastNotification[] = [];
  private activeToasts: Map<string, Toast> = new Map();
  private container: HTMLElement;
  private readonly MAX_VISIBLE = 3;

  private constructor() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  }

  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  public async notify(options: { 
    message: string; 
    type?: ToastType; 
    priority?: ToastPriority; 
    duration?: number; 
  }): Promise<string> {
    const id = crypto.randomUUID();
    const notification: ToastNotification = {
      id,
      message: options.message,
      type: options.type || 'INFO',
      priority: options.priority || 'LOW',
      duration: options.duration || 5000,
      timestamp: Date.now(),
    };

    if (notification.priority === 'HIGH') {
      this.queue.unshift(notification);
    } else {
      this.queue.push(notification);
    }

    await this.processQueue();
    return id;
  }

  private async processQueue(): Promise<void> {
    if (this.activeToasts.size >= this.MAX_VISIBLE) return;
    if (this.queue.length === 0) return;

    const notification = this.queue.shift();
    if (notification) {
      await this.showToast(notification);
    }
  }

  private async showToast(notification: ToastNotification): Promise<void> {
    const toast = new Toast(notification);
    this.activeToasts.set(notification.id, toast);
    toast.mount(this.container);

    setTimeout(async () => {
      await toast.dismiss();
      this.activeToasts.delete(notification.id);
      this.processQueue();
    }, notification.duration);
  }

  public async dismissAll(): Promise<void> {
    const promises = Array.from(this.activeToasts.values()).map(t => t.dismiss());
    await Promise.all(promises);
    this.activeToasts.clear();
    this.queue = [];
  }
}

export const toastManager = ToastManager.getInstance();
