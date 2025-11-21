
import React, { useState, createContext, useContext } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Controller, FormProvider, useFormContext, useController } from 'react-hook-form';

// --- Base Components ---
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link', size?: 'default' | 'sm' | 'lg' | 'icon' }>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
    }
    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
    }
    return (
      <button
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => {
      return (
        <textarea
          className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
          ref={ref}
          {...props}
        />
      )
    }
  )
Textarea.displayName = "Textarea"

export const Badge = ({ children, variant = 'default', className }: any) => {
    const variants: any = {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'text-foreground border-border',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        success: 'border-transparent bg-green-500 text-white hover:bg-green-600',
        warning: 'border-transparent bg-yellow-500 text-white hover:bg-yellow-600',
        info: 'border-transparent bg-blue-500 text-white hover:bg-blue-600',
        gray: 'border-transparent bg-gray-500 text-white hover:bg-gray-600',
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

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (
  <label ref={ref} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props} />
));
Label.displayName = "Label";

// --- Table ---
export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table ref={ref} className={`w-full caption-bottom text-sm ${className}`} {...props} />
  </div>
))
Table.displayName = "Table"

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <thead ref={ref} className={`[&_tr]:border-b ${className}`} {...props} />
))
TableHeader.displayName = "TableHeader"

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={`[&_tr:last-child]:border-0 ${className}`} {...props} />
))
TableBody.displayName = "TableBody"

export const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={`border-t bg-muted/50 font-medium [&>tr]:last:border-b-0 ${className}`} {...props} />
))
TableFooter.displayName = "TableFooter"

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
  <tr ref={ref} className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`} {...props} />
))
TableRow.displayName = "TableRow"

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <th ref={ref} className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`} {...props} />
))
TableHead.displayName = "TableHead"

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <td ref={ref} className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`} {...props} />
))
TableCell.displayName = "TableCell"

export const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(({ className, ...props }, ref) => (
  <caption ref={ref} className={`mt-4 text-sm text-muted-foreground ${className}`} {...props} />
))
TableCaption.displayName = "TableCaption"


// --- Card ---
export const Card = ({ className, children }: any) => <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>{children}</div>;
export const CardHeader = ({ className, children }: any) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
export const CardTitle = ({ className, children }: any) => <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
export const CardDescription = ({ className, children }: any) => <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
export const CardContent = ({ className, children }: any) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
export const CardFooter = ({ className, children }: any) => <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>;

// --- Dialog ---
export const Dialog = ({ open, onOpenChange, children }: any) => {
    // Filter children to separate trigger and content
    let trigger = null;
    let content = null;

    React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
             if ((child.type as any).displayName === 'DialogTrigger') {
                trigger = child;
             } else if ((child.type as any).displayName === 'DialogContent') {
                content = child;
             } else {
                // Fallback for direct nesting or other structures
                 if(!trigger) trigger = child; 
             }
        }
    });

    return (
        <>
            {trigger && React.cloneElement(trigger as React.ReactElement<any>, { onClick: () => onOpenChange(true) })}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                    <div className="fixed inset-0" onClick={() => onOpenChange(false)}></div>
                    {content}
                </div>
            )}
        </>
    );
};

export const DialogTrigger = ({ children }: any) => children;
DialogTrigger.displayName = "DialogTrigger";

export const DialogContent = ({ children, className }: any) => (
    <div className={`relative z-50 grid w-full gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg max-h-[90vh] overflow-hidden flex flex-col ${className}`}>
        {children}
    </div>
);
DialogContent.displayName = "DialogContent";

export const DialogHeader = ({ children }: any) => <div className="flex flex-col space-y-1.5 text-center sm:text-left">{children}</div>;
export const DialogTitle = ({ children }: any) => <h2 className="text-lg font-semibold leading-none tracking-tight">{children}</h2>;
export const DialogDescription = ({ children }: any) => <p className="text-sm text-muted-foreground">{children}</p>;
export const DialogFooter = ({ children, className }: any) => <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}>{children}</div>;


// --- Form ---
export const Form = ({ children, ...props }: any) => <FormProvider {...props}><form {...props}>{children}</form></FormProvider>;

const FormItemContext = createContext<{ id: string } | null>(null);

export const FormItem = ({ children }: any) => {
    const id = React.useId();
    return <FormItemContext.Provider value={{ id }}><div className="space-y-2 mb-4">{children}</div></FormItemContext.Provider>
};

export const FormLabel = ({ children, className }: any) => {
    const context = useContext(FormItemContext);
    return <label htmlFor={context?.id} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>{children}</label>
};

export const FormControl = ({ children }: any) => {
    const context = useContext(FormItemContext);
    return React.cloneElement(children, { id: context?.id });
};

export const FormMessage = ({ className }: any) => {
    const context = useContext(FormItemContext);
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
                            <p className="text-sm font-medium text-destructive">
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
    
    // Sync internal state if controlled value changes
    React.useEffect(() => {
        if (value !== undefined) setInternalValue(value);
    }, [value]);

    const handleSelect = (newValue: string) => {
        setInternalValue(newValue);
        if(onValueChange) onValueChange(newValue);
        setOpen(false);
    };

    return (
        <SelectContext.Provider value={{ open, setOpen, value: internalValue, handleSelect }}>
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    );
};

export const SelectTrigger = ({ children, className }: any) => {
    const { open, setOpen } = useContext(SelectContext);
    return (
        <button type="button" onClick={() => setOpen(!open)} className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    )
};

export const SelectValue = ({ placeholder }: any) => {
    const { value } = useContext(SelectContext);
    return <span style={{ pointerEvents: 'none' }}>{value || placeholder}</span>;
};

export const SelectContent = ({ children }: any) => {
    const { open } = useContext(SelectContext);
    if (!open) return null;
    return (
        <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 w-full mt-1">
            <div className="p-1 max-h-60 overflow-auto">{children}</div>
        </div>
    );
};

export const SelectItem = ({ value, children }: any) => {
    const { handleSelect } = useContext(SelectContext);
    return (
        <div onClick={() => handleSelect(value)} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer">
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center"></span>
            {children}
        </div>
    );
};

// --- Tabs ---
export const Tabs = ({ value, onValueChange, children, className }: any) => {
    return <div className={`w-full ${className}`} data-value={value} onClick={(e: any) => { 
        // Simple delegation to find closest tab trigger
        const trigger = e.target.closest('[data-value]');
        if(trigger && onValueChange && !trigger.disabled) onValueChange(trigger.dataset.value) 
    }}>{children}</div>
}
export const TabsList = ({ children, className }: any) => <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}>{children}</div>
export const TabsTrigger = ({ value, children, disabled, className }: any) => {
    // Using context or parent state passing would be cleaner, but this works for the localized version.
    // For styling active state, we need to know the parent's value. 
    // In this simplified version, we rely on the `data-value` attribute and visual feedback handled by CSS if possible or parent re-render.
    // To make it look 'active', we need the parent `value` prop. 
    // Since we can't easily access parent props here without context, we'll assume standard styling.
    // IMPROVEMENT: Pass active state from parent if possible or use Context. 
    // For now, we add a simple style that might not reflect 'active' perfectly without Context, 
    // but since `Tabs` rerenders on `value` change, we can check it if we used context.
    return <button type="button" disabled={disabled} data-value={value} className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground shadow-sm hover:bg-background/50 ${className}`}>{children}</button>
};

