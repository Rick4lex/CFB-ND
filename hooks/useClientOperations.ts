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
   * Realiza validaciones de esquema (Zod) y reglas de negocio (Duplicados).
   * @returns true si la operación fue exitosa, false si falló.
   */
  const saveClient = (saveData: ClientWithMultiple): boolean => {
    try {
        // CASO 1: Importación Masiva (CSV)
        if (saveData.addMultiple) { 
            const { updatedClients, updatedAdvisors } = saveData.addMultiple(clients, advisors); 
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
        
        // RF-02.2: Validación de Esquema Zod
        // Aunque el formulario ya valida, esta es una capa de seguridad en la lógica de negocio.
        // Nota: Omitimos campos generados como ID para la validación estricta del payload base si fuera necesario,
        // pero aquí validamos el objeto completo para asegurar integridad.
        const validationResult = clientSchema.safeParse(clientData);
        
        if (!validationResult.success) {
            const errorMessage = validationResult.error.errors[0]?.message || "Datos inválidos";
            toast({ 
                variant: "destructive", 
                title: "Error de validación", 
                description: errorMessage 
            });
            return false;
        }

        // RF-02.1: Validación de Unicidad de Documento
        // Buscamos si existe otro cliente con el mismo documento pero diferente ID interno
        const duplicate = clients.find(c => c.documentId === clientData.documentId && c.id !== clientData.id);
        if (duplicate) {
            toast({ 
                variant: "destructive", 
                title: "Documento Duplicado", 
                description: `El documento ${clientData.documentId} ya pertenece a ${duplicate.fullName}.` 
            });
            return false;
        }

        // Determinar si es Crear o Actualizar
        const exists = clients.some(c => c.id === clientData.id);
        
        if (exists) {
            // RF-01.2: Acción Semántica Update
            updateClient(clientData);
            toast({ 
                title: "Datos actualizados", 
                description: `Se guardaron los cambios para ${clientData.fullName}` 
            });
        } else {
            // RF-01.1: Acción Semántica Add
            addClient(clientData);
            toast({ 
                title: "Cliente registrado", 
                description: `${clientData.fullName} ha sido añadido exitosamente.` 
            });
        }

        return true;
    } catch (error) {
        console.error("Error en operación de cliente:", error);
        toast({ 
            variant: "destructive", 
            title: "Error del sistema", 
            description: "No se pudieron guardar los cambios. Verifique la consola." 
        });
        return false;
    }
  };

  /**
   * Elimina un cliente por su ID.
   * Nota: La confirmación de UI debe hacerse antes de llamar a esta función.
   */
  const deleteClient = (clientId: string) => {
    const clientToDelete = clients.find(c => c.id === clientId);
    if (!clientToDelete) return;

    // RF-01.3: Acción Semántica Remove
    removeClient(clientId);
    
    toast({ 
        title: "Cliente eliminado", 
        description: `Se ha eliminado a ${clientToDelete.fullName} de la base de datos.` 
    });
  };

  return { saveClient, deleteClient };
};