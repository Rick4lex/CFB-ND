
import { useState } from 'react';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
    Button, Textarea, Label
} from '../ui/Shared';
import { ClipboardList, Play, Info } from 'lucide-react';
import { CLIENT_CSV_COLUMNS } from '../../lib/crm-states';

interface QuickImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (text: string) => void;
}

export const QuickImportDialog = ({ open, onOpenChange, onImport }: QuickImportDialogProps) => {
    const headers = CLIENT_CSV_COLUMNS.map(c => c.label).join(';');
    const [text, setText] = useState(headers + '\n');

    const handleImport = () => {
        onImport(text);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-primary" />
                        Importación Rápida (Pegar Datos)
                    </DialogTitle>
                    <DialogDescription>
                        Copia tus datos desde Excel o texto plano y pégalos aquí. 
                        Asegúrate de mantener el orden de las columnas.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 py-4 space-y-4 overflow-hidden flex flex-col">
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-2">
                            <Info className="h-3 w-3" />
                            Sugerencia: Deja la primera línea (cabeceras) intacta y pega tus datos a partir de la segunda línea.
                        </Label>
                        <Textarea 
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Pega aquí tus datos separador por punto y coma..."
                            className="font-mono text-xs h-[400px] resize-none focus-visible:ring-primary shadow-inner"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleImport} className="gap-2">
                        <Play className="h-4 w-4" />
                        Procesar e Importar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
