import React, { useState } from 'react';
import { Heart, Send, CheckCircle2, User, Mail, Phone, Briefcase } from 'lucide-react';
import { submitVolunteerApplication } from '../services/cmsService';
import { motion, AnimatePresence } from 'motion/react';

export default function Volunteer() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    experience: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitVolunteerApplication(formData);
      setSubmitted(true);
    } catch (err) {
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="text-center space-y-4">
        <div className="w-20 h-20 bg-lemon rounded-3xl flex items-center justify-center text-ngo-blue mx-auto shadow-xl shadow-lemon/20 rotate-3">
           <Heart size={40} fill="currentColor" />
        </div>
        <h1 className="text-5xl font-black text-ngo-blue tracking-tight">Join the Roster</h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">Help us expand our reach. Whether you have 2 hours or 20, your skills are needed at Sinarimam Foundation.</p>
      </header>

      <div className="bg-white rounded-[48px] shadow-2xl border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-5 min-h-[600px]">
        <div className="lg:col-span-2 bg-ngo-blue p-10 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <path d="M0 100 Q 20 0 100 100" fill="none" stroke="white" strokeWidth="0.5" />
                 <path d="M0 80 Q 40 20 100 80" fill="none" stroke="white" strokeWidth="0.5" />
              </svg>
           </div>
           
           <div className="relative z-10 space-y-8">
              <h3 className="text-3xl font-bold leading-tight">Why Volunteer with Us?</h3>
              <ul className="space-y-6">
                 <li className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-lemon flex items-center justify-center text-ngo-blue">
                       <CheckCircle2 size={16} />
                    </div>
                    <div>
                       <p className="font-bold text-lemon">Skill Development</p>
                       <p className="text-xs text-blue-100/60 mt-1">Work alongside industry professionals in field operations and data analysis.</p>
                    </div>
                 </li>
                 <li className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold flex items-center justify-center text-ngo-blue">
                       <CheckCircle2 size={16} />
                    </div>
                    <div>
                       <p className="font-bold text-gold">Real Impact</p>
                       <p className="text-xs text-blue-100/60 mt-1">See the direct results of your work in the communities we serve.</p>
                    </div>
                 </li>
              </ul>
           </div>

           <div className="relative z-10 p-6 bg-white/5 rounded-3xl border border-white/10 mt-10">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-2">Next Orientation</p>
              <p className="text-xl font-bold">May 30, 2024</p>
              <p className="text-xs text-blue-100/60 mt-1">Main Lobby • 10:00 AM</p>
           </div>
        </div>

        <div className="lg:col-span-3 p-10 md:p-16 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit} 
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="group relative">
                    <label className="text-[10px] font-black text-ngo-blue uppercase tracking-widest absolute -top-2 left-4 bg-white px-2 z-10">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-ngo-blue" size={20} />
                      <input 
                        required
                        type="text" 
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        placeholder="John Doe"
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-ngo-blue focus:ring-4 focus:ring-ngo-blue/5 outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="group relative">
                        <label className="text-[10px] font-black text-ngo-blue uppercase tracking-widest absolute -top-2 left-4 bg-white px-2 z-10">Email Address</label>
                        <div className="relative">
                           <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-ngo-blue" size={20} />
                           <input 
                              required
                              type="email" 
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              placeholder="john@example.com"
                              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-ngo-blue outline-none transition-all"
                           />
                        </div>
                     </div>
                     <div className="group relative">
                        <label className="text-[10px] font-black text-ngo-blue uppercase tracking-widest absolute -top-2 left-4 bg-white px-2 z-10">Phone Number</label>
                        <div className="relative">
                           <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-ngo-blue" size={20} />
                           <input 
                              type="tel" 
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              placeholder="+1 (555) 000-0000"
                              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-ngo-blue outline-none transition-all"
                           />
                        </div>
                     </div>
                  </div>

                  <div className="group relative">
                    <label className="text-[10px] font-black text-ngo-blue uppercase tracking-widest absolute -top-2 left-4 bg-white px-2 z-10">Experience / Motivation</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-4 text-slate-300 group-focus-within:text-ngo-blue" size={20} />
                      <textarea 
                        rows={4}
                        value={formData.experience}
                        onChange={(e) => setFormData({...formData, experience: e.target.value})}
                        placeholder="Tell us why you want to join and what skills you bring..."
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-ngo-blue outline-none transition-all resize-none"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <button 
                  disabled={loading}
                  type="submit" 
                  className="w-full py-5 bg-ngo-blue text-white rounded-[24px] font-black text-lg shadow-xl shadow-ngo-blue/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? 'Processing...' : (
                    <>
                      Submit Application <Send size={20} className="text-lemon" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                 <div className="w-24 h-24 bg-lemon rounded-full flex items-center justify-center text-ngo-blue mx-auto shadow-2xl shadow-lemon/30">
                    <CheckCircle2 size={48} />
                 </div>
                 <h2 className="text-4xl font-black text-ngo-blue">Application Received!</h2>
                 <p className="text-slate-500 text-lg leading-relaxed">
                   Thank you for your interest in joining Sinarimam Foundation. Our coordination team will review your profile and contact you within 3-5 business days.
                 </p>
                 <button 
                   onClick={() => setSubmitted(false)}
                   className="text-ngo-blue font-bold underline underline-offset-4 decoration-lemon decoration-2"
                 >
                   Submit another application
                 </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
