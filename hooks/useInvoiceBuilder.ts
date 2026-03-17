import { useState } from 'react';
import { parseCurrency } from '../lib/utils';

export interface InvoiceItem {
  id: number;
  description: string;
  value: number;
}

export function useInvoiceBuilder() {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [newItem, setNewItem] = useState({ description: '', value: '' });

  const addItem = () => {
    const val = parseCurrency(newItem.value);
    if (newItem.description && val !== 0) {
      setItems(prev => [...prev, {
        id: Date.now() + Math.random(),
        description: newItem.description,
        value: val,
      }]);
      setNewItem({ description: '', value: '' });
    }
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearItems = () => {
    setItems([]);
  };

  const addItemsBulk = (newItems: InvoiceItem[]) => {
    setItems(prev => [...prev, ...newItems]);
  };

  return {
    items,
    newItem,
    setNewItem,
    addItem,
    removeItem,
    clearItems,
    addItemsBulk
  };
}
