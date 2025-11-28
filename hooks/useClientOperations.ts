
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

        // Validación de Unicidad de Documento
        // Verificamos si existe OTRO cliente con el mismo documentId pero diferente ID interno
        const duplicate = clients.find(c => c.documentId === clientData.documentId && c.id !== clientData.id);
        if (duplicate) {
            console.warn(`6. [Hook] Bloqueo por duplicado. ID entrante: ${clientData.id}, ID existente: ${duplicate.id}`);
            toast({ 
                variant: "destructive", 
                title: "Documento Duplicado", 
                description: `El documento ${clientData.documentId} ya pertenece a ${duplicate.fullName}.` 
            });
            return false;
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