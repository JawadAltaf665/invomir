import { create } from 'zustand';

export type SyncQueueEntity = 'invoice' | 'client' | 'payment' | 'settings';
export type SyncQueueOperation = 'create' | 'update' | 'delete' | 'send';

export interface SyncQueueItem {
  id: string;
  entity: SyncQueueEntity;
  operation: SyncQueueOperation;
  label: string;
  createdAt: string;
}

interface SyncQueueStore {
  items: readonly SyncQueueItem[];
  enqueue: (item: Omit<SyncQueueItem, 'id' | 'createdAt'>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useSyncQueueStore = create<SyncQueueStore>((set) => ({
  items: [],

  enqueue(item) {
    set((state) => ({
      items: [
        ...state.items,
        {
          ...item,
          id: `${item.entity}-${item.operation}-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  },

  remove(id) {
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
  },

  clear() {
    set({ items: [] });
  },
}));
