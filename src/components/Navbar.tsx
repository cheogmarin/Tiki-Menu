import React, { useState } from 'react';
import { LucideIcon, Ticket } from 'lucide-react';
import { useSelection } from '../context/SelectionContext';
import SelectionModal from './SelectionModal';

interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
}

interface NavbarProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ categories, activeCategory, onCategoryChange }) => {
  const { selectedItems } = useSelection();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-20 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center gap-3">
        <div className="flex-1 overflow-x-auto no-scrollbar flex gap-3 pr-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${
                activeCategory === cat.id 
                  ? 'bg-[#f27d26] text-white shadow-[0_0_20px_rgba(242,125,38,0.3)]' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <cat.icon size={16} />
              <span className="text-sm font-bold uppercase tracking-wider">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Selection Button */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className={`p-3 rounded-2xl transition-all duration-300 ${
              selectedItems.length > 0 
                ? 'bg-[#00ffcc] text-[#0a0a0a] shadow-[0_0_15px_rgba(0,255,204,0.4)]' 
                : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
          >
            <Ticket size={20} />
            {selectedItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#f27d26] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0a0a0a]">
                {selectedItems.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      <SelectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Navbar;
