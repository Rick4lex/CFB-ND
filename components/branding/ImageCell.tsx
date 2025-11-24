import React, { useState } from 'react';
import { Edit2, AlertTriangle, Loader2 } from 'lucide-react';
import { BrandingElement } from '../../lib/db';

interface ImageCellProps {
  element: BrandingElement;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ImageCell = ({ element, onClick, className, style }: ImageCellProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Reset states when URL changes
  React.useEffect(() => {
    setLoading(true);
    setError(false);
  }, [element.data.url]);

  return (
    <div 
        className={`group relative overflow-hidden rounded-xl border bg-muted/20 transition-all hover:shadow-lg cursor-pointer ${className}`}
        style={style}
        onClick={onClick}
    >
        {element.data.url && !error ? (
            <>
                <img 
                    src={element.data.url} 
                    alt={element.label}
                    className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${loading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setLoading(false)}
                    onError={() => { setLoading(false); setError(true); }}
                />
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}
            </>
        ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
                <AlertTriangle className="h-8 w-8 opacity-50" />
                <span className="text-xs font-medium">Sin imagen o enlace roto</span>
            </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-black shadow-sm">
                <Edit2 className="h-3 w-3" /> Editar {element.label}
            </div>
        </div>
        
        {/* Label Badge */}
        <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold text-white opacity-70 group-hover:opacity-0 transition-opacity">
            {element.label}
        </div>
    </div>
  );
};