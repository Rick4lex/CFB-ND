
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
  type ThHTMLAttributes,
  type TdHTMLAttributes,
  type HTMLTableCaptionElement,
  type ReactElement,
  type ReactNode
} from 'react';
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { Controller, FormProvider, useFormContext } from 'react-hook-form';

// --- Base Components ---
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={`flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${className}`}
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
        default: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
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
          className={`flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}
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
    <div className={`overflow-y-auto ${className} scrollbar-thin`}>
        {children}
    </div>
);

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (
  <label ref={ref} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props} />
));
Label.displayName = "Label";

// --- Table ---
export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-lg border shadow-sm scrollbar-thin">
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
  <th ref={ref} className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 whitespace-nowrap ${className}`} {...props} />
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
export const DialogTrigger = ({ children, ...props }: any) => {
    return cloneElement(children, props);
}
DialogTrigger.displayName = 'DialogTrigger';

export const DialogContent = ({ className, children }: any) => (
    <div className={`relative z-[1001] grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg md:w-full max-h-[90vh] overflow-y-auto scrollbar-thin ${className}`} onClick={(e) => e.stopPropagation()}>
        {children}
    </div>
);
DialogContent.displayName = 'DialogContent';

export const DialogHeader = ({ className, ...props }: any) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`} {...props} />
)
DialogHeader.displayName = "DialogHeader"

export const DialogFooter = ({ className, ...props }: any) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`} {...props} />
)
DialogFooter.displayName = "DialogFooter"

export const DialogTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props} />
))
DialogTitle.displayName = "DialogTitle"

export const DialogDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={`text-sm text-muted-foreground ${className}`} {...props} />
))
DialogDescription.displayName = "DialogDescription"

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
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300" onClick={() => onOpenChange(false)} />
                    {content}
                </div>
            )}
        </>
    );
};

// --- Sheet (Sidebar) ---
export const SheetTrigger = ({ children, ...props }: any) => {
    return cloneElement(children, props);
}
SheetTrigger.displayName = 'SheetTrigger';

export const SheetContent = ({ className, children, side = "right" }: any) => {
    const sides: any = {
        left: "left-0 h-full w-3/4 border-r sm:max-w-sm animate-in slide-in-from-left duration-300",
        right: "right-0 h-full w-full sm:w-[450px] border-l animate-in slide-in-from-right duration-300",
        top: "top-0 w-full border-b animate-in slide-in-from-top duration-300",
        bottom: "bottom-0 w-full border-t animate-in slide-in-from-bottom duration-300",
    };

    return (
        <div className={`fixed z-[1001] gap-4 bg-background p-6 shadow-2xl transition ease-in-out ${sides[side]} ${className}`} onClick={(e) => e.stopPropagation()}>
            {children}
        </div>
    );
};
SheetContent.displayName = 'SheetContent';

export const SheetHeader = ({ className, ...props }: any) => (
  <div className={`flex flex-col space-y-2 text-left ${className}`} {...props} />
)
SheetHeader.displayName = "SheetHeader"

export const SheetTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={`text-xl font-bold text-foreground font-belanosima tracking-tight ${className}`} {...props} />
))
SheetTitle.displayName = "SheetTitle"

export const SheetDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={`text-sm text-muted-foreground ${className}`} {...props} />
))
SheetDescription.displayName = "SheetDescription"

export const Sheet = ({ open, onOpenChange, children }: any) => {
    let trigger = null;
    let content = null;

    Children.forEach(children, (child) => {
        if (isValidElement(child)) {
             if ((child.type as any).displayName === 'SheetTrigger') {
                trigger = child;
             } else if ((child.type as any).displayName === 'SheetContent') {
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
                <div className="fixed inset-0 z-[1000] flex items-center justify-end">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300" onClick={() => onOpenChange(false)} />
                    {content}
                </div>
            )}
        </>
    );
};


// --- Select ---
export const SelectContext = createContext<any>(null);

export const Select = ({ children, onValueChange, defaultValue, value }: any) => {
    const [open, setOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value || defaultValue);

    useEffect(() => {
        if (value !== undefined) setSelectedValue(value);
    }, [value]);

    const handleSelect = (val: string) => {
        setSelectedValue(val);
        onValueChange?.(val);
        setOpen(false);
    };

    const contextValue = { open, setOpen, selectedValue, handleSelect };

    return (
        <SelectContext.Provider value={contextValue}>
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    );
};

export const SelectTrigger = ({ className, children, id }: any) => {
    const { open, setOpen } = useContext(SelectContext);
    return (
        <button
            type="button"
            id={id}
            onClick={() => setOpen(!open)}
            className={`flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    );
};

export const SelectContent = ({ children, className }: any) => {
    const { open } = useContext(SelectContext);
    if (!open) return null;
    return (
        <div className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 mt-1 w-full max-h-[200px] overflow-y-auto scrollbar-thin ${className}`}>
            <div className="p-1">{children}</div>
        </div>
    );
};

export const SelectItem = ({ value, children, className }: any) => {
    const { selectedValue, handleSelect } = useContext(SelectContext);
    const isSelected = selectedValue === value;
    return (
        <div
            onClick={() => handleSelect(value)}
            className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${isSelected ? 'bg-accent text-accent-foreground' : ''} ${className}`}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {isSelected && <Check className="h-4 w-4" />}
            </span>
            {children}
        </div>
    );
};

export const SelectValue = ({ placeholder }: any) => {
    const { selectedValue } = useContext(SelectContext);
    return <span className="truncate">{selectedValue || placeholder}</span>;
};

// --- Tabs ---
export const TabsContext = createContext<any>(null);

export const Tabs = ({ value, onValueChange, defaultValue, children, className }: any) => {
    const [activeTab, setActiveTab] = useState(value || defaultValue);
    
    useEffect(() => {
        if (value !== undefined) setActiveTab(value);
    }, [value]);

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        onValueChange?.(val);
    };

    return (
        <TabsContext.Provider value={{ activeTab, handleTabChange }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
};

export const TabsList = ({ className, children }: any) => (
    <div className={`inline-flex h-11 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground ${className}`}>
        {children}
    </div>
);

export const TabsTrigger = ({ value, children, className, disabled }: any) => {
    const { activeTab, handleTabChange } = useContext(TabsContext);
    const isActive = activeTab === value;
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => handleTabChange(value)}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'} ${className}`}
        >
            {children}
        </button>
    );
};

