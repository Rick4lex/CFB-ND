
import { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutTemplate, Grid, LayoutGrid, Shuffle, RefreshCw, Download, Smartphone, Square, Monitor } from 'lucide-react';
import { PageLayout } from '../components/layout/Layout';
import { BrandingElement } from '../lib/db';
import { useAppStore } from '../lib/store';
import { LAYOUTS, INITIAL_ELEMENTS } from '../lib/branding-constants';
import { ImageCell } from '../components/branding/ImageCell';
import { ColorCell } from '../components/branding/ColorCell';
import { TypographyCell } from '../components/branding/TypographyCell';
import { EditModal } from '../components/branding/EditModal';
import { Button, Card, CardContent, Tabs, TabsList, TabsTrigger, Switch, Label, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Shared';
import { useToast } from '../hooks/use-toast';
import { toPng, toJpeg } from 'html-to-image';

export const ThemeView = () => {
  const { toast } = useToast();
  
  // Store
  const { brandingElements, setBrandingElements, updateBrandingElement } = useAppStore();
  
  // State
  const [activeLayoutId, setActiveLayoutId] = useState(LAYOUTS[0].id);
  const [editingElement, setEditingElement] = useState<BrandingElement | null>(null);
  const [roundColors, setRoundColors] = useState(false);
  const [activeTab, setActiveTab] = useState('layout');
  
  // New State for Customization
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('16:9');
  const [gap, setGap] = useState(16);
  const [borderRadius, setBorderRadius] = useState(16);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg'>('png');
  const [includeBackground, setIncludeBackground] = useState(true);
  
  const moodboardRef = useRef<HTMLDivElement>(null);

  // Seed Data if empty
  useEffect(() => {
    if (brandingElements.length === 0) {
        setBrandingElements(INITIAL_ELEMENTS);
    } else if (!brandingElements.some(e => e.type === 'typography')) {
        // Migration for existing users
        const typographyElement = INITIAL_ELEMENTS.find(e => e.type === 'typography');
        if (typographyElement) {
            setBrandingElements([...brandingElements, typographyElement]);
        }
    }
  }, [brandingElements, setBrandingElements]);

  // Handlers
  const handleSaveElement = async (id: string, data: any) => {
    try {
      updateBrandingElement(id, data);
      toast({ title: 'Actualizado', description: 'Los cambios se han guardado localmente.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el cambio.' });
    }
  };

  const handleReset = async () => {
    if (confirm('¿Restablecer todo el moodboard a los valores iniciales?')) {
      setBrandingElements(INITIAL_ELEMENTS);
      toast({ title: 'Restablecido', description: 'Moodboard reiniciado.' });
    }
  };

  const handleRandomLayout = () => {
    const random = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];
    setActiveLayoutId(random.id);
  };

  const handleExport = async () => {
    if (!moodboardRef.current) return;
    try {
      setIsExporting(true);
      // Pequeño retraso para asegurar que la UI se actualice (ej. ocultar bordes de edición si los hubiera)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const options = { 
        quality: 1, 
        pixelRatio: 2,
        cacheBust: true,
        style: { transform: 'scale(1)', transformOrigin: 'top left' },
        backgroundColor: includeBackground ? bgColor : 'transparent'
      };

      let dataUrl;
      if (exportFormat === 'jpg') {
        // JPG doesn't support transparency, so we force background if transparent is requested
        options.backgroundColor = includeBackground ? bgColor : '#ffffff';
        dataUrl = await toJpeg(moodboardRef.current, options);
      } else {
        dataUrl = await toPng(moodboardRef.current, options);
      }
      
      const link = document.createElement('a');
      link.download = `moodboard-marca.${exportFormat}`;
      link.href = dataUrl;
      link.click();
      
      toast({ title: 'Exportado', description: 'El moodboard se ha descargado correctamente.' });
    } catch (error) {
      console.error('Error exporting moodboard:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo exportar el moodboard.' });
    } finally {
      setIsExporting(false);
    }
  };

  // Grid Logic
  const activeLayout = LAYOUTS.find(l => l.id === activeLayoutId) || LAYOUTS[0];
  
  // Convert areas string array to CSS grid-template-areas string
  const gridTemplateAreas = activeLayout.areas.map(row => `"${row}"`).join(' ');
  const gridColumns = activeLayout.areas[0].split(' ').length;
  const gridRows = activeLayout.areas.length;

  // Mapping function for rendering
  const renderCell = (areaName: string) => {
    const element = brandingElements.find(e => e.id === areaName);
    if (!element) return <div key={areaName} style={{ gridArea: areaName, borderRadius: `${borderRadius}px` }} className="border border-dashed bg-muted/20"></div>;

    if (element.type === 'typography') {
      return (
        <TypographyCell 
            key={element.id} 
            element={element}
            onClick={() => setEditingElement(element)}
            style={{ gridArea: areaName, borderRadius: `${borderRadius}px` }}
            className="h-full w-full"
            aspectRatio={aspectRatio}
        />
      );
    }

    if (element.type === 'image') {
      return (
        <ImageCell 
            key={element.id} 
            element={element}
            onClick={() => setEditingElement(element)}
            style={{ gridArea: areaName, borderRadius: `${borderRadius}px` }}
            className="h-full w-full"
        />
      );
    }
    
    return (
        <ColorCell 
            key={element.id} 
            element={element}
            onClick={() => setEditingElement(element)}
            style={{ gridArea: areaName, borderRadius: `${borderRadius}px` }}
            className="h-full w-full"
            shape={roundColors ? 'circle' : 'square'}
        />
    );
  };

  // Collect unique area names from the layout string to render grid items
  const areaNames = useMemo(() => {
    const areas = new Set<string>();
    activeLayout.areas.forEach(row => {
      row.split(' ').forEach(area => areas.add(area));
    });
    return Array.from(areas);
  }, [activeLayout]);

  if (!brandingElements) return <div className="flex h-96 items-center justify-center"><RefreshCw className="animate-spin" /></div>;

  return (
    <PageLayout title="Moodboard Interactivo" subtitle="Define y visualiza la identidad de tu marca." onBackRoute="/app/dashboard">
      <div className="flex flex-col gap-6 lg:flex-row">
        
        {/* Controls Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
          <Card>
            <CardContent className="p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="layout">Layout</TabsTrigger>
                  <TabsTrigger value="styles">Estilos</TabsTrigger>
                  <TabsTrigger value="export">Exportar</TabsTrigger>
                </TabsList>

                {activeTab === 'layout' && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Proporción (Aspect Ratio)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant={aspectRatio === '9:16' ? 'default' : 'outline'} className="flex-col gap-2 h-16" onClick={() => setAspectRatio('9:16')}>
                          <Smartphone className="h-4 w-4" /> <span className="text-[10px]">9:16</span>
                        </Button>
                        <Button variant={aspectRatio === '1:1' ? 'default' : 'outline'} className="flex-col gap-2 h-16" onClick={() => setAspectRatio('1:1')}>
                          <Square className="h-4 w-4" /> <span className="text-[10px]">1:1</span>
                        </Button>
                        <Button variant={aspectRatio === '16:9' ? 'default' : 'outline'} className="flex-col gap-2 h-16" onClick={() => setAspectRatio('16:9')}>
                          <Monitor className="h-4 w-4" /> <span className="text-[10px]">16:9</span>
                        </Button>
                      </div>
                    </div>

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
                            <span className="text-[10px] text-center leading-tight">{layout.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button variant="secondary" className="w-full" onClick={handleRandomLayout}>
                        <Shuffle className="mr-2 h-4 w-4" /> Distribución Aleatoria
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'styles' && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label className="text-base font-semibold">Espaciado (Gap)</Label>
                        <span className="text-sm text-muted-foreground">{gap}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="48" step="4" 
                        value={gap} 
                        onChange={(e) => setGap(Number(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label className="text-base font-semibold">Redondeo (Radius)</Label>
                        <span className="text-sm text-muted-foreground">{borderRadius}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="64" step="4" 
                        value={borderRadius} 
                        onChange={(e) => setBorderRadius(Number(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Color de Fondo</Label>
                      <div className="flex gap-2">
                        <div className="h-10 w-10 shrink-0 rounded border" style={{backgroundColor: bgColor}}></div>
                        <Input type="text" value={bgColor} onChange={(e) => setBgColor(e.target.value)} placeholder="#ffffff" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                      <Label htmlFor="shape-toggle" className="flex flex-col">
                          <span className="font-semibold">Formas Suaves</span>
                          <span className="text-xs text-muted-foreground">Paleta circular</span>
                      </Label>
                      <Switch id="shape-toggle" checked={roundColors} onCheckedChange={setRoundColors} />
                    </div>
                  </div>
                )}

                {activeTab === 'export' && (
                  <div className="space-y-6">
                    <div className="bg-primary/5 rounded-lg p-4 text-sm text-primary border border-primary/20">
                      <p className="font-semibold mb-1">Exportar Moodboard</p>
                      <p>Descarga una imagen en alta resolución de tu moodboard para compartirla con tu equipo o clientes.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Formato de Imagen</Label>
                        <Select value={exportFormat} onValueChange={(v: 'png' | 'jpg') => setExportFormat(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="png">PNG (Alta calidad, soporta transparencia)</SelectItem>
                            <SelectItem value="jpg">JPG (Menor peso)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <Label htmlFor="bg-toggle" className="flex flex-col">
                            <span className="font-semibold">Incluir Fondo</span>
                            <span className="text-xs text-muted-foreground">Exportar con el color de fondo actual</span>
                        </Label>
                        <Switch id="bg-toggle" checked={includeBackground} onCheckedChange={setIncludeBackground} disabled={exportFormat === 'jpg'} />
                      </div>
                    </div>
                    
                    <Button className="w-full h-12 text-base" onClick={handleExport} disabled={isExporting}>
                      {isExporting ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                      {isExporting ? 'Generando...' : 'Descargar Imagen'}
                    </Button>

                    <div className="pt-4 border-t">
                      <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleReset}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Restablecer Todo
                      </Button>
                    </div>
                  </div>
                )}
              </Tabs>
            </CardContent>
          </Card>

          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground border">
            <p className="font-semibold mb-1">Nota:</p>
            <p>Los cambios se guardan automáticamente. Haz clic en cualquier elemento del moodboard para editarlo.</p>
          </div>
        </div>

        {/* Main Grid Canvas */}
        <div className="flex-grow flex justify-center items-start overflow-hidden">
          <div 
            ref={moodboardRef}
            className="w-full transition-all duration-300 ease-in-out"
            style={{ 
              aspectRatio: aspectRatio === '1:1' ? '1/1' : aspectRatio === '16:9' ? '16/9' : '9/16',
              backgroundColor: bgColor,
              padding: `${gap}px`,
              borderRadius: '16px', // Outer radius
            }}
          >
             {/* Mobile Stacked View (Fallback) */}
             <div className="flex flex-col md:hidden" style={{ gap: `${gap}px` }}>
                {brandingElements.filter(e => e.type === 'typography').map(e => (
                    <div key={e.id} className="w-full">{renderCell(e.id)}</div>
                ))}
                {brandingElements.filter(e => e.type === 'image').map(e => (
                    <div key={e.id} className="aspect-video w-full">{renderCell(e.id)}</div>
                ))}
                <div className="grid grid-cols-3" style={{ gap: `${gap}px` }}>
                    {brandingElements.filter(e => e.type === 'color').map(e => (
                        <div key={e.id} className="aspect-square">{renderCell(e.id)}</div>
                    ))}
                </div>
             </div>

             {/* Desktop CSS Grid */}
             <div 
                className="hidden md:grid h-full w-full transition-all duration-500 ease-in-out"
                style={{ 
                    gap: `${gap}px`,
                    gridTemplateAreas: gridTemplateAreas,
                    gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                    gridTemplateRows: `repeat(${gridRows}, 1fr)`
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