// --- Accordion ---
export const Accordion = ({ type, defaultValue, children, className }: any) => {
    return <div className={className}>{children}</div>;
};
export const AccordionItem = ({ value, children }: any) => <div className="border-b">{children}</div>
export const AccordionTrigger = ({ children, className }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="flex flex-col">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className={`flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline ${className}`}>
                {children}
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div data-open="true"></div>} 
        </div>
    )
}
export const AccordionContent = ({ children }: any) => {
    // Simplified Accordion content wrapper
    return <div className="overflow-hidden text-sm transition-all pb-4 pt-0">{children}</div>;
};

// --- Checkbox ---
export const Checkbox = React.forwardRef<HTMLInputElement, any>(({ className, checked, onCheckedChange, ...props }, ref) => (
    <input type="checkbox" checked={checked} className={`peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground ${className}`} 
    ref={ref} 
    onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
    {...props} />
));
Checkbox.displayName = "Checkbox";

// --- RadioGroup ---
const RadioGroupContext = createContext<any>(null);
export const RadioGroup = ({ className, value, onValueChange, children, ...props }: any) => {
    return <RadioGroupContext.Provider value={{ value, onValueChange }}><div role="radiogroup" className={`grid gap-2 ${className}`} {...props}>{children}</div></RadioGroupContext.Provider>
}
export const RadioGroupItem = React.forwardRef<HTMLButtonElement, any>(({ className, value: itemValue, ...props }, ref) => {
    const { value, onValueChange } = useContext(RadioGroupContext);
    const checked = value === String(itemValue);
    return (
        <button
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onValueChange(itemValue)}
            ref={ref}
            className={`aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-primary text-primary-foreground' : ''} ${className}`}
            {...props}
        >
            {checked && <span className="flex items-center justify-center"><div className="h-2.5 w-2.5 rounded-full bg-current" /></span>}
        </button>
    )
});
RadioGroupItem.displayName = "RadioGroupItem";

// --- Switch ---
export const Switch = React.forwardRef<HTMLButtonElement, any>(({ className, checked, onCheckedChange, ...props }, ref) => (
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

// --- Dropdown ---
export const DropdownMenu = ({ children }: any) => <div className="relative inline-block text-left group">{children}</div>;
export const DropdownMenuTrigger = ({ asChild, children }: any) => <div className="inline-block">{children}</div>;
export const DropdownMenuContent = ({ children }: any) => <div className="hidden group-hover:block absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border">{children}</div>;
export const DropdownMenuItem = ({ onSelect, children }: any) => <button onClick={onSelect} className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-accent hover:text-accent-foreground">{children}</button>;

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
