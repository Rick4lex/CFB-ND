
import './index.css';
import { Suspense, useEffect, lazy, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppHeader, ThemeToggleButton } from './components/layout/Layout';
import { TokenView } from './views/TokenView';
import { Loader2 } from 'lucide-react';
import { useAppStore } from './lib/store';

// --- Lazy Load Views ---
const ServicesView = lazy(() => import('./views/ServicesView').then(module => ({ default: module.ServicesView })));
const ClientsView = lazy(() => import('./views/ClientsView').then(module => ({ default: module.ClientsView })));
const DocumentsView = lazy(() => import('./views/DocumentsView').then(module => ({ default: module.DocumentsView })));
const CotizadorView = lazy(() => import('./views/CotizadorView').then(module => ({ default: module.CotizadorView })));
const ThemeView = lazy(() => import('./views/ThemeView').then(module => ({ default: module.ThemeView })));
const ConfigView = lazy(() => import('./views/ConfigView').then(module => ({ default: module.ConfigView })));

// --- Components ---
const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background text-muted-foreground">
    <Loader2 className="h-10 w-10 animate-spin" />
  </div>
);

const ProtectedLayout = ({ children }: { children?: ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem('cfbnd_token');

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 flex flex-col selection:bg-primary/30">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8 flex flex-col">
            <Suspense fallback={<LoadingScreen />}>
                {children}
            </Suspense>
        </main>
        <ThemeToggleButton />
    </div>
  );
};

const App = () => {
  const initStore = useAppStore(state => state.initStore);
  const isInitialized = useAppStore(state => state.isInitialized);

  useEffect(() => {
    initStore();
  }, []);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
      <ThemeProvider>
        <HashRouter>
            <Routes>
                {/* Public Route */}
                <Route path="/" element={<TokenView />} />

                {/* Protected Routes */}
                <Route path="/app/*" element={
                    <ProtectedLayout>
                        <Routes>
                            <Route path="dashboard" element={<ServicesView />} />
                            <Route path="clientes" element={<ClientsView />} />
                            <Route path="documentos" element={<DocumentsView />} />
                            <Route path="cotizador" element={<CotizadorView />} />
                            <Route path="theme" element={<ThemeView />} />
                            <Route path="config" element={<ConfigView />} />
                            {/* Default Redirect within app */}
                            <Route path="*" element={<Navigate to="dashboard" replace />} />
                        </Routes>
                    </ProtectedLayout>
                } />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
      </ThemeProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
