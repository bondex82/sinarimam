import { useState, useEffect } from 'react';
import { Image as ImageIcon, Play, Plus } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Gallery() {
  const [items, setItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    const fetchGallery = async () => {
      const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchGallery();
  }, []);

  const filtered = activeTab === 'All' ? items : items.filter(i => i.type === activeTab.toLowerCase().slice(0, -1));

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-ngo-blue tracking-tight">The Gallery</h1>
          <p className="text-slate-500 mt-2 text-lg">Visual stories from our operations around the globe.</p>
        </div>
        <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm">
          {['All', 'Photos', 'Videos'].map((t) => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t ? 'bg-ngo-blue text-white shadow-lg' : 'text-slate-400 hover:text-ngo-blue'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {filtered.map((item) => (
          <div key={item.id} className="relative group rounded-[32px] overflow-hidden bg-slate-100 shadow-sm hover:shadow-2xl transition-all cursor-zoom-in">
             <img 
               src={item.url} 
               alt={item.title} 
               className="w-full object-cover transition-transform duration-700 group-hover:scale-105" 
             />
             <div className="absolute inset-0 bg-gradient-to-t from-ngo-blue/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                <span className="text-[10px] font-black text-lemon uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full w-fit mb-2 backdrop-blur-sm border border-white/10">
                   {item.type}
                </span>
                <h4 className="text-white font-bold text-lg">{item.title}</h4>
                {item.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                       <Play className="text-white fill-white" size={24} />
                    </div>
                  </div>
                )}
             </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white border border-dashed border-slate-200 rounded-[40px] text-slate-300">
             <ImageIcon size={64} className="mb-4 opacity-20" />
             <p className="font-bold text-lg">No media uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
