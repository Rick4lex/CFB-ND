
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { defaultGlobalConfig } from './constants';
import type { Client, Advisor, Entity } from './types';

// --- RNF-01: Arquitectura Local-First Asíncrona con Migración ---
// Adaptador de almacenamiento asíncrono usando IndexedDB (idb-keyval).
// Incluye lógica de migración automática desde LocalStorage para usuarios existentes.
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      // 1. Intentar leer de IndexedDB (Fuente de la verdad asíncrona)
      const value = await get(name);
      if (value) return value;

      // 2. Fallback: Intentar leer de LocalStorage (Migración Legacy)
      // Si el usuario tenía datos en la versión anterior (síncrona), los migramos a IDB.
      if (typeof window !== 'undefined') {
        const localValue = window.localStorage.getItem(name);
        if (localValue) {
          console.log(`Migrando datos de ${name} desde LocalStorage a IndexedDB...`);
          await set(name, localValue);
          // Opcional: Limpiar localStorage después de migrar para liberar espacio
          // window.localStorage.removeItem(name); 
          return localValue;
        }
      }
      return null;
    } catch (error) {
      console.warn('Error al leer persistencia:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch (error) {
      console.error('Error escribiendo en IndexedDB:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
    // Asegurar limpieza también en LocalStorage si existía
    if (typeof window !== 'undefined') {
       window.localStorage.removeItem(name);
    }
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
  setClients: (clients: Client[]) => void;

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
        // La rehidratación asíncrona puede tomar unos milisegundos.
        // Zustand persist maneja esto automáticamente, pero aseguramos el flag.
        set({ isInitialized: true });
      }
    }),
    {
      name: 'cfbnd-storage-db', // Nombre de la base de datos/key
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        clients: state.clients,
        advisors: state.advisors,
        entities: state.entities,
        config: state.config,
        cotizadorProfiles: state.cotizadorProfiles,
      }),
      skipHydration: false, // Asegurar hidratación automática
      onRehydrateStorage: () => (state) => {
        if (state) {
            state.isInitialized = true;
            console.log('Store rehidratado desde IndexedDB');
        }
      }
    }
  )
);
