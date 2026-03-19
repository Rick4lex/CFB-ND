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

  // Load fonts dynamically
  const fontLink = `https://fonts.googleapis.com/css2?family=${primaryFont.replace(/ /g, '+')}:wght@400;600;700&family=${secondaryFont.replace(/ /g, '+')}:wght@400;600;700&display=swap`;

  const isShort = aspectRatio === '16:9' || aspectRatio === '1:1';

  return (
    <div 
      onClick={onClick}
      style={style}
      className={`relative overflow-hidden rounded-xl border bg-card ${isShort ? 'p-3 md:p-4' : 'p-4 md:p-6'} shadow-sm transition-all hover:ring-2 hover:ring-primary/50 cursor-pointer flex flex-col justify-center ${className}`}
    >
      <link href={fontLink} rel="stylesheet" />
      
      <div className="absolute top-2 right-2 rounded-md bg-background/80 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur-sm z-10">
        {element.label}
      </div>

      <div className={`flex flex-col h-full justify-center ${isShort ? 'gap-1 md:gap-2' : 'gap-2 md:gap-4'} overflow-hidden`}>
        <div className="flex flex-col min-h-0">
          <p className={`text-[10px] ${isShort ? 'md:text-[10px]' : 'md:text-xs'} text-muted-foreground mb-0.5 uppercase tracking-wider truncate shrink-0`}>Principal: {primaryFont}</p>
          <div className={`flex items-end ${isShort ? 'gap-2 md:gap-3' : 'gap-3 md:gap-4'} min-h-0`}>
            <h1 
              style={{ fontFamily: `"${primaryFont}", sans-serif` }} 
              className={`${isShort ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-3xl md:text-5xl lg:text-6xl'} font-bold leading-none tracking-tight text-foreground shrink-0`}
            >
              Aa
            </h1>
            <p style={{ fontFamily: `"${primaryFont}", sans-serif` }} className={`text-xs ${isShort ? 'md:text-xs line-clamp-1' : 'md:text-sm line-clamp-1 md:line-clamp-2'} font-medium overflow-hidden pb-1`}>
              {customText}
            </p>
          </div>
        </div>

        <div className={`h-px w-full bg-border/50 ${isShort ? 'my-1' : 'my-1 md:my-2'} shrink-0`} />

        <div className="flex flex-col min-h-0">
          <p className={`text-[10px] ${isShort ? 'md:text-[10px]' : 'md:text-xs'} text-muted-foreground mb-0.5 uppercase tracking-wider truncate shrink-0`}>Secundaria: {secondaryFont}</p>
          <div className={`flex items-end ${isShort ? 'gap-2 md:gap-3' : 'gap-3 md:gap-4'} min-h-0`}>
            <h2 
              style={{ fontFamily: `"${secondaryFont}", serif` }} 
              className={`${isShort ? 'text-xl md:text-2xl lg:text-3xl' : 'text-2xl md:text-3xl lg:text-4xl'} font-semibold leading-none text-foreground/90 shrink-0`}
            >
              Aa
            </h2>
            <p style={{ fontFamily: `"${secondaryFont}", serif` }} className={`text-[10px] ${isShort ? 'md:text-[10px] line-clamp-1' : 'md:text-xs line-clamp-1 md:line-clamp-2'} text-muted-foreground overflow-hidden pb-1`}>
              {customText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
