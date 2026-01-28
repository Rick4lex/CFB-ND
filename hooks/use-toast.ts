
import { useState, useEffect } from 'react';

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
    // Simple alert for now as the full Toast UI component is complex
    // In a full implementation, this would trigger a context update
    console.log(`TOAST [${variant}]: ${title} - ${description}`);
    
    // Quick custom toast visualization
    const div = document.createElement('div');
    // MODIFICADO: z-50 cambiado a z-[9999] para asegurar que se vea sobre los modales (Dialog tiene z-1000)
    div.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-[9999] animate-in slide-in-from-bottom-5 duration-300 ${variant === 'destructive' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'}`;
    div.innerHTML = `<h4 class="font-bold">${title}</h4><p class="text-sm">${description || ''}</p>`;
    document.body.appendChild(div);
    setTimeout(() => {
        div.classList.add('opacity-0');
        setTimeout(() => document.body.removeChild(div), 300);
    }, 3000);
  };

  return { toast };
}
