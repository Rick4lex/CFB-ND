
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { defaultGlobalConfig } from './constants';
import type { Client, Advisor, Entity } from './types';

// --- RNF-01: Arquitectura Local-First Asíncrona ---
// Adaptador de almacenamiento asíncrono usando IndexedDB (idb-keyval).
// Esto evita el bloqueo del hilo principal (UI Blocking) al serializar grandes volúmenes de datos JSON.
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
  
  // RF-01: Gestión Semántica del Estado (Acciones Atómicas)
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  removeClient: (id: string) => void;
  setClients: (clients: Client[]) => void; // Para importaciones masivas

  addAdvisor: (advisor: Advisor) => void;
  updateAdvisor: (advisor: Advisor) => void;
  removeAdvisor: (id: string) => void;
  setAdvisors: (advisors: Advisor[]) => void;

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

      // --- Acciones de Clientes ---
      addClient: (client) => set((state) => ({ 
        clients: [client, ...state.clients] 
      })),
      
      updateClient: (client) => set((state) => ({ 
        clients: state.clients.map((c) => c.id === client.id ? client : c) 
      })),
      
      removeClient: (id) => set((state) => ({ 
        clients: state.clients.filter((c) => c.id !== id) 
      })),

      setClients: (clients) => set({ clients }),

      // --- Acciones de Asesores ---
      addAdvisor: (advisor) => set((state) => ({
        advisors: [...state.advisors, advisor]
      })),

      updateAdvisor: (advisor) => set((state) => ({
        advisors: state.advisors.map((a) => a.id === advisor.id ? advisor : a)
      })),

      removeAdvisor: (id) => set((state) => ({
        advisors: state.advisors.filter((a) => a.id !== id)
      })),

      setAdvisors: (advisors) => set({ advisors }),

      // --- Acciones Genéricas (Legacy/Config) ---
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
        // La rehidratación es manejada por persist, pero esto marca el flag para la UI
        set({ isInitialized: true });
      }
    }),
    {
      name: 'cfbnd-storage-db', // Base de datos IndexedDB
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
