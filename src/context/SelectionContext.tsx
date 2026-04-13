import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  total: number;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedItems, setSelectedItems] = useState<MenuItem[]>([]);

  const toggleItem = (item: MenuItem) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const clearSelection = () => setSelectedItems([]);

  const total = selectedItems.reduce((acc, item) => acc + item.precio, 0);

  return (
    <SelectionContext.Provider value={{ selectedItems, toggleItem, clearSelection, total }}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
};
