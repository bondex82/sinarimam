import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Heart, Calendar, Newspaper, Info, User } from 'lucide-react';
import { getProjects, getNews, getEvents, getAboutInfo } from '../services/cmsService';
import { motion } from 'motion/react';

const heroImages = [
  "https://i.ibb.co/N6Rhd190/1774966869615.jpg",
  "https://i.ibb.co/xdYPJWS/1774966869654.jpg",
  "https://i.ibb.co/BHFTb3YN/1774966871883.jpg",
  "https://i.ibb.co/C3W97FrG/IMG-20231215-WA0034-jpg.jpg"
];

export default function Home() {
  const [projects, setProjects] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [about, setAbout] = useState<any>(null);

  useEffect(() => {
    getProjects(2).then(setProjects);
    getNews(3).then(setNews);
    getEvents(3).then(setEvents);
    getAboutInfo().then(setAbout);
  }, []);

  return (
    <div className="space-y-12">
      <header className="bg-gradient-to-r from-ngo-blue to-blue-800 p-10 md:p-14 rounded-[40px] text-white shadow-xl relative overflow-hidden min-h-[500px] flex items-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-lemon opacity-10 rounded-full blur-3xl -mr-48 -mt-48 transition-all duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold opacity-10 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="bg-gold/20 text-gold px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 inline-block border border-gold/20">Impact Since 2020</span>
              <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
                Empowering Growth, <br/>Building <span className="text-lemon italic">Resilience</span>.
              </h1>
              <p className="text-blue-100 text-xl leading-relaxed opacity-90 mb-10 max-w-lg">
                We are dedicated to sustainable change through transparency, data, and community action.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/volunteer" className="bg-lemon text-ngo-blue px-8 py-4 rounded-full font-bold shadow-xl shadow-lemon/30 hover:scale-105 hover:shadow-lemon/40 transition-all">
                  Join the Cause
                </Link>
                <Link to="/projects" className="bg-white/10 text-white px-8 py-4 rounded-full font-bold backdrop-blur-md hover:bg-white/20 border border-white/20 transition-all">
                  See Our Proof
                </Link>
              </div>
            </motion.div>
          </div>

          <div className="relative hidden lg:flex justify-center items-center h-[400px]">
             {heroImages.map((src, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    rotate: (i - 1.5) * 8,
                    x: (i - 1.5) * 40,
                    y: Math.abs(i - 1.5) * 10
                  }}
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: 0, 
                    zIndex: 50,
                    transition: { duration: 0.3 }
                  }}
                  transition={{ 
                    delay: i * 0.1,
                    type: "spring",
                    stiffness: 100,
                    damping: 20
                  }}
                  className="absolute w-56 h-72 rounded-3xl overflow-hidden shadow-2xl border-4 border-white cursor-pointer origin-bottom"
                  style={{ zIndex: i }}
                >
                   <img src={src} className="w-full h-full object-cover" alt="Hero impact" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </motion.div>
             ))}
          </div>
        </div>
      </header>

      {/* Founder's Welcome */}
      {!about ? (
        <div className="animate-pulse bg-white rounded-[64px] p-8 md:p-14 border border-slate-100 flex flex-col md:flex-row gap-12 items-center">
          <div className="w-full md:w-1/4 aspect-[3/4] bg-slate-100 rounded-[48px]" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-slate-100 rounded w-1/4" />
            <div className="h-12 bg-slate-100 rounded w-3/4" />
            <div className="space-y-2">
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-4 bg-slate-100 rounded w-2/3" />
            </div>
          </div>
        </div>
      ) : (
        <section className="bg-white rounded-[64px] p-8 md:p-14 border border-slate-100 flex flex-col md:flex-row gap-12 items-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-lemon/5 rounded-full blur-3xl opacity-50" />
           <div className="w-full md:w-1/4 aspect-square md:aspect-[3/4] rounded-[48px] overflow-hidden bg-slate-100 relative group shadow-2xl shrink-0">
              {about?.founderPhoto ? (
                <img src={about.founderPhoto} alt={about.founderName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                   <User size={80} />
                </div>
              )}
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-ngo-blue/40 backdrop-blur-md rounded-2xl border border-white/20">
                 <p className="text-white font-black tracking-tight text-sm">{about?.founderName || 'Sarah Jenkins'}</p>
                 <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest">Foundation Founder</p>
              </div>
           </div>
           <div className="flex-1 space-y-8">
              <div className="space-y-4">
                 <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em] bg-gold/10 px-6 py-2 rounded-full">A message from our lead</span>
                 <h2 className="text-4xl font-black text-ngo-blue leading-tight tracking-tighter italic">
                    "Your compassion is the <span className="text-lemon not-italic underline decoration-ngo-blue underline-offset-8">engine</span> of our progress."
                 </h2>
              </div>
              <div className="prose prose-slate prose-lg max-w-none text-slate-600 leading-relaxed font-medium">
                 {(about?.founderWelcome || "We believe that empowerment begins with a single step towards community resilience. Over the last decade, Sinarimam Foundation has worked tirelessly to bridge gaps in education, health, and economic stability. Our progress is a testament to the collective power of dedicated individuals working towards a common goal of sustainable development and social justice.").split('\n').map((para: string, i: number) => (
                    <p key={i} className="mb-4">{para}</p>
                 ))}
              </div>
              <div className="pt-4 flex items-center gap-6">
                 <div className="w-12 h-px bg-slate-200" />
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">{about?.founderName || 'Dr. Sarah Jenkins'}</p>
              </div>
           </div>
        </section>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Projects & News */}
        <div className="lg:col-span-8 space-y-12">
          {/* Projects Section */}
          <section>
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-black text-ngo-blue tracking-tight">Active Causes</h2>
                <div className="h-1.5 w-12 bg-lemon mt-2 rounded-full"></div>
              </div>
              <Link to="/projects" className="text-ngo-blue font-bold text-sm flex items-center gap-2 group">
                All Projects <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.length > 0 ? projects.map((p) => {
                const progress = p.targetAmount ? Math.min(Math.round((p.raisedAmount / p.targetAmount) * 100), 100) : null;
                return (
                  <Link key={p.id} to={`/projects/${p.id}`} className="group bg-white rounded-[32px] p-2 shadow-sm border border-slate-100 hover:shadow-xl hover:border-gold/30 transition-all flex flex-col">
                     <div className="aspect-video w-full bg-slate-100 rounded-[24px] overflow-hidden relative">
                        {p.imageUrl ? <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-ngo-blue/20"><Heart size={48} /></div>}
                        <span className="absolute top-4 left-4 bg-ngo-blue text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">{p.status}</span>
                     </div>
                     <div className="p-6 space-y-4">
                        <div>
                           <h3 className="font-bold text-xl text-ngo-blue mb-2 group-hover:text-gold transition-colors">{p.title}</h3>
                           <p className="text-slate-500 text-sm line-clamp-2 font-medium leading-relaxed">{p.description}</p>
                        </div>
                        
                        {progress !== null && (
                           <div className="space-y-2 pt-2">
                              <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                                 <span className="text-slate-400">Raised: ₦{p.raisedAmount.toLocaleString()}</span>
                                 <span className="text-ngo-blue">{progress}%</span>
                              </div>
                              <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                 <div 
                                   className="h-full bg-gold transition-all duration-1000" 
                                   style={{ width: `${progress}%` }} 
                                 />
                              </div>
                           </div>
                        )}
                     </div>
                  </Link>
                );
              }) : (
                [1,2].map(i => (
                  <div key={i} className="animate-pulse bg-white rounded-[32px] p-6 h-64 border border-slate-100">
                    <div className="w-full h-32 bg-slate-100 rounded-2xl mb-4"></div>
                    <div className="w-3/4 h-6 bg-slate-100 rounded mb-2"></div>
                    <div className="w-full h-4 bg-slate-100 rounded"></div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* News Feed */}
          <section>
             <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-black text-ngo-blue tracking-tight">The Latest News</h2>
                  <div className="h-1.5 w-12 bg-gold mt-2 rounded-full"></div>
                </div>
                <Link to="/news" className="text-ngo-blue font-bold text-sm flex items-center gap-2 group">
                  News Hub <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
             </div>
              <div className="space-y-4">
                 {news.map((item, idx) => (
                   <Link key={item.id || idx} to={`/news/${item.id}`} className="bg-white p-4 rounded-[32px] border border-slate-100 flex gap-6 items-center hover:bg-slate-50 transition-all group hover:shadow-lg">
                      <div className="w-24 h-24 bg-ngo-blue/5 rounded-[24px] flex-shrink-0 overflow-hidden relative group-hover:scale-105 transition-transform">
                         {item.imageUrl ? (
                           <img src={item.imageUrl} alt={item.title} className="w-full h-full object-contain bg-slate-50" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-ngo-blue/20">
                             <Newspaper size={32} />
                           </div>
                         )}
                      </div>
                      <div className="flex-1">
                         <div className="flex items-center gap-3 mb-1">
                           <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">{item.publishedAt ? new Date(item.publishedAt.toDate()).toLocaleDateString() : 'Update'}</span>
                         </div>
                         <h3 className="text-lg font-black text-ngo-blue group-hover:text-gold transition-colors line-clamp-1 tracking-tight">{item.title}</h3>
                         <p className="text-slate-500 text-sm line-clamp-1 mt-1 font-medium">{item.content}</p>
                      </div>
                   </Link>
                 ))}
              </div>
          </section>
        </div>

        {/* Right Column: Events & Volunteer */}
        <div className="lg:col-span-4 space-y-8">
           {/* Events Widget */}
           <section className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-bold text-ngo-blue mb-6 flex items-center gap-2">
                <Calendar className="text-gold" /> Events
              </h2>
              <div className="space-y-6">
                 {events.map((e, idx) => (
                   <Link key={e.id || idx} to={`/events/${e.id}`} className="flex gap-4 group cursor-pointer transition-all">
                      <div className="flex-shrink-0 w-12 h-14 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100 group-hover:border-lemon transition-colors">
                         <span className="text-[10px] font-bold text-slate-400 uppercase">
                           {e.date?.toDate ? new Date(e.date.toDate()).toLocaleDateString('en-US', { month: 'short' }) : 'MAY'}
                         </span>
                         <span className="text-lg font-black text-ngo-blue">
                           {e.date?.toDate ? new Date(e.date.toDate()).getDate() : '24'}
                         </span>
                      </div>
                      <div>
                         <h4 className="text-sm font-bold text-ngo-blue group-hover:text-lemon transition-colors">{e.title}</h4>
                         <p className="text-xs text-slate-400 mt-0.5">{e.location}</p>
                      </div>
                   </Link>
                 ))}
                 {events.length === 0 && <p className="text-xs text-slate-400 italic">No upcoming events scheduled.</p>}
              </div>
           </section>

           {/* Volunteer Teaser */}
           <section className="bg-lemon rounded-[32px] p-8 text-ngo-blue shadow-xl shadow-lemon/20">
              <Heart size={40} className="mb-4 text-ngo-blue opacity-50" />
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">Be the Spark</h3>
              <p className="text-sm font-medium mb-8 leading-relaxed opacity-80">
                Join our roster of over 1,200 volunteers across various departments. Your skills can change lives.
              </p>
              <Link to="/volunteer" className="w-full py-4 bg-ngo-blue text-white rounded-[20px] font-bold text-center block shadow-lg hover:translate-y-[-2px] transition-all">
                Become a Volunteer
              </Link>
           </section>

           {/* Founder/Testimonial */}
           <section className="bg-ngo-blue rounded-[32px] p-8 text-white">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-lemon border-2 border-white/20 p-1 overflow-hidden">
                   {about?.founderPhoto ? (
                      <img src={about.founderPhoto} alt={about.founderName} className="w-full h-full object-cover rounded-full" />
                   ) : (
                      <div className="w-full h-full rounded-full bg-blue-900 border border-white/10 flex items-center justify-center text-lemon">
                         <User size={24} />
                      </div>
                   )}
                </div>
                <div>
                   <p className="font-bold">{about?.founderName || 'Founder'}</p>
                   <p className="text-[10px] text-blue-300 uppercase tracking-widest">Founder & Visionary</p>
                </div>
              </div>
              <p className="text-sm italic leading-relaxed text-blue-100/80">
                "{about?.founderBio || "Our mission is to build systems that empower communities and ensure sustainable growth for all."}"
              </p>
           </section>
        </div>
      </div>
    </div>
  );
}
