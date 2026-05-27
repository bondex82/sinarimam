import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Eye, Mail, Linkedin, X, ChevronRight } from 'lucide-react';

interface BoardMember {
  id: string;
  name: string;
  role: string;
  position: string;
  image: string;
  bio: string;
  linkedin?: string;
  email?: string;
}

const boardMembers: BoardMember[] = [
  {
    id: "m1",
    name: "Bin-Uthman Ahmed",
    role: "Legal Practitioner/Business Man",
    position: "Chairman",
    image: "https://i.ibb.co/tPFNx6HY/IMG-20260502-WA0068.jpg",
    bio: "Bin-Uthman Ahmed has over three decades of exceptional leadership in public service and community philanthropy. Under his guidance, the Sinarimam Foundation has grown to support regional initiatives across Nigeria, securing institutional partnerships and driving sustainable policies for rural education and clean water access.",
    email: "ahmed@sinarimamfoundation.org.ng"
  },
  {
    id: "m2",
    name: "Christiana Joshua Samari",
    role: "Academician/Philanthropist/Analyst",
    position: "Secretary",
    image: "https://i.ibb.co/Jw1SmM1L/IMG-20260502-WA0069.jpg",
    bio: "Christiana Joshua Samari is a distinguished academician, a philanthropist and an analyst who has excelled. She translates advanced research into localized outreach initiatives, ensuring our programs remain modern, highly targeted, and strictly effective.",
    linkedin: "https://linkedin.com",
    email: "christiana@sinarimamfoundation.org.ng"
  },
  {
    id: "m3",
    name: "Jacob P. Emmanuel",
    role: "Legal Practitioner/Writer",
    position: "Member BOT",
    image: "https://i.ibb.co/r2L68rQc/Whats-App-Image-2026-05-02-at-5-27-35-PM.jpg",
    bio: "Barr. Jacob P. Emmanuel commands over 20 years of experience in corporate governance and human rights law. He meticulously manages Sinarimam Foundation's regulatory compliance, institutional integrity, and strategic partnerships, upholding our peerless transparency metrics.",
    linkedin: "https://linkedin.com"
  },
  {
    id: "m4",
    name: "Frank John",
    role: "Graphic Designer",
    position: "Member BOT",
    image: "https://i.ibb.co/twqn34VR/Whats-App-Image-2026-05-02-at-5-27-35-PM-1.jpg",
    bio: "Frank John directs Sinarimam Foundation's visual designs that have aided the outreaches of the foundation to achieve recognition which includes grassroots campaigns, and emergency outreaches. He is an expert in visuals, ensuring that over 90% of Sinarimam Foundation's outreaches goes viral.",
    email: "frank@sinarimamfoundation.org.ng"
  },
  {
    id: "m5",
    name: "Sadigat Gangs",
    role: "Legal Practitioner/Fashionista",
    position: "Member BOT",
    image: "https://i.ibb.co/0pzHC59r/Whats-App-Image-2026-05-02-at-5-27-35-PM-2.jpg",
    bio: "Sadigat Gang brings advanced environmental modeling and digital tracking technologies into Sinarimam's regional initiatives. Her methodologies allow real-time analysis of projects which leads to a sounding success of each outreach.",
    linkedin: "https://linkedin.com"
  },
  {
    id: "m6",
    name: "Silas Dauda Diadia",
    role: "Banker/Techie",
    position: "Member BOT",
    image: "https://i.ibb.co/FqKq8pMW/Whats-App-Image-2026-05-02-at-5-30-30-PM.jpg",
    bio: "Silas Dauda Diadia excels in tech and a financial expert."
    },

  
  {
    id: "m7",
    name: "Nelson Enan",
    role: "Videographer",
    position: "Member BOT",
    image: "https://i.ibb.co/mVvZJwfd/Whats-App-Image-2026-05-02-at-5-37-25-PM.jpg",
    bio: "Nelson Enan brings advanced videography and digital technologies into Sinarimam's initiatives to ensure the security of the visual presence of the foundation."
    },

  
];

