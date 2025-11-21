import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const ServicesView = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
  const tools = [
    { id: 'clients', title: 'Gestión de Clientes', description: 'Base de datos, CRM y perfiles.', icon: 'fa-users', color: 'bg-blue-500/10 text-blue-600' },
    { id: 'documents', title: 'Generador Documentos', description: 'Cuentas de cobro y reportes.', icon: 'fa-file-invoice', color: 'bg-orange-500/10 text-orange-600' },
    { id: 'cotizador', title: 'Cotizador', description: 'Calculadora rápida de seguridad social.', icon: 'fa-calculator', color: 'bg-green-500/10 text-green-600' },
    { id: 'theme', title: 'Branding', description: 'Visualización de marca.', icon: 'fa-palette', color: 'bg-purple-500/10 text-purple-600' }
  ];
  return (
    <div className="max-w-5xl mx-auto mt-12">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-block p-3 rounded-2xl bg-primary/10 mb-4"><div className="text-primary text-4xl font-bold font-belanosima">CF</div></div>
            <h1 className="text-5xl font-bold font-belanosima text-foreground mb-4 tracking-tight">Herramientas</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Selecciona una herramienta para comenzar a administrar tu negocio de seguridad social.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            {tools.map((t) => (
                <div key={t.id} onClick={() => onNavigate(t.id)} className="group bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 cursor-pointer transition-all duration-300 relative overflow-hidden">
                    <div className={`h-16 w-16 ${t.color} rounded-2xl flex items-center justify-center mb-6 text-2xl shadow-sm group-hover:scale-110 transition-transform`}><i className={`fas ${t.icon}`}></i></div>
                    <h3 className="font-bold text-2xl mb-2 text-foreground group-hover:text-primary transition-colors font-belanosima">{t.title}</h3>
                    <p className="text-muted-foreground">{t.description}</p>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary"><ArrowLeft className="w-5 h-5 rotate-180" /></div>
                </div>
            ))}
        </div>
    </div>
  );
};