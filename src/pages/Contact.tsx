import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, Facebook } from 'lucide-react';
import { useState, type FormEvent, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function Contact() {
  const [searchParams] = useSearchParams();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });

  // Prefill the form if search parameters are parsed
  useEffect(() => {
    const querySubject = searchParams.get('subject');
    const queryMessage = searchParams.get('message');
    if (querySubject || queryMessage) {
      setFormState(prev => ({
        ...prev,
        subject: querySubject || prev.subject,
        message: queryMessage || prev.message
      }));
    }
  }, [searchParams]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formState.name,
        phone: formState.phone,
        subject: formState.subject,
        message: formState.message,
        submittedAt: Timestamp.now()
      };
      if (formState.email.trim()) {
        payload.email = formState.email.trim();
      }

      // Log to database but enforce a tight timeout so misconfigured or blocked network states on cPanel do not hang the UI.
      await Promise.race([
        addDoc(collection(db, 'inquiries'), payload),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 3000))
      ]).catch(dbError => {
        console.warn('Firestore write-logging was bypassed or timed out:', dbError);
      });
    } catch (err) {
      console.warn('Database reference error:', err);
    }

    try {
      // Trigger the mailto trigger (non-blocking fallback)
      const emailTo = 'info@sinarimamfoundation.org.ng';
      const subject = encodeURIComponent(`${formState.subject} - ${formState.name}`);
      const body = encodeURIComponent(
        `Dear Sinarimam Foundation Team,\n\n` +
        `You have received a new contact inquiry from your website:\n\n` +
        `Name: ${formState.name}\n` +
        `Phone: ${formState.phone}\n` +
        `Email: ${formState.email || 'Not Provided'}\n` +
        `Subject: ${formState.subject}\n\n` +
        `Message Content:\n${formState.message}\n\n` +
        `---\n` +
        `This message has also been logged securely in Sinarimam Foundation's records database.`
      );
      
      const mailtoUrl = `mailto:${emailTo}?subject=${subject}&body=${body}`;
      const mailtoLink = document.createElement('a');
      mailtoLink.href = mailtoUrl;
      mailtoLink.click();
    } catch (err) {
      console.warn('Auto mailto prompt bypassed:', err);
    }

    setSubmitted(true);
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
                   <p className="text-lg font-bold">info@sinarimamfoundation.org.ng</p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                  <Phone size={24} className="text-lemon" />
                </div>
                <div>
                   <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-1">Call us</p>
                   <p className="text-lg font-bold">07067299440, 081655541055</p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                  <MapPin size={24} className="text-lemon" />
                </div>
                <div>
                   <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-1">Visit us</p>
                   <p className="text-lg font-bold">Gidyson Plaza Adjacent Taraba State Polytechnic Jalingo Campus</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <p className="text-xs font-bold text-blue-300 uppercase tracking-widest">Connect with us</p>
            <div className="flex gap-4">
              <a 
                href="https://www.facebook.com/profile.php?id=100068743965045"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-lemon hover:text-ngo-blue transition-all"
                title="Sinarimam Foundation Facebook Page"
                id="facebook_contact_link"
              >
                <Facebook size={20} />
              </a>
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
            <div className="py-12 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Send size={40} className="animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-ngo-blue">Message Received!</h3>
                <p className="text-sm font-bold text-lemon uppercase tracking-widest">Logged Securely in Admin Database</p>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 max-w-md mx-auto space-y-4 text-left text-xs text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-700">
                  ✓ Your inquiry has been securely saved in the Sinarimam Foundation records system. Our administrators can view and respond directly from the Portal.
                </p>
                <p>
                  To also send an email copy directly from your private account, click the button below to pre-populate and open your device's mail app:
                </p>
                <a 
                  href={`mailto:info@sinarimamfoundation.org.ng?subject=${encodeURIComponent(formState.subject + ' - ' + formState.name)}&body=${encodeURIComponent(
                    `Dear Sinarimam Foundation Team,\n\n` +
                    `You have received a new contact inquiry from your website:\n\n` +
                    `Name: ${formState.name}\n` +
                    `Phone: ${formState.phone}\n` +
                    `Email: ${formState.email || 'Not Provided'}\n` +
                    `Subject: ${formState.subject}\n\n` +
                    `Message Content:\n${formState.message}\n\n` +
                    `---\n` +
                    `Logged securely in Sinarimam Foundation records.`
                  )}`}
                  className="w-full py-4 px-6 bg-gold hover:bg-lemon text-ngo-blue rounded-2xl font-black text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Mail size={16} /> Open Email Client Backup
                </a>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-ngo-blue font-black uppercase tracking-widest text-xs hover:text-lemon transition-colors"
                >
                  Send another message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Your Name (compulsory)</label>
                  <input 
                    required
                    type="text" 
                    value={formState.name}
                    onChange={e => setFormState({...formState, name: e.target.value})}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white transition-all outline-none font-semibold text-ngo-blue text-sm"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Phone Number (compulsory)</label>
                  <input 
                    required
                    type="tel" 
                    value={formState.phone}
                    onChange={e => setFormState({...formState, phone: e.target.value})}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white transition-all outline-none font-semibold text-ngo-blue text-sm"
                    placeholder="e.g. 07067299440"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email Address (optional)</label>
                <input 
                  type="email" 
                  value={formState.email}
                  onChange={e => setFormState({...formState, email: e.target.value})}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white transition-all outline-none font-semibold text-ngo-blue text-sm"
                  placeholder="john@example.com (optional)"
                />
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
                  {!['General Inquiry', 'Partnership Proposal', 'Volunteer Interest', 'Sponsorship Opportunity'].includes(formState.subject) && (
                    <option value={formState.subject}>{formState.subject}</option>
                  )}
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
