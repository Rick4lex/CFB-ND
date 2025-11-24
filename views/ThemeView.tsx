import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { LayoutTemplate, Grid, LayoutGrid, Shuffle, RefreshCw } from 'lucide-react';
import { PageLayout } from '../components/layout/Layout';
import { db, BrandingElement } from '../lib/db';
import { LAYOUTS, INITIAL_ELEMENTS } from '../lib/branding-constants';
import { ImageCell } from '../components/branding/ImageCell';
import { ColorCell } from '../components/branding/ColorCell';
import { EditModal } from '../components/branding/EditModal';
import { Button, Card, CardContent, Tabs, TabsList, TabsTrigger, Switch, Label } from '../components/ui/Shared';
import { useToast } from '../hooks/use-toast';

export const ThemeView = () => {
  const { toast } = useToast();
  
  // State
  const [activeLayoutId, setActiveLayoutId] = useState(LAYOUTS[0].id);
  const [editingElement, setEditingElement] = useState<BrandingElement | null>(null);
  const [roundColors, setRoundColors] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Dexie Query (Reactivity)
  const elements = useLiveQuery(() => db.elements.toArray());

  // Seed DB if empty
  useEffect(() => {
    const seed = async () => {
      const count = await db.elements.count();
      if (count === 0 && !isSeeding) {
        setIsSeeding(true);
        await db.elements.bulkAdd(INITIAL_ELEMENTS);
        setIsSeeding(false);
      }
    };
    seed();
  }, []);

  // Handlers
  const handleSaveElement = async (id: string, data: any) => {
    try {
      await db.elements.update(id, { data });
      toast({ title: 'Actualizado', description: 'Los cambios se han guardado localmente.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar en la base de datos.' });
    }
  };

  const handleReset = async () => {
    if (confirm('¿Restablecer todo el moodboard a los valores iniciales?')) {
      await db.elements.clear();
      await db.elements.bulkAdd(INITIAL_ELEMENTS);
      toast({ title: 'Restablecido', description: 'Moodboard reiniciado.' });
    }
  };

  const handleRandomLayout = () => {
    const random = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];
    setActiveLayoutId(random.id);
  };

  // Grid Logic
  const activeLayout = LAYOUTS.find(l => l.id === activeLayoutId) || LAYOUTS[0];
  
  // Convert areas string array to CSS grid-template-areas string
  const gridTemplateAreas = activeLayout.areas.map(row => `"${row}"`).join(' ');

  // Mapping function for rendering
  const renderCell = (areaName: string) => {
    const element = elements?.find(e => e.id === areaName);
    if (!element) return <div key={areaName} style={{ gridArea: areaName }} className="rounded-xl border border-dashed bg-muted/20"></div>;

    if (element.type === 'image') {
      return (
        <ImageCell 
            key={element.id} 
            element={element}
            onClick={() => setEditingElement(element)}
            style={{ gridArea: areaName }}
            className="h-full w-full"
        />
      );
    }
    return (
        <ColorCell 
            key={element.id} 
            element={element}
            onClick={() => setEditingElement(element)}
            style={{ gridArea: areaName }}
            className="h-full w-full"
            shape={roundColors ? 'circle' : 'square'}
        />
    );
  };

  // Collect unique area names from the layout string to render grid items
  const areaNames = React.useMemo(() => {
    const areas = new Set<string>();
    activeLayout.areas.forEach(row => {
      row.split(' ').forEach(area => areas.add(area));
    });
    return Array.from(areas);
  }, [activeLayout]);


  if (!elements) return <div className="flex h-96 items-center justify-center"><RefreshCw className="animate-spin" /></div>;

  return (
    <PageLayout title="Moodboard Interactivo" subtitle="Define y visualiza la identidad de tu marca." onBackRoute="/app/dashboard">
      <div className="flex flex-col gap-6 lg:flex-row">
        
        {/* Controls Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
          <Card>
            <CardContent className="p-4 space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Distribución</Label>
                <div className="grid grid-cols-3 gap-2">
                  {LAYOUTS.map(layout => (
                    <Button 
                      key={layout.id}
                      variant={activeLayoutId === layout.id ? 'default' : 'outline'}
                      className="h-20 flex-col gap-2"
                      onClick={() => setActiveLayoutId(layout.id)}
                    >
                      {layout.icon === 'LayoutTemplate' && <LayoutTemplate className="h-5 w-5"/>}
                      {layout.icon === 'Grid' && <Grid className="h-5 w-5"/>}
                      {layout.icon === 'LayoutGrid' && <LayoutGrid className="h-5 w-5"/>}
                      <span className="text-[10px]">{layout.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <Label htmlFor="shape-toggle" className="flex flex-col">
                    <span className="font-semibold">Formas Suaves</span>
                    <span className="text-xs text-muted-foreground">Paleta circular</span>
                </Label>
                <Switch id="shape-toggle" checked={roundColors} onCheckedChange={setRoundColors} />
              </div>

              <div className="space-y-2">
                 <Button variant="secondary" className="w-full" onClick={handleRandomLayout}>
                    <Shuffle className="mr-2 h-4 w-4" /> Distribución Aleatoria
                 </Button>
                 <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleReset}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Restablecer Todo
                 </Button>
              </div>
            </CardContent>
          </Card>

          <div className="bg-primary/5 rounded-lg p-4 text-sm text-primary border border-primary/20">
            <p className="font-semibold mb-1">Nota:</p>
            <p>Los cambios se guardan automáticamente en este navegador. Haz clic en cualquier elemento para editarlo.</p>
          </div>
        </div>

        {/* Main Grid Canvas */}
        <div className="flex-grow">
          <div className="aspect-[3/4] md:aspect-[4/3] w-full rounded-2xl border bg-background p-4 shadow-sm transition-all">
             {/* Mobile Stacked View (Fallback) */}
             <div className="flex flex-col gap-4 md:hidden">
                {/* Manual order for mobile specifically if grid isn't supported or to force hierarchy */}
                {elements.filter(e => e.type === 'image').map(e => (
                    <div key={e.id} className="aspect-video w-full">{renderCell(e.id)}</div>
                ))}
                <div className="grid grid-cols-3 gap-2">
                    {elements.filter(e => e.type === 'color').map(e => (
                        <div key={e.id} className="aspect-square">{renderCell(e.id)}</div>
                    ))}
                </div>
             </div>

             {/* Desktop CSS Grid */}
             <div 
                className="hidden md:grid h-full w-full gap-4 transition-all duration-500 ease-in-out"
                style={{ 
                    gridTemplateAreas: gridTemplateAreas,
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gridTemplateRows: 'repeat(3, 1fr)'
                }}
             >
                {areaNames.map(area => renderCell(area))}
             </div>
          </div>
        </div>

      </div>

      <EditModal 
        isOpen={!!editingElement} 
        onClose={() => setEditingElement(null)} 
        element={editingElement} 
        onSave={handleSaveElement}
      />
    </PageLayout>
  );
};