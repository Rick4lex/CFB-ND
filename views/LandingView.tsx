import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Calculator, ArrowRight, CheckCircle2, AlertTriangle, MessageCircle, Info, ChevronLeft, ChevronRight, Facebook, Mail, ShieldCheck, Zap, HelpCircle, Music } from 'lucide-react';
import { carouselImages } from '../data/landingContent';
import { motion, AnimatePresence } from 'motion/react';

export const LandingView = () => {
    // Cotizador Lite State
    const [income, setIncome] = useState<string>('1.750.905');
    const [risk, setRisk] = useState<string>('0');
    const [ccf, setCcf] = useState<string>('0');
    const [apply40, setApply40] = useState<boolean>(true);
    const [days, setDays] = useState<number>(30);

    // Carousel State
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev === carouselImages.length - 1 ? 0 : prev + 1));
        }, 30000); // 30 seconds
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev === carouselImages.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? carouselImages.length - 1 : prev - 1));
    };

    // Smooth Scroll Helper
    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Basic calculation logic for Lite Cotizador
    const smlv = 1750905;
    const calculateAportes = () => {
        const numIncome = parseFloat(income.replace(/\D/g, '')) || 0;
        const baseIbc = apply40 ? Math.max(numIncome * 0.4, smlv) : Math.max(numIncome, smlv);
        const ibc = (baseIbc / 30) * days;
        
        const eps = ibc * 0.125;
        const pension = ibc * 0.16;
        
        let arlRate = 0;
        if (risk === '1') arlRate = 0.00522;
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
    const whatsappMessage = `Hola, vengo de la página web y me gustaría asesoría con mi Seguridad Social. Calculé mis aportes por ${days} ${days === 1 ? 'día' : 'días'} con un total de ${formatCurrency(calc.total)} y quiero gestionar mi planilla.`;
    const whatsappLink = `https://wa.me/573157513325?text=${encodeURIComponent(whatsappMessage)}`;

    return (
        <div className="min-h-screen font-sans selection:bg-[#641E1E]/20" style={{ backgroundColor: '#F5F5DC', color: '#2A2A2A' }}>
            {/* Sticky Floating CTA */}
            <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3">
                <motion.a 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="h-16 w-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-[#25D366]/40 transition-shadow transition-transform"
                    title="Hablar con un asesor ahora"
                >
                    <MessageCircle className="w-8 h-8 fill-current" />
                </motion.a>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-[#F5F5DC]/90 border-b border-[#641E1E]/10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-[#641E1E] rounded-lg flex items-center justify-center text-[#F5F5DC] font-bold">CF</div>
                        <span className="font-bold text-xl tracking-tight" style={{ color: '#641E1E' }}>CFBra!nd</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 font-medium text-xs uppercase tracking-widest" aria-label="Navegación Principal">
                        <a href="#inicio" onClick={(e) => scrollToSection(e, 'inicio')} className="hover:text-[#641E1E] transition-colors">Inicio</a>
                        <a href="#servicios" onClick={(e) => scrollToSection(e, 'servicios')} className="hover:text-[#641E1E] transition-colors">Servicios</a>
                        <a href="#beneficios" onClick={(e) => scrollToSection(e, 'beneficios')} className="hover:text-[#641E1E] transition-colors">¿Por qué nosotros?</a>
                        <a href="#cotizador" onClick={(e) => scrollToSection(e, 'cotizador')} className="hover:text-[#641E1E] transition-colors">Cotizador</a>
                        <a href="https://github.com/Rick4lex" target="_blank" rel="noreferrer" className="bg-[#641E1E] text-white px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-opacity-90 transition-all">GitHub</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="p-2 hover:bg-[#641E1E]/10 rounded-full transition-colors text-[#641E1E]" title="Acceso Staff">
                            <Lock className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main id="main-content">
                {/* Hero Section */}
                <section id="inicio" className="relative pt-20 pb-32 overflow-hidden">
                <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <motion.div 
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex-1 space-y-8"
                    >
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]" style={{ color: '#641E1E' }}>
                            Trámites de <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#641E1E] to-red-600">Seguridad Social</span> <br/>
                            Legal y sin Enredos.
                        </h1>
                        <p className="text-lg md:text-xl max-w-xl text-gray-700 leading-relaxed font-medium">
                            Expertos en <strong className="text-[#641E1E]">Planilla PILA</strong>, <strong className="text-[#641E1E]">ARL por Días</strong> y <strong className="text-[#641E1E]">Afiliaciones</strong> para independientes y empresas en Colombia. Cotiza en segundos.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <a href="#cotizador" onClick={(e) => scrollToSection(e, 'cotizador')} className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#641E1E]/20" style={{ backgroundColor: '#641E1E' }}>
                                Calcular mi Planilla <ArrowRight className="ml-2 w-5 h-5" />
                            </a>
                            <a href="https://wa.me/573157513325?text=Hola,%20vengo%20de%20la%20p%C3%A1gina%20web%20y%20me%20gustar%C3%ADa%20asesor%C3%ADa%20con%20mi%20Seguridad%20Social" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold transition-all hover:bg-[#641E1E]/10" style={{ color: '#641E1E', border: '2px solid #641E1E' }}>
                                <MessageCircle className="mr-2 w-5 h-5" /> Chat con Asesor
                            </a>
                        </div>
                    </motion.div>
                    <motion.div 
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="flex-1 relative w-full max-w-md mx-auto"
                    >
                        {/* Carousel */}
                        <div className="aspect-[4/5] relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/40 group">
                            {carouselImages.map((media, index) => {
                                const isVideo = media.url.toLowerCase().endsWith('.mp4');
                                const isActive = index === currentSlide;
                                
                                return isVideo ? (
                                    <video
                                        key={media.id}
                                        src={media.url}
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                ) : (
                                    <img 
                                        key={media.id}
                                        src={media.url} 
                                        alt={media.alt}
                                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                                        referrerPolicy="no-referrer"
                                    />
                                );
                            })}
                            
                            {/* Carousel Controls */}
                            <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={prevSlide} className="p-2 rounded-full bg-white/80 text-[#641E1E] hover:bg-white transition-colors shadow-lg">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button onClick={nextSlide} className="p-2 rounded-full bg-white/80 text-[#641E1E] hover:bg-white transition-colors shadow-lg">
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Carousel Indicators */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                {carouselImages.map((_, index) => (
                                    <button 
                                        key={index}
                                        onClick={() => setCurrentSlide(index)}
                                        className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentSlide ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Services Section */}
            <section id="servicios" className="py-24 bg-white/50 scroll-mt-16">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight" style={{ color: '#641E1E' }}>Servicios de Seguridad Social</h2>
                        <p className="text-lg text-gray-600 leading-relaxed">Liquidamos tu Planilla PILA, gestionamos tu ARL por días y realizamos tus afiliaciones para que tú solo tengas que preocuparte por trabajar.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Card 1 */}
                        <motion.article 
                            whileHover={{ y: -10 }}
                            className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative transform transition-all hover:shadow-2xl"
                        >
                            <div className="absolute top-0 right-8 transform -translate-y-1/2">
                                <span className="bg-orange-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Más Solicitado</span>
                            </div>
                            <header>
                                <h3 className="text-2xl font-bold mb-1">Planilla Mensual PILA</h3>
                                <p className="text-sm font-medium text-gray-400 mb-6 uppercase tracking-wider">Gestión Profesional</p>
                            </header>
                            <div className="text-5xl font-black mb-8 flex items-baseline" style={{ color: '#641E1E' }}>
                                $15.000<span className="text-base text-gray-400 font-medium ml-1">/mes</span>
                            </div>
                            <ul className="space-y-4 mb-10 text-sm font-medium" aria-label="Beneficios de Planilla Mensual">
                                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500 shrink-0" /> Liquidación exacta bajo ley</li>
                                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500 shrink-0" /> Envío de planilla lista para pago</li>
                                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500 shrink-0" /> Soporte personalizado WhatsApp</li>
                            </ul>
                            <a href="https://wa.me/573157513325?text=Me%20interesa%20la%20gesti%C3%B3n%20de%20Planilla%20Mensual" target="_blank" rel="noreferrer" className="block w-full py-4 rounded-xl font-bold text-center text-white transition-all hover:bg-opacity-90 shadow-lg shadow-[#641E1E]/10" style={{ backgroundColor: '#641E1E' }}>Solicitar Gestión</a>
                        </motion.article>

                        {/* Card 2 */}
                        <motion.article 
                            whileHover={{ y: -10 }}
                            className="bg-white rounded-3xl p-8 shadow-lg border-2 relative transform transition-all hover:shadow-2xl flex flex-col" style={{ borderColor: '#641E1E' }}
                        >
                            <header>
                                <h3 className="text-2xl font-bold mb-1">ARL x Días</h3>
                                <p className="text-sm font-medium text-gray-400 mb-6 uppercase tracking-wider">Por Días y Mensual</p>
                            </header>
                            <div className="space-y-4 mb-8 flex-grow">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                    <span className="font-semibold text-gray-600">1 a 8 días</span>
                                    <span className="font-black text-lg">$6.000</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                    <span className="font-semibold text-gray-600">9 a 15 días</span>
                                    <span className="font-black text-lg">$10.000</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                    <span className="font-semibold text-gray-600">16 a 30 días</span>
                                    <span className="font-black text-lg">$15.000</span>
                                </div>
                            </div>
                            <div className="bg-red-50 p-4 rounded-2xl mb-8 border border-red-100">
                                <div className="flex items-start">
                                    <AlertTriangle className="w-5 h-5 text-red-500 mr-3 shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-800 leading-relaxed font-semibold"><strong>Para Riesgos 4 y 5:</strong> Somos especialistas en alta peligrosidad. Incluye el proceso de pago en planilla.</p>
                                </div>
                            </div>
                            <a href="https://wa.me/573157513325?text=Me%20interesa%20ARL%20Express" target="_blank" rel="noreferrer" className="block w-full py-4 rounded-xl font-bold text-center transition-all hover:bg-[#641E1E]/10" style={{ color: '#641E1E', border: '2px solid #641E1E' }}>Solicitar ARL</a>
                        </motion.article>

                        {/* Card 3 */}
                        <motion.article 
                            whileHover={{ y: -10 }}
                            className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 transform transition-all hover:shadow-2xl"
                        >
                            <header>
                                <h3 className="text-2xl font-bold mb-1">Afiliaciones Nuevas</h3>
                                <p className="text-sm font-medium text-gray-400 mb-6 uppercase tracking-wider">Cero Complicaciones</p>
                            </header>
                            <div className="text-5xl font-black mb-8 flex items-baseline" style={{ color: '#641E1E' }}>
                                $50.000<span className="text-base text-gray-400 font-medium ml-1">/entidad</span>
                            </div>
                            <ul className="space-y-4 mb-10 text-sm font-medium" aria-label="Servicios de Afiliación">
                                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500 shrink-0" /> Salud (EPS) e Inclusión</li>
                                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500 shrink-0" /> Riesgos Laborales (ARL)</li>
                                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500 shrink-0" /> Caja de Compensación</li>
                                <li className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-3 text-green-500 shrink-0" /> Fondo de Pensiones</li>
                            </ul>
                            <a href="https://wa.me/573157513325?text=Me%20interesan%20las%20Afiliaciones%20Nuevas" target="_blank" rel="noreferrer" className="block w-full py-4 rounded-xl font-bold text-center text-white transition-all hover:bg-opacity-90 shadow-lg shadow-[#641E1E]/10" style={{ backgroundColor: '#641E1E' }}>Iniciar Afiliación</a>
                        </motion.article>
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

            {/* Why Us Section */}
            <section id="beneficios" className="py-24 scroll-mt-16">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <h2 className="text-4xl font-extrabold tracking-tight" style={{ color: '#641E1E' }}>¿Por qué CFBra!nd es tu mejor aliado?</h2>
                            <p className="text-lg text-gray-600 leading-relaxed">Entendemos que el tiempo es tu recurso más valioso. Por eso hemos simplificado la seguridad social para que no pierdas un segundo más.</p>
                            
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-[#641E1E]/10 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-6 h-6 text-[#641E1E]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl mb-1 text-gray-800">Rapidez Certificada</h3>
                                        <p className="text-gray-500">Tramitamos tus afiliaciones y seguros en tiempo récord, informándote de cada avance.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-[#641E1E]/10 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-6 h-6 text-[#641E1E]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl mb-1 text-gray-800">Asesoría Legal</h3>
                                        <p className="text-gray-500">Trabajamos bajo la normativa vigente de Seguridad Social en Colombia para que estés 100% cubierto.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-[#641E1E]/10 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-6 h-6 text-[#641E1E]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl mb-1 text-gray-800">Transparencia Total</h3>
                                        <p className="text-gray-500">Sin cargos ocultos ni sorpresas. Sabes exactamente qué pagas y por qué servicios estás recibiendo.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative h-full">
                            <div className="bg-gradient-to-br from-[#641E1E] to-red-800 rounded-[3rem] p-10 md:p-12 text-white shadow-2xl relative overflow-hidden h-full flex flex-col justify-between">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                                <div className="relative z-10">
                                    <h3 className="text-3xl font-black italic mb-8">"Dile adiós a las filas y a los trámites engorrosos."</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center text-xl font-bold">CF</div>
                                        <div>
                                            <p className="font-bold">Equipo CFBra!nd</p>
                                            <p className="text-white/60 text-sm">Tu aliado en trámites digitales</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative z-10 flex justify-end -mt-28 md:-mt-32">
                                    <img 
                                        src="https://res.cloudinary.com/dyeppbrfl/image/upload/v1777347670/3ae0c28f-6748-40e0-8b7c-bcb23f6fe508.png" 
                                        alt="Asesor CFBra!nd" 
                                        className="w-56 md:w-80 object-contain drop-shadow-2xl -mr-6 -mb-12" 
                                        referrerPolicy="no-referrer" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Cotizador Lite */}
            <section id="cotizador" className="py-24 scroll-mt-16 bg-gray-50">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="text-center mb-12">
                         <h2 className="text-4xl font-extrabold tracking-tight mb-4" style={{ color: '#641E1E' }}>Calculadora de Aportes Seguridad Social</h2>
                         <p className="text-gray-500 text-lg">Estima el valor de tus aportes legales en base a tus ingresos.</p>
                    </div>
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
                        <div className="p-10 md:w-1/2" style={{ backgroundColor: '#641E1E', color: 'white' }}>
                            <Calculator className="w-12 h-12 mb-6 opacity-80" />
                            <h3 className="text-2xl font-bold mb-4">Cotizador Express</h3>
                            <p className="text-white/80 mb-8">Ingresa tus datos y obtén una liquidación aproximada de ley para independientes.</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="income-input" className="block text-sm font-medium mb-2 text-white/90">Ingresos Mensuales</label>
                                    <input 
                                        id="income-input"
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
                                            <span className="text-xs opacity-70">(Aplica para independientes Voluntarios)</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="days-select" className="block text-sm font-medium mb-2 text-white/90">Días cotizados</label>
                                        <select 
                                            id="days-select"
                                            value={days}
                                            onChange={(e) => setDays(parseInt(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 [&>option]:text-black"
                                        >
                                            {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                                                <option key={day} value={day}>{day} {day === 1 ? 'día' : 'días'}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="risk-select" className="block text-sm font-medium mb-2 text-white/90">Nivel de Riesgo (ARL)</label>
                                        <select 
                                            id="risk-select"
                                            value={risk}
                                            onChange={(e) => setRisk(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 [&>option]:text-black"
                                        >
                                            <option value="0">No aportar (0%)</option>
                                            <option value="1">Riesgo I (0.522%)</option>
                                            <option value="2">Riesgo II (1.044%)</option>
                                            <option value="3">Riesgo III (2.436%)</option>
                                            <option value="4">Riesgo IV (4.350%)</option>
                                            <option value="5">Riesgo V (6.960%)</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="ccf-select" className="block text-sm font-medium mb-2 text-white/90">Caja de Compensación (CCF)</label>
                                    <select 
                                        id="ccf-select"
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
                            <h3 className="text-xl font-bold mb-6 text-gray-800">Resumen Estimado <span className="text-sm font-normal text-gray-500 ml-2">({days} {days === 1 ? 'día' : 'días'})</span></h3>
                            
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
            </main>

            {/* Footer */}
            <footer className="bg-[#2A2A2A] text-white py-12">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="h-8 w-8 bg-[#641E1E] rounded-lg flex items-center justify-center text-white font-bold">CF</div>
                        <span className="font-bold text-xl">CFBra!nd</span>
                    </div>
                    <p className="text-gray-400 mb-6">Gestión de Seguridad Social en Colombia.</p>
                    <div className="flex justify-center gap-6 mb-8">
                        <a href="https://www.tiktok.com/@cfbraind" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                            <i className="fa-brands fa-tiktok text-xl flex items-center justify-center"></i>
                            <span className="text-sm">CFBra!nd</span>
                        </a>
                        <a href="https://www.facebook.com/cfbraind/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                            <Facebook className="w-5 h-5" />
                            <span className="text-sm">cfbraind</span>
                        </a>
                        <a href="mailto:cfb.dig@gmail.com" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                            <Mail className="w-5 h-5" />
                            <span className="text-sm">cfb.dig@gmail.com</span>
                        </a>
                    </div>
                    <div className="text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} CFBra!nd. Todos los derechos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
};