export default function Board() {
  const [selectedMember, setSelectedMember] = useState<BoardMember | null>(null);

  return (
    <div className="space-y-12">
      {/* Header section with brand decoration */}
      <header className="relative text-center max-w-3xl mx-auto space-y-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-lemon/10 rounded-full blur-3xl -z-10"></div>
        <span className="bg-gold/10 text-gold px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest inline-block border border-gold/20">
          Governance & Trustees
        </span>
        <h1 id="board_title" className="text-5xl font-black text-ngo-blue tracking-tight underline decoration-lemon decoration-8 underline-offset-8">
          Board of Trustees
        </h1>
        <p className="text-slate-500 text-lg">
          Meet the dedicated visionaries, professionals, and academic pioneers guiding the Sinarimam Foundation with accountability, excellence, and transparency.
        </p>
      </header>

      {/* Highlights / Patron Spotlight (Chairman Highlight Card) */}
      <section className="bg-gradient-to-r from-ngo-blue to-blue-800 rounded-[48px] p-8 md:p-14 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-lemon opacity-5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold opacity-5 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gold/20 rounded-[40px] blur-xl group-hover:scale-105 transition-transform"></div>
              <div className="w-64 h-64 md:w-72 md:h-72 bg-white/5 border border-white/20 rounded-[48px] p-2 relative">
                <img 
                  src={boardMembers[0].image} 
                  alt={boardMembers[0].name} 
                  className="w-full h-full object-cover rounded-[40px]"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold text-ngo-blue rounded-full text-xs font-black uppercase tracking-wider">
                <Shield size={12} /> Board Chairman
              </span>
              <h2 id="chairman_name" className="text-3xl md:text-4xl font-extrabold tracking-tight">{boardMembers[0].name}</h2>
              <p className="text-lemon font-bold text-lg">{boardMembers[0].role}</p>
            </div>

            <p className="text-blue-100/90 leading-relaxed text-sm md:text-base">
              {boardMembers[0].bio}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-widest text-blue-300">Governance Role</p>
                <p className="text-xs text-blue-100">Board of Trustees Chairman</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-widest text-blue-300">Primary Focus</p>
                <p className="text-xs text-blue-100">National Philanthropy & Strategic Partnerships</p>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                id="btn_read_more_chairman"
                onClick={() => setSelectedMember(boardMembers[0])}
                className="bg-lemon text-ngo-blue px-6 py-3 rounded-full text-xs font-black shadow-lg shadow-lemon/20 flex items-center gap-1.5 hover:scale-105 transition-transform"
              >
                <Eye size={14} /> Full Profile & Bio
              </button>
              {boardMembers[0].email && (
                <a 
                  href={`mailto:${boardMembers[0].email}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 hover:scale-105 transition-all text-sm"
                  title="Contact Board Chair"
                >
                  <Mail size={16} />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Directors & Executive Team Board Grid */}
      <div className="space-y-8">
        <div id="directors_section_header" className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 className="text-2xl font-bold text-ngo-blue">Governing Directors</h3>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            {boardMembers.length - 1} Key Officers
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {boardMembers.slice(1).map((member) => (
            <motion.div 
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group relative flex flex-col justify-between"
              id={`member_card_${member.id}`}
            >
              <div className="space-y-6">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ngo-blue/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gold bg-gold/10 px-2.5 py-1 rounded-full">
                    {member.position}
                  </span>
                  <h4 className="text-xl font-bold text-ngo-blue group-hover:text-gold transition-colors">{member.name}</h4>
                  <p className="text-xs text-slate-400 font-semibold leading-normal min-h-[32px]">{member.role}</p>
                </div>

                <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                  {member.bio}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button 
                  id={`btn_view_profile_${member.id}`}
                  onClick={() => setSelectedMember(member)}
                  className="text-xs font-black text-ngo-blue hover:text-gold transition-colors flex items-center gap-1 group/btn"
                >
                  View Profile <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>

                <div className="flex gap-2">
                  {member.linkedin && (
                    <a 
                      href={member.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-2 bg-slate-50 text-slate-400 hover:text-ngo-blue hover:bg-ngo-blue/10 rounded-full transition-colors"
                      id={`linkedin_${member.id}`}
                    >
                      <Linkedin size={14} />
                    </a>
                  )}
                  {member.email && (
                    <a 
                      href={`mailto:${member.email}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-slate-50 text-slate-400 hover:text-ngo-blue hover:bg-ngo-blue/10 rounded-full transition-colors"
                      id={`email_${member.id}`}
                    >
                      <Mail size={14} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Interactive Detail Modal Block */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="absolute inset-0 bg-ngo-blue/60 backdrop-blur-sm"
              id="modal_overlay"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-[40px] max-w-2xl w-full max-h-[85vh] overflow-y-auto no-scrollbar relative z-10 shadow-2xl p-6 md:p-10 border border-slate-100"
              id="member_detail_modal"
            >
              <button 
                id="btn_close_modal"
                onClick={() => setSelectedMember(null)}
                className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-full transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-[36px] overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 mx-auto md:mx-0">
                  <img src={selectedMember.image} alt={selectedMember.name} className="w-full h-full object-cover" />
                </div>

                <div className="space-y-4 text-center md:text-left flex-1">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gold bg-gold/15 px-3 py-1 rounded-full inline-block">
                      {selectedMember.position}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black text-ngo-blue">{selectedMember.name}</h3>
                    <p className="text-sm text-gold font-bold">{selectedMember.role}</p>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    {selectedMember.bio}
                  </p>



                  {/* Social / Contact Links footer */}
                  <div className="flex justify-center md:justify-start gap-4 pt-6 border-t border-slate-100">
                    {selectedMember.linkedin && (
                      <a 
                        href={selectedMember.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="px-4 py-2.5 bg-slate-50 hover:bg-ngo-blue hover:text-white text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                      >
                        <Linkedin size={14} /> Connect on LinkedIn
                      </a>
                    )}
                    {selectedMember.email && (
                      <a 
                        href={`mailto:${selectedMember.email}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 bg-slate-50 hover:bg-gold hover:text-ngo-blue text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                      >
                        <Mail size={14} /> Email Office
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Advisory Council Highlight section */}
      <footer id="board_footer_advisory" className="bg-white rounded-[40px] border border-slate-100 p-8 md:p-12 text-center max-w-4xl mx-auto space-y-6">
        <h4 className="text-xl font-bold text-ngo-blue">Advisory Council Committees</h4>
        <p className="text-slate-500 text-xs md:text-sm leading-relaxed max-w-2xl mx-auto">
          In addition to our core Board of Trustees, Sinarimam Foundation coordinates with regional civil society advocates, local leaders, and sector specialists in emergency medical health and hydrological engineers. This guarantees strict accountability and direct operational action.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-[10px] font-black uppercase tracking-widest text-ngo-blue/60">
          <span className="px-3.5 py-1.5 bg-slate-50 rounded-full">Medical Outreaches Advisory</span>
          <span className="w-1.5 h-1.5 rounded-full bg-lemon"></span>
          <span className="px-3.5 py-1.5 bg-slate-50 rounded-full">Community Water & Sanitation Committee</span>
          <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
          <span className="px-3.5 py-1.5 bg-slate-50 rounded-full">Governance & Anti-Corruption Panel</span>
        </div>
      </footer>
    </div>
  );
}
