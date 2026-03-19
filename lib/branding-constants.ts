import { BrandingElement } from './db';

export const LAYOUTS = [
  {
    id: 'hero-focus',
    name: 'Enfoque Hero',
    // CSS Grid Template Areas representation
    areas: [
      "logo color1 color2 color3",
      "hero hero texture color4",
      "hero hero lifestyle color5",
      "typography typography typography typography"
    ],
    // Mobile fallback (stacked) handled in CSS
    icon: 'LayoutTemplate'
  },
  {
    id: 'balanced',
    name: 'Balanceado',
    areas: [
      "logo color1 color2 color3",
      "hero hero texture texture",
      "lifestyle lifestyle color4 color5",
      "typography typography typography typography"
    ],
    icon: 'Grid'
  },
  {
    id: 'mosaic',
    name: 'Mosaico',
    areas: [
      "logo color1 color2 texture",
      "hero hero lifestyle lifestyle",
      "color3 color4 color5 color6",
      "typography typography typography typography"
    ],
    icon: 'LayoutGrid'
  },
  {
    id: 'asymmetric',
    name: 'Asimétrico',
    areas: [
      "logo hero hero color1",
      "texture hero hero color2",
      "lifestyle lifestyle typography typography",
      "color3 color4 typography typography"
    ],
    icon: 'LayoutGrid'
  },
  {
    id: 'typography-focus',
    name: 'Tipografía',
    areas: [
      "logo color1 color2 color3",
      "typography typography typography typography",
      "typography typography typography typography",
      "hero hero lifestyle texture"
    ],
    icon: 'LayoutTemplate'
  },
  {
    id: 'minimalist',
    name: 'Minimalista',
    areas: [
      "logo hero hero hero",
      "color1 hero hero hero",
      "color2 typography typography typography",
      "color3 typography typography typography"
    ],
    icon: 'LayoutGrid'
  },
  {
    id: 'gallery',
    name: 'Galería',
    areas: [
      "hero hero lifestyle lifestyle",
      "hero hero texture texture",
      "logo color1 color2 color3",
      "typography typography typography typography"
    ],
    icon: 'Grid'
  }
];

export const INITIAL_ELEMENTS: BrandingElement[] = [
  { id: 'logo', type: 'image', label: 'Logo Principal', data: { url: 'https://res.cloudinary.com/dyeppbrfl/image/upload/v1748304382/codefaker-04_pjvwsp.png' } },
  { id: 'hero', type: 'image', label: 'Imagen Hero', data: { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200' } },
  { id: 'texture', type: 'image', label: 'Textura / Patrón', data: { url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=600' } },
  { id: 'lifestyle', type: 'image', label: 'Estilo de Vida', data: { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600' } },
  
  { id: 'color1', type: 'color', label: 'Primario', data: { color1: '#E08C79', style: 'solid' } },
  { id: 'color2', type: 'color', label: 'Secundario', data: { color1: '#F7DC6F', style: 'solid' } },
  { id: 'color3', type: 'color', label: 'Acento', data: { color1: '#3A2E27', style: 'solid' } },
  { id: 'color4', type: 'color', label: 'Neutro Claro', data: { color1: '#F8EDD2', style: 'solid' } },
  { id: 'color5', type: 'color', label: 'Neutro Oscuro', data: { color1: '#2A2A2A', style: 'diagonal', color2: '#000000' } },
  { id: 'color6', type: 'color', label: 'Extra', data: { color1: '#FFFFFF', style: 'central-circle', color2: '#E08C79' } },
  
  { id: 'typography', type: 'typography', label: 'Tipografía', data: { fontFamily: 'Inter', secondaryFontFamily: 'Playfair Display' } },
];