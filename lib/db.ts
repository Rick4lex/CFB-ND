
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Transaction, Account } from './types';

// Archivo de definición de tipos para Branding
export interface BrandingElement {
  id: string; // Identificador único (ej: 'logo', 'color1')
  type: 'image' | 'color' | 'typography';
  label: string; // Título legible
  data: {
    url?: string; // Para imágenes (Input URL)
    color1?: string; // Hex principal
    color2?: string; // Hex secundario (opcional)
    style?: 'solid' | 'central-circle' | 'diagonal'; // Patrón de color
    fontFamily?: string; // Para tipografía principal
    secondaryFontFamily?: string; // Para tipografía secundaria
    text?: string; // Texto de muestra opcional
    textColor?: string; // Color de texto para tipografía (opcional)
    bgColor?: string; // Color de fondo para tipografía (opcional)
  };
}

interface CFBNDSchema extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-date': number; 'by-account': string };
  };
  accounts: {
    key: string;
    value: Account;
  };
}

let dbPromise: Promise<IDBPDatabase<CFBNDSchema>> | null = null;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<CFBNDSchema>('cfbnd-finance-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('by-date', 'date');
          txStore.createIndex('by-account', 'sourceAccountId');
        }
        if (!db.objectStoreNames.contains('accounts')) {
          db.createObjectStore('accounts', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

/**
 * Registra una transacción y actualiza el saldo de la cuenta simultáneamente 
 * utilizando una transacción atómica `readwrite` en IndexedDB.
 */
export const saveTransactionWithAccountBalance = async (
  newTx: Transaction,
  accountToUpdate: Account
) => {
  const db = await initDB();
  const tx = db.transaction(['transactions', 'accounts'], 'readwrite');
  
  try {
    const txStore = tx.objectStore('transactions');
    const accStore = tx.objectStore('accounts');

    await txStore.put(newTx);
    await accStore.put(accountToUpdate);

    await tx.done; // Ensure the transaction completes successfully
    return true;
  } catch (error) {
    console.error("Atomic transaction failed in IndexedDB: ", error);
    tx.abort(); // Rollback if something goes wrong
    throw error;
  }
};
