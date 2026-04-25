import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Target, 
  TrendingUp, 
  Calendar, 
  ShieldCheck, 
  Share2,
  Heart
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProject({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error('Error fetching project:', err);
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

  const progress = project.targetAmount ? Math.min(Math.round((project.raisedAmount / project.targetAmount) * 100), 100) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
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
                <button className="w-full py-5 bg-ngo-blue text-white rounded-2xl font-black shadow-xl shadow-ngo-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                   <Heart size={20} className="text-lemon fill-lemon" /> Support This Cause
                </button>
             </div>
           )}
        </div>

        <div className="relative">
           <div className="aspect-[4/5] rounded-[60px] overflow-hidden shadow-2xl relative z-10">
              {project.imageUrl ? (
                <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
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

      <div className="p-12 md:p-20 bg-ngo-blue rounded-[64px] text-white relative overflow-hidden text-center space-y-8">
         <div className="absolute top-0 left-0 w-96 h-96 bg-lemon/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
         <h2 className="text-4xl md:text-5xl font-black max-w-3xl mx-auto tracking-tight relative z-10">
           Ready to make an <span className="text-lemon italic">impact</span> with this project?
         </h2>
         <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
            <button className="bg-lemon text-ngo-blue px-12 py-6 rounded-full font-black text-sm shadow-2xl shadow-lemon/30 hover:scale-105 transition-all">Partner With Us</button>
            <button className="bg-white/10 backdrop-blur-xl text-white border border-white/20 px-12 py-6 rounded-full font-black text-sm hover:bg-white/20 transition-all flex items-center gap-3">
               <Share2 size={20} /> Share Project
            </button>
         </div>
      </div>
    </div>
  );
}
