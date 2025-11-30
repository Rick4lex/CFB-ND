
import { 
  useState, 
  createContext, 
  useContext, 
  useRef, 
  forwardRef, 
  useId, 
  useEffect, 
  Children, 
  isValidElement, 
  cloneElement,
  type InputHTMLAttributes,
  type ButtonHTMLAttributes,
  type TextareaHTMLAttributes,
  type LabelHTMLAttributes,
  type HTMLAttributes,
  type TableHTMLAttributes,
  type ThHTMLAttributes,
  type TdHTMLAttributes,
  type HTMLTableCaptionElement,
  type ReactElement
} from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Controller, FormProvider, useFormContext, useController } from 'react-hook-form';

// --- Base Components ---
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={`flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link', size?: 'default' | 'sm' | 'lg' | 'icon' }>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
        default: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
    }
    const sizes = {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-11 w-11"
    }
    return (
      <button
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => {
      return (
        <textarea
          className={`flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}
          ref={ref}
          {...props}
        />
      )
    }
  )
Textarea.displayName = "Textarea"

export const Badge = ({ children, variant = 'default', className }: any) => {
    const variants: any = {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'text-foreground border-border',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        success: 'border-transparent bg-green-500 text-white shadow hover:bg-green-600',
        warning: 'border-transparent bg-amber-500 text-white shadow hover:bg-amber-600',
        info: 'border-transparent bg-blue-500 text-white shadow hover:bg-blue-600',
        gray: 'border-transparent bg-gray-500 text-white shadow hover:bg-gray-600',
    };
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant] || variants.default} ${className}`}>
            {children}
        </span>
    );
};

export const Separator = ({ className }: any) => <div className={`shrink-0 bg-border h-[1px] w-full my-4 ${className}`} />;

export const ScrollArea = ({ children, className }: any) => (
    <div className={`overflow-y-auto ${className}`}>
        {children}
    </div>
);

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (
  <label ref={ref} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props} />
));
Label.displayName = "Label";

// --- Table ---
export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-lg border shadow-sm">
    <table ref={ref} className={`w-full caption-bottom text-sm ${className}`} {...props} />
  </div>
))
Table.displayName = "Table"

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <thead ref={ref} className={`[&_tr]:border-b bg-muted/50 ${className}`} {...props} />
))
TableHeader.displayName = "TableHeader"

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={`[&_tr:last-child]:border-0 ${className}`} {...props} />
))
TableBody.displayName = "TableBody"

export const TableFooter = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={`border-t bg-muted/50 font-medium [&>tr]:last:border-b-0 ${className}`} {...props} />
))
TableFooter.displayName = "TableFooter"

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
  <tr ref={ref} className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`} {...props} />
))
TableRow.displayName = "TableRow"

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <th ref={ref} className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`} {...props} />
))
TableHead.displayName = "TableHead"

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <td ref={ref} className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`} {...props} />
))
TableCell.displayName = "TableCell"

export const TableCaption = forwardRef<HTMLTableCaptionElement, HTMLAttributes<HTMLTableCaptionElement>>(({ className, ...props }, ref) => (
  <caption ref={ref} className={`mt-4 text-sm text-muted-foreground ${className}`} {...props} />
))
TableCaption.displayName = "TableCaption"


// --- Card ---
export const Card = ({ className, children }: any) => <div className={`rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>{children}</div>;
export const CardHeader = ({ className, children }: any) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
export const CardTitle = ({ className, children }: any) => <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
export const CardDescription = ({ className, children }: any) => <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
export const CardContent = ({ className, children }: any) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
export const CardFooter = ({ className, children }: any) => <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>;

// --- Dialog ---
export const Dialog = ({ open, onOpenChange, children }: any) => {
    let trigger = null;
    let content = null;

    Children.forEach(children, (child) => {
        if (isValidElement(child)) {
             if ((child.type as any).displayName === 'DialogTrigger') {
                trigger = child;
             } else if ((child.type as any).displayName === 'DialogContent') {
                content = child;
             } else {
                 if(!trigger) trigger = child; 
             }
        }
    });

    return (
        <>
            {trigger && cloneElement(trigger as ReactElement<any>, { onClick: () => onOpenChange(true) })}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300" onClick={() => onOpenChange(false)}></div>
                    {content}
                </div>
            )}
        </>
    );
};

export const DialogTrigger = ({ children }: any) => children;
DialogTrigger.displayName = "DialogTrigger";

export const DialogContent = ({ children, className }: any) => (
    <div className={`relative z-50 grid w-[95vw] max-w-lg sm:max-w-3xl gap-4 border bg-background p-6 shadow-2xl duration-200 sm:rounded-xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 sm:slide-in-from-bottom-0 ${className}`}>
        {children}
    </div>
);
DialogContent.displayName = "DialogContent";

export const DialogHeader = ({ children }: any) => <div className="flex flex-col space-y-1.5 text-center sm:text-left">{children}</div>;
export const DialogTitle = ({ children }: any) => <h2 className="text-xl font-semibold leading-none tracking-tight">{children}</h2>;
export const DialogDescription = ({ children }: any) => <p className="text-sm text-muted-foreground">{children}</p>;
export const DialogFooter = ({ children, className }: any) => <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0 ${className}`}>{children}</div>;


// --- Form ---
export const Form = ({ children, ...props }: any) => <FormProvider {...props}><form {...props}>{children}</form></FormProvider>;

const FormItemContext = createContext<{ id: string } | null>(null);

export const FormItem = ({ children, className }: any) => {
    const id = useId();
    return <FormItemContext.Provider value={{ id }}><div className={`space-y-2 mb-4 ${className}`}>{children}</div></FormItemContext.Provider>
};

export const FormLabel = ({ children, className }: any) => {
    const context = useContext(FormItemContext);
    return <label htmlFor={context?.id} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>{children}</label>
};

export const FormControl = ({ children }: any) => {
    const context = useContext(FormItemContext);
    return cloneElement(children, { id: context?.id });
};

export const FormMessage = ({ className }: any) => {
    return null; 
};

export const FormField = ({ control, name, render }: any) => {
    return (
        <Controller
            control={control}
            name={name}
            render={(props) => {
                const { field, fieldState } = props;
                const children = render({ ...props });
                return (
                    <div className="space-y-1 mb-3">
                        {children}
                        {fieldState.error && (
                            <p className="text-sm font-medium text-destructive animate-in slide-in-from-top-1">
                                {fieldState.error.message}
                            </p>
                        )}
                    </div>
                )
            }}
        />
    );
};

// --- Select ---
const SelectContext = createContext<any>(null);

export const Select = ({ onValueChange, defaultValue, value, children }: any) => {
    const [open, setOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue || value);
    const containerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (value !== undefined) setInternalValue(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (newValue: string) => {
        setInternalValue(newValue);
        if(onValueChange) onValueChange(newValue);
        setOpen(false);
    };

    return (
        <SelectContext.Provider value={{ open, setOpen, value: internalValue, handleSelect }}>
            <div className="relative" ref={containerRef}>{children}</div>
        </SelectContext.Provider>
    );
};

export const SelectTrigger = ({ children, className }: any) => {
    const { open, setOpen } = useContext(SelectContext);
    return (
        <button type="button" onClick={() => setOpen(!open)} className={`flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}>
            {children}
            <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
    )
};

export const SelectValue = ({ placeholder }: any) => {
    const { value } = useContext(SelectContext);
    return <span style={{ pointerEvents: 'none' }} className="truncate">{value || placeholder}</span>;
};

export const SelectContent = ({ children }: any) => {
    const { open } = useContext(SelectContext);
    if (!open) return null;
    return (
        <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 w-full mt-1">
            <div className="p-1 max-h-60 overflow-auto">{children}</div>
        </div>
    );
};

export const SelectItem = ({ value, children }: any) => {
    const { handleSelect } = useContext(SelectContext);
    return (
        <div onClick={() => handleSelect(value)} className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center"></span>
            {children}
        </div>
    );
};

// --- Tabs ---
export const Tabs = ({ value, onValueChange, children, className }: any) => {
    return <div className={`w-full ${className}`} data-value={value} onClick={(e: any) => { 
        const trigger = e.target.closest('[data-value]');
        if(trigger && onValueChange && !trigger.disabled) onValueChange(trigger.dataset.value) 
    }}>{children}</div>
}
export const TabsList = ({ children, className }: any) => <div className={`inline-flex h-12 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground ${className}`}>{children}</div>
export const TabsTrigger = ({ value, children, disabled, className }: any) => {
    return <button type="button" disabled={disabled} data-value={value} className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:text-foreground ${className}`}>{children}</button>
};

// --- Accordion ---
export const Accordion = ({ type, defaultValue, children, className }: any) => {
    return <div className={className}>{children}</div>;
};
export const AccordionItem = ({ value, children }: any) => <div className="border-b last:border-0">{children}</div>
export const AccordionTrigger = ({ children, className }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="flex flex-col">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className={`flex flex-1 items-center justify-between py-4 font-medium transition-all hover:text-primary ${className}`}>
                {children}
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div data-open="true"></div>} 
        </div>
    )
}
export const AccordionContent = ({ children }: any) => {
    return <div className="overflow-hidden text-sm transition-all pb-4 pt-0 animate-in slide-in-from-top-2">{children}</div>;
};

// --- Checkbox ---
export const Checkbox = forwardRef<HTMLInputElement, any>(({ className, checked, onCheckedChange, ...props }, ref) => (
    <div className="relative flex items-center">
        <input 
            type="checkbox" 
            checked={checked} 
            ref={ref} 
            onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
            className={`peer h-5 w-5 shrink-0 rounded-md border-2 border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none checked:bg-primary checked:text-primary-foreground transition-all cursor-pointer ${className}`}
            {...props} 
        />
         <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-[3px] top-[3px] transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    </div>
));
Checkbox.displayName = "Checkbox";

// --- Switch ---
export const Switch = forwardRef<HTMLButtonElement, any>(({ className, checked, onCheckedChange, ...props }, ref) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    ref={ref}
    className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input ${checked ? 'bg-primary' : 'bg-input'} ${className}`}
    {...props}
  >
    <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
));
Switch.displayName = "Switch";

// --- Dropdown Menu ---
const DropdownMenuContext = createContext<any>(null);

export const DropdownMenu = ({ children }: any) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
            <div className="relative inline-block text-left" ref={containerRef}>{children}</div>
        </DropdownMenuContext.Provider>
    );
};

export const DropdownMenuTrigger = ({ children, className }: any) => {
    const { open, setOpen } = useContext(DropdownMenuContext);
    return (
        <div onClick={() => setOpen(!open)} className={`cursor-pointer ${className}`} style={{ display: 'inline-block' }}>
            {children}
        </div>
    );
};

export const DropdownMenuContent = ({ children, className, align = 'end' }: any) => {
    const { open, setOpen } = useContext(DropdownMenuContext);
    if (!open) return null;
    const alignClass = align === 'end' ? 'right-0' : 'left-0';
    return (
        <div 
            className={`absolute z-50 mt-2 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 ${alignClass} ${className}`}
            onClick={() => setOpen(false)}
        >
            {children}
        </div>
    );
};

export const DropdownMenuItem = ({ children, className, onClick, ...props }: any) => {
    const { setOpen } = useContext(DropdownMenuContext);
    return (
        <div 
            className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
            onClick={(e) => {
                if(onClick) onClick(e);
                setOpen(false);
            }}
            {...props}
        >
            {children}
        </div>
    );
};

// --- Utils ---
export const Modal = ({ isOpen, onClose, title, children, className = "" }: any) => {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
         <DialogContent className={className}>
            <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
            {children}
         </DialogContent>
      </Dialog>
    );
};
