
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import { AppHeader, PageLayout, ThemeToggleButton } from './components/layout/Layout';
import { ServicesView } from './views/ServicesView';
import { ClientsView } from './views/ClientsView';
import { DocumentsView } from './views/DocumentsView';
import { TokenView } from './views/TokenView';
import { CotizadorView } from './views/CotizadorView';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('services');
  const [viewParams, setViewParams] = useState<any>({});

  useEffect(() => { if (localStorage.getItem('cfbnd_token')) setIsAuthenticated(true); }, []);
  const handleLogout = () => { localStorage.removeItem('cfbnd_token'); setIsAuthenticated(false); setCurrentView('services'); };
  const navigate = (view: string, params: any = {}) => { setCurrentView(view); setViewParams(params); };

  if (!isAuthenticated) return <ThemeProvider><TokenView onVerified={() => setIsAuthenticated(true)} /></ThemeProvider>;

  return (
      <ThemeProvider>
        <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 flex flex-col selection:bg-primary/30">
            <AppHeader onNavigate={navigate} onLogout={handleLogout} />
            <main className="flex-grow container mx-auto px-4 py-8 flex flex-col">
                {currentView === 'services' && <ServicesView onNavigate={navigate} />}
                {currentView === 'clients' && <ClientsView onNavigate={navigate} />}
                {currentView === 'documents' && <DocumentsView onBack={() => navigate('services')} initialClientId={viewParams.clientId} />}
                {currentView === 'cotizador' && <CotizadorView onBack={() => navigate('services')} />}
                {currentView === 'theme' && <PageLayout title="Branding Kit" onBack={() => navigate('services')}><div className="p-10 text-center">Vista de prueba de tema.</div></PageLayout>}
            </main>
            <ThemeToggleButton />
        </div>
      </ThemeProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
