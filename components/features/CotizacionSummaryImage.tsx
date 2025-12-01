
import { CheckCircle, AlertTriangle } from 'lucide-react';

export interface CotizacionData {
    totalNet: string;
    resultsIbc: string;
    resultsIbcDays: string;
    modality: string;
    totalSocialSecurity: string;
    breakdownItems: { label: string; value: string }[];
    totalProcedureCost: string;
    procedureItems: { label: string; value: string }[];
}

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.456l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.398 1.905 6.161l-1.026 3.755 3.844-1.016z"/>
    </svg>
);

const FacebookIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500">
        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
    </svg>
);


export function CotizacionSummaryImage({
    totalNet,
    resultsIbc,
    resultsIbcDays,
    modality,
    totalSocialSecurity,
    breakdownItems,
    procedureItems,
    totalProcedureCost,
}: CotizacionData) {
    return (
        <div id="summary-image-content" className="w-[400px] bg-white p-6 font-sans text-[#3A2E27]">
            <div className="flex items-center justify-start gap-2 mb-4">
                <img src="https://res.cloudinary.com/dyeppbrfl/image/upload/v1748304382/codefaker-04_pjvwsp.png" alt="CFBND Logo" width={32} height={32} crossOrigin="anonymous" />
                <span className="font-bold text-xl text-[#E08C79]">CFBND</span>
            </div>

            <div className="relative mt-4">
                <div className="bg-[#F8EDD2] rounded-lg p-3 pt-4">
                    <h2 className="text-md font-bold">Resumen de Cotización</h2>
                    <p className="text-xs" style={{ color: '#8d7a6e' }}>Cálculos para <span className="font-semibold text-[#E08C79]">{modality}</span>.</p>
                    <div className="flex justify-between items-end mt-2">
                        <div>
                            <p className="text-xs" style={{ color: '#8d7a6e' }}>Valor Final Cliente</p>
                            <p className="text-4xl font-bold text-[#E08C79] leading-none">{totalNet}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-bold text-blue-600">{resultsIbcDays}</p>
                            <p className="text-xs font-semibold">{resultsIbc}</p>
                        </div>
                    </div>
                </div>
                 <div className="absolute -top-4 right-2">
                    <img
                        src="https://res.cloudinary.com/dyeppbrfl/image/upload/v1733031738/tu_imagen_gapghc.png"
                        alt="Asesor"
                        width={80}
                        height={80}
                        className="rounded-full object-cover"
                        style={{width: 80, height: 80}}
                        crossOrigin="anonymous"
                    />
                </div>
            </div>

            <div className="bg-[#F8EDD2] rounded-lg p-3 mt-3 text-xs">
                <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#8d7a6e' }}/>
                    <div>
                        <p className="font-bold">Aviso Importante</p>
                        <ul className="list-disc list-inside text-[10px]" style={{ color: '#8d7a6e' }}>
                            <li>Los cálculos son una aproximación y no reflejan el valor real a pagar.</li>
                            <li>El valor total no incluye la posible mora que el operador de pago (PILA) pueda generar.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-[#F8EDD2] rounded-lg p-3 flex flex-col">
                    <h3 className="font-bold text-center uppercase text-xs" style={{ color: '#8d7a6e' }}>Aportes a Seg. Social</h3>
                    <p className="text-[10px] text-center" style={{ color: '#8d7a6e' }}>SUBTOTAL</p>
                    <p className="text-3xl font-bold text-center text-[#E08C79] my-1">{totalSocialSecurity}</p>
                    <hr className="border-gray-300 my-1" />
                    <ul className="space-y-1 text-[10px] flex-grow">
                        {breakdownItems.length > 0 ? breakdownItems.map(item => (
                            <li key={item.label} className="flex justify-between">
                                <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" />{item.label}</span>
                                <span>{item.value}</span>
                            </li>
                        )) : <p className="text-center text-[10px] py-2" style={{ color: '#8d7a6e' }}>No hay aportes.</p>}
                    </ul>
                </div>
                <div className="bg-[#F8EDD2] rounded-lg p-3 flex flex-col">
                    <h3 className="font-bold text-center uppercase text-xs" style={{ color: '#8d7a6e' }}>Trámites y Servicios</h3>
                    <p className="text-[10px] text-center" style={{ color: '#8d7a6e' }}>SUBTOTAL</p>
                    <p className="text-3xl font-bold text-center text-[#E08C79] my-1">{totalProcedureCost}</p>
                     <hr className="border-gray-300 my-1" />
                    <ul className="space-y-1 text-[10px] flex-grow">
                        {procedureItems.length > 0 ? procedureItems.map(item => (
                             <li key={item.label} className="flex justify-between">
                                <span style={{ color: '#8d7a6e' }}>{item.label}</span>
                                <span>{item.value}</span>
                            </li>
                        )): <p className="text-center text-[10px] py-2" style={{ color: '#8d7a6e' }}>No hay trámites.</p>}
                    </ul>
                </div>
            </div>

            <div className="text-center mt-4 text-xs" style={{ color: '#8d7a6e' }}>
                <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1">
                        <WhatsAppIcon />
                        <span>3157513325</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <FacebookIcon />
                        <span>cfbraind</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
