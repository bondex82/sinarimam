import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { getEvents } from '../services/cmsService';

export default function Events() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    getEvents().then(setEvents);
  }, []);

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-5xl font-black text-ngo-blue tracking-tight">Our Calendar</h1>
        <p className="text-slate-500 mt-2 text-lg">Join us in person or virtually for workshops, galas, and field work orientation.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {events.map((e, idx) => (
          <div key={e.id || idx} className="group bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -mr-16 -mt-16"></div>
            
            <div className="flex justify-between items-start">
               <div className="w-16 h-20 bg-ngo-blue rounded-2xl flex flex-col items-center justify-center text-white font-black shadow-lg shadow-ngo-blue/20">
                  <span className="text-[10px] text-blue-300 uppercase opacity-60">
                    {e.date?.toDate ? new Date(e.date.toDate()).toLocaleDateString('en-US', { month: 'short' }) : 'DATE'}
                  </span>
                  <span className="text-2xl tracking-tighter">
                    {e.date?.toDate ? new Date(e.date.toDate()).getDate() : '--'}
                  </span>
               </div>
               <span className="bg-slate-50 text-slate-400 text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest uppercase border border-slate-100">
                  {e.location.toLowerCase().includes('zoom') || e.location.toLowerCase().includes('online') ? 'Online' : 'In-Person'}
               </span>
            </div>

            <div className="space-y-4">
               <Link to={`/events/${e.id}`}>
                 <h3 className="text-2xl font-black text-ngo-blue group-hover:text-gold transition-colors">{e.title}</h3>
               </Link>
               <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{e.description || "Join our team and fellow community members for this impactful gathering focused on our local initiatives."}</p>
            </div>

            <div className="pt-6 border-t border-slate-50 flex flex-wrap gap-6 text-xs font-bold text-slate-400">
               <div className="flex items-center gap-2">
                  <Clock size={16} className="text-lemon" /> 10:00 AM - 2:00 PM
               </div>
               <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gold" /> {e.location}
               </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link to={`/events/${e.id}`} className="flex-1 py-4 bg-ngo-blue text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-ngo-blue/10">
                View Details <ArrowRight size={18} />
              </Link>
              <button 
                onClick={() => {
                  const shareTitle = e.title;
                  const shareUrl = `${window.location.origin}/events/${e.id}`;
                  if (navigator.share) {
                    navigator.share({ title: shareTitle, url: shareUrl }).catch(console.error);
                  } else {
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
                  }
                }}
                className="flex-1 py-4 bg-slate-50 text-ngo-blue rounded-2xl font-bold hover:bg-lemon transition-colors"
              >
                 Share Event
              </button>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100 italic text-slate-400">
           No events scheduled currently.
        </div>
      )}
    </div>
  );
}
