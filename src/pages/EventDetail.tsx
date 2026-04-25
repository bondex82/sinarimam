import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Share2, 
  ArrowLeft,
  Bell,
  Users
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'events', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error('Error fetching event:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = window.location.href;
  const shareTitle = event?.title || 'Check out this event at Sinarimam Foundation';

  const shareLinks = [
    { 
      name: 'X (Twitter)', 
      icon: <Share2 size={20} />, 
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
      color: 'bg-black text-white'
    },
    { 
      name: 'Facebook', 
      icon: <Users size={20} />, 
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: 'bg-[#1877F2] text-white'
    },
    { 
      name: 'WhatsApp', 
      icon: <Bell size={20} />, 
      url: `https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`,
      color: 'bg-[#25D366] text-white'
    }
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-lemon border-t-ngo-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-40 space-y-6">
        <h2 className="text-3xl font-black text-ngo-blue">Event Not Found</h2>
        <Link to="/events" className="inline-flex items-center gap-2 bg-ngo-blue text-white px-8 py-4 rounded-full font-black text-sm">
          <ArrowLeft size={18} /> Back to Calendar
        </Link>
      </div>
    );
  }

  const dateObj = event.date?.toDate ? new Date(event.date.toDate()) : (event.date ? new Date(event.date) : new Date());

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <Link to="/events" className="inline-flex items-center gap-2 text-slate-400 hover:text-ngo-blue font-black uppercase tracking-widest text-[10px] transition-colors group">
        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Our Calendar
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
           <header className="space-y-6">
              <div className="flex items-center gap-3">
                 <span className="px-4 py-1.5 bg-gold/10 text-gold rounded-full text-[10px] font-black uppercase tracking-widest">
                   {event.location.toLowerCase().includes('online') ? 'Digital Workshop' : 'Community Gathering'}
                 </span>
                 <div className="h-px flex-1 bg-slate-100" />
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-ngo-blue leading-[1.05] tracking-tighter italic">
                {event.title}
              </h1>
           </header>

           <div className="aspect-video w-full rounded-[48px] overflow-hidden bg-slate-100 shadow-2xl relative border-8 border-white">
              {event.imageUrl ? (
                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-ngo-blue/10 bg-slate-50 gap-4">
                   <Calendar size={120} strokeWidth={1} />
                   <p className="font-black uppercase tracking-[0.2em] opacity-30 text-xs text-ngo-blue">Event Visualization</p>
                </div>
              )}
           </div>

           <div className="prose prose-slate prose-lg max-w-none text-slate-600 leading-relaxed font-medium">
              {event.description?.split('\n').map((p: string, i: number) => (
                <p key={i}>{p}</p>
              )) || "Join our team and fellow community members for this impactful gathering focused on our local initiatives. This event provides an opportunity to connect, learn, and contribute to the foundation's goals."}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-ngo-blue/5 space-y-8 sticky top-32">
              <div className="space-y-6">
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-gold shrink-0 border border-slate-100">
                       <Calendar size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                       <p className="font-bold text-ngo-blue">{dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                 </div>

                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lemon shrink-0 border border-slate-100">
                       <Clock size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time</p>
                       <p className="font-bold text-ngo-blue">10:00 AM - 2:00 PM</p>
                    </div>
                 </div>

                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-400 shrink-0 border border-slate-100">
                       <MapPin size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                       <p className="font-bold text-ngo-blue">{event.location}</p>
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-50 space-y-4">
                 <button className="w-full py-5 bg-ngo-blue text-white rounded-2xl font-black shadow-xl shadow-ngo-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                    <Bell size={20} className="text-lemon" /> Remind Me
                 </button>
                 <button 
                   onClick={() => setShowShareModal(true)}
                   className="w-full py-5 border-2 border-slate-100 text-ngo-blue rounded-2xl font-black hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-3"
                 >
                    <Share2 size={20} /> Share Event
                 </button>
              </div>

              {/* Share Modal */}
              <AnimatePresence>
                {showShareModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowShareModal(false)}
                      className="absolute inset-0 bg-ngo-blue/60 backdrop-blur-sm"
                    />
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: 20 }}
                      className="bg-white rounded-[40px] w-full max-w-sm p-8 shadow-2xl relative z-10 space-y-8"
                    >
                       <div className="text-center space-y-2">
                          <h3 className="text-2xl font-black text-ngo-blue">Spread the Word</h3>
                          <p className="text-slate-500 text-sm">Share this event with your network to help our cause.</p>
                       </div>

                       <div className="grid grid-cols-1 gap-3">
                          {shareLinks.map((link) => (
                             <a 
                               key={link.name}
                               href={link.url}
                               target="_blank"
                               rel="noopener noreferrer"
                               className={`flex items-center gap-4 p-4 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${link.color}`}
                             >
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                   {link.icon}
                                </div>
                                Share on {link.name}
                             </a>
                          ))}
                          
                          <button 
                            onClick={copyToClipboard}
                            className="flex items-center gap-4 p-4 rounded-2xl font-bold bg-slate-50 text-ngo-blue border border-slate-100 hover:bg-slate-100 transition-all group"
                          >
                             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <Share2 size={20} />
                             </div>
                             {copied ? 'Link Copied!' : 'Copy Event Link'}
                          </button>
                       </div>

                       <button 
                         onClick={() => setShowShareModal(false)}
                         className="w-full py-4 text-slate-400 font-bold hover:text-red-500 transition-colors"
                       >
                         Close
                       </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              <div className="bg-lemon/10 p-6 rounded-3xl border border-lemon/20 flex items-center gap-4">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-ngo-blue shadow-sm">
                    <Users size={20} />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-ngo-blue">42 Registered</p>
                    <p className="text-[10px] text-ngo-blue/60 uppercase font-black">Limited Spots</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
