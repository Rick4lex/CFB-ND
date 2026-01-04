
import { type ReactNode } from 'react';
import { LogOut, ArrowLeft, Sun, Moon, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export const AppHeader = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        if(window.confirm('¿Cerrar sesión?')) {
            localStorage.removeItem('cfbnd_token');
            navigate('/');
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-colors duration-500">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/app/dashboard')}>
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold font-belanosima text-xl shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">CF</div>
                    <div className="hidden sm:flex flex-col">
                        <span className="font-bold text-xl font-belanosima leading-none tracking-tight">CFBND</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Plataforma</span>
                    </div>
                </div>
                <nav className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/app/config')}
                        className="text-sm font-medium hover:text-primary transition-colors hidden md:flex items-center gap-2 hover:bg-secondary/50 px-3 py-2 rounded-lg"
                    >
                        <Settings className="w-4 h-4" /> Configuración
                    </button>
                    <div className="h-6 w-px bg-border hidden md:block"></div>
                    <button onClick={handleLogout} className="text-destructive hover:bg-destructive/10 p-2 rounded-full transition-colors active:scale-90" title="Cerrar Sesión">
                        <LogOut className="w-5 h-5" />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-secondary to-primary flex items-center justify-center text-secondary-foreground text-xs font-bold ring-2 ring-background shadow-md">AD</div>
                </nav>
            </div>
        </header>
    );
};

interface PageLayoutProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    onBackRoute?: string;
    actions?: ReactNode;
    children?: ReactNode;
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col gap-6 mb-8">
                {(onBack || onBackRoute) && (
                    <button onClick={handleBack} className="group flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit">
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Volver
                    </button>
                )}
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-border/60">
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold font-belanosima text-foreground tracking-tight leading-tight">{title}</h1>
                        {subtitle && <p className="text-muted-foreground text-base md:text-lg max-w-2xl">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex flex-wrap gap-3 w-full md:w-auto">{actions}</div>}
                </div>
            </div>
            
            <main className="space-y-8">
                {children}
            </main>
        </div>
    );
};

export const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="fixed bottom-6 right-6 h-12 w-12 flex items-center justify-center rounded-full shadow-xl border border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground z-50 transition-all duration-300 hover:scale-110 active:scale-95">
      {theme === 'dark' ? <Sun className="h-6 w-6 text-yellow-500 fill-yellow-500" /> : <Moon className="h-6 w-6 text-blue-600 fill-blue-600" />}
    </button>
  );
};
