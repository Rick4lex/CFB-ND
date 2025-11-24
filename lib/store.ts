
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { defaultGlobalConfig } from './constants';
import type { Client, Advisor, Entity } from './types';

// Adaptador de almacenamiento asíncrono usando IndexedDB
// Esto permite almacenar mucha más información que localStorage (5MB vs cientos de MB)
// y no bloquea el UI durante la carga/guardado.
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get(name);
    return value || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

interface AppState {
  clients: Client[];
  advisors: Advisor[];
  entities: Entity[];
  config: typeof defaultGlobalConfig;
  cotizadorProfiles: any[];
  
  setClients: (value: Client[] | ((prev: Client[]) => Client[])) => void;
  setAdvisors: (value: Advisor[] | ((prev: Advisor[]) => Advisor[])) => void;
  setEntities: (value: Entity[] | ((prev: Entity[]) => Entity[])) => void;
  setConfig: (value: typeof defaultGlobalConfig | ((prev: typeof defaultGlobalConfig) => typeof defaultGlobalConfig)) => void;
  setCotizadorProfiles: (value: any[] | ((prev: any[]) => any[])) => void;
  
  isInitialized: boolean;
  initStore: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      clients: [],
      advisors: [{ id: '1', name: "Asesor Principal", commissionType: 'percentage', commissionValue: 10 }],
      entities: [],
      config: defaultGlobalConfig,
      cotizadorProfiles: [],
      isInitialized: false,

      setClients: (value) => set((state) => ({ 
        clients: typeof value === 'function' ? value(state.clients) : value 
      })),
      setAdvisors: (value) => set((state) => ({ 
        advisors: typeof value === 'function' ? value(state.advisors) : value 
      })),
      setEntities: (value) => set((state) => ({ 
        entities: typeof value === 'function' ? value(state.entities) : value 
      })),
      setConfig: (value) => set((state) => ({ 
        config: typeof value === 'function' ? value(state.config) : value 
      })),
      setCotizadorProfiles: (value) => set((state) => ({ 
        cotizadorProfiles: typeof value === 'function' ? value(state.cotizadorProfiles) : value 
      })),

      initStore: async () => {
        // La rehidratación es automática con persist, pero aseguramos que el flag se active
        // Se puede usar para migraciones de datos si fuera necesario en el futuro
        set({ isInitialized: true });
      }
    }),
    {
      name: 'cfbnd-storage-db', // Nuevo nombre para evitar conflictos con la versión anterior basada en localStorage
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        clients: state.clients,
        advisors: state.advisors,
        entities: state.entities,
        config: state.config,
        cotizadorProfiles: state.cotizadorProfiles,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
            state.isInitialized = true;
        }
      }
    }
  )
);
