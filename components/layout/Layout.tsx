import React, { useState } from 'react';
import { LogOut, ArrowLeft, Sun, Moon, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { GlobalConfigDialog } from '../features/GlobalConfigDialog';

export const AppHeader = () => {
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        if(window.confirm('¿Cerrar sesión?')) {
            localStorage.removeItem('cfbnd_token');
            navigate('/');
        }
    };

    return (
        <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/app/dashboard')}>
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold font-belanosima text-xl shadow-md group-hover:scale-105 group-hover:shadow-lg transition-all duration-300 transform group-hover:-rotate-3">CF</div>
                    <div className="hidden sm:flex flex-col">
                        <span className="font-bold text-lg font-belanosima leading-none text-foreground group-hover:text-primary transition-colors">CFBND</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Plataforma</span>
                    </div>
                </div>
                <nav className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsConfigOpen(true)}
                        className="text-sm font-medium hover:text-primary transition-colors hidden md:flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted/50"
                    >
                        <Settings className="w-4 h-4" /> Soporte & Config
                    </button>
                    <div className="h-6 w-px bg-border hidden md:block"></div>
                    <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-full transition-all duration-200" title="Cerrar Sesión">
                        <LogOut className="w-5 h-5" />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-foreground text-xs font-bold ring-2 ring-background shadow-md cursor-default select-none">AD</div>
                </nav>
            </div>
            <GlobalConfigDialog isOpen={isConfigOpen} onOpenChange={setIsConfigOpen} />
        </header>
    );
};

interface PageLayoutProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    onBackRoute?: string;
    actions?: React.ReactNode;
    children?: React.ReactNode;
}

export const PageLayout = ({ title, subtitle, onBack, onBackRoute, actions, children }: PageLayoutProps) => {
    const navigate = useNavigate();
    
    const handleBack = () => {
        if (onBack) {
            onBack();
        } else if (onBackRoute) {
            navigate(onBackRoute);
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out pb-24">
            {(onBack || onBackRoute) && (
                <button onClick={handleBack} className="group flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-all w-fit px-2 py-1 -ml-2 rounded-md hover:bg-muted/50">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Volver
                </button>
            )}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6 border-b border-border/60 pb-6">
                <div className="max-w-2xl">
                    <h1 className="text-3xl md:text-4xl font-bold font-belanosima text-foreground tracking-tight leading-tight">{title}</h1>
                    {subtitle && <p className="text-muted-foreground mt-3 text-lg leading-relaxed">{subtitle}</p>}
                </div>
                {actions && <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-start lg:justify-end">{actions}</div>}
            </div>
            {children}
        </div>
    );
};

export const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button 
        onClick={toggleTheme} 
        className="fixed bottom-6 right-6 h-12 w-12 flex items-center justify-center rounded-full shadow-xl border border-border/50 bg-card/80 backdrop-blur-sm text-card-foreground hover:bg-accent hover:text-accent-foreground z-40 transition-all duration-300 hover:scale-110 active:scale-95 group"
    >
      {theme === 'dark' ? 
        <Sun className="h-6 w-6 text-yellow-500 transition-transform duration-500 rotate-0 group-hover:rotate-45" /> : 
        <Moon className="h-6 w-6 text-blue-600 transition-transform duration-500 rotate-0 group-hover:-rotate-12" />
      }
    </button>
  );
};