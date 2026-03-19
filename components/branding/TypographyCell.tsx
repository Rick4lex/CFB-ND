import { BrandingElement } from '../../lib/db';

interface TypographyCellProps {
  element: BrandingElement;
  onClick: () => void;
  style?: React.CSSProperties;
  className?: string;
  aspectRatio?: string;
}

export function TypographyCell({ element, onClick, style, className = '', aspectRatio = '1:1' }: TypographyCellProps) {
  const primaryFont = element.data.fontFamily || 'Inter';
  const secondaryFont = element.data.secondaryFontFamily || 'Playfair Display';
  const customText = element.data.text || 'El rápido zorro marrón salta sobre el perro perezoso.';
  const textColor = element.data.textColor || '';
  const bgColor = element.data.bgColor || '';

  // Load fonts dynamically
  const fontLink = `https://fonts.googleapis.com/css2?family=${primaryFont.replace(/ /g, '+')}:wght@400;600;700&family=${secondaryFont.replace(/ /g, '+')}:wght@400;600;700&display=swap`;

  const isShort = aspectRatio === '16:9' || aspectRatio === '1:1';

  return (
    <div 
      onClick={onClick}
      style={{ ...style, backgroundColor: bgColor || undefined, color: textColor || undefined }}
      className={`relative overflow-hidden rounded-xl border ${!bgColor ? 'bg-card' : ''} ${isShort ? 'p-4 md:p-6' : 'p-6 md:p-8'} shadow-sm transition-all hover:ring-2 hover:ring-primary/50 cursor-pointer flex flex-col justify-center ${className}`}
    >
      <link href={fontLink} rel="stylesheet" />
      
      <div className="absolute top-2 right-2 rounded-md bg-background/80 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur-sm z-10">
        {element.label}
      </div>

      <div className={`flex flex-col md:flex-row h-full justify-center items-center ${isShort ? 'gap-4 md:gap-6' : 'gap-6 md:gap-8'} overflow-hidden w-full`}>
        
        {/* Primary Font */}
        <div className="flex flex-col min-h-0 w-full md:flex-1 justify-center overflow-hidden">
          <p className={`text-[10px] ${isShort ? 'md:text-[10px]' : 'md:text-xs'} mb-1 md:mb-2 uppercase tracking-wider truncate shrink-0`} style={{ color: textColor || 'var(--muted-foreground)', opacity: textColor ? 0.8 : 1 }}>
            Principal: {primaryFont}
          </p>
          <div className={`flex flex-col items-start gap-1 md:gap-2 min-h-0 w-full`}>
            <h1 
              style={{ fontFamily: `"${primaryFont}", sans-serif`, color: textColor || 'var(--foreground)' }} 
              className={`${isShort ? 'text-4xl md:text-5xl lg:text-6xl' : 'text-5xl md:text-6xl lg:text-7xl'} font-bold leading-none tracking-tight shrink-0`}
            >
              Aa
            </h1>
            <p style={{ fontFamily: `"${primaryFont}", sans-serif`, color: textColor || 'var(--foreground)' }} className={`text-xs ${isShort ? 'md:text-sm line-clamp-2' : 'md:text-base line-clamp-2'} font-medium overflow-hidden w-full`}>
              {customText}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className={`hidden md:block w-px h-3/4 shrink-0`} style={{ backgroundColor: textColor ? `${textColor}40` : 'var(--border)' }} />
        <div className={`md:hidden h-px w-full shrink-0`} style={{ backgroundColor: textColor ? `${textColor}40` : 'var(--border)' }} />

        {/* Secondary Font */}
        <div className="flex flex-col min-h-0 w-full md:flex-1 justify-center overflow-hidden">
          <p className={`text-[10px] ${isShort ? 'md:text-[10px]' : 'md:text-xs'} mb-1 md:mb-2 uppercase tracking-wider truncate shrink-0`} style={{ color: textColor || 'var(--muted-foreground)', opacity: textColor ? 0.8 : 1 }}>
            Secundaria: {secondaryFont}
          </p>
          <div className={`flex flex-col items-start gap-1 md:gap-2 min-h-0 w-full`}>
            <h2 
              style={{ fontFamily: `"${secondaryFont}", serif`, color: textColor || 'var(--foreground)' }} 
              className={`${isShort ? 'text-3xl md:text-4xl lg:text-5xl' : 'text-4xl md:text-5xl lg:text-6xl'} font-semibold leading-none shrink-0`}
            >
              Aa
            </h2>
            <p style={{ fontFamily: `"${secondaryFont}", serif`, color: textColor || 'var(--muted-foreground)' }} className={`text-[10px] ${isShort ? 'md:text-xs line-clamp-2' : 'md:text-sm line-clamp-2'} overflow-hidden w-full`}>
              {customText}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
