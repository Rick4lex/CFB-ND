import Dexie, { Table } from 'dexie';

export interface BrandingElement {
  id: string; // Identificador único (ej: 'logo', 'color1')
  type: 'image' | 'color';
  label: string; // Título legible
  data: {
    url?: string; // Para imágenes (Input URL)
    color1?: string; // Hex principal
    color2?: string; // Hex secundario (opcional)
    style?: 'solid' | 'central-circle' | 'diagonal'; // Patrón de color
  };
}

export class BrandingDB extends Dexie {
  elements!: Table<BrandingElement>;

  constructor() {
    super('CFBraindDB');
    // Fix: Explicitly cast 'this' to allow access to Dexie's version method if TS doesn't detect it on subclass
    (this as any).version(1).stores({
      elements: 'id' // Primary key
    });
  }
}

export const db = new BrandingDB();