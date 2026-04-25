import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Calendar, ArrowUpRight } from 'lucide-react';
import { getNews } from '../services/cmsService';

export default function News() {
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    getNews().then(setNews);
  }, []);

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-5xl font-black text-ngo-blue tracking-tight">The News Hub</h1>
        <p className="text-slate-500 mt-2 text-lg">Updates from the field, policy changes, and community success stories.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {news.map((item, idx) => (
          <article key={item.id || idx} className="group bg-white rounded-[40px] p-2 pr-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row gap-8 items-center">
            <Link to={`/news/${item.id}`} className="w-full md:w-80 aspect-[4/3] bg-ngo-blue/5 rounded-[36px] overflow-hidden flex-shrink-0 relative">
               {item.imageUrl ? (
                 <img src={item.imageUrl} alt={item.title} className="w-full h-full object-contain bg-slate-50 group-hover:scale-105 transition-transform duration-700" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-ngo-blue/20">
                    <Newspaper size={80} />
                 </div>
               )}
               <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full text-[10px] font-black text-ngo-blue shadow-lg">
                 ARTICLE #{news.length - idx}
               </div>
            </Link>
            <div className="flex-1 py-4">
              <div className="flex items-center gap-4 mb-4">
                 <div className="flex items-center gap-2 text-[10px] font-black text-gold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full">
                    <Calendar size={12} /> {item.publishedAt ? new Date(item.publishedAt.toDate()).toLocaleDateString() : 'Draft'}
                 </div>
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">5 min read</p>
              </div>
              <Link to={`/news/${item.id}`}>
                <h2 className="text-3xl font-black text-ngo-blue mb-4 group-hover:text-lemon transition-colors leading-tight">
                  {item.title}
                </h2>
              </Link>
              <p className="text-slate-500 leading-relaxed text-sm mb-6 line-clamp-3">
                {item.content}
              </p>
              <Link to={`/news/${item.id}`} className="flex items-center gap-2 text-ngo-blue font-black text-sm group-hover:gap-4 transition-all uppercase tracking-tighter">
                Read Full Story <ArrowUpRight size={18} className="text-lemon" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      {news.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100 italic text-slate-400">
           No articles published yet. Stay tuned!
        </div>
      )}
    </div>
  );
}
