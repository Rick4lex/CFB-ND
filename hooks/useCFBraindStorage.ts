
import { useState, useEffect, useRef, useCallback } from 'react';

// Hook optimizado con estrategia de dos niveles: Memoria (RAM) + Persistencia (LocalStorage/Async)
// Garantiza actualizaciones de UI inmediatas (optimistic UI) mientras persiste en segundo plano.
export function useCFBraindStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  
  // Nivel 1: Estado en memoria (React State) - Lectura inicial síncrona segura
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

  // Referencia mutable para acceso inmediato en callbacks sin dependencias
  const rawValueRef = useRef<T>(storedValue);

  // Sincronización entre pestañas (Storage Event)
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
      
      // 1. Actualizar Nivel 1 (Memoria UI) - Inmediato
      setStoredValue(valueToStore);
      rawValueRef.current = valueToStore;

      // 2. Actualizar Nivel 2 (Persistencia) - Asíncrono/No bloqueante conceptualmente
      if (typeof window !== "undefined") {
        // Usamos requestIdleCallback si está disponible para no bloquear interacciones críticas
        const saveToStorage = () => {
             try {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
                // Disparar evento para otras pestañas manualmente si es necesario (local storage lo hace auto entre pestañas, no misma pestaña)
            } catch (storageError: any) {
                if (storageError.name === 'QuotaExceededError' || storageError.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                    console.error("LocalStorage lleno. Datos solo en memoria.");
                } else {
                    console.error("Error guardando en localStorage:", storageError);
                }
            }
        };

        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(saveToStorage);
        } else {
            setTimeout(saveToStorage, 0);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }, [key]);

  return [storedValue, setValue];
}
