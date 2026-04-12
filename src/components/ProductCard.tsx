import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { useSelection } from '../context/SelectionContext';

interface MenuItem {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen_url?: string;
  etiquetas?: string[];
}

interface ProductCardProps {
  item: MenuItem;
}

const ProductCard: React.FC<ProductCardProps> = ({ item }) => {
  const { selectedItems, toggleItem } = useSelection();
  const isSelected = selectedItems.some((i) => i.id === item.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={() => toggleItem(item)}
      className={`group relative bg-white/5 border ${
        isSelected ? 'border-[#f27d26]' : 'border-white/10'
      } rounded-3xl p-6 hover:bg-white/[0.08] transition-all duration-500 overflow-hidden cursor-pointer`}
    >
      {/* Decorative Wood Texture Overlay (Simulated) */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
      
      {item.imagen_url && (
        <div className="relative h-48 -mx-6 -mt-6 mb-6 overflow-hidden">
          <img 
            src={item.imagen_url} 
            alt={item.nombre}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/40 to-transparent" />
          
          {/* Selection Circle */}
          <div className="absolute top-4 right-4 z-10">
            <div 
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                isSelected 
                  ? 'bg-[#f27d26] border-[#f27d26] shadow-[0_0_15px_rgba(242,125,38,0.6)]' 
                  : 'bg-black/20 border-white/60 backdrop-blur-sm'
              }`}
            >
              {isSelected && <Check size={18} className="text-white" strokeWidth={3} />}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <h3 className={`text-xl font-bold tracking-tight transition-colors ${
          isSelected ? 'text-[#f27d26]' : 'text-white group-hover:text-[#f27d26]'
        }`}>
          {item.nombre}
        </h3>
        <span className="text-lg font-black text-[#00ffcc] drop-shadow-[0_0_8px_rgba(0,255,204,0.4)]">
          ${item.precio}
        </span>
      </div>

      {item.etiquetas && item.etiquetas.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {item.etiquetas.map((tag, idx) => (
            <span 
              key={idx} 
              className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-[#f27d26]/10 text-[#f27d26] border border-[#f27d26]/20"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <p className="text-sm text-white/60 leading-relaxed mb-4">
        {item.descripcion}
      </p>

      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 bg-white/10 rounded text-white/40">
          {item.categoria}
        </span>
      </div>
    </motion.div>
  );
};

export default ProductCard;
