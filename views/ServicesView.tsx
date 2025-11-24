import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ServicesView = () => {
  const navigate = useNavigate();
  const tools = [
    { id: 'clients', route: '/app/clientes', title: 'Gestión de Clientes', description: 'Base de datos, CRM y perfiles.', icon: 'fa-users', color: 'bg-blue-500/10 text-blue-600' },
    { id: 'documents', route: '/app/documentos', title: 'Generador Documentos', description: 'Cuentas de cobro y reportes.', icon: 'fa-file-invoice', color: 'bg-orange-500/10 text-orange-600' },
    { id: 'cotizador', route: '/app/cotizador', title: 'Cotizador', description: 'Calculadora rápida de seguridad social.', icon: 'fa-calculator', color: 'bg-green-500/10 text-green-600' },
    { id: 'theme', route: '/app/theme', title: 'Branding', description: 'Visualización de marca.', icon: 'fa-palette', color: 'bg-purple-500/10 text-purple-600' }
  ];

  return (
    <div className="max-w-7xl mx-auto mt-8 md:mt-16 px-4 md:px-0">
        <div className="text-center mb-12 md:mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-block p-4 rounded-3xl bg-primary/10 mb-6 shadow-inner"><div className="text-primary text-5xl font-bold font-belanosima">CF</div></div>
            <h1 className="text-4xl md:text-6xl font-bold font-belanosima text-foreground mb-4 tracking-tight leading-tight">Herramientas</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">Selecciona una herramienta para comenzar a administrar tu negocio de seguridad social.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            {tools.map((t) => (
                <div key={t.id} onClick={() => navigate(t.route)} className="group bg-card p-6 rounded-3xl border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col items-center text-center h-full hover:-translate-y-2">
                    <div className={`h-20 w-20 ${t.color} rounded-2xl flex items-center justify-center mb-6 text-3xl shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}><i className={`fas ${t.icon}`}></i></div>
                    <h3 className="font-bold text-2xl mb-3 text-foreground group-hover:text-primary transition-colors font-belanosima">{t.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{t.description}</p>
                    <div className="mt-auto pt-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                        <span className="text-xs font-bold text-primary uppercase tracking-widest flex items-center justify-center gap-1">Ingresar <ArrowLeft className="w-3 h-3 rotate-180" /></span>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};