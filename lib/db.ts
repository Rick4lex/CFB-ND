
// Archivo de definición de tipos para Branding

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