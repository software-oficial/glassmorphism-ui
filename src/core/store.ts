export interface AppState {
  system: {
    theme: 'dark' | 'light';
    hpMode: boolean;
    isStressing: boolean;
    menuOpen: boolean;
    platform: 'web' | 'android' | 'ios' | 'mac' | 'windows' | 'linux' | 'unknown';
    performanceTier: 'low' | 'medium' | 'high';
  };
  metrics: {
    fps: number;
    ram: number | null;
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  };
  user?: {
    id: string;
    name: string;
    balance: number;
  };
}

type SliceName = keyof AppState;
type Listener = (state: any) => void;

export class Store {
  private state: AppState = {
    system: {
      theme: 'dark',
      hpMode: false,
      isStressing: false,
      menuOpen: false,
      platform: 'unknown',
      performanceTier: 'high',
    },
    metrics: {
      fps: 60,
      ram: null,
      status: 'HEALTHY',
    },
  };

  private listeners: Map<SliceName, Set<Listener>> = new Map();

  public getState<K extends SliceName>(slice: K): AppState[K] {
    return this.state[slice];
  }

  public setState<K extends SliceName>(slice: K, newState: Partial<AppState[K]>): void {
    const previousSlice = this.state[slice];
    const updatedSlice = { ...previousSlice, ...newState };

    let hasChanged = false;
    for (const key in newState) {
      if (previousSlice[key as keyof AppState[K]] !== newState[key as keyof AppState[K]]) {
        hasChanged = true;
        break;
      }
    }

    if (hasChanged) {
      this.state[slice] = updatedSlice;
      this.notify(slice);
    }
  }

  public subscribe<K extends SliceName>(slice: K, listener: Listener): () => void {
    if (!this.listeners.has(slice)) {
      this.listeners.set(slice, new Set());
    }
    this.listeners.get(slice)!.add(listener);
    listener(this.getState(slice));
    return () => this.listeners.get(slice)?.delete(listener);
  }

  private notify(slice: SliceName): void {
    const sliceState = this.getState(slice);
    const listeners = this.listeners.get(slice);
    if (!listeners) return;

    // Usamos un loop for...of simple para minimizar la creación de iteradores
    // y reducir la presión sobre el Garbage Collector en dispositivos de bajos recursos.
    for (const listener of listeners) {
      listener(sliceState);
    }
  }
}

export const store = new Store();

