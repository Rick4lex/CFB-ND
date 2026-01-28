
import type { Client } from '../../lib/types';
import { useAppStore } from '../../lib/store';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator, Button } from '../ui/Shared';
import { FacebookIcon, MailIcon, PhoneIcon, NequiIcon, DaviplataIcon, EfectyIcon, EpaycoIcon, DaleIcon, EntidadHabilitadaIcon, BrebIcon } from './icons';

interface AdditionalItem {
    id: number;
    description: string;
    value: number;
}

interface InvoicePreviewProps {
  client: Client;
  additionalItems: AdditionalItem[];
  totalAmount: number;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

export function InvoicePreview({ client, additionalItems, totalAmount: _unusedTotalAmount }: InvoicePreviewProps) {
  const { config } = useAppStore();
  const catalog = config.servicesCatalog;
  
  const generationDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
  
  // Mapeo dinámico: Buscamos cada servicio del cliente en el catálogo actual para obtener su precio vigente
  const allItems = [
    ...(client.contractedServices || []).map(serviceIdentifier => {
        // Buscamos coincidencia por ID (recomendado) o por Nombre (compatibilidad)
        const service = catalog.find(s => s.id === serviceIdentifier) || catalog.find(s => s.name === serviceIdentifier);
        
        // Si no existe en catálogo, mostramos el identificador guardado pero con precio 0 para evitar errores
        const name = service?.name || serviceIdentifier;
        const price = service?.price || 0;

        return { name, price };
    }),
    ...additionalItems.map(item => ({ name: item.description, price: item.value }))
  ];

  // Recalculamos el total real sumando los precios vigentes del catálogo + ítems adicionales
  const realTotal = allItems.reduce((acc, item) => acc + item.price, 0);

  return (
    <div className="w-full bg-white text-[#3A2E27] font-sans p-4 shadow-lg rounded-lg border print:p-2 print:shadow-none print:border-none box-border">
        
        <div className="grid grid-cols-12 gap-6 print:grid print:grid-cols-12 print:gap-4">
            
            <div className="col-span-12 md:col-span-9 print:col-span-9 space-y-4">
                 
                 {/* Encabezado anidado para las primeras dos columnas */}
                <div className='grid grid-cols-9 gap-6 print:grid print:grid-cols-9 print:gap-4'>
                    <div className='col-span-9 md:col-span-3 print:col-span-3'>
                        {/* Advisor Image without overlap, taking full column width */}
                        <div className="relative w-full aspect-square overflow-hidden rounded-lg">
                            <img 
                                src="https://res.cloudinary.com/dyeppbrfl/image/upload/v1733031738/tu_imagen_gapghc.png" 
                                alt="Asesor" 
                                className="absolute inset-0 w-full h-full object-cover"
                                crossOrigin="anonymous"
                            />
                        </div>
                    </div>

                     <div className='col-span-9 md:col-span-6 print:col-span-6 flex flex-col h-full justify-between'>
                        <p className="text-right print:text-sm text-sm text-gray-500 whitespace-nowrap">Creado el. {generationDate}</p>
                        <div className="flex flex-col items-center justify-center h-full mt-2">
                             <h1 className="text-4xl font-bold text-[#3A2E27] uppercase whitespace-nowrap print:text-2xl">Cuenta de Cobro</h1>
                        </div>
                         <div className="flex flex-col justify-end h-full mt-1">
                           <p className="text-sm text-gray-600 text-justify print:text-xs">Puede hacer trasferencia a cualquiera de los medios habilitados.</p>
                        </div>
                     </div>
                </div>

                <div className='flex items-stretch print:flex print:items-stretch'>
                    <div className='bg-[#3A2E27] text-white font-bold text-lg px-4 py-2 rounded-l-md whitespace-nowrap print:text-base flex items-center' style={{flexBasis: '33.3333%'}}>DEUDOR</div>
                    <div className='bg-[#E08C79]/30 text-[#3A2E27] font-semibold text-xl px-4 py-1.5 flex-grow rounded-r-md border border-[#3A2E27]/30 whitespace-nowrap overflow-hidden text-ellipsis print:text-lg flex items-center justify-center'>{client.fullName}</div>
                </div>
                
                <div className="grid grid-cols-9 gap-6 print:grid print:grid-cols-9 print:gap-4">
                    <div className="col-span-9 md:col-span-3 print:col-span-3 space-y-4 flex flex-col justify-start">
                        <div className='bg-white p-4 rounded-lg text-center border-2 border-dashed print:p-2'>
                            <img src='https://res.cloudinary.com/dyeppbrfl/image/upload/v1763148510/codigo_QR_MOVii_yiv4sc.jpg' alt='QR Code' width={200} height={200} className='mx-auto w-full max-w-[150px]' crossOrigin="anonymous"/>
                            <p className='font-bold text-sm mt-2 print:text-xs'>Paga desde la app de cualquier entidad habilitada</p>
                            <div className='flex justify-center mt-2 print:flex print:justify-center'>
                                <EntidadHabilitadaIcon/>
                            </div>
                        </div>
                        <div className='bg-gray-100 p-4 rounded-lg text-center border-2 border-dashed print:p-2'>
                        <div className='flex items-center justify-between p-2 rounded-md print:flex print:items-center print:justify-between'>
                                <span className='font-semibold text-gray-600 print:text-sm'>Recargar Cuenta</span>
                                <EfectyIcon />
                        </div>
                            <p className='text-sm print:text-xs'>Número de convenio <span className='font-bold'>112493</span></p>
                            <p className='text-sm print:text-xs'>Cel. <span className='font-bold'>3146620654</span></p>
                        </div>
                    </div>

                    <div className="col-span-9 md:col-span-6 print:col-span-6 space-y-4 flex flex-col">
                        <p className='font-bold text-purple-700 text-sm print:text-xs'>Una vez realizado el pago, le solicitamos enviar el comprobante</p>
                        
                        <div className='flex items-stretch print:flex print:items-stretch'>
                            <div className='bg-[#3A2E27] text-white font-bold text-lg px-4 py-2 flex-grow rounded-l-md print:text-base'>TOTAL A PAGAR</div>
                            <div className='bg-[#F7DC6F] text-[#3A2E27] font-bold text-2xl px-4 py-1.5 w-48 text-right rounded-r-md flex items-center justify-end print:text-xl print:w-40'>
                                <span className='text-lg align-middle mr-2 print:text-base'>$</span>{formatCurrency(realTotal).replace('$', '')}
                            </div>
                        </div>
                        
                        <div className='space-y-2 flex-grow print:space-y-1'>
                            <h3 className="font-semibold text-gray-700 print:font-semibold print:text-sm">Detalles de los servicios prestados</h3>
                            {allItems.map((item, index) => (
                                <div key={index} className='flex items-stretch print:flex print:items-stretch'>
                                    {/* Adjusted styles to allow wrapping for long names (e.g. Beneficiary - Service) */}
                                    <div className='bg-[#3A2E27] text-white font-semibold text-sm px-4 py-2 flex-grow rounded-l-md flex items-center print:text-xs whitespace-normal leading-tight'>
                                        {item.name}
                                    </div>
                                    <div className={`bg-[#F8EDD2] ${item.price < 0 ? 'text-red-600' : 'text-[#3A2E27]'} font-bold text-xl px-4 py-1.5 w-40 text-right rounded-r-md flex items-center justify-end print:text-base print:w-32 flex-shrink-0`}>
                                        <span className={`text-base align-middle mr-2 print:text-sm ${item.price < 0 ? 'text-red-500' : ''}`}>$</span>
                                        {formatCurrency(item.price).replace('$', '')}
                                    </div>
                                </div>
                            ))}
                        </div>
                         <div className="flex items-center justify-center gap-2 print:flex print:items-center mt-auto pt-4">
                            <img src="https://res.cloudinary.com/dyeppbrfl/image/upload/v1748304382/codefaker-04_pjvwsp.png" alt="CFBND Logo" width={32} height={32} crossOrigin="anonymous" />
                            <span className="font-bold text-xl text-[#E08C79]">CFBND</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-span-12 md:col-span-3 print:col-span-3 space-y-4 flex flex-col justify-center">
                <div className='bg-[#3A2E27] text-white p-4 rounded-lg space-y-3 print:p-2 print:space-y-2'>
                     <div className='flex flex-col items-center gap-1'>
                         <PhoneIcon />
                         <p className='text-base font-semibold print:text-xs'>315 751 33 25</p>
                    </div>
                    <Separator className='bg-white/20'/>
                    <div className='flex flex-col items-center gap-1'>
                         <MailIcon />
                         <p className='text-xs font-semibold print:text-xs'>cfb.dig@gmail.com</p>
                    </div>
                     <Separator className='bg-white/20'/>
                     <div className='flex flex-col items-center gap-1'>
                         <FacebookIcon />
                         <p className='text-base font-semibold print:text-xs'>cfbraind</p>
                    </div>
                </div>

                <div className='bg-[#3A2E27] p-4 rounded-lg space-y-4 text-center print:p-2 print:space-y-2'>
                     <div className='grid grid-cols-2 gap-4 items-center justify-items-center py-2 print:grid print:grid-cols-2 print:gap-2'>
                        <NequiIcon />
                        <DaviplataIcon />
                        <DaleIcon />
                        <BrebIcon />
                    </div>
                    <div className='text-center text-white font-bold text-lg bg-[#E08C79]/50 py-1 rounded-md print:text-base'>314 662 0654</div>
                    <div className='flex justify-center my-2 print:flex print:justify-center'>
                        <EpaycoIcon />
                    </div>
                     <p className='text-white text-xs text-center print:text-[10px]'>Para pagar con tarjetas debito o credito solicita un <span className='font-bold'>link de pago</span>, procesamos diversos medios de pago con la pasarela de pagos <span className='font-bold'>epayco</span></p>
                    <Button variant='secondary' className='w-full bg-white text-black hover:bg-gray-200 print:hidden'>
                        Pagar con ePayco
                    </Button>
                </div>
            </div>
        </div>

        <div className='text-center space-y-2 pt-8 print:pt-4'>
            <p className='text-xs text-gray-600 print:text-[8px]'>Cuentas a nombre de Ricardo Alvarez. Quedamos atentos para resolver cualquier consulta adicional y le agradecemos de antemano su atención y cumplimiento</p>
        </div>
    </div>
  );
}
