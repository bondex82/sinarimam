import { useState, useEffect } from 'react';
import { Image as ImageIcon, Play, X, ChevronLeft, ChevronRight, Calendar, MapPin, Grid, Layers, Eye } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

export default function Gallery() {
  const [items, setItems] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'grid'>('grouped');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching gallery items:", err);
      }
    };
    const fetchProjects = async () => {
      try {
        const snap = await getDocs(collection(db, 'projects'));
        setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching projects for gallery filter:", err);
      }
    };
    const fetchEvents = async () => {
      try {
        const snap = await getDocs(collection(db, 'events'));
        setEvents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching events for gallery:", err);
      }
    };
    fetchGallery();
    fetchProjects();
    fetchEvents();
  }, []);

  // Filter items based on active tabs and selected project
  const filtered = items.filter(i => {
    const matchesTab = activeTab === 'All' ? true : i.type === activeTab.toLowerCase().slice(0, -1);
    const matchesProject = selectedProjectId === 'all' ? true : i.projectId === selectedProjectId;
    return matchesTab && matchesProject;
  });

  // Safe helper to obtain event group name
  const getEventGroup = (item: any) => {
    if (item.eventName && item.eventName.trim() !== '') {
      return item.eventName.trim();
    }
    if (item.projectTitle && item.projectTitle.trim() !== '') {
      return item.projectTitle.trim();
    }
    // Strip trailing parenthesis (e.g. "Community Visit (3)" -> "Community Visit")
    const cleanTitle = item.title ? item.title.replace(/\s*\(\d+\)\s*$/g, '').trim() : "General Operations";
    return cleanTitle;
  };

  // Cross-reference with standard/scheduled events info
  const getEventDetails = (groupName: string) => {
    return events.find(e => e.title?.toLowerCase().trim() === groupName.toLowerCase().trim()) || null;
  };

  // Group matched photos by event
  const groupedItems = filtered.reduce((groups: { [key: string]: any[] }, item) => {
    const groupName = getEventGroup(item);
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(item);
    return groups;
  }, {});

  // Sort groups so the ones with the most recent uploaded photos appear first
  const sortedGroupNames = Object.keys(groupedItems).sort((a, b) => {
    const maxA = Math.max(...groupedItems[a].map(item => item.createdAt?.seconds || 0));
    const maxB = Math.max(...groupedItems[b].map(item => item.createdAt?.seconds || 0));
    return maxB - maxA;
  });

  // Lightbox handlers
  const handleItemClick = (item: any) => {
    const idx = filtered.findIndex(f => f.id === item.id);
    if (idx !== -1) {
      setLightboxIndex(idx);
    }
  };

  const handleNext = () => {
    if (lightboxIndex !== null && filtered.length > 0) {
      setLightboxIndex((lightboxIndex + 1) % filtered.length);
    }
  };

  const handlePrev = () => {
    if (lightboxIndex !== null && filtered.length > 0) {
      setLightboxIndex((lightboxIndex - 1 + filtered.length) % filtered.length);
    }
  };

  // Bind Keyboard Events
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'Escape') setLightboxIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filtered]);

  // Lock scroll when lightbox active
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxIndex]);

  const activeItem = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <div className="space-y-12 animate-fade-in font-sans">
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-ngo-blue tracking-tight">The Gallery</h1>
          <p className="text-slate-500 mt-2 text-lg">Visual stories from our operations around the globe.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Arrange mode switch */}
          <div className="flex gap-1 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm font-sans">
            <button
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'grouped' ? 'bg-ngo-blue text-white shadow-md' : 'text-slate-400 hover:text-ngo-blue'}`}
              title="Arrange by upload events / albums"
            >
              <Layers size={14} />
              <span>By Event</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-ngo-blue text-white shadow-md' : 'text-slate-400 hover:text-ngo-blue'}`}
              title="Classic Grid chronological"
            >
              <Grid size={14} />
              <span>Grid List</span>
            </button>
          </div>

          <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm">
            {['All', 'Photos', 'Videos'].map((t) => (
              <button 
                key={t}
                onClick={() => {
                  setActiveTab(t);
                  setLightboxIndex(null); // Reset indices
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === t ? 'bg-ngo-blue text-white shadow-md' : 'text-slate-400 hover:text-ngo-blue'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {projects.length > 0 && (
            <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm font-sans animate-fade-in">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Filter Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setLightboxIndex(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 border-0 outline-none text-ngo-blue cursor-pointer hover:bg-slate-100 transition-colors mr-1 font-semibold"
              >
                <option value="all">All Initiatives</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      {/* RENDER MODE: GROUPED BY UPLOAD EVENT */}
      {viewMode === 'grouped' && sortedGroupNames.length > 0 && (
        <div className="space-y-16">
          {sortedGroupNames.map((groupName) => {
            const groupMedia = groupedItems[groupName];
            const eventInfo = getEventDetails(groupName);

            return (
              <motion.section 
                key={groupName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Event Group Banner Header */}
                <div className="p-6 md:p-8 bg-slate-50 rounded-[32px] border border-slate-100/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-ngo-blue/5 text-ngo-blue rounded-xl">
                        <Layers size={18} />
                      </div>
                      <h3 className="text-2xl font-black text-ngo-blue tracking-tight">{groupName}</h3>
                    </div>
                    {eventInfo ? (
                      <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
                        {eventInfo.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-450 italic">
                        Media album and records associated with this event campaign.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 items-center text-xs font-semibold text-slate-500">
                    {eventInfo?.location && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-slate-100">
                        <MapPin size={13} className="text-slate-400" />
                        <span>{eventInfo.location}</span>
                      </div>
                    )}
                    {eventInfo?.date && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-slate-100">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{new Date(eventInfo.date.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    )}
                    <span className="px-3 py-1.5 bg-ngo-blue/10 text-ngo-blue rounded-xl font-bold uppercase tracking-wider text-[10px]">
                      {groupMedia.length} {groupMedia.length === 1 ? 'Media' : 'Media files'}
                    </span>
                  </div>
                </div>

                {/* Event Group Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupMedia.map((item) => (
                    <motion.div 
                      key={item.id} 
                      whileHover={{ y: -4 }}
                      onClick={() => handleItemClick(item)}
                      className="relative group rounded-[32px] overflow-hidden bg-slate-50 shadow-xs hover:shadow-2xl transition-all cursor-zoom-in"
                    >
                       <div className="aspect-4/3 w-full bg-slate-100 overflow-hidden relative">
                         <img 
                           src={item.url} 
                           alt={item.title} 
                           className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                           referrerPolicy="no-referrer"
                         />
                         {/* Hover Eye indicator */}
                         <div className="absolute inset-0 bg-ngo-blue/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white text-ngo-blue flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                              <Eye size={20} />
                            </div>
                         </div>
                       </div>
                       <div className="absolute inset-0 bg-gradient-to-t from-ngo-blue/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-6 flex flex-col justify-end">
                           <div className="flex flex-wrap gap-1.5 mb-2">
                              <span className="text-[9px] font-black text-lemon uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                 {item.type}
                              </span>
                              {item.projectTitle && (
                                <span className="text-[9px] font-bold text-white bg-lemon/30 text-lemon border border-lemon/20 px-2.5 py-1 rounded-full backdrop-blur-sm truncate max-w-[150px]">
                                   {item.projectTitle}
                                </span>
                              )}
                           </div>
                           <h4 className="text-white font-bold text-base leading-tight truncate">{item.title}</h4>
                           {item.type === 'video' && (
                             <div className="absolute inset-0 flex items-center justify-center">
                               <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                                  <Play className="text-white fill-white ml-0.5" size={20} />
                               </div>
                             </div>
                           )}
                       </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>
      )}

      {/* RENDER MODE: STANDARD CHRONOLOGICAL MASONRY/GRID */}
      {(viewMode === 'grid' || sortedGroupNames.length === 0) && filtered.length > 0 && (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {filtered.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleItemClick(item)}
              className="relative group rounded-[32px] overflow-hidden bg-slate-100 shadow-sm hover:shadow-2xl transition-all cursor-zoom-in"
            >
               <img 
                 src={item.url} 
                 alt={item.title} 
                 className="w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-ngo-blue/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                   <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="text-[10px] font-black text-lemon uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full w-fit backdrop-blur-sm border border-white/10">
                         {item.type}
                      </span>
                      {item.projectTitle && (
                        <span className="text-[10px] font-bold text-white bg-lemon/30 text-lemon border border-lemon/20 px-3 py-1 rounded-full w-fit backdrop-blur-sm truncate max-w-[180px]">
                           {item.projectTitle}
                        </span>
                      )}
                      {item.eventName && (
                        <span className="text-[10px] font-bold text-ngo-blue bg-white border border-slate-100 px-3 py-1 rounded-full w-fit max-w-[180px] truncate font-sans">
                           Album: {item.eventName}
                        </span>
                      )}
                   </div>
                   <h4 className="text-white font-bold text-lg leading-tight">{item.title}</h4>
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
        </div>
      )}

      {/* FALLBACK: EMPTY STATE */}
      {filtered.length === 0 && (
        <div className="py-32 flex flex-col items-center justify-center bg-white border border-dashed border-slate-200 rounded-[40px] text-slate-305">
           <ImageIcon size={64} className="mb-4 text-slate-300 opacity-60" />
           <p className="font-bold text-lg text-slate-500">No media found for the selected filters</p>
           <p className="text-xs text-slate-400 mt-1">Try selecting a different filter above or add photos in the admin area.</p>
        </div>
      )}

      {/* PORTAL-LIKE FULLSCREEN LIGHTBOX POPUP */}
      <AnimatePresence>
        {activeItem && lightboxIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-between p-4 md:p-8 bg-slate-950/98 backdrop-blur-xl outline-hidden select-none"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top Bar Navigation */}
            <div className="flex items-center justify-between w-full text-slate-400 font-sans p-2">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Global Gallery</p>
                <h4 className="text-sm font-bold text-white truncate max-w-[300px] md:max-w-xl">
                  {activeItem.title}
                </h4>
              </div>

              {/* Index counter and Close */}
              <div className="flex items-center gap-6">
                <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-500 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                  {lightboxIndex + 1} of {filtered.length}
                </span>
                <button 
                  onClick={() => setLightboxIndex(null)}
                  className="p-2 ml-1 bg-white/5 rounded-full border border-white/10 text-white hover:bg-white/15 transition-all cursor-pointer"
                  title="Close Gallery Lightbox (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Main Stage View Area */}
            <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              
              {/* Prev Button */}
              <button 
                onClick={handlePrev}
                className="absolute left-0 md:left-4 z-40 p-4 bg-black/40 text-white hover:bg-black/70 rounded-full border border-white/5 hover:scale-105 transition-all text-slate-200 cursor-pointer"
                title="Previous (Left Arrow)"
              >
                <ChevronLeft size={24} />
              </button>

              {/* Display Media */}
              <div className="max-w-full max-h-[75vh] md:max-h-[80vh] flex items-center justify-center p-2 rounded-[24px] overflow-hidden">
                {activeItem.type === 'video' ? (
                  <video 
                    src={activeItem.url} 
                    controls 
                    autoPlay
                    className="max-w-full max-h-[75vh] md:max-h-[80vh] rounded-2xl border border-white/10 shadow-2xl" 
                  />
                ) : (
                  <img 
                    src={activeItem.url} 
                    alt={activeItem.title} 
                    className="max-w-full max-h-[75vh] md:max-h-[80vh] object-contain rounded-2xl border border-white/10 shadow-2xl selection:bg-transparent"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {/* Next Button */}
              <button 
                onClick={handleNext}
                className="absolute right-0 md:right-4 z-40 p-4 bg-black/40 text-white hover:bg-black/70 rounded-full border border-white/5 hover:scale-105 transition-all text-slate-200 cursor-pointer"
                title="Next (Right Arrow)"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Bottom Bar Specifications */}
            <div className="w-full max-w-2xl mx-auto bg-white/5 border border-white/5 rounded-[24px] p-6 text-center text-slate-400 backdrop-blur-md mb-2 font-sans flex flex-col gap-2 relative z-30" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-center flex-wrap gap-2">
                <span className="text-[10px] font-black text-lemon uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full border border-white/5">
                   {activeItem.type}
                </span>
                {activeItem.projectTitle && (
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-450/10 px-3 py-1 rounded-full">
                     Project: {activeItem.projectTitle}
                  </span>
                )}
                {(activeItem.eventName || getEventGroup(activeItem)) && (
                  <span className="text-[10px] font-bold text-lemon bg-lemon/10 border border-lemon/10 px-3 py-1 rounded-full">
                     Event Profile: {activeItem.eventName || getEventGroup(activeItem)}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-white max-w-xl mx-auto mt-1">
                {activeItem.title}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
