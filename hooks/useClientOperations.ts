
import { useAppStore } from '../lib/store';
import { useToast } from './use-toast';
import { clientSchema } from '../lib/schemas';
import { ClientWithMultiple } from '../lib/types';

export const useClientOperations = () => {
  const { 
    clients, 
    advisors, 
    addClient, 
    updateClient, 
    removeClient, 
    setClients, 
    setAdvisors 
  } = useAppStore();
  
  const { toast } = useToast();

  /**
   * Gestiona el guardado de clientes (Creación, Edición o Carga Masiva).
   * Persiste automáticamente en localStorage a través del store.
   * @returns true si la operación fue exitosa, false si falló.
   */
  const saveClient = (saveData: ClientWithMultiple): boolean => {
    console.log("3. [Hook] Iniciando operación saveClient. Datos:", saveData);
    try {
        // CASO 1: Importación Masiva (CSV)
        if (saveData.addMultiple) { 
            console.log("3.1 [Hook] Modo Importación Masiva detectado.");
            const { updatedClients, updatedAdvisors } = saveData.addMultiple(clients, advisors); 
            // setClients sobrescribe el array, persistencia automática
            setClients(updatedClients);
            setAdvisors(updatedAdvisors);
            toast({ 
                title: "Importación completada", 
                description: `${updatedClients.length - clients.length} nuevos registros procesados.` 
            });
            return true;
        } 
        
        // CASO 2: Cliente Individual (Crear/Editar)
        const clientData = saveData.client;
        console.log("4. [Hook] Procesando cliente individual:", clientData);
        
        // Validación de Esquema
        const validationResult = clientSchema.safeParse(clientData);
        
        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues[0]?.message || "Datos inválidos";
            console.error("5. [Hook] Error de validación Zod:", validationResult.error);
            toast({ 
                variant: "destructive", 
                title: "Error de validación", 
                description: errorMessage 
            });
            return false;
        }
        console.log("5. [Hook] Validación Zod exitosa.");

        // Validación de Unicidad de Documento - Lógica Mejorada
        
        // 1. Identificar si estamos editando un cliente existente
        const originalClient = clients.find(c => c.id === clientData.id);
        
        // 2. Determinar si es necesario verificar duplicados
        // Solo verificamos si:
        // A) Es un cliente nuevo (no existe original)
        // B) Es una edición PERO se cambió el número de documento
        let shouldCheckDuplicate = true;
        
        if (originalClient) {
            // Normalizamos a string y trim para comparar de forma segura
            const originalDoc = String(originalClient.documentId).trim();
            const newDoc = String(clientData.documentId).trim();
            
            if (originalDoc === newDoc) {
                // Si el documento es el mismo, no verificamos duplicados contra la base de datos.
                // Esto permite guardar cambios en otros campos (ej. credenciales) incluso si 
                // existen duplicados históricos en la BD.
                shouldCheckDuplicate = false;
            }
        }

        if (shouldCheckDuplicate) {
            const duplicate = clients.find(c => {
                // Coincidencia de documento (normalizado)
                const sameDoc = String(c.documentId).trim() === String(clientData.documentId).trim();
                
                // Excluirse a sí mismo de la búsqueda (por si acaso el ID coincide)
                const isSelf = c.id && clientData.id && String(c.id) === String(clientData.id);
                
                return sameDoc && !isSelf;
            });

            if (duplicate) {
                console.warn(`6. [Hook] Bloqueo por duplicado. ID entrante: ${clientData.id}, ID existente: ${duplicate.id}`);
                toast({ 
                    variant: "destructive", 
                    title: "Documento Duplicado", 
                    description: `El documento ${clientData.documentId} ya pertenece a ${duplicate.fullName}.` 
                });
                return false;
            }
        }

        const exists = clients.some(c => c.id === clientData.id);
        console.log(`6. [Hook] Verificación de existencia para ID ${clientData.id}: ${exists}`);
        
        if (exists) {
            // Actualización (UPDATE)
            console.log("7. [Hook] Ejecutando updateClient en Store...");
            updateClient(clientData);
            toast({ 
                title: "Datos actualizados", 
                description: `Se guardaron los cambios para ${clientData.fullName}` 
            });
        } else {
            // Creación (CREATE)
            console.log("7. [Hook] Ejecutando addClient en Store...");
            addClient(clientData);
            toast({ 
                title: "Cliente registrado", 
                description: `${clientData.fullName} ha sido añadido exitosamente.` 
            });
        }

        return true;
    } catch (error) {
        console.error("Error CRÍTICO en operación de cliente:", error);
        toast({ 
            variant: "destructive", 
            title: "Error del sistema", 
            description: "No se pudieron guardar los cambios. Verifique la consola." 
        });
        return false;
    }
  };

  /**
   * Elimina un cliente por su ID (DELETE).
   */
  const deleteClient = (clientId: string) => {
    const clientToDelete = clients.find(c => c.id === clientId);
    if (!clientToDelete) return;

    removeClient(clientId);
    
    toast({ 
        title: "Cliente eliminado", 
        description: `Se ha eliminado a ${clientToDelete.fullName} de la base de datos.` 
    });
  };

  return { saveClient, deleteClient };
};
