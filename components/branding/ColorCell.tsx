import React from 'react';
import { Edit2 } from 'lucide-react';
import { BrandingElement } from '../../lib/db';

interface ColorCellProps {
  element: BrandingElement;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
  shape?: 'square' | 'circle';
}

export const ColorCell: React.FC<ColorCellProps> = ({ element, onClick, className, style, shape = 'square' }) => {
  const { color1, color2, style: patternStyle } = element.data;

  const getBackgroundStyle = () => {
    if (patternStyle === 'diagonal' && color2) {
      return { background: `linear-gradient(45deg, ${color1} 50%, ${color2} 50%)` };
    }
    if (patternStyle === 'central-circle' && color2) {
      return { background: `radial-gradient(circle, ${color2} 30%, ${color1} 31%)` };
    }
    return { backgroundColor: color1 };
  };

  const borderRadius = shape === 'circle' ? '50%' : '0.75rem'; // rounded-xl

  return (
    <div 
        className={`group relative overflow-hidden border shadow-sm transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer ${className}`}
        style={{ ...style, ...getBackgroundStyle(), borderRadius }}
        onClick={onClick}
    >
        {/* Hover Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
            <Edit2 className="h-4 w-4 text-white drop-shadow-md" />
            <span className="rounded bg-black/50 px-1 py-0.5 text-[10px] font-mono text-white backdrop-blur-sm">
                {color1}
            </span>
        </div>
    </div>
  );
};