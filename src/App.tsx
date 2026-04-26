import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palmtree, 
  Wine, 
  Beer, 
  Utensils, 
  MessageCircle, 
  X, 
  Send, 
  MapPin,
  Phone,
  Instagram,
  Dog,
  Volume2,
  Download,
  Bell
} from 'lucide-react';
import { Routes, Route } from 'react-router-dom';
import StaffAdmin from './pages/StaffAdmin';
import { supabase } from './lib/supabase';
import VoiceButton from './components/VoiceButton';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import { SelectionProvider } from './context/SelectionContext';
import { GoogleGenAI } from "@google/genai";

// --- AI Setup ---
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (aiInstance) return aiInstance;
  
  const apiKey = process.env.gallera || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "undefined" || apiKey === "YOUR_GEMINI_API_KEY") {
    return null;
  }
  
  try {
    aiInstance = new GoogleGenAI({ apiKey });
    return aiInstance;
  } catch (err) {
    console.error("Failed to initialize Gemini AI:", err);
    return null;
  }
};

// --- Types ---
interface MenuItem {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen_url?: string;
  etiquetas?: string[];
}

const CATEGORIES = [
  { id: 'Coctelería', name: 'Coctelería', icon: Wine },
  { id: 'Sangrías', name: 'Sangrías', icon: Wine },
  { id: 'Licores', name: 'Licores', icon: Wine },
  { id: 'Cervezas', name: 'Cervezas', icon: Beer },
  { id: 'Entradas', name: 'Entradas', icon: Utensils },
  { id: 'Principales', name: 'Principales', icon: Utensils },
  { id: 'Burgers', name: 'Burgers', icon: Utensils },
  { id: 'Pizzas & Pastas', name: 'Pizzas & Pastas', icon: Utensils },
  { id: 'Zero Alcohol', name: 'Sin Alcohol', icon: Palmtree },
];

export default function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('Coctelería');
  const [mesa, setMesa] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Initialization ---
  useEffect(() => {
    // Get Token from URL (support ?token= or ?t=)
    const params = new URLSearchParams(window.location.search);
    const tableToken = params.get('token') || params.get('t') || params.get('mesa') || params.get('m');
    
    if (tableToken) {
      setToken(tableToken);
      validateToken(tableToken);
    }

    // Check Cooldown from localStorage
    const savedCooldown = localStorage.getItem('tiki_waiter_cooldown');
    if (savedCooldown) {
      const remaining = Math.floor((parseInt(savedCooldown) - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
      }
    }

    // Fetch Menu from Supabase
    fetchMenu();
  }, []);

  // Cooldown Timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            localStorage.removeItem('tiki_waiter_cooldown');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const validateToken = async (tokenToValidate: string) => {
    if (!supabase) return;
    
    try {
      // Check if it's a UUID (token) or a direct number (legacy support)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tokenToValidate);
      
      if (isUUID) {
        const { data, error } = await supabase
          .from('mesas')
          .select('numero')
          .eq('id', tokenToValidate)
          .single();
        
        if (data) setMesa(data.numero);
      } else {
        // Legacy support for direct mesa numbers
        setMesa(tokenToValidate);
      }
    } catch (err) {
      console.error('Error validating token:', err);
    }
  };

  useEffect(() => {
    setFilteredItems(menuItems.filter(item => item.categoria === activeCategory));
  }, [activeCategory, menuItems]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchMenu = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase URL o Anon Key no configurados en las Secrets.');
      }
      const { data, error } = await supabase
        .from('platillos')
        .select('*')
        .order('categoria', { ascending: true });

      if (error) throw error;
      const items = data || [];
      setMenuItems(items);
      
      // Sync embeddings in background if needed
      syncEmbeddings(items);
    } catch (err) {
      console.error('Error fetching menu:', err);
      // Fallback data if Supabase is not configured yet
      setMenuItems([
        { id: '1', nombre: 'Zombie', descripcion: 'Un auténtico "resucita muertos". Enérgica combinación de ron extra dry, añejo y oscuro, potenciada con Brandy Spicy, fruta de la pasión, zumo de piña, lima y un toque de Angostura y canela.', precio: 12, categoria: 'Coctelería', etiquetas: ['Fuerte', 'Exótico', 'Frutal'], imagen_url: 'https://i.ibb.co/VWL5SyZw/Zobie-web.webp' },
        { id: '2', nombre: 'Tiki Electric Ice Beach Tea', descripcion: 'Eléctrica y audaz. Ron Extra Dry, Vodka, Ginebra, Tequila, licor de melón, limonada y un toque vibrante de Blue Curaçao.', precio: 12, categoria: 'Coctelería', etiquetas: ['Fuerte', 'Refrescante', 'Azul'], imagen_url: 'https://i.ibb.co/20k2WKqq/electric-tea.jpg' },
        { id: '3', nombre: 'Coco-Mango Loco', descripcion: 'El Caribe en una copa. Mezcla espirituosa de Ron Batida de Coco, Vodka de Coco, Tequila, Tiki-Mix Falernum, puré de coco y mango.', precio: 10, categoria: 'Coctelería', etiquetas: ['Tropical', 'Dulce', 'Frutal'], imagen_url: 'https://i.ibb.co/TBRKcqLQ/coco-mango-loco.avif' },
        { id: '4', nombre: 'Aku Aku', descripcion: 'El balance perfecto. Ron Extra Dry, licor de melocotón, puré de maracuyá, zumo de lima, sirope de azúcar de caña y hierbabuena fresca.', precio: 8, categoria: 'Coctelería', etiquetas: ['Ligero', 'Refrescante', 'Menta'], imagen_url: 'https://i.ibb.co/spsYKxQR/aku-aku.jpg' },
        { id: '5', nombre: 'Jasper\'s Jamaica', descripcion: 'Aroma especiado y carácter Tiki. Ron Oscuro de Jamaica, zumo de lima, pimienta Dram Syrup y sirope de agave.', precio: 8, categoria: 'Coctelería', etiquetas: ['Especiado', 'Fuerte', 'Clásico'], imagen_url: 'https://picsum.photos/seed/dark-rum/600/400' },
        { id: '6', nombre: 'Mezcaliña', descripcion: 'Inspirada en el Mezcal, "la única bebida del mundo a la que se le dan besos en lugar de tragos". Combina Mezcal, sirope de piña chili, Tiki-Mix Falernum, Frangelico y Bitters.', precio: 8, categoria: 'Coctelería', etiquetas: ['Ahumado', 'Picante', 'Cítrico'], imagen_url: 'https://picsum.photos/seed/mezcal/600/400' },
        { id: '48', nombre: 'Aperol Spritz', descripcion: 'Alegre y vibrante. Aperol, Prosecco, soda y rodaja de naranja.', precio: 4.5, categoria: 'Coctelería', etiquetas: ['Refrescante', 'Cítrico', 'Ligero'], imagen_url: 'https://picsum.photos/seed/aperol/600/400' },
        { id: '49', nombre: 'Tropical Spritz', descripcion: 'Sirope de fruta de la pasión, Aperol, Prosecco y soda.', precio: 5.5, categoria: 'Coctelería', etiquetas: ['Frutal', 'Dulce', 'Refrescante'], imagen_url: 'https://picsum.photos/seed/tropical-spritz/600/400' },
        { id: '50', nombre: 'Spritz Hugo', descripcion: 'Refrescante mezcla de sirope Elderflower, Prosecco y soda.', precio: 4.5, categoria: 'Coctelería', etiquetas: ['Floral', 'Ligero', 'Elegante'], imagen_url: 'https://picsum.photos/seed/hugo-spritz/600/400' },
        { id: '51', nombre: 'Pirlo Spritz', descripcion: 'Campari, Prosecco, soda y rodaja de naranja.', precio: 5.5, categoria: 'Coctelería', etiquetas: ['Amargo', 'Refrescante', 'Clásico'], imagen_url: 'https://picsum.photos/seed/campari-spritz/600/400' },
        { id: '52', nombre: 'Americano', descripcion: 'Un clásico eterno con Campari, Vermouth rojo Cinzano y soda.', precio: 6.5, categoria: 'Coctelería', etiquetas: ['Amargo', 'Clásico', 'Intenso'], imagen_url: 'https://picsum.photos/seed/americano-cocktail/600/400' },
        { id: '9', nombre: 'Maï Taï', descripcion: 'El rey de la Polinesia. Bases de Ron Extra Dry y Ron Oscuro, Triple Seco, Orgeat y zumo de lima.', precio: 12, categoria: 'Coctelería', etiquetas: ['Clásico', 'Fuerte', 'Equilibrado'], imagen_url: 'https://picsum.photos/seed/maitai/600/400' },
        { id: '10', nombre: 'Blue Hawaiian', descripcion: 'Ron blanco extra dry, puré de coco, Blue Curaçao y zumo de piña.', precio: 8, categoria: 'Coctelería', etiquetas: ['Dulce', 'Cremoso', 'Tropical'], imagen_url: 'https://picsum.photos/seed/blue-hawaiian/600/400' },
        { id: '11', nombre: 'Mojito Tradicional', descripcion: 'Ron Extra Dry, lima, menta fresca, azúcar y soda.', precio: 6, categoria: 'Coctelería', etiquetas: ['Refrescante', 'Clásico', 'Ligero'], imagen_url: 'https://picsum.photos/seed/mojito/600/400' },
        { id: '12', nombre: 'Mojito Sabores', descripcion: 'Versión frutal de nuestro Mojito con sabores tropicales.', precio: 7, categoria: 'Coctelería', etiquetas: ['Frutal', 'Refrescante', 'Variado'], imagen_url: 'https://picsum.photos/seed/fruit-mojito/600/400' },
        { id: '13', nombre: 'Bourbon Mojito', descripcion: 'Variante intensa con Bourbon, lima, menta, azúcar y Ginger Ale.', precio: 7, categoria: 'Coctelería', etiquetas: ['Intenso', 'Amaderado', 'Refrescante'], imagen_url: 'https://picsum.photos/seed/bourbon-mojito/600/400' },
        { id: '14', nombre: 'Sex on the Beach', descripcion: 'Vodka melocotón, licor de melocotón, zumo de naranja y un toque de arándano.', precio: 7, categoria: 'Coctelería', etiquetas: ['Clásico', 'Dulce', 'Frutal'], imagen_url: 'https://picsum.photos/seed/sex-beach/600/400' },
        { id: '15', nombre: 'Caipirinha', descripcion: 'Cachaça, lima, azúcar y soda.', precio: 7, categoria: 'Coctelería', etiquetas: ['Cítrico', 'Fuerte', 'Refrescante'], imagen_url: 'https://picsum.photos/seed/caipirinha/600/400' },
        { id: '16', nombre: 'Daiquiri', descripcion: 'Mezcla clásica de Ron Extra Dry, Triple Seco y lima. Consulte por nuestras versiones frutales.', precio: 7, categoria: 'Coctelería', etiquetas: ['Cítrico', 'Clásico', 'Refrescante'], imagen_url: 'https://picsum.photos/seed/daiquiri/600/400' },
        { id: '7', nombre: 'The Pitbull Burger', descripcion: 'Carne premium, tocineta crujiente y gratinado de queso realizado con soplete en mesa.', precio: 15, categoria: 'Burgers', etiquetas: ['Premium', 'Show', 'Contundente'], imagen_url: 'https://i.ibb.co/W4Zp2sBd/burguer.jpg' },
        { id: '8', nombre: 'Sangría Caleta', descripcion: 'Vino tinto, vino especiado, frutas de temporada, brandy, Triple Seco y ginebra.', precio: 15, categoria: 'Sangrías', etiquetas: ['Clásica', 'Frutal', 'Compartir'], imagen_url: 'https://i.ibb.co/4ZztkxSn/sangria-caleta.jpg' },
        { id: '17', nombre: 'Sangría Blanca', descripcion: 'Frizzante Verdejo, fresas, melocotón, Triple Seco y Vodka de melocotón.', precio: 16, categoria: 'Sangrías', etiquetas: ['Refrescante', 'Dulce', 'Frutal'], imagen_url: 'https://i.ibb.co/qTmqwBj/sangria-blanca.png' },
        { id: '18', nombre: 'Sangría Azul', descripcion: 'Vino blanco, licor de Curaçao, Vodka de coco, carambolas y Soda-Prosecco.', precio: 16, categoria: 'Sangrías', etiquetas: ['Exótica', 'Coco', 'Visual'], imagen_url: 'https://picsum.photos/seed/blue-sangria/600/400' },
        { id: '19', nombre: 'Rebujito Caleta', descripcion: 'Especialidad. Vino Manzanilla o Fino, refresco de lima, lima natural y hierbabuena.', precio: 15, categoria: 'Sangrías', etiquetas: ['Ligero', 'Tradicional', 'Refrescante'], imagen_url: 'https://picsum.photos/seed/rebujito/600/400' },
        { id: '20', nombre: 'Sangría Piña Colada', descripcion: 'Especialidad. Frizzante Verdejo, Ron Extra Dry, Malibú, piña y coco.', precio: 18, categoria: 'Sangrías', etiquetas: ['Cremosa', 'Tropical', 'Dulce'], imagen_url: 'https://picsum.photos/seed/pina-sangria/600/400' },
        { id: '21', nombre: 'Sangría Cava', descripcion: 'Top de Gama. Cava Premium, Triple Seco, Brandy, Vodka de piña y mix de cítricos.', precio: 20, categoria: 'Sangrías', etiquetas: ['Premium', 'Burbujas', 'Elegante'], imagen_url: 'https://picsum.photos/seed/cava-sangria/600/400' },
        { id: '22', nombre: 'Zacapa XO', descripcion: 'Ron de Lujo. Añejado en Guatemala.', precio: 21, categoria: 'Licores', etiquetas: ['Lujo', 'Añejo', 'Digestivo'], imagen_url: 'https://i.ibb.co/x0JGrkY/zacapa-xo.jpg' },
        { id: '23', nombre: 'Hendrick’s Gin', descripcion: 'Ginebra Perfect Served con pepino.', precio: 8, categoria: 'Licores', etiquetas: ['Botánico', 'Premium', 'Refrescante'], imagen_url: 'https://picsum.photos/seed/gin-hendricks/600/400' },
        { id: '24', nombre: 'JW Blue Label', descripcion: 'Whisky de Lujo. El tope de gama de Johnnie Walker.', precio: 31, categoria: 'Licores', etiquetas: ['Lujo', 'Exclusivo', 'Intenso'], imagen_url: 'https://picsum.photos/seed/blue-label/600/400' },
        { id: '25', nombre: 'Jaime I', descripcion: 'Brandy de Lujo. Reserva de la familia Torres.', precio: 19, categoria: 'Licores', etiquetas: ['Elegante', 'Reserva', 'Fuerte'], imagen_url: 'https://picsum.photos/seed/brandy-jaime/600/400' },
        { id: '26', nombre: 'Don Julio Reposado', descripcion: 'Tequila Premium. Ideal para Cóctel Paloma.', precio: 9, categoria: 'Licores', etiquetas: ['Premium', 'Cítrico', 'Suave'], imagen_url: 'https://picsum.photos/seed/tequila-don-julio/600/400' },
        { id: '27', nombre: 'Caña de Barril', descripcion: 'Cerveza de barril servida en caña.', precio: 2, categoria: 'Cervezas', etiquetas: ['Fría', 'Ligera', 'Clásica'], imagen_url: 'https://i.ibb.co/TDR6f86D/ca-a-de-barril.jpg' },
        { id: '28', nombre: 'Jarra de Barril', descripcion: 'Cerveza de barril servida en jarra.', precio: 7, categoria: 'Cervezas', etiquetas: ['Grande', 'Compartir', 'Fría'], imagen_url: 'https://picsum.photos/seed/beer-mug/600/400' },
        { id: '29', nombre: 'Paulaner Trigo', descripcion: 'Cerveza de trigo alemana.', precio: 4, categoria: 'Cervezas', etiquetas: ['Trigo', 'Alemana', 'Cuerpo'], imagen_url: 'https://picsum.photos/seed/paulaner/600/400' },
        { id: '30', nombre: 'Heineken 0’0', descripcion: 'Cerveza sin alcohol.', precio: 2.5, categoria: 'Cervezas', etiquetas: ['Sin Alcohol', 'Ligera', 'Refrescante'], imagen_url: 'https://picsum.photos/seed/heineken/600/400' },
        { id: '31', nombre: 'Bulmer’s Original', descripcion: 'Sidra premium.', precio: 4.5, categoria: 'Cervezas', etiquetas: ['Sidra', 'Dulce', 'Frutal'], imagen_url: 'https://picsum.photos/seed/sidra/600/400' },
        { id: '32', nombre: 'Aperitivos de la Bahía', descripcion: 'Mar y Tierra. Selección de marisquería fresca (pulpo/calamar).', precio: 18, categoria: 'Entradas', etiquetas: ['Mar', 'Fresco', 'Compartir'], imagen_url: 'https://i.ibb.co/KxvKJmsg/aperitivos-de-la-bahia.jpg' },
        { id: '33', nombre: 'Tapas del Morro', descripcion: 'Mar y Tierra. Croquetas artesanales y especialidades.', precio: 12, categoria: 'Entradas', etiquetas: ['Casero', 'Fritura', 'Tapas'], imagen_url: 'https://picsum.photos/seed/tapas/600/400' },
        { id: '34', nombre: 'Tiki Urban Burger', descripcion: 'Sabores exóticos en pan brioche artesanal.', precio: 14, categoria: 'Burgers', etiquetas: ['Exótico', 'Brioche', 'Original'], imagen_url: 'https://i.ibb.co/xK72GW9y/Tiki-Urban-Burger.jpg' },
        { id: '35', nombre: 'Paella Marinera', descripcion: 'Arroces. Tradición española con el frescor del Caribe.', precio: 25, categoria: 'Principales', etiquetas: ['Tradicional', 'Marisco', 'Arroz'], imagen_url: 'https://i.ibb.co/mCwb5B2L/paella-marinera.jpg' },
        { id: '36', nombre: 'Arroz Negro con Calamares', descripcion: 'Arroces. Clásico de nuestra herencia Gallega-Española.', precio: 22, categoria: 'Principales', etiquetas: ['Gallego', 'Intenso', 'Arroz'], imagen_url: 'https://picsum.photos/seed/black-rice/600/400' },
        { id: '37', nombre: 'Pescado del Día', descripcion: 'Del Mar. Mero o Pargo preparado a la vanguardia.', precio: 28, categoria: 'Principales', etiquetas: ['Fresco', 'Ligero', 'Saludable'], imagen_url: 'https://picsum.photos/seed/fish-dish/600/400' },
        { id: '38', nombre: 'Pizzas Artesanales', descripcion: 'Masa fina y crujiente con ingredientes frescos.', precio: 12, categoria: 'Pizzas & Pastas', etiquetas: ['Crujiente', 'Casero', 'Familiar'], imagen_url: 'https://i.ibb.co/23984PgL/Pizzas-Artesanales.jpg' },
        { id: '39', nombre: 'Pasta Marina Fusión', descripcion: 'Frutos del mar con pastas italianas de alta calidad.', precio: 18, categoria: 'Pizzas & Pastas', etiquetas: ['Mar', 'Italiano', 'Gourmet'], imagen_url: 'https://picsum.photos/seed/seafood-pasta/600/400' },
        { id: '40', nombre: 'Ensaladas Tropicales', descripcion: 'Opciones ligeras con frutas exóticas.', precio: 10, categoria: 'Pizzas & Pastas', etiquetas: ['Ligero', 'Veggie', 'Fresco'], imagen_url: 'https://picsum.photos/seed/tropical-salad/600/400' },
        { id: '41', nombre: 'Magic Beach', descripcion: 'Kids. Zumo de piña, naranja, melocotón, lima y granadina.', precio: 4.5, categoria: 'Zero Alcohol', etiquetas: ['Niños', 'Dulce', 'Sin Alcohol'], imagen_url: 'https://picsum.photos/seed/kids-drink/600/400' },
        { id: '42', nombre: 'Dirty Banana Shake', descripcion: 'Kids. Plátano, leche, azúcar y sirope de chocolate.', precio: 4.5, categoria: 'Zero Alcohol', etiquetas: ['Cremoso', 'Chocolate', 'Niños'], imagen_url: 'https://picsum.photos/seed/banana-shake/600/400' },
        { id: '43', nombre: 'Fruit Smoothies', descripcion: 'Kids. Batidos de frutas naturales de temporada.', precio: 4.5, categoria: 'Zero Alcohol', etiquetas: ['Saludable', 'Frutal', 'Niños'], imagen_url: 'https://picsum.photos/seed/fruit-smoothie/600/400' },
        { id: '44', nombre: 'Tropical Beach', descripcion: 'Mocktail. Mix de mango, fresa, manzana y zumo de uva.', precio: 5.5, categoria: 'Zero Alcohol', etiquetas: ['Saludable', 'Sin Alcohol', 'Frutal'], imagen_url: 'https://picsum.photos/seed/tropical-mocktail/600/400' },
        { id: '45', nombre: 'Nada Colada', descripcion: 'Mocktail. Piña natural, zumo y puré de coco.', precio: 5.5, categoria: 'Zero Alcohol', etiquetas: ['Cremoso', 'Tropical', 'Sin Alcohol'], imagen_url: 'https://picsum.photos/seed/virgin-pina-colada/600/400' },
        { id: '46', nombre: 'Maracaibo', descripcion: 'Mocktail. Fruta de la pasión, mango, maracuyá y canela.', precio: 5.5, categoria: 'Zero Alcohol', etiquetas: ['Especiado', 'Exótico', 'Sin Alcohol'], imagen_url: 'https://picsum.photos/seed/exotic-mocktail/600/400' },
        { id: '47', nombre: 'Banana Twist', descripcion: 'Mocktail. Combinado refrescante con base de plátano.', precio: 5.5, categoria: 'Zero Alcohol', etiquetas: ['Refrescante', 'Plátano', 'Sin Alcohol'], imagen_url: 'https://picsum.photos/seed/banana-twist/600/400' },
      ]);
    }
  };

  const syncEmbeddings = async (items: any[]) => {
    if (!supabase) return;

    const itemsToUpdate = items.filter(item => !item.embedding);
    if (itemsToUpdate.length === 0) return;

    console.log(`Syncing embeddings for ${itemsToUpdate.length} items...`);

    for (const item of itemsToUpdate) {
      try {
        const ai = getAI();
        if (!ai) {
          console.warn("AI client not available for syncing embeddings.");
          return;
        }

        const textToEmbed = `${item.nombre}: ${item.descripcion}. Categoría: ${item.categoria}. Etiquetas: ${item.etiquetas?.join(', ') || ''}`;
        
        const result = await ai.models.embedContent({
          model: 'gemini-embedding-2-preview',
          contents: [textToEmbed],
        });

        const embedding = result.embeddings[0].values;

        await supabase
          .from('platillos')
          .update({ embedding })
          .eq('id', item.id);
          
      } catch (err) {
        console.error(`Error syncing embedding for ${item.nombre}:`, err);
      }
    }
    console.log('Embedding sync complete.');
  };

  // --- Chat Logic ---
  const getRelevantContext = async (query: string) => {
    if (!supabase) return menuItems.map(item => `${item.nombre} (${item.categoria}): ${item.descripcion} - $${item.precio}`).join('\n');

    try {
      const ai = getAI();
      if (!ai) {
        console.warn("AI client not available for RAG context.");
        return menuItems.map(item => `${item.nombre} (${item.categoria}): ${item.descripcion} - $${item.precio}`).join('\n');
      }

      // 1. Generate embedding for the user query
      const embeddingResult = await ai.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: [query],
      });
      
      const queryEmbedding = embeddingResult.embeddings[0].values;

      // 2. Search Supabase using pgvector
      const { data: matchedItems, error } = await supabase.rpc('match_platillos', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 5,
      });

      if (error) throw error;

      if (!matchedItems || matchedItems.length === 0) {
        // Fallback to full menu if no matches found
        return menuItems.map(item => `${item.nombre} (${item.categoria}): ${item.descripcion} - $${item.precio}`).join('\n');
      }

      // 3. Format the context
      return matchedItems.map((item: any) => 
        `${item.nombre} (${item.categoria}): ${item.descripcion} - $${item.precio} [Etiquetas: ${item.etiquetas?.join(', ') || 'N/A'}]`
      ).join('\n');
    } catch (err) {
      console.error('RAG Error:', err);
      return menuItems.map(item => `${item.nombre} (${item.categoria}): ${item.descripcion} - $${item.precio}`).join('\n');
    }
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  const llamarAlMesonero = async () => {
    if (!supabase) {
      alert("El sistema de llamados no está configurado.");
      return;
    }

    if (!token && !mesa) {
      alert("Por favor, escanea un código QR de mesa válido.");
      return;
    }

    if (cooldown > 0) return;

    setIsCallingWaiter(true);
    try {
      // Usar la función RPC para bloqueo inteligente y validación
      const { data, error } = await supabase.rpc('llamar_mesonero_seguro', {
        p_token: token
      });

      if (error) throw error;

      if (data.success) {
        alert(`¡Llamado enviado! Un mesonero vendrá a la mesa ${data.mesa} pronto.`);
        // Iniciar cooldown de 3 minutos (180s)
        const endTime = Date.now() + 180000;
        localStorage.setItem('tiki_waiter_cooldown', endTime.toString());
        setCooldown(180);
      } else if (data.already_called) {
        alert(data.message);
        // Si ya llamaron, también activamos el cooldown local para evitar spam
        setCooldown(180);
      } else {
        alert(data.message || 'Error al procesar el llamado.');
      }
    } catch (err: any) {
      console.error('Error al llamar al mesonero:', err);
      alert('Hubo un error al enviar el llamado. Por favor, inténtalo de nuevo.');
    } finally {
      setIsCallingWaiter(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newUserMessage = { role: 'user' as const, text: userInput };
    const currentInput = userInput; // Store to use in RAG
    setChatMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoadingChat(true);

    try {
      const ai = getAI();
      if (!ai) {
        setChatMessages(prev => [...prev, { 
          role: 'model', 
          text: "Lo siento, el sistema de Inteligencia Artificial no está configurado correctamente (falta la API Key). Por favor, contacta al administrador." 
        }]);
        setIsLoadingChat(false);
        return;
      }

      const menuContext = await getRelevantContext(currentInput);
      
      const systemInstruction = `
        Eres un sommelier experto y mesero de un restaurante de lujo (Tiki Bar Restaurant Lechería). 
        Eres amable, breve y siempre intentas sugerir un maridaje o un postre para cerrar la comida.
        Tu objetivo es recomendar platillos y bebidas del menú basándote en los gustos del cliente.
        
        Al final de tus recomendaciones, invita al cliente a usar el botón de altavoz para escuchar tu sugerencia si lo desea.
        
        CONTEXTO RELEVANTE DEL MENÚ (RAG):
        ${menuContext}
        
        REGLAS:
        1. Solo recomienda cosas que estén en el menú proporcionado en el contexto.
        2. Si preguntan por precios, dales el precio exacto en USD.
        3. Si preguntan por la ubicación, estamos en Calle Rodrigo de Triana, Lechería.
        4. Menciona que somos Pet Friendly si preguntan por mascotas.
        5. ¡Okole Maluna! es nuestro lema y debes usarlo al despedirte o saludar.
      `;

      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: systemInstruction,
        },
        history: chatMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
      });

      const result = await chat.sendMessage({ message: currentInput });
      if (result.text) {
        setChatMessages(prev => [...prev, { role: 'model', text: result.text }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages(prev => [...prev, { role: 'model', text: 'Lo siento, mi conexión tropical está fallando. ¡Inténtalo de nuevo! 🌴' }]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  return (
    <Routes>
      <Route path="/admin/staff" element={<StaffAdmin />} />
      <Route path="/" element={
        <SelectionProvider>
          <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#f27d26] selection:text-white">
            {/* --- Background Atmosphere --- */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#f27d26]/10 blur-[120px] rounded-full" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00ffcc]/5 blur-[120px] rounded-full" />
            </div>

            {/* --- Header --- */}
            <header className="relative z-10 px-6 pt-12 pb-8 flex flex-col items-center text-center">
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex flex-col items-center"
              >
                <img 
                  src="https://i.ibb.co/v6JrDgKn/tiki-logo.webp" 
                  alt="Tiki Bar Logo" 
                  className="h-32 md:h-48 w-auto mb-2 drop-shadow-[0_0_15px_rgba(242,125,38,0.3)]"
                  referrerPolicy="no-referrer"
                />
                <p className="text-xs tracking-[0.3em] uppercase opacity-60 font-medium">Lechería · Venezuela</p>
              </motion.div>

              {mesa && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-2 px-4 py-1 border border-[#f27d26]/30 rounded-full bg-[#f27d26]/10 text-[#f27d26] text-sm font-bold"
                >
                  MESA {mesa}
                </motion.div>
              )}
            </header>

            {/* --- Categories --- */}
            <Navbar 
              categories={CATEGORIES} 
              activeCategory={activeCategory} 
              onCategoryChange={setActiveCategory} 
            />

            {/* --- Menu Grid --- */}
            <main className="relative z-10 px-6 py-8 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => (
                    <ProductCard key={item.id} item={item} />
                  ))}
                </AnimatePresence>
              </div>

              {/* --- Footer Info --- */}
              <footer className="mt-20 pt-12 border-t border-white/10 text-center pb-24">
                <div className="flex justify-center gap-8 mb-8">
                  <a href="https://instagram.com" className="text-white/40 hover:text-[#f27d26] transition-colors"><Instagram size={24} /></a>
                  <a href="tel:+584121801530" className="text-white/40 hover:text-[#f27d26] transition-colors"><Phone size={24} /></a>
                  <a href="#" className="text-white/40 hover:text-[#f27d26] transition-colors"><MapPin size={24} /></a>
                </div>
                <p className="text-sm text-white/40 mb-2 italic">"La felicidad debe aprovecharse en el momento que se presenta"</p>
                <p className="text-lg font-black tracking-widest text-[#f27d26] uppercase">¡Okole Maluna!</p>
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/30 uppercase tracking-widest">
                  <Dog size={14} />
                  <span>Pet Friendly</span>
                </div>

                {showInstallBtn && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12"
                  >
                    <button
                      onClick={handleInstallClick}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:bg-[#f27d26] hover:text-white hover:border-[#f27d26] transition-all duration-300 group"
                    >
                      <Download size={18} className="group-hover:bounce" />
                      <span className="text-xs font-bold uppercase tracking-widest">Instalar App</span>
                    </button>
                    <p className="mt-3 text-[10px] text-white/20 uppercase tracking-tighter">Acceso rápido desde tu pantalla de inicio</p>
                  </motion.div>
                )}
              </footer>
            </main>

            {/* --- Call Waiter Button (Bottom Left) --- */}
            <button
              onClick={llamarAlMesonero}
              disabled={isCallingWaiter || cooldown > 0}
              className="fixed bottom-8 left-8 z-50 w-16 h-16 bg-white/10 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center shadow-2xl hover:bg-[#f27d26] hover:border-[#f27d26] transition-all duration-300 group disabled:opacity-50"
            >
              <Bell className={`text-white group-hover:animate-ring ${isCallingWaiter ? 'animate-pulse' : ''}`} size={32} />
              <span className="absolute -top-2 -left-2 bg-[#f27d26] text-white text-[10px] font-black px-2 py-1 rounded-full">
                {cooldown > 0 ? `${Math.floor(cooldown / 60)}:${(cooldown % 60).toString().padStart(2, '0')}` : 'MESERO'}
              </span>
            </button>

            {/* --- AI Chat Button (Bottom Right) --- */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-[#f27d26] rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(242,125,38,0.5)] hover:scale-110 active:scale-95 transition-all duration-300 group"
            >
              <MessageCircle className="text-white group-hover:rotate-12 transition-transform" size={32} />
              <span className="absolute -top-2 -right-2 bg-[#00ffcc] text-[#0a0a0a] text-[10px] font-black px-2 py-1 rounded-full animate-bounce">
                IA
              </span>
            </button>

            {/* --- Chat Modal --- */}
            <AnimatePresence>
              {isChatOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 100, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 100, scale: 0.9 }}
                  className="fixed inset-0 z-[60] md:inset-auto md:bottom-28 md:right-8 md:w-[400px] md:h-[600px] bg-[#111] border border-white/10 md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                >
                  {/* Chat Header */}
                  <div className="p-6 bg-gradient-to-r from-[#f27d26] to-[#ffcc33] flex justify-between items-center">
                    <div>
                      <h4 className="font-black uppercase tracking-tighter text-[#0a0a0a]">Mesero Virtual</h4>
                      <p className="text-[10px] uppercase tracking-widest text-[#0a0a0a]/60 font-bold">Tiki Bar Lechería</p>
                    </div>
                    <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-black/10 rounded-full transition-colors">
                      <X size={24} className="text-[#0a0a0a]" />
                    </button>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-10">
                        <Palmtree className="mx-auto text-[#f27d26]/20 mb-4" size={48} />
                        <p className="text-white/40 text-sm">¡Hola! Soy tu mesero virtual. ¿Qué te gustaría probar hoy? 🍹</p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                          msg.role === 'user' 
                            ? 'bg-[#f27d26] text-white rounded-tr-none' 
                            : 'bg-white/10 text-white/90 rounded-tl-none border border-white/5'
                        }`}>
                          {msg.text}
                        </div>
                        {msg.role === 'model' && (
                          <VoiceButton text={msg.text} />
                        )}
                      </div>
                    ))}
                    {isLoadingChat && (
                      <div className="flex justify-start">
                        <div className="bg-white/10 p-4 rounded-2xl rounded-tl-none animate-pulse flex gap-1">
                          <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="p-6 border-t border-white/10 bg-[#0a0a0a]">
                    <div className="relative">
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Pregúntame por una recomendación..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-[#f27d26] transition-colors"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={isLoadingChat}
                        className="absolute right-2 top-2 bottom-2 w-12 bg-[#f27d26] rounded-xl flex items-center justify-center hover:bg-[#ff8c42] transition-colors disabled:opacity-50"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SelectionProvider>
      } />
    </Routes>
  );
}
