import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, Clock, Trash2 } from 'lucide-react';

interface Llamado {
  id: number;
  mesa: string;
  estado: 'pendiente' | 'atendido';
  created_at: string;
}

export default function StaffAdmin() {
  const [llamados, setLlamados] = useState<Llamado[]>([]);
  const [audio] = useState(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

  useEffect(() => {
    fetchLlamados();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('llamados_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'llamados' },
        (payload) => {
          console.log('Nuevo llamado recibido:', payload);
          setLlamados(prev => [payload.new as Llamado, ...prev]);
          audio.play().catch(e => console.error('Error al reproducir sonido:', e));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'llamados' },
        (payload) => {
          setLlamados(prev => prev.map(l => l.id === payload.new.id ? payload.new as Llamado : l));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'llamados' },
        (payload) => {
          setLlamados(prev => prev.filter(l => l.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLlamados = async () => {
    const { data, error } = await supabase
      .from('llamados')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) console.error('Error fetching llamados:', error);
    else setLlamados(data || []);
  };

  const markAsAtendido = async (id: number) => {
    const { error } = await supabase
      .from('llamados')
      .update({ estado: 'atendido' })
      .eq('id', id);

    if (error) console.error('Error updating llamado:', error);
  };

  const deleteLlamado = async (id: number) => {
    const { error } = await supabase
      .from('llamados')
      .delete()
      .eq('id', id);

    if (error) console.error('Error deleting llamado:', error);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-sans">
      <header className="max-w-4xl mx-auto mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-[#f27d26]">Panel de Staff</h1>
          <p className="text-white/40 text-sm uppercase tracking-widest">Tiki Bar Lechería · Llamados en tiempo real</p>
        </div>
        <div className="bg-[#f27d26]/10 px-4 py-2 rounded-full border border-[#f27d26]/30 flex items-center gap-2">
          <div className="w-2 h-2 bg-[#00ffcc] rounded-full animate-pulse" />
          <span className="text-[#f27d26] text-xs font-bold uppercase tracking-widest">En Línea</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {llamados.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-white/5 rounded-3xl border border-white/5"
              >
                <Bell className="mx-auto text-white/10 mb-4" size={48} />
                <p className="text-white/40 uppercase tracking-widest text-sm">No hay llamados pendientes</p>
              </motion.div>
            ) : (
              llamados.map((llamado) => (
                <motion.div
                  key={llamado.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-6 rounded-3xl border flex items-center justify-between transition-colors ${
                    llamado.estado === 'pendiente' 
                      ? 'bg-[#f27d26]/10 border-[#f27d26]/30 shadow-[0_0_20px_rgba(242,125,38,0.1)]' 
                      : 'bg-white/5 border-white/10 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${
                      llamado.estado === 'pendiente' ? 'bg-[#f27d26] text-white' : 'bg-white/10 text-white/40'
                    }`}>
                      {llamado.mesa}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold uppercase tracking-tight">Mesa {llamado.mesa}</h3>
                      <div className="flex items-center gap-2 text-white/40 text-xs mt-1">
                        <Clock size={12} />
                        <span>{new Date(llamado.created_at).toLocaleTimeString()}</span>
                        <span className="mx-1">·</span>
                        <span className={`uppercase font-bold ${llamado.estado === 'pendiente' ? 'text-[#f27d26]' : 'text-white/40'}`}>
                          {llamado.estado}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {llamado.estado === 'pendiente' && (
                      <button
                        onClick={() => markAsAtendido(llamado.id)}
                        className="p-4 bg-[#00ffcc] text-[#0a0a0a] rounded-2xl hover:scale-105 active:scale-95 transition-transform shadow-lg"
                        title="Marcar como atendido"
                      >
                        <Check size={24} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteLlamado(llamado.id)}
                      className="p-4 bg-white/5 text-white/40 rounded-2xl hover:bg-red-500/20 hover:text-red-500 transition-colors"
                      title="Eliminar registro"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
