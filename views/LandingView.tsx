import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Calculator, ArrowRight, CheckCircle2, AlertTriangle, MessageCircle, Info } from 'lucide-react';

export const LandingView = () => {
    // Cotizador Lite State
    const [income, setIncome] = useState<string>('');
    const [risk, setRisk] = useState<string>('1');
    const [ccf, setCcf] = useState<string>('0');
    const [apply40, setApply40] = useState<boolean>(true);

    // Basic calculation logic for Lite Cotizador
    const smlv = 1423500;
    const calculateAportes = () => {
        const numIncome = parseFloat(income.replace(/\D/g, '')) || 0;
        const ibc = apply40 ? Math.max(numIncome * 0.4, smlv) : Math.max(numIncome, smlv);
        
        const eps = ibc * 0.125;
        const pension = ibc * 0.16;
        
        let arlRate = 0.00522;
        if (risk === '2') arlRate = 0.01044;
        if (risk === '3') arlRate = 0.02436;
        if (risk === '4') arlRate = 0.04350;
        if (risk === '5') arlRate = 0.06960;
        
        const arl = ibc * arlRate;

        let ccfRate = 0;
        if (ccf === '0.6') ccfRate = 0.006;
        if (ccf === '2') ccfRate = 0.02;

        const ccfAmount = ibc * ccfRate;

        const total = eps + pension + arl + ccfAmount;
        
        return {
            ibc,
            total: Math.round(total),
            eps: Math.round(eps),
            pension: Math.round(pension),
            arl: Math.round(arl),
            ccf: Math.round(ccfAmount),
            arlRate,
            ccfRate
        };
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
    };

    const calc = calculateAportes();
    const whatsappMessage = `Hola, vengo de la página web y me gustaría asesoría con mi Seguridad Social. Calculé mis aportes por ${formatCurrency(calc.total)} y quiero gestionar mi planilla.`;
    const whatsappLink = `https://wa.me/573157513325?text=${encodeURIComponent(whatsappMessage)}`;

    return (
        <div className="min-h-screen font-sans selection:bg-[#641E1E]/20" style={{ backgroundColor: '#F5F5DC', color: '#2A2A2A' }}>
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-[#F5F5DC]/90 border-b border-[#641E1E]/10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-[#641E1E] rounded-lg flex items-center justify-center text-[#F5F5DC] font-bold">CF</div>
                        <span className="font-bold text-xl" style={{ color: '#641E1E' }}>CFBra!nd</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 font-medium text-sm">
                        <a href="#inicio" className="hover:text-[#641E1E] transition-colors">Inicio</a>
                        <a href="#servicios" className="hover:text-[#641E1E] transition-colors">Servicios</a>
                        <a href="#cotizador" className="hover:text-[#641E1E] transition-colors">Cotizador</a>
                        <a href="#novedades" className="hover:text-[#641E1E] transition-colors">Novedades</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="p-2 hover:bg-[#641E1E]/10 rounded-full transition-colors text-[#641E1E]" title="Acceso Staff">
                            <Lock className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section id="inicio" className="relative pt-20 pb-32 overflow-hidden">
                <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-8">
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight" style={{ color: '#641E1E' }}>
                            Seguridad Social <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#641E1E] to-red-600">sin enredos.</span>
                        </h1>
                        <p className="text-lg md:text-xl max-w-xl text-gray-700 leading-relaxed">
                            Gestión experta de liquidación y aportes en Planilla PILA, ARL Express y Afiliaciones para independientes y empresas en Colombia.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href="#cotizador" className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white transition-transform hover:scale-105" style={{ backgroundColor: '#641E1E' }}>
                                Cotizar mi Planilla <ArrowRight className="ml-2 w-5 h-5" />
                            </a>
                            <a href="https://wa.me/573157513325?text=Hola,%20vengo%20de%20la%20p%C3%A1gina%20web%20y%20me%20gustar%C3%ADa%20asesor%C3%ADa%20con%20mi%20Seguridad%20Social" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold transition-colors hover:bg-[#641E1E]/10" style={{ color: '#641E1E', border: '2px solid #641E1E' }}>
                                <MessageCircle className="mr-2 w-5 h-5" /> Hablar con un asesor
                            </a>
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        {/* Abstract/Trust visual representation */}
                        <div className="aspect-square max-w-md mx-auto relative">
                            <div className="absolute inset-0 bg-[#641E1E]/10 rounded-full blur-3xl"></div>
                            <div className="relative h-full w-full bg-white/60 backdrop-blur-sm border border-white/40 rounded-3xl shadow-2xl p-8 flex flex-col justify-center items-center text-center">
                                <CheckCircle2 className="w-24 h-24 mb-6" style={{ color: '#641E1E' }} />
                                <h3 className="text-3xl font-bold mb-4" style={{ color: '#641E1E' }}>Tranquilidad Total</h3>
                                <p className="text-gray-700 text-lg">Nos encargamos de los trámites para que tú te enfoques en tu trabajo.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="servicios" className="py-24 bg-white/50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4" style={{ color: '#641E1E' }}>Nuestros Servicios</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Soluciones rápidas y transparentes para tu seguridad social.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Card 1 */}
                        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative transform transition-transform hover:-translate-y-2">
                            <div className="absolute top-0 right-8 transform -translate-y-1/2">
                                <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">Más Popular</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Planilla Mensual</h3>
                            <p className="text-gray-500 mb-6">Liquidación de novedades PILA</p>
                            <div className="text-4xl font-extrabold mb-6" style={{ color: '#641E1E' }}>$15.000<span className="text-lg text-gray-400 font-normal">/mes</span></div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> Liquidación exacta</li>
                                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> Envío de planilla lista</li>
                                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> Soporte por WhatsApp</li>
                            </ul>
                            <a href="https://wa.me/573157513325?text=Me%20interesa%20la%20gesti%C3%B3n%20de%20Planilla%20Mensual" target="_blank" rel="noreferrer" className="block w-full py-3 rounded-xl font-bold text-center text-white transition-colors hover:bg-opacity-90" style={{ backgroundColor: '#641E1E' }}>Solicitar</a>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white rounded-3xl p-8 shadow-lg border-2 relative transform transition-transform hover:-translate-y-2 flex flex-col" style={{ borderColor: '#641E1E' }}>
                            <h3 className="text-2xl font-bold mb-2">ARL Express</h3>
                            <p className="text-gray-500 mb-6">Soporte de Ingreso en 24h</p>
                            <div className="space-y-4 mb-6 flex-grow">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">1 a 8 días</span>
                                    <span className="font-bold">$6.000</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">9 a 15 días</span>
                                    <span className="font-bold">$10.000</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                    <span className="text-gray-600">16 a 28 días</span>
                                    <span className="font-bold">$15.000</span>
                                </div>
                            </div>
                            <div className="bg-red-50 p-3 rounded-xl mb-8 border border-red-100">
                                <div className="flex items-start">
                                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-800 leading-tight"><strong>Riesgo 4 y 5:</strong> Especialistas en alta peligrosidad. Incluye pago de aportes en planilla.</p>
                                </div>
                            </div>
                            <a href="https://wa.me/573157513325?text=Me%20interesa%20ARL%20Express" target="_blank" rel="noreferrer" className="block w-full py-3 rounded-xl font-bold text-center transition-colors hover:bg-[#641E1E]/10 mt-auto" style={{ color: '#641E1E', border: '2px solid #641E1E' }}>Solicitar</a>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 transform transition-transform hover:-translate-y-2">
                            <h3 className="text-2xl font-bold mb-2">Afiliaciones Nuevas</h3>
                            <p className="text-gray-500 mb-6">El paquete completo para iniciar</p>
                            <div className="text-4xl font-extrabold mb-6" style={{ color: '#641E1E' }}>$15.000<span className="text-lg text-gray-400 font-normal">/entidad</span></div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> Afiliación EPS</li>
                                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> Afiliación ARL</li>
                                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> Afiliación CCF</li>
                                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> Afiliación Pensión</li>
                            </ul>
                            <a href="https://wa.me/573157513325?text=Me%20interesan%20las%20Afiliaciones%20Nuevas" target="_blank" rel="noreferrer" className="block w-full py-3 rounded-xl font-bold text-center text-white transition-colors hover:bg-opacity-90" style={{ backgroundColor: '#641E1E' }}>Solicitar</a>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="mt-16 text-center">
                        <p className="text-sm text-gray-500 uppercase tracking-widest font-semibold mb-6">Medios de Pago Disponibles</p>
                        <div className="flex flex-wrap justify-center items-center gap-8 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                            <span className="text-2xl font-black text-[#5C1B8A]">Nequi</span>
                            <span className="text-2xl font-black text-[#E51A22]">DaviPlata</span>
                            <span className="text-2xl font-black text-[#00D06C]">dale!</span>
                            <span className="text-2xl font-black text-[#003B7A]">Bre-B</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Cotizador Lite */}
            <section id="cotizador" className="py-24">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                        <div className="p-10 md:w-1/2" style={{ backgroundColor: '#641E1E', color: 'white' }}>
                            <Calculator className="w-12 h-12 mb-6 opacity-80" />
                            <h2 className="text-3xl font-bold mb-4">Cotizador Rápido</h2>
                            <p className="text-white/80 mb-8">Calcula un estimado de tus aportes a seguridad social como independiente.</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-white/90">Ingresos Mensuales</label>
                                    <input 
                                        type="text" 
                                        value={income}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setIncome(val ? new Intl.NumberFormat('es-CO').format(parseInt(val)) : '');
                                        }}
                                        placeholder="Ej. 2.000.000"
                                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
                                    />
                                    <div className="flex items-start mt-3">
                                        <input
                                            type="checkbox"
                                            id="apply40"
                                            checked={apply40}
                                            onChange={(e) => setApply40(e.target.checked)}
                                            className="mt-1 mr-2 rounded border-white/20 bg-white/10 text-white focus:ring-white/50 accent-white"
                                        />
                                        <label htmlFor="apply40" className="text-sm text-white/80 leading-tight cursor-pointer">
                                            Aplicar base de cotización del 40% <br/>
                                            <span className="text-xs opacity-70">(Aplica para independientes por prestación de servicios)</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-white/90">Nivel de Riesgo (ARL)</label>
                                    <select 
                                        value={risk}
                                        onChange={(e) => setRisk(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 [&>option]:text-black"
                                    >
                                        <option value="1">Riesgo I (0.522%)</option>
                                        <option value="2">Riesgo II (1.044%)</option>
                                        <option value="3">Riesgo III (2.436%)</option>
                                        <option value="4">Riesgo IV (4.350%)</option>
                                        <option value="5">Riesgo V (6.960%)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-white/90">Caja de Compensación (CCF)</label>
                                    <select 
                                        value={ccf}
                                        onChange={(e) => setCcf(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 [&>option]:text-black"
                                    >
                                        <option value="0">No aportar (0%)</option>
                                        <option value="0.6">Aportar 0.6%</option>
                                        <option value="2">Aportar 2.0%</option>
                                    </select>
                                    <div className="mt-3 bg-black/20 p-3 rounded-lg flex items-start">
                                        <Info className="w-4 h-4 text-white/70 mr-2 shrink-0 mt-0.5" />
                                        <p className="text-xs text-white/80 leading-relaxed">
                                            <strong>¿Cuál elegir?</strong><br/>
                                            • <strong>0.6%:</strong> Recreación, turismo y capacitación.<br/>
                                            • <strong>2%:</strong> Suma subsidio de vivienda.<br/>
                                            <em>*Ninguno incluye subsidio monetario por hijos para independientes.</em>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-10 md:w-1/2 bg-white flex flex-col justify-center">
                            <h3 className="text-xl font-bold mb-6 text-gray-800">Resumen Estimado</h3>
                            
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Salud (EPS) <span className="text-xs opacity-70">12.5%</span></span>
                                    <span className="font-semibold">{formatCurrency(calc.eps)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Pensión <span className="text-xs opacity-70">16%</span></span>
                                    <span className="font-semibold">{formatCurrency(calc.pension)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Riesgos (ARL) <span className="text-xs opacity-70">{(calc.arlRate * 100).toFixed(3)}%</span></span>
                                    <span className="font-semibold">{formatCurrency(calc.arl)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Caja (CCF) <span className="text-xs opacity-70">{ccf === '0' ? '0%' : `${ccf}%`}</span></span>
                                    <span className="font-semibold">{formatCurrency(calc.ccf)}</span>
                                </div>
                                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <span className="font-bold text-gray-800">Total Aportes</span>
                                    <span className="text-2xl font-black" style={{ color: '#641E1E' }}>{formatCurrency(calc.total)}</span>
                                </div>
                                <div className="pt-2 flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Liquidar planilla</span>
                                    <span className="font-bold text-green-600">$15.000</span>
                                </div>
                            </div>

                            <a 
                                href={whatsappLink}
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full py-4 rounded-xl font-bold text-center text-white transition-transform hover:scale-105 shadow-lg flex items-center justify-center"
                                style={{ backgroundColor: '#25D366' }} // WhatsApp Green
                            >
                                <MessageCircle className="w-5 h-5 mr-2" /> Liquidar por WhatsApp
                            </a>
                            <p className="mt-4 text-xs text-gray-400 text-center leading-relaxed">
                                * Nota: Esta cotización es un estimado para el pago de la planilla y no incluye costos de trámites de afiliación inicial.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* News Feed */}
            <section id="novedades" className="py-24 bg-white/30 border-t border-[#641E1E]/5">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-3xl font-bold mb-2" style={{ color: '#641E1E' }}>Novedades</h2>
                            <p className="text-gray-600">Actualidad en Seguridad Social</p>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <span className="text-xs font-bold text-[#641E1E] uppercase tracking-wider mb-2 block">Actualización 2025</span>
                            <h3 className="text-xl font-bold mb-3">Nuevo SMMLV y Auxilio de Transporte</h3>
                            <p className="text-gray-600 mb-4">Conoce los nuevos valores base para la liquidación de aportes a seguridad social en el año en curso.</p>
                            <a href="#" className="text-sm font-bold hover:underline inline-flex items-center" style={{ color: '#641E1E' }}>Leer más <ArrowRight className="w-4 h-4 ml-1" /></a>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <span className="text-xs font-bold text-[#641E1E] uppercase tracking-wider mb-2 block">Normativa</span>
                            <h3 className="text-xl font-bold mb-3">Cambios en aportes de independientes</h3>
                            <p className="text-gray-600 mb-4">Resumen de las últimas resoluciones que afectan la forma en que los trabajadores independientes deben cotizar.</p>
                            <a href="#" className="text-sm font-bold hover:underline inline-flex items-center" style={{ color: '#641E1E' }}>Leer más <ArrowRight className="w-4 h-4 ml-1" /></a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#2A2A2A] text-white py-12">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="h-8 w-8 bg-[#641E1E] rounded-lg flex items-center justify-center text-white font-bold">CF</div>
                        <span className="font-bold text-xl">CFBra!nd</span>
                    </div>
                    <p className="text-gray-400 mb-6">Gestión experta de Seguridad Social en Colombia.</p>
                    <div className="text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} CFBra!nd. Todos los derechos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
};
