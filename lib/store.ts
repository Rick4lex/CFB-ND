import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { defaultGlobalConfig } from './constants';
import type { Client, Advisor, Entity } from './types';
import type { BrandingElement } from './db';

interface AppState {
  // --- Estado ---
  clients: Client[];
  advisors: Advisor[];
  entities: Entity[];
  brandingElements: BrandingElement[];
  config: typeof defaultGlobalConfig;
  cotizadorProfiles: any[];
  isInitialized: boolean;
  
  // --- Acciones de Clientes ---
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  removeClient: (id: string) => void;
  setClients: (clients: Client[]) => void; // Para importación masiva

  // --- Acciones de Asesores ---
  addAdvisor: (advisor: Advisor) => void;
  updateAdvisor: (advisor: Advisor) => void;
  removeAdvisor: (id: string) => void;
  setAdvisors: (advisors: Advisor[]) => void; // Para edición en lote

  // --- Acciones de Entidades ---
  addEntity: (entity: Entity) => void;
  updateEntity: (entity: Entity) => void;
  removeEntity: (id: string) => void;
  setEntities: (entities: Entity[]) => void; // Para edición en lote

  // --- Acciones de Configuración y Sistema ---
  setConfig: (value: typeof defaultGlobalConfig | ((prev: typeof defaultGlobalConfig) => typeof defaultGlobalConfig)) => void;
  setCotizadorProfiles: (value: any[] | ((prev: any[]) => any[])) => void;
  initStore: () => Promise<void>;
  
  // --- Acciones de Branding ---
  setBrandingElements: (elements: BrandingElement[]) => void;
  updateBrandingElement: (id: string, data: any) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado Inicial
      clients: [],
      advisors: [{ id: '1', name: "Asesor Principal", commissionType: 'percentage', commissionValue: 10 }],
      entities: [],
      brandingElements: [],
      config: defaultGlobalConfig,
      cotizadorProfiles: [],
      isInitialized: false,

      // ------------------------------------------------------------------
      // MÉTODOS CRUD (Manipulación de Datos)
      // Nota: Zustand + persist maneja automáticamente la serialización 
      // JSON al guardar en localStorage.
      // ------------------------------------------------------------------

      // --- CLIENTES ---
      addClient: (client) => set((state) => ({ 
        clients: [client, ...state.clients] 
      })),
      
      updateClient: (updatedClient) => set((state) => ({ 
        clients: state.clients.map((c) => c.id === updatedClient.id ? updatedClient : c) 
      })),
      
      removeClient: (id) => set((state) => ({ 
        clients: state.clients.filter((c) => c.id !== id) 
      })),

      setClients: (clients) => set({ clients }),

      // --- ASESORES ---
      addAdvisor: (advisor) => set((state) => ({
        advisors: [...state.advisors, advisor]
      })),

      updateAdvisor: (updatedAdvisor) => set((state) => ({
        advisors: state.advisors.map((a) => a.id === updatedAdvisor.id ? updatedAdvisor : a)
      })),

      removeAdvisor: (id) => set((state) => ({
        advisors: state.advisors.filter((a) => a.id !== id)
      })),

      setAdvisors: (advisors) => set({ advisors }),

      // --- ENTIDADES ---
      addEntity: (entity) => set((state) => ({
        entities: [...state.entities, entity]
      })),

      updateEntity: (updatedEntity) => set((state) => ({
        entities: state.entities.map((e) => e.id === updatedEntity.id ? updatedEntity : e)
      })),

      removeEntity: (id) => set((state) => ({
        entities: state.entities.filter((e) => e.id !== id)
      })),

      setEntities: (entities) => set({ entities }),

      // --- BRANDING ---
      setBrandingElements: (elements) => set({ brandingElements: elements }),
      
      updateBrandingElement: (id, data) => set((state) => ({
        brandingElements: state.brandingElements.map((el) => 
          el.id === id ? { ...el, data } : el
        )
      })),

      // --- SISTEMA ---
      setConfig: (value) => set((state) => ({ 
        config: typeof value === 'function' ? value(state.config) : value 
      })),
      
      setCotizadorProfiles: (value) => set((state) => ({ 
        cotizadorProfiles: typeof value === 'function' ? value(state.cotizadorProfiles) : value 
      })),

      initStore: async () => {
        // La inicialización es automática con persist, pero mantenemos el flag
        // para controlar la UI de carga si fuera necesario.
        set({ isInitialized: true });
      }
    }),
    {
      name: 'cfbnd-storage-v2', // Clave única en LocalStorage
      storage: createJSONStorage(() => localStorage), // Adaptador explícito a LocalStorage
      version: 1,
      // Definimos qué partes del estado se persisten
      partialize: (state) => ({
        clients: state.clients,
        advisors: state.advisors,
        entities: state.entities,
        brandingElements: state.brandingElements,
        config: state.config,
        cotizadorProfiles: state.cotizadorProfiles,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
            state.isInitialized = true;
            console.log('App state rehydrated from localStorage');
        } else {
            console.warn('Failed to rehydrate app state');
        }
      }
    }
  )
);