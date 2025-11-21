
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppHeader, ThemeToggleButton, PageLayout } from './components/layout/Layout';
import { TokenView } from './views/TokenView';
import { Loader2 } from 'lucide-react';

// --- Lazy Load Views ---
const ServicesView = React.lazy(() => import('./views/ServicesView').then(module => ({ default: module.ServicesView })));
const ClientsView = React.lazy(() => import('./views/ClientsView').then(module => ({ default: module.ClientsView })));
const DocumentsView = React.lazy(() => import('./views/DocumentsView').then(module => ({ default: module.DocumentsView })));
const CotizadorView = React.lazy(() => import('./views/CotizadorView').then(module => ({ default: module.CotizadorView })));

// --- Components ---
const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background text-muted-foreground">
    <Loader2 className="h-10 w-10 animate-spin" />
  </div>
);

const ProtectedLayout = () => {
  const isAuthenticated = !!localStorage.getItem('cfbnd_token');

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 flex flex-col selection:bg-primary/30">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8 flex flex-col">
            <Suspense fallback={<LoadingScreen />}>
                <Outlet />
            </Suspense>
        </main>
        <ThemeToggleButton />
    </div>
  );
};

const ThemeView = () => (
    <PageLayout title="Branding Kit" onBackRoute="/app/dashboard">
        <div className="p-10 text-center">Vista de prueba de tema y colores.</div>
    </PageLayout>
);

const App = () => {
  return (
      <ThemeProvider>
        <HashRouter>
            <Routes>
                {/* Public Route */}
                <Route path="/" element={<TokenView />} />

                {/* Protected Routes */}
                <Route path="/app" element={<ProtectedLayout />}>
                    <Route path="dashboard" element={<ServicesView />} />
                    <Route path="clientes" element={<ClientsView />} />
                    <Route path="documentos" element={<DocumentsView />} />
                    <Route path="cotizador" element={<CotizadorView />} />
                    <Route path="theme" element={<ThemeView />} />
                    {/* Default Redirect within app */}
                    <Route index element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
      </ThemeProvider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
