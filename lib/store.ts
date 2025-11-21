
import { create } from 'zustand';
import { get, set as setItem } from 'idb-keyval';
import { defaultGlobalConfig } from './constants';
import type { Client, Advisor, Entity } from './types';

type Setter<T> = (value: T | ((prev: T) => T)) => void;

interface AppState {
  clients: Client[];
  advisors: Advisor[];
  entities: Entity[];
  config: typeof defaultGlobalConfig;
  cotizadorProfiles: any[];
  
  setClients: Setter<Client[]>;
  setAdvisors: Setter<Advisor[]>;
  setEntities: Setter<Entity[]>;
  setConfig: Setter<typeof defaultGlobalConfig>;
  setCotizadorProfiles: Setter<any[]>;
  
  isInitialized: boolean;
  initStore: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, getStore) => ({
  clients: [],
  advisors: [{ id: '1', name: "Asesor Principal", commissionType: 'percentage', commissionValue: 10 }],
  entities: [],
  config: defaultGlobalConfig,
  cotizadorProfiles: [],
  isInitialized: false,

  setClients: (value) => {
    set((state) => {
      const newValue = typeof value === 'function' ? (value as any)(state.clients) : value;
      setItem('clients', newValue).catch(err => console.error('Failed to persist clients', err));
      return { clients: newValue };
    });
  },
  setAdvisors: (value) => {
    set((state) => {
        const newValue = typeof value === 'function' ? (value as any)(state.advisors) : value;
        setItem('advisors', newValue).catch(err => console.error('Failed to persist advisors', err));
        return { advisors: newValue };
      });
  },
  setEntities: (value) => {
    set((state) => {
        const newValue = typeof value === 'function' ? (value as any)(state.entities) : value;
        setItem('entities', newValue).catch(err => console.error('Failed to persist entities', err));
        return { entities: newValue };
      });
  },
  setConfig: (value) => {
    set((state) => {
        const newValue = typeof value === 'function' ? (value as any)(state.config) : value;
        setItem('sys_config', newValue).catch(err => console.error('Failed to persist config', err));
        return { config: newValue };
      });
  },
  setCotizadorProfiles: (value) => {
    set((state) => {
        const newValue = typeof value === 'function' ? (value as any)(state.cotizadorProfiles) : value;
        setItem('cotizadorProfiles', newValue).catch(err => console.error('Failed to persist profiles', err));
        return { cotizadorProfiles: newValue };
      });
  },

  initStore: async () => {
    try {
        const [clients, advisors, entities, config, cotizadorProfiles] = await Promise.all([
            get('clients'),
            get('advisors'),
            get('entities'),
            get('sys_config'),
            get('cotizadorProfiles')
        ]);
        
        set({
            clients: clients || [],
            advisors: advisors || [{ id: '1', name: "Asesor Principal", commissionType: 'percentage', commissionValue: 10 }],
            entities: entities || [],
            config: config || defaultGlobalConfig,
            cotizadorProfiles: cotizadorProfiles || [],
            isInitialized: true
        });
    } catch (error) {
        console.error("Failed to initialize store from IndexedDB", error);
        set({ isInitialized: true });
    }
  }
}));
