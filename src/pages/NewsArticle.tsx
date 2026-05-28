import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, Calendar, ChevronLeft, Share2, Clock, Check } from 'lucide-react';
import { getNewsItem } from '../services/cmsService';

export default function NewsArticle() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = article?.title ? `${article.title} - Sinarimam Foundation` : 'Check out this update by Sinarimam Foundation';

  const shareLinks = [
    { 
      name: 'X (Twitter)', 
      icon: <Share2 size={18} />, 
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
      color: 'bg-black text-white hover:bg-black/90'
    },
    { 
      name: 'Facebook', 
      icon: <span className="font-extrabold text-lg text-white">f</span>, 
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: 'bg-[#1877F2] text-white hover:bg-[#1877F2]/90'
    },
    { 
      name: 'WhatsApp', 
      icon: <span className="font-bold text-sm text-white">WA</span>, 
      url: `https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`,
      color: 'bg-[#25D366] text-white hover:bg-[#25D366]/90'
    }
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <button 
            type="button"
            onClick={() => setShowShareModal(true)}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-ngo-blue hover:border-ngo-blue transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
            title="Share Article"
          >
            <Share2 size={20} />
          </button>
        </aside>

        <article className="md:col-span-11 space-y-8">
          <div className="prose prose-slate prose-lg max-w-none text-slate-600 leading-relaxed font-medium">
             {article.content.split('\n').map((para: string, i: number) => (
               <p key={i} className="mb-6">{para}</p>
             ))}
          </div>
        </article>
      </div>

      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-ngo-blue/60 backdrop-blur-sm shadow-2xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-sm p-8 shadow-2xl relative z-10 space-y-8 text-ngo-blue text-left"
            >
               <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-ngo-blue">Spread the Word</h3>
                  <p className="text-slate-500 text-sm">Share this news update with your network to raise awareness.</p>
               </div>

               <div className="grid grid-cols-1 gap-3">
                  {shareLinks.map((link) => (
                     <a 
                       key={link.name}
                       href={link.url}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex items-center gap-4 p-4 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] bg-slate-50 hover:bg-slate-100 border border-slate-100 text-ngo-blue text-left"
                     >
                        <div className={`w-10 h-10 ${link.color.split(' ')[0]} rounded-xl flex items-center justify-center shadow-sm`}>
                           {link.icon}
                        </div>
                        Share on {link.name}
                     </a>
                  ))}
                  
                  <button 
                    type="button"
                    onClick={copyToClipboard}
                    className="flex items-center gap-4 p-4 rounded-xl font-bold bg-slate-50 text-ngo-blue border border-slate-100 hover:bg-slate-100 transition-all group w-full cursor-pointer text-left"
                  >
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        {copied ? <Check size={18} className="text-green-500" /> : <Share2 size={18} />}
                     </div>
                     {copied ? 'Copied Link!' : 'Copy Article Link'}
                  </button>
               </div>

               <button 
                 type="button"
                 onClick={() => setShowShareModal(false)}
                 className="w-full py-4 text-slate-400 font-bold hover:text-red-500 transition-colors cursor-pointer text-center"
               >
                 Close
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
