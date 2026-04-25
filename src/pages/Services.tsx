import { motion } from 'motion/react';
import { Heart, BookOpen, ShieldCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const services = [
  {
    title: 'Health Outreaches',
    description: 'Providing essential medical care, screenings, and health education to underserved communities. We believe health is a fundamental right.',
    icon: Heart,
    image: 'https://i.ibb.co/DPMzt2p2/1774966870214.jpg',
    color: 'bg-red-50 text-red-500',
    details: ['Mobile Medical Clinics', 'Maternal Health Support', 'Vaccination Drives', 'Health Awareness Workshops']
  },
  {
    title: 'Educational Outreaches',
    description: 'Empowering the next generation through scholarships, school supplies, and literacy programs. Knowledge is the key to breaking the cycle of poverty.',
    icon: BookOpen,
    image: 'https://i.ibb.co/N6Rhd190/1774966869615.jpg',
    color: 'bg-emerald-50 text-emerald-500',
    details: ['Scholarship Funds', 'School Renovation', 'Adult Literacy Classes', 'STEM Education Support']
  },
  {
    title: 'Social Protection',
    description: 'Safeguarding vulnerable individuals through advocacy, food security, and shelter initiatives. No one should be left behind.',
    icon: ShieldCheck,
    image: 'https://i.ibb.co/BHFTb3YN/1774966871883.jpg',
    color: 'bg-blue-50 text-blue-500',
    details: ['Food Distribution', 'Widows Support Group', 'Orphanage Assistance', 'Human Rights Advocacy']
  }
];

export default function Services() {
  return (
    <div className="space-y-24 pb-20">
      <header className="max-w-4xl mx-auto text-center space-y-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-block px-6 py-2 bg-lemon/20 text-ngo-blue rounded-full text-xs font-black uppercase tracking-[0.2em]"
        >
          Our Impact Pillars
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-7xl font-black text-ngo-blue leading-[1.1] tracking-tighter"
        >
          Transforming Lives <br />
          <span className="text-gold">One Soul at a Time</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto"
        >
          Sinarimam Foundation is dedicated to addressing the root causes of vulnerability 
          through three integrated domains of excellence.
        </motion.p>
      </header>

      <div className="space-y-32">
        {services.map((service, idx) => (
          <motion.section 
            key={service.title}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className={`flex flex-col ${idx % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-20`}
          >
            <div className="flex-1 space-y-8">
              <div className={`w-20 h-20 ${service.color} rounded-[32px] flex items-center justify-center shadow-xl shadow-current/10`}>
                <service.icon size={40} />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-ngo-blue tracking-tight">
                {service.title}
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed">
                {service.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {service.details.map((detail) => (
                  <div key={detail} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-lemon shrink-0" />
                    <span className="text-xs font-black text-ngo-blue uppercase tracking-wider">{detail}</span>
                  </div>
                ))}
              </div>

              <Link 
                to="/contact" 
                className="inline-flex items-center gap-3 text-sm font-black text-ngo-blue hover:text-gold transition-colors uppercase tracking-widest group"
              >
                Inquire about this service
                <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>

            <div className="flex-1 relative">
              <div className="aspect-[4/5] rounded-[60px] overflow-hidden shadow-2xl relative z-10">
                <img 
                  src={service.image} 
                  alt={service.title} 
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000"
                />
              </div>
              {/* Decorative elements */}
              <div className={`absolute -top-10 -right-10 w-40 h-40 ${service.color.split(' ')[0]} rounded-full blur-3xl opacity-50`} />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gold/20 rounded-full blur-2xl opacity-50" />
              <div className="absolute top-1/2 -translate-y-1/2 right-1/2 translate-x-1/2 w-[120%] h-[120%] border-2 border-slate-50 rounded-[80px] -z-0 pointer-events-none" />
            </div>
          </motion.section>
        ))}
      </div>

      {/* Stats/Highlight */}
      <section className="bg-slate-50 rounded-[64px] p-12 md:p-20 grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { label: 'Outreaches', val: '150+' },
          { label: 'States Covered', val: '12' },
          { label: 'Beneficiaries', val: '50k+' },
          { label: 'Volunteers', val: '500+' }
        ].map((stat) => (
          <div key={stat.label} className="text-center space-y-2">
            <p className="text-4xl md:text-5xl font-black text-ngo-blue">{stat.val}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Impact Statement */}
      <section className="bg-ngo-blue rounded-[64px] p-12 md:p-20 text-center text-white space-y-10 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-96 h-96 bg-lemon/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
        
        <h2 className="text-4xl md:text-5xl font-black max-w-3xl mx-auto leading-tight relative z-10 tracking-tight">
          Every <span className="text-lemon italic">contribution</span> fuels a sustainable future for someone in need.
        </h2>
        <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
          <Link to="/contact" className="bg-lemon text-ngo-blue px-12 py-6 rounded-full font-black text-sm shadow-2xl shadow-lemon/30 hover:scale-105 active:scale-95 transition-all">Volunteer With Us</Link>
          <Link to="/contact" className="bg-white/10 backdrop-blur-xl text-white border border-white/20 px-12 py-6 rounded-full font-black text-sm hover:bg-white/20 transition-all">Partner With Us</Link>
        </div>
      </section>
    </div>
  );
}
