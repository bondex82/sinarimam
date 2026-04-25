import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, Instagram, Twitter, Facebook } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function Contact() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'inquiries'), {
        ...formState,
        submittedAt: Timestamp.now()
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Error sending message. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-20">
      <header className="text-center space-y-6 max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-4 py-1.5 bg-gold/10 text-gold rounded-full text-xs font-black uppercase tracking-widest"
        >
          Contact Us
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl font-black text-ngo-blue leading-tight"
        >
          Let's Build a <span className="text-lemon">Brighter</span> Future Together
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-slate-500"
        >
          Have questions or want to partner with us? Reach out and our team will get back to you shortly.
        </motion.p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Contact info */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-ngo-blue text-white rounded-[40px] p-8 md:p-12 space-y-12 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-lemon/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
          
          <div className="space-y-8 relative z-10">
            <h3 className="text-3xl font-black">Contact Information</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                  <Mail size={24} className="text-lemon" />
                </div>
                <div>
                   <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-1">Email us</p>
                   <p className="text-lg font-bold">info@sinarimam.org</p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                  <Phone size={24} className="text-lemon" />
                </div>
                <div>
                   <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-1">Call us</p>
                   <p className="text-lg font-bold">+234 800 123 4567</p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                  <MapPin size={24} className="text-lemon" />
                </div>
                <div>
                   <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-1">Visit us</p>
                   <p className="text-lg font-bold">12 Foundation Way, Abuja, Nigeria</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <p className="text-xs font-bold text-blue-300 uppercase tracking-widest">Connect with us</p>
            <div className="flex gap-4">
              {[Instagram, Twitter, Facebook].map((Icon, idx) => (
                <button key={idx} className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-lemon hover:text-ngo-blue transition-all">
                  <Icon size={20} />
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[40px] border border-slate-100 p-8 md:p-12 shadow-sm"
        >
          {submitted ? (
            <div className="py-20 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <Send size={40} />
              </div>
              <h3 className="text-3xl font-black text-ngo-blue">Message Sent!</h3>
              <p className="text-slate-500">Thank you for reaching out. We will get back to you within 24 hours.</p>
              <button 
                onClick={() => setSubmitted(false)}
                className="text-ngo-blue font-black uppercase tracking-widest text-xs hover:text-lemon transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Your Name</label>
                  <input 
                    required
                    type="text" 
                    value={formState.name}
                    onChange={e => setFormState({...formState, name: e.target.value})}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white transition-all outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                  <input 
                    required
                    type="email" 
                    value={formState.email}
                    onChange={e => setFormState({...formState, email: e.target.value})}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white transition-all outline-none"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Inquiry Subject</label>
                <select 
                  value={formState.subject}
                  onChange={e => setFormState({...formState, subject: e.target.value})}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white transition-all outline-none appearance-none"
                >
                  <option>General Inquiry</option>
                  <option>Partnership Proposal</option>
                  <option>Volunteer Interest</option>
                  <option>Sponsorship Opportunity</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Your Message</label>
                <textarea 
                  required
                  value={formState.message}
                  onChange={e => setFormState({...formState, message: e.target.value})}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white transition-all outline-none h-40 resize-none"
                  placeholder="How can we help you?"
                />
              </div>

              <button 
                disabled={isSubmitting}
                className="w-full py-5 bg-ngo-blue text-white rounded-2xl font-black shadow-xl shadow-ngo-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : (
                  <>
                    Send Message
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