// --- Accordion ---
export const AccordionContext = createContext<any>(null);

export const Accordion = ({ children, defaultValue, className }: any) => {
    const [openItem, setOpenItem] = useState(defaultValue);
    return (
        <AccordionContext.Provider value={{ openItem, setOpenItem }}>
            <div className={className}>{children}</div>
        </AccordionContext.Provider>
    );
};

export const AccordionItem = ({ value, children, className }: any) => {
    const { openItem } = useContext(AccordionContext);
    const isOpen = openItem === value;
    return (
        <div className={`border-b ${className}`} data-state={isOpen ? 'open' : 'closed'}>
            {Children.map(children, child => {
                if (isValidElement(child)) {
                    return cloneElement(child as ReactElement<any>, { value, isOpen });
                }
                return child;
            })}
        </div>
    );
};

export const AccordionTrigger = ({ children, className, value, isOpen }: any) => {
    const { setOpenItem } = useContext(AccordionContext);
    return (
        <button
            type="button"
            onClick={() => setOpenItem(isOpen ? '' : value)}
            className={`flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180 ${className}`}
            data-state={isOpen ? 'open' : 'closed'}
        >
            {children}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </button>
    );
};

export const AccordionContent = ({ children, className, isOpen }: any) => {
    if (!isOpen) return null;
    return (
        <div className={`overflow-hidden text-sm transition-all animate-in slide-in-from-top-1 ${className}`}>
            <div className="pb-4 pt-0">{children}</div>
        </div>
    );
};

// --- Form ---
export const Form = FormProvider;

export const FormItemContext = createContext<any>({});

export const FormItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
    const id = useId();
    return (
        <FormItemContext.Provider value={{ id }}>
            <div ref={ref} className={`space-y-2 ${className}`} {...props} />
        </FormItemContext.Provider>
    )
});
FormItem.displayName = "FormItem";

export const FormLabel = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => {
   const { id } = useContext(FormItemContext);
   return <Label ref={ref} className={className} htmlFor={id} {...props} />
});
FormLabel.displayName = "FormLabel";

export const FormControl = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => {
    const { id } = useContext(FormItemContext);
    return cloneElement(children as ReactElement, { id, ...props });
});
FormControl.displayName = "FormControl";

export const FormMessage = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(({ className, children, ...props }, ref) => {
    const { formState } = useFormContext();
    if (!children) return null;
    return (
        <p ref={ref} className={`text-[0.8rem] font-medium text-destructive ${className}`} {...props}>
            {children}
        </p>
    )
});
FormMessage.displayName = "FormMessage";

export const FormField = (props: any) => {
    return (
        <Controller
            {...props}
            render={({ field, fieldState }) => (
                <FormItemContext.Provider value={{ id: field.name }}>
                    {props.render({ 
                        field: { ...field, id: field.name }, 
                        fieldState 
                    })}
                    {fieldState.error && (
                        <FormMessage>{fieldState.error.message}</FormMessage>
                    )}
                </FormItemContext.Provider>
            )}
        />
    );
};

// --- Checkbox ---
export const Checkbox = forwardRef<HTMLButtonElement, any>(({ className, checked, onCheckedChange, ...props }, ref) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    ref={ref}
    onClick={() => onCheckedChange?.(!checked)}
    className={`peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground ${checked ? 'bg-primary text-primary-foreground' : ''} ${className}`}
    {...props}
  >
    {checked && <Check className="h-3 w-3 flex items-center justify-center mx-auto" />}
  </button>
))
Checkbox.displayName = "Checkbox"

// --- Switch ---
export const Switch = forwardRef<HTMLButtonElement, any>(({ className, checked, onCheckedChange, ...props }, ref) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    ref={ref}
    onClick={() => onCheckedChange?.(!checked)}
    className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-input'} ${className}`}
    {...props}
  >
    <span
      className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
))
Switch.displayName = "Switch"

// --- Dropdown Menu (Placeholder / Simplified) ---
export const DropdownMenu = ({ children }: any) => <div className="relative inline-block text-left">{children}</div>;
export const DropdownMenuTrigger = ({ children, asChild, ...props }: any) => {
    return <div {...props} onClick={(e) => {
        const menu = e.currentTarget.nextElementSibling;
        if(menu) menu.classList.toggle('hidden');
    }}>{children}</div>
};
export const DropdownMenuContent = ({ children, className }: any) => (
    <div className={`hidden absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none animate-in data-[side=bottom]:slide-in-from-top-2 ${className}`}>
        {children}
    </div>
);
export const DropdownMenuItem = ({ children, className, onClick }: any) => (
    <div onClick={onClick} className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground ${className}`}>
        {children}
    </div>
);
