
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { BrandingElement } from '../../lib/db';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
    Button, Input, Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../ui/Shared';

const imageSchema = z.object({
    url: z.string().url("Debe ser una URL válida"),
});

const colorSchema = z.object({
    color1: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Hexadecimal inválido (ej: #FF0000)"),
    color2: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Hexadecimal inválido").optional().or(z.literal('')),
    style: z.enum(['solid', 'diagonal', 'central-circle']).default('solid'),
});

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    element: BrandingElement | null;
    onSave: (id: string, data: any) => Promise<void>;
}

export const EditModal = ({ isOpen, onClose, element, onSave }: EditModalProps) => {
    const form = useForm();
    
    // Reset form when element changes
    useEffect(() => {
        if (isOpen && element) {
            form.reset(element.data);
        }
    }, [isOpen, element, form]);

    const handleSubmit = async (data: any) => {
        if (!element) return;
        await onSave(element.id, data);
        onClose();
    };

    if (!element) return null;

    const isImage = element.type === 'image';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar {element.label}</DialogTitle>
                    <DialogDescription>
                        {isImage 
                            ? "Ingresa la URL de la imagen que deseas mostrar."
                            : "Configura el código de color y el estilo visual."
                        }
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        
                        {isImage ? (
                            <FormField
                                control={form.control}
                                name="url"
                                rules={{ required: "URL requerida", pattern: { value: /^(http|https):\/\/[^ "]+$/, message: "URL inválida" } }}
                                render={({ field }: any) => (
                                    <FormItem>
                                        <FormLabel>URL de Imagen</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="https://ejemplo.com/imagen.jpg" />
                                        </FormControl>
                                        <FormMessage />
                                        {/* Preview Thumbnail */}
                                        {field.value && (
                                            <div className="mt-2 h-32 w-full overflow-hidden rounded-md border bg-muted/20">
                                                <img 
                                                    src={field.value} 
                                                    alt="Preview" 
                                                    className="h-full w-full object-contain"
                                                    onError={(e) => (e.currentTarget.style.display = 'none')} 
                                                />
                                            </div>
                                        )}
                                    </FormItem>
                                )}
                            />
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="color1"
                                        rules={{ required: "Requerido", pattern: /^#([0-9A-F]{3}){1,2}$/i }}
                                        render={({ field }: any) => (
                                            <FormItem>
                                                <FormLabel>Color Principal</FormLabel>
                                                <div className="flex gap-2">
                                                    <div className="h-10 w-10 shrink-0 rounded border" style={{backgroundColor: field.value}}></div>
                                                    <FormControl><Input {...field} placeholder="#000000" /></FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="style"
                                        render={({ field }: any) => (
                                            <FormItem>
                                                <FormLabel>Estilo</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="solid">Sólido</SelectItem>
                                                        <SelectItem value="diagonal">Diagonal</SelectItem>
                                                        <SelectItem value="central-circle">Círculo Central</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                {form.watch('style') !== 'solid' && (
                                    <FormField
                                        control={form.control}
                                        name="color2"
                                        render={({ field }: any) => (
                                            <FormItem>
                                                <FormLabel>Color Secundario</FormLabel>
                                                <div className="flex gap-2">
                                                    <div className="h-10 w-10 shrink-0 rounded border" style={{backgroundColor: field.value}}></div>
                                                    <FormControl><Input {...field} placeholder="#FFFFFF" /></FormControl>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                            <Button type="submit">Guardar Cambios</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
