import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Target, 
  TrendingUp, 
  Calendar, 
  ShieldCheck, 
  Share2,
  Heart,
  Image as ImageIcon,
  Users
} from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProject({ id: docSnap.id, ...docSnap.data() });
          
          // Fetch associated gallery items
          const q = query(collection(db, 'gallery'), where('projectId', '==', id));
          const gallerySnap = await getDocs(q);
          setGalleryItems(gallerySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (err) {
        console.error('Error fetching project details/gallery:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-lemon border-t-ngo-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-40 space-y-6">
        <h2 className="text-3xl font-black text-ngo-blue">Project Not Found</h2>
        <Link to="/projects" className="inline-flex items-center gap-2 bg-ngo-blue text-white px-8 py-4 rounded-full font-black text-sm">
          <ChevronLeft size={18} /> Back to Projects
        </Link>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = project?.title ? `${project.title} - Sinarimam Foundation` : 'Check out this project by Sinarimam Foundation';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progress = project.targetAmount ? Math.min(Math.round((project.raisedAmount / project.targetAmount) * 100), 100) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 animate-fade-in">
      <Link to="/projects" className="inline-flex items-center gap-2 text-slate-400 hover:text-ngo-blue font-black uppercase tracking-widest text-[10px] transition-colors group">
        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> All initiatives
      </Link>

      <header className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
           <div className="space-y-4">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                project.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 
                project.status === 'Upcoming' ? 'bg-blue-50 text-blue-600' : 
                'bg-lemon/20 text-ngo-blue'
              }`}>
                {project.status} Initiative
              </span>
              <h1 className="text-5xl md:text-6xl font-black text-ngo-blue leading-[1.1] tracking-tighter">
                {project.title}
              </h1>
           </div>
           <p className="text-lg text-slate-500 leading-relaxed font-medium">
             {project.description}
           </p>

           {progress !== null && (
             <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-ngo-blue/5 space-y-6">
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fundraising Progress</p>
                      <h3 className="text-3xl font-black text-ngo-blue">₦{project.raisedAmount.toLocaleString()} <span className="text-slate-300 text-lg font-bold">/ ₦{project.targetAmount.toLocaleString()}</span></h3>
                   </div>
                   <div className="text-right">
                      <p className="text-4xl font-black text-gold">{progress}%</p>
                   </div>
                </div>
                <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${progress}%` }}
                     transition={{ duration: 1, ease: 'easeOut' }}
                     className="h-full bg-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                   />
                </div>
                <Link 
                  to={`/contact?subject=${encodeURIComponent(`Support Cause - ${project.title}`)}&message=${encodeURIComponent(`Dear Sinarimam Foundation Team,\n\nI am reaching out because I would like to support the initiative: "${project.title}".\n\nPlease let me know how I can contribute toward this fundraising cause.\n\nWarm regards,\n`)}`}
                  className="w-full py-5 bg-ngo-blue text-white rounded-2xl font-black shadow-xl shadow-ngo-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer text-center"
                >
                   <Heart size={20} className="text-lemon fill-lemon" /> Support This Cause
                </Link>
             </div>
           )}
        </div>

        <div className="relative">
           <div className="aspect-[4/5] rounded-[60px] overflow-hidden shadow-2xl relative z-10">
              {project.imageUrl ? (
                <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                   <Target size={80} />
                </div>
              )}
           </div>
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-lemon/20 rounded-full blur-3xl" />
           <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gold/10 rounded-full blur-3xl" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
         {[
           { icon: Calendar, label: 'Started On', value: project.createdAt ? new Date(project.createdAt.toDate()).toLocaleDateString() : 'Active' },
           { icon: ShieldCheck, label: 'Intervention', value: 'Community Driven' },
           { icon: TrendingUp, label: 'Impact Level', value: 'High' }
         ].map((stat, i) => (
           <div key={i} className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 flex items-center gap-6">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-ngo-blue shadow-sm">
                 <stat.icon size={24} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                 <p className="font-bold text-ngo-blue">{stat.value}</p>
              </div>
           </div>
         ))}
      </div>

      {galleryItems.length > 0 && (
         <div className="space-y-6 pt-12 animate-fade-in">
            <div className="flex border-b border-slate-100 pb-4">
               <div>
                  <h3 className="text-2xl font-black text-ngo-blue">Project Gallery Highlights</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Authentic visual moments from this initiative</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {galleryItems.map((item) => (
                 <div key={item.id} className="relative group rounded-[32px] overflow-hidden bg-slate-100 shadow-sm hover:shadow-xl transition-all aspect-video cursor-zoom-in">
                    <img 
                      src={item.url} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ngo-blue/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                       <span className="text-[9px] font-black text-lemon uppercase tracking-widest bg-white/10 px-2.5 py-0.5 rounded-full w-fit mb-1 border border-white/15 backdrop-blur-xs">
                          {item.type}
                       </span>
                       <h4 className="text-white font-bold text-sm leading-tight">{item.title}</h4>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      )}

      <div className="p-12 md:p-20 bg-ngo-blue rounded-[64px] text-white relative overflow-hidden text-center space-y-8 z-10">
         <div className="absolute top-0 left-0 w-96 h-96 bg-lemon/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
         <h2 className="text-4xl md:text-5xl font-black max-w-3xl mx-auto tracking-tight relative z-10">
           Ready to make an <span className="text-lemon italic">impact</span> with this project?
         </h2>
         <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-20">
            <Link 
              to={`/contact?subject=${encodeURIComponent(`Partnership - ${project.title}`)}&message=${encodeURIComponent(`Dear Sinarimam Foundation Team,\n\nI am interested in partnering with you on the dynamic initiative: "${project.title}".\n\nPlease let me know how we can collaborate and make a greater impact together.\n\nWarm regards,\n`)}`}
              className="bg-lemon text-ngo-blue px-12 py-6 rounded-full font-black text-sm border-2 border-transparent hover:border-lemon hover:bg-white hover:text-ngo-blue transition-all active:scale-95 shadow-md text-center inline-flex items-center justify-center cursor-pointer relative z-30"
              onClick={() => console.log('Partner button clicked')}
            >
              Partner With Us
            </Link>
            <button 
              onClick={() => {
                console.log('Share Project button clicked');
                setShowShareModal(true);
              }} 
              className="bg-white/10 backdrop-blur-xl text-white border border-white/20 px-12 py-6 rounded-full font-black text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-3 cursor-pointer relative z-30"
            >
               <Share2 size={20} /> Share Project
            </button>
         </div>
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
                  <p className="text-slate-500 text-sm">Share this project with your network to help our cause.</p>
               </div>

               <div className="grid grid-cols-1 gap-3">
                  {[
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
                  ].map((link) => (
                     <a 
                       key={link.name}
                       href={link.url}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex items-center gap-4 p-4 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] bg-slate-50 hover:bg-slate-100 border border-slate-100 text-ngo-blue"
                     >
                        <div className={`w-10 h-10 ${link.color.split(' ')[0]} rounded-xl flex items-center justify-center shadow-sm`}>
                           {link.icon}
                        </div>
                        Share on {link.name}
                     </a>
                  ))}
                  
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-4 p-4 rounded-xl font-bold bg-slate-50 text-ngo-blue border border-slate-100 hover:bg-slate-100 transition-all group w-full cursor-pointer text-left"
                  >
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Share2 size={20} />
                     </div>
                     {copied ? 'Link Copied!' : 'Copy Project Link'}
                  </button>
               </div>

               <button 
                 onClick={() => setShowShareModal(false)}
                 className="w-full py-2 text-slate-400 font-bold hover:text-red-500 transition-colors cursor-pointer text-center"
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
