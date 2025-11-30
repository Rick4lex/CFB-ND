
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ServicesView = () => {
  const navigate = useNavigate();
  const tools = [
    { id: 'clients', route: '/app/clientes', title: 'Gestión de Clientes', description: 'CRM, base de datos y perfiles detallados.', icon: 'fa-users', color: 'bg-blue-500/10 text-blue-600', gradient: 'from-blue-500/20 to-blue-500/5' },
    { id: 'documents', route: '/app/documentos', title: 'Generador Documentos', description: 'Cuentas de cobro automáticas y reportes.', icon: 'fa-file-invoice', color: 'bg-orange-500/10 text-orange-600', gradient: 'from-orange-500/20 to-orange-500/5' },
    { id: 'cotizador', route: '/app/cotizador', title: 'Cotizador', description: 'Calculadora rápida de seguridad social.', icon: 'fa-calculator', color: 'bg-green-500/10 text-green-600', gradient: 'from-green-500/20 to-green-500/5' },
    { id: 'theme', route: '/app/theme', title: 'Branding', description: 'Visualización de recursos de marca.', icon: 'fa-palette', color: 'bg-purple-500/10 text-purple-600', gradient: 'from-purple-500/20 to-purple-500/5' }
  ];

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6">
        <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex p-4 rounded-3xl bg-primary/10 mb-6 shadow-inner ring-1 ring-primary/20"><div className="text-primary text-5xl font-bold font-belanosima">CF</div></div>
            <h1 className="text-5xl sm:text-6xl font-bold font-belanosima text-foreground mb-6 tracking-tight">Herramientas</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">Selecciona una herramienta para comenzar a administrar tu negocio de seguridad social con eficiencia.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-100">
            {tools.map((t) => (
                <div 
                    key={t.id} 
                    onClick={() => navigate(t.route)} 
                    className="group relative bg-card p-8 rounded-3xl border border-border/60 shadow-sm hover:shadow-2xl hover:border-primary/20 cursor-pointer transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                >
                    <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                    <div className={`h-16 w-16 ${t.color} rounded-2xl flex items-center justify-center mb-6 text-2xl shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 relative z-10`}>
                        <i className={`fas ${t.icon}`}></i>
                    </div>
                    <div className="relative z-10">
                        <h3 className="font-bold text-2xl mb-3 text-foreground group-hover:text-primary transition-colors font-belanosima">{t.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{t.description}</p>
                    </div>
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 text-primary">
                        <ArrowLeft className="w-6 h-6 rotate-180" />
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
