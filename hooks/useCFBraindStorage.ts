
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useCFBraindStorage - Hook optimizado con estrategia de dos niveles.
 * 
 * Nivel 1: Memoria RAM (React State) para respuesta instantánea.
 * Nivel 2: Persistencia (LocalStorage) con escritura asíncrona no bloqueante.
 */
export function useCFBraindStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  
  // Nivel 1: Estado en memoria (Lectura inicial síncrona segura)
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

  // Referencia mutable para acceso inmediato en callbacks y persistencia diferida
  const rawValueRef = useRef<T>(storedValue);

  // Sincronización entre pestañas para coherencia de datos distribuida
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const newValue = JSON.parse(e.newValue);
          setStoredValue(newValue);
          rawValueRef.current = newValue;
        } catch (error) {
          console.error("Error al sincronizar storage:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(rawValueRef.current) : value;
      
      // Actualizar Nivel 1 (Memoria RAM) - Respuesta inmediata en UI
      setStoredValue(valueToStore);
      rawValueRef.current = valueToStore;

      // Actualizar Nivel 2 (Persistencia LocalStorage) - Asíncrono
      if (typeof window !== "undefined") {
        const persistData = () => {
             try {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            } catch (storageError: any) {
                if (storageError.name === 'QuotaExceededError' || storageError.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                    console.error("LocalStorage lleno. Los cambios permanecen en memoria pero no persistirán.");
                } else {
                    console.error("Error en persistencia de datos:", storageError);
                }
            }
        };

        // Priorizamos la persistencia en tiempo de inactividad para no afectar el framerate
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(persistData);
        } else {
            setTimeout(persistData, 0);
        }
      }
    } catch (error) {
      console.error("Fallo crítico en useCFBraindStorage:", error);
    }
  }, [key]);

  return [storedValue, setValue];
}
