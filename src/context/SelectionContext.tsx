import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MenuItem {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen_url?: string;
  etiquetas?: string[];
}

interface SelectionContextType {
  selectedItems: MenuItem[];
  toggleItem: (item: MenuItem) => void;
  clearSelection: () => void;
  totalPrice: number;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionProvider = ({ children }: { children: ReactNode }) => {
  const [selectedItems, setSelectedItems] = useState<MenuItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tiki_selection');
    if (saved) {
      try {
        setSelectedItems(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing saved selection', e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('tiki_selection', JSON.stringify(selectedItems));
  }, [selectedItems]);

  const toggleItem = (item: MenuItem) => {
    setSelectedItems((prev) => {
      const isSelected = prev.find((i) => i.id === item.id);
      if (isSelected) {
        return prev.filter((i) => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const totalPrice = selectedItems.reduce((acc, item) => acc + item.precio, 0);

  return (
    <SelectionContext.Provider value={{ selectedItems, toggleItem, clearSelection, totalPrice }}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
};
