import { useState, useEffect } from 'react';
import { Volume2, Square } from 'lucide-react';
import { motion } from 'motion/react';

interface VoiceButtonProps {
  text: string;
}

export default function VoiceButton({ text }: VoiceButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
    }
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const reproducirVoz = (texto: string) => {
    if (!isSupported) return;

    // Cancelar cualquier audio previo
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(texto);
    
    // Configuración de voz
    utterance.lang = 'es-ES';
    utterance.rate = 0.9; // Estilo Tiki relajado
    
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // Intentamos encontrar una voz de Google en español primero (suelen ser de mejor calidad)
      const googleSpanish = voices.find(
        v => (v.lang.startsWith('es-ES') || v.lang.startsWith('es-MX')) && v.name.includes('Google')
      );
      
      // Si no hay Google, cualquier voz en español
      const generalSpanish = voices.find(
        v => v.lang.startsWith('es-ES') || v.lang.startsWith('es-MX')
      );

      if (googleSpanish) {
        utterance.voice = googleSpanish;
      } else if (generalSpanish) {
        utterance.voice = generalSpanish;
      }
    };

    setVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const detenerVoz = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  if (!isSupported) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      {!isSpeaking ? (
        <button
          onClick={() => reproducirVoz(text)}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-[#f27d26] hover:text-[#ff8c42] transition-colors bg-[#f27d26]/10 px-3 py-1.5 rounded-full border border-[#f27d26]/20"
        >
          <Volume2 size={14} />
          <span>Escuchar recomendación</span>
        </button>
      ) : (
        <button
          onClick={detenerVoz}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-[#00ffcc] hover:text-[#33ffdd] transition-colors bg-[#00ffcc]/10 px-3 py-1.5 rounded-full border border-[#00ffcc]/20"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Square size={14} fill="currentColor" />
          </motion.div>
          <span>Detener</span>
        </button>
      )}
    </div>
  );
}
