import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { defaultGlobalConfig } from './constants';
import type { Client, Advisor, Entity } from './types';

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
    (set) => ({
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
        // La inicialización es manejada automáticamente por el middleware persist.
        // Mantenemos esta función para compatibilidad y asegurar el flag de inicialización.
        set({ isInitialized: true });
      }
    }),
    {
      name: 'cfbnd-storage', // Nombre único en localStorage
      storage: createJSONStorage(() => localStorage),
      // Solo persistimos los datos de negocio, no el flag de inicialización
      partialize: (state) => ({
        clients: state.clients,
        advisors: state.advisors,
        entities: state.entities,
        config: state.config,
        cotizadorProfiles: state.cotizadorProfiles,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isInitialized = true;
      }
    }
  )
);