import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { useSelection } from '../context/SelectionContext';

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SelectionModal: React.FC<SelectionModalProps> = ({ isOpen, onClose }) => {
  const { selectedItems, toggleItem, clearSelection, total } = useSelection();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-[#f27d26]/10 to-transparent">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                  <ShoppingBag className="text-[#f27d26]" />
                  Tu Selección
                </h2>
                <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold mt-1">Repasa lo que pedirás al mesonero</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
              {selectedItems.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag size={32} className="text-white/20" />
                  </div>
                  <p className="text-white/40 font-medium">No has seleccionado nada aún.</p>
                  <p className="text-white/20 text-xs mt-2 uppercase tracking-widest">Explora el menú y marca tus favoritos</p>
                </div>
              ) : (
                selectedItems.map((item) => (
                  <motion.div 
                    layout
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-[#f27d26]/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {item.imagen_url && (
                        <img 
                          src={item.imagen_url} 
                          alt={item.nombre} 
                          className="w-12 h-12 rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div>
                        <h4 className="font-bold text-white group-hover:text-[#f27d26] transition-colors">{item.nombre}</h4>
                        <p className="text-[#00ffcc] text-sm font-black">${item.precio}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleItem(item)}
                      className="p-2 text-white/20 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {selectedItems.length > 0 && (
              <div className="p-8 bg-black/40 border-t border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-white/40 uppercase tracking-widest font-bold text-xs">Total Estimado</span>
                  <span className="text-3xl font-black text-[#00ffcc] drop-shadow-[0_0_10px_rgba(0,255,204,0.3)]">${total}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={clearSelection}
                    className="py-4 rounded-2xl border border-white/10 text-white/40 text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={onClose}
                    className="py-4 rounded-2xl bg-[#f27d26] text-white text-xs font-black uppercase tracking-widest shadow-[0_10px_20px_rgba(242,125,38,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Listo
                  </button>
                </div>
                <p className="mt-4 text-[9px] text-center text-white/20 uppercase tracking-widest leading-relaxed">
                  Esta lista es para tu referencia personal.<br/>Llama al mesonero para realizar el pedido oficial.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SelectionModal;
