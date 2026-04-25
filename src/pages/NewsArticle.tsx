import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Newspaper, Calendar, ChevronLeft, Share2, Clock } from 'lucide-react';
import { getNewsItem } from '../services/cmsService';

export default function NewsArticle() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getNewsItem(id).then(item => {
        setArticle(item);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-lemon border-t-ngo-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-40 space-y-6">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <Newspaper size={40} />
        </div>
        <h2 className="text-3xl font-black text-ngo-blue">Article Not Found</h2>
        <p className="text-slate-500">The article you looking for may have been removed or moved.</p>
        <Link to="/news" className="inline-flex items-center gap-2 bg-ngo-blue text-white px-8 py-4 rounded-full font-black text-sm hover:scale-105 transition-transform">
          <ChevronLeft size={18} /> Back to News
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <Link to="/news" className="inline-flex items-center gap-2 text-slate-400 hover:text-ngo-blue font-black uppercase tracking-widest text-[10px] transition-colors group">
        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to all updates
      </Link>

      <header className="space-y-8">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-gold uppercase tracking-[0.2em] bg-gold/10 px-4 py-1.5 rounded-full">
              <Calendar size={12} /> {article.publishedAt ? new Date(article.publishedAt.toDate()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Draft'}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-100 px-4 py-1.5 rounded-full">
              <Clock size={12} /> 5 min read
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-ngo-blue leading-[1.1] tracking-tighter">
            {article.title}
          </h1>
        </div>

        <div className="max-w-3xl mx-auto rounded-[40px] overflow-hidden bg-slate-50 relative shadow-xl border border-slate-100">
          {article.imageUrl ? (
            <img 
              src={article.imageUrl} 
              alt={article.title} 
              className="w-full h-auto max-h-[500px] object-contain" 
            />
          ) : (
            <div className="aspect-video w-full flex items-center justify-center text-slate-300">
              <Newspaper size={80} />
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        <aside className="md:col-span-1 flex md:flex-col gap-6 sticky top-32 h-fit">
          <button className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-ngo-blue hover:border-ngo-blue transition-all shadow-sm">
            <Share2 size={20} />
          </button>
        </aside>

        <article className="md:col-span-11 space-y-8">
          <div className="prose prose-slate prose-lg max-w-none text-slate-600 leading-relaxed font-medium">
             {article.content.split('\n').map((para: string, i: number) => (
               <p key={i} className="mb-6">{para}</p>
             ))}
          </div>

          <div className="p-12 bg-ngo-blue rounded-[40px] text-white relative overflow-hidden mt-20">
             <div className="absolute top-0 right-0 w-64 h-64 bg-lemon/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
             <div className="relative z-10 space-y-6">
                <h3 className="text-3xl font-black tracking-tight">Stay updated with our mission.</h3>
                <p className="text-blue-200">Join our newsletter to receive the latest updates directly in your inbox.</p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md">
                   <input type="email" placeholder="Your email address" className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 outline-none focus:bg-white/20 transition-all placeholder:text-blue-300" />
                   <button className="bg-lemon text-ngo-blue px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform whitespace-nowrap">Subscribe</button>
                </div>
             </div>
          </div>
        </article>
      </div>
    </div>
  );
}
