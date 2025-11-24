import { useAppStore } from '../lib/store';
import { useToast } from './use-toast';
import { clientSchema } from '../lib/schemas';
import { ClientWithMultiple, Client } from '../lib/types';

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

  /**
   * Genera y descarga el CSV de clientes filtrados.
   */
  const exportClientsToCSV = (filteredList: Client[]) => {
      if (filteredList.length === 0) {
        toast({ variant: "destructive", title: "Sin datos", description: "No hay datos para exportar con los filtros actuales." });
        return;
      }
      
      const headers = ["ID", "Nombre", "Documento", "Tipo Doc", "Email", "Telefono", "Estado", "Asesor", "Fecha Ingreso", "Notas"];
      
      const csvContent = [
          headers.join(','),
          ...filteredList.map(c => [
              c.id, 
              `"${c.fullName.replace(/"/g, '""')}"`, // Escapar comillas
              c.documentId, 
              c.documentType, 
              c.email || '', 
              c.phone || c.whatsapp || '', 
              c.serviceStatus, 
              `"${(c.assignedAdvisor || '').replace(/"/g, '""')}"`, 
              c.entryDate, 
              `"${(c.notes || '').replace(/"/g, '""')}"`
          ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `clientes_cfbnd_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast({ title: "Exportación exitosa", description: "El archivo CSV se ha descargado." });
  };

  return { saveClient, deleteClient, exportClientsToCSV };
};