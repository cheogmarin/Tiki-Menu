import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { useSelection } from '../context/SelectionContext';

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SelectionModal: React.FC<SelectionModalProps> = ({ isOpen, onClose }) => {
  const { selectedItems, clearSelection, totalPrice, toggleItem } = useSelection();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] md:max-h-[80vh] bg-[#111] border border-white/10 rounded-3xl shadow-2xl z-[80] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-[#f27d26] to-[#ffcc33] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ShoppingBag size={24} className="text-[#0a0a0a]" />
                <div>
                  <h4 className="font-black uppercase tracking-tighter text-[#0a0a0a]">Tu Selección</h4>
                  <p className="text-[10px] uppercase tracking-widest text-[#0a0a0a]/60 font-bold">Resumen Informativo</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full transition-colors">
                <X size={24} className="text-[#0a0a0a]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {selectedItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag size={32} className="text-white/20" />
                  </div>
                  <p className="text-white/40 text-sm">Aún no has seleccionado ningún producto. ¡Explora el menú!</p>
                </div>
              ) : (
                selectedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <img 
                        src={item.imagen_url || 'https://picsum.photos/seed/tiki/100/100'} 
                        alt={item.nombre} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-white truncate">{item.nombre}</h5>
                      <p className="text-xs text-white/40 uppercase tracking-wider">{item.categoria}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#00ffcc]">${item.precio}</p>
                      <button 
                        onClick={() => toggleItem(item)}
                        className="text-[10px] text-red-400/60 hover:text-red-400 uppercase font-bold mt-1"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-[#0a0a0a] space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/60 uppercase tracking-widest font-bold text-sm">Total Estimado</span>
                <span className="text-2xl font-black text-[#00ffcc] drop-shadow-[0_0_10px_rgba(0,255,204,0.3)]">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={clearSelection}
                  disabled={selectedItems.length === 0}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">Limpiar</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-3 rounded-2xl bg-[#f27d26] text-[#0a0a0a] font-black uppercase tracking-widest text-xs hover:bg-[#ff8c42] transition-all shadow-[0_5px_15px_rgba(242,125,38,0.3)]"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SelectionModal;
