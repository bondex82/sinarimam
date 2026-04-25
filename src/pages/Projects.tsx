import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, Filter, ArrowRight } from 'lucide-react';
import { getProjects } from '../services/cmsService';

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const filteredProjects = filter === 'All' ? projects : projects.filter(p => p.status === filter);

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-ngo-blue tracking-tight">Direct Impact</h1>
          <p className="text-slate-500 mt-2 text-lg">Transparent tracking of our active and completed initiatives.</p>
        </div>
        <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm">
          {['All', 'Active', 'Completed', 'Upcoming'].map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f ? 'bg-ngo-blue text-white shadow-lg' : 'text-slate-400 hover:text-ngo-blue'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((p) => {
          const progress = p.targetAmount ? Math.min(Math.round((p.raisedAmount / p.targetAmount) * 100), 100) : null;
          return (
            <Link key={p.id} to={`/projects/${p.id}`} className="group bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:border-gold/20 transition-all flex flex-col">
              <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                 {p.imageUrl ? (
                   <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-ngo-blue/10">
                     <Heart size={64} fill="currentColor" stroke="none" />
                   </div>
                 )}
                 <div className="absolute top-4 left-4 flex gap-2">
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
                     p.status === 'Active' ? 'bg-lemon text-ngo-blue' : 
                     p.status === 'Completed' ? 'bg-gold text-ngo-blue' : 'bg-ngo-blue text-white'
                   }`}>
                     {p.status}
                   </span>
                 </div>
              </div>
              <div className="p-8 flex-1 flex flex-col space-y-4">
                 <div>
                    <h3 className="text-2xl font-bold text-ngo-blue mb-2 group-hover:text-gold transition-colors">{p.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 font-medium">{p.description}</p>
                 </div>

                 {progress !== null && (
                   <div className="space-y-2">
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
                 
                 <div className="pt-4 mt-auto">
                    <div className="w-full py-4 border-2 border-slate-100 rounded-[20px] text-ngo-blue font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-ngo-blue group-hover:text-white group-hover:border-ngo-blue transition-all">
                      View Details & Progress <ArrowRight size={18} />
                    </div>
                 </div>
              </div>
            </Link>
          );
        })}
      </div>
      
      {filteredProjects.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
          <p className="text-slate-400 font-medium">No projects found matching the criteria.</p>
        </div>
      )}
    </div>
  );
}
