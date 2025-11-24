
import { useState, useEffect, useRef, useCallback } from 'react';

// Hook optimizado con estrategia de dos niveles: Memoria (RAM) + Persistencia (LocalStorage)
// Maneja errores de cuota y sincronización entre pestañas.
export function useCFBraindStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Nivel 1: Estado en memoria (React State)
  // Inicialización perezosa para evitar lecturas bloqueantes en cada render
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error leyendo localStorage clave "${key}":`, error);
      return initialValue;
    }
  });

  // Referencia para evitar dependencias circulares en efectos
  const rawValueRef = useRef<T>(storedValue);

  // Escuchar cambios en otras pestañas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const newValue = JSON.parse(e.newValue);
          setStoredValue(newValue);
          rawValueRef.current = newValue;
        } catch (error) {
          console.error("Error parsing storage change:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Permitir que el valor sea una función (estilo useState)
      const valueToStore = value instanceof Function ? value(rawValueRef.current) : value;
      
      // 1. Actualizar Nivel 1 (Memoria)
      setStoredValue(valueToStore);
      rawValueRef.current = valueToStore;

      // 2. Actualizar Nivel 2 (Persistencia)
      if (typeof window !== "undefined") {
        try {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (storageError: any) {
            // Manejo de cuota excedida
            if (storageError.name === 'QuotaExceededError' || storageError.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                console.error("LocalStorage lleno. Los datos no se persistirán, pero funcionarán en memoria durante esta sesión.");
                // Opcional: Podríamos intentar limpiar datos antiguos aquí o notificar al usuario
            } else {
                console.error("Error guardando en localStorage:", storageError);
            }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }, [key]);

  return [storedValue, setValue];
}
