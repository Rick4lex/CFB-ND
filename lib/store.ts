import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { defaultGlobalConfig } from './constants';
import { DEFAULT_CATALOG } from './defaultCatalog';
import type { Client, Advisor, Entity, CatalogService, Transaction, Account, Category, InvoiceRecord } from './types';
import type { BrandingElement } from './db';

interface AppState {
  // --- Estado ---
  clients: Client[];
  advisors: Advisor[];
  entities: Entity[];
  brandingElements: BrandingElement[];
  config: typeof defaultGlobalConfig;
  cotizadorProfiles: any[];
  catalogServices: CatalogService[];
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  invoices: InvoiceRecord[];
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

  // --- Acciones de Catálogo ---
  setCatalogServices: (services: CatalogService[]) => void;

  // --- Acciones Financieras ---
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  removeTransaction: (id: string) => void;
  setTransactions: (transactions: Transaction[]) => void;

  addAccount: (account: Account) => void;
  updateAccount: (account: Account) => void;
  removeAccount: (id: string) => void;
  setAccounts: (accounts: Account[]) => void;

  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  removeCategory: (id: string) => void;
  setCategories: (categories: Category[]) => void;

  addInvoice: (invoice: InvoiceRecord) => void;
  updateInvoice: (invoice: InvoiceRecord) => void;
  removeInvoice: (id: string) => void;
  setInvoices: (invoices: InvoiceRecord[]) => void;

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
      catalogServices: DEFAULT_CATALOG,
      transactions: [],
      accounts: [],
      categories: [],
      invoices: [],
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

      // --- CATALOGO ---
      setCatalogServices: (services) => set({ catalogServices: services }),

      // --- FINANZAS ---
      addTransaction: (transaction) => set((state) => ({ transactions: [...state.transactions, transaction] })),
      updateTransaction: (updatedTransaction) => set((state) => ({ transactions: state.transactions.map((t) => t.id === updatedTransaction.id ? updatedTransaction : t) })),
      removeTransaction: (id) => set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) })),
      setTransactions: (transactions) => set({ transactions }),

      addAccount: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
      updateAccount: (updatedAccount) => set((state) => ({ accounts: state.accounts.map((a) => a.id === updatedAccount.id ? updatedAccount : a) })),
      removeAccount: (id) => set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) })),
      setAccounts: (accounts) => set({ accounts }),

      addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (updatedCategory) => set((state) => ({ categories: state.categories.map((c) => c.id === updatedCategory.id ? updatedCategory : c) })),
      removeCategory: (id) => set((state) => ({ categories: state.categories.filter((c) => c.id !== id) })),
      setCategories: (categories) => set({ categories }),

      addInvoice: (invoice) => set((state) => ({ invoices: [...state.invoices, invoice] })),
      updateInvoice: (updatedInvoice) => set((state) => ({ invoices: state.invoices.map((i) => i.id === updatedInvoice.id ? updatedInvoice : i) })),
      removeInvoice: (id) => set((state) => ({ invoices: state.invoices.filter((i) => i.id !== id) })),
      setInvoices: (invoices) => set({ invoices }),

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
        const state = get();
        let needsUpdate = false;
        
        // FASE 2: Sanar clientes sin ID (o con ID 'undefined')
        const healedClients = state.clients.map(client => {
            if (!client.id || String(client.id) === 'undefined') {
                needsUpdate = true;
                return { ...client, id: crypto.randomUUID() };
            }
            return client;
        });

        if (needsUpdate) {
            set({ clients: healedClients });
            console.log('Fase 2: Clientes sanados (IDs asignados)');
        }

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
        transactions: state.transactions,
        accounts: state.accounts,
        categories: state.categories,
        invoices: state.invoices,
        brandingElements: state.brandingElements,
        config: state.config,
        catalogServices: state.catalogServices,
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