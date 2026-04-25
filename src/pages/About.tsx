import { useState, useEffect } from 'react';
import { Info, Target, Compass, History, User } from 'lucide-react';
import { getAboutInfo } from '../services/cmsService';

export default function About() {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    getAboutInfo().then(setInfo);
  }, []);

  const sections = [
    { id: 'vision', title: 'Our Vision', icon: <Compass className="text-lemon" />, content: info?.vision || "A future where every community has the resources it needs to thrive sustainably." },
    { id: 'mission', title: 'Our Mission', icon: <Target className="text-gold" />, content: info?.mission || "To catalyze positive social change through innovative, data-driven projects and grassroots education." },
    { id: 'goal', title: 'Our Goal', icon: <Info className="text-blue-400" />, content: info?.goal || "To empower marginalized groups by providing tools for self-sufficiency and local leadership development." }
  ];

  return (
    <div className="space-y-12">
      <header className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-5xl font-black text-ngo-blue tracking-tight underline decoration-lemon decoration-8 underline-offset-8">Our Foundation</h1>
        <p className="text-slate-500 text-lg">Learn about the heart behind our work, our journey, and the leaders driving our vision forward.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {sections.map((s) => (
          <div key={s.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
             <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-ngo-blue transition-colors">
                {s.icon}
             </div>
             <h3 className="text-2xl font-bold text-ngo-blue mb-4">{s.title}</h3>
             <p className="text-slate-500 leading-relaxed text-sm">{s.content}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white rounded-[48px] p-8 md:p-16 border border-slate-100">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <History className="text-gold" size={32} />
            <h2 className="text-3xl font-black text-ngo-blue">Our History</h2>
          </div>
          <p className="text-slate-600 leading-relaxed">
            {info?.history || "Founded in 2008 by a group of passionate educators and environmentalists, Sinarimam Foundation began as a small community newsletter in the rural outskirts. Over the past 16 years, we have grown into a multi-national organization support 50+ active projects annually."}
          </p>
          <div className="flex gap-4">
            <div className="flex-1 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-3xl font-black text-ngo-blue">16+</p>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">Years Active</p>
            </div>
            <div className="flex-1 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-3xl font-black text-ngo-blue">500k</p>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">Lives Touched</p>
            </div>
          </div>
        </div>
        <div className="aspect-square bg-ngo-blue rounded-[50px] relative overflow-hidden flex items-center justify-center text-lemon">
           {/* Placeholder for history image */}
           <History size={120} strokeWidth={1} className="opacity-10 absolute" />
           <div className="w-64 h-64 border-4 border-lemon/20 rounded-full flex items-center justify-center">
              <div className="w-48 h-48 border-4 border-gold/20 rounded-full flex items-center justify-center">
                 <div className="w-32 h-32 bg-lemon rounded-full shadow-2xl"></div>
              </div>
           </div>
        </div>
      </div>

      <section className="bg-ngo-blue rounded-[50px] p-8 md:p-16 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lemon opacity-5 rounded-full blur-3xl"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
             <div className="flex items-center gap-3 mb-6">
               <User className="text-lemon" size={32} />
               <h2 className="text-3xl font-black tracking-tight">The Founder</h2>
             </div>
             <h3 className="text-4xl font-bold mb-4">{info?.founderName || "Dr. Sarah Jenkins"}</h3>
             <p className="text-blue-100/80 leading-relaxed mb-8 text-lg underline decoration-gold/30 underline-offset-4 decoration-2">
               {info?.founderBio || "A visionary leader with a PhD in Social Development and 25 years of experience in NGO management and environmental advocacy."}
             </p>
             <blockquote className="border-l-4 border-lemon pl-6 py-2 italic text-blue-200">
                "We don't just provide aid; we build resilient systems for the future."
             </blockquote>
          </div>
          <div className="order-1 lg:order-2 flex justify-center">
             <div className="w-full max-w-sm aspect-[4/5] bg-white/5 border border-white/10 rounded-[60px] p-2">
                <div className="w-full h-full bg-slate-800 rounded-[54px] overflow-hidden">
                  {info?.founderPhoto && <img src={info.founderPhoto} alt="Founder" className="w-full h-full object-cover" />}
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
