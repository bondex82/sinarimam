import React, { useState } from 'react';
import { ClipboardList, Send, CheckCircle2, QrCode, Share2, BarChart3 } from 'lucide-react';
import { submitSurveyResponse } from '../services/cmsService';
import { motion, AnimatePresence } from 'motion/react';

export default function DataCollection() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    respondentName: '',
    respondentEmail: '',
    answers: {
      satisfaction: '5',
      communityImpact: '',
      needFrequency: 'weekly',
      additionalComments: ''
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitSurveyResponse({
        surveyTitle: 'Q2 2024 Community Impact Assessment',
        ...formData
      });
      setSubmitted(true);
    } catch (err) {
      alert('Failed to submit response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
        <div className="w-24 h-24 bg-gold rounded-[32px] flex items-center justify-center text-ngo-blue shadow-xl shadow-gold/20 -rotate-6 flex-shrink-0">
           <ClipboardList size={40} />
        </div>
        <div className="space-y-3">
          <h1 className="text-5xl font-black text-ngo-blue tracking-tight">Community Voice Dashboard</h1>
          <p className="text-slate-500 text-lg">Your data helps us prioritize resources where they are needed most. Help us understand the community impact.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Statistics info */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
              <BarChart3 className="text-gold mb-4" size={32} />
              <h3 className="font-bold text-ngo-blue text-lg mb-2">Real-time Data</h3>
              <p className="text-xs text-slate-400 leading-relaxed">By participating, you contribute to our open-data transparency initiative. All responses are anonymized before reporting.</p>
           </div>
           
           <div className="bg-ngo-blue p-8 rounded-[40px] text-white space-y-6">
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Active Survey</p>
                 <h4 className="font-bold text-lg leading-tight">Q2 2024 Impact Assessment</h4>
              </div>
              <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl border border-white/10">
                 <div className="flex flex-col">
                   <span className="text-3xl font-black text-lemon">428</span>
                   <span className="text-[10px] font-bold text-blue-100 uppercase mt-1">Responses</span>
                 </div>
                 <QrCode size={48} className="text-white/20" />
              </div>
           </div>
        </div>

        {/* Survey Form */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form 
                key="survey-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleSubmit}
                className="bg-white rounded-[48px] p-8 md:p-12 border border-slate-100 shadow-xl space-y-10"
              >
                <div className="space-y-8">
                  {/* Respondent Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-slate-50">
                     <div className="space-y-2">
                        <label className="text-xs font-black text-ngo-blue uppercase tracking-widest ml-1">Your Name (Optional)</label>
                        <input 
                          type="text" 
                          value={formData.respondentName}
                          onChange={(e) => setFormData({...formData, respondentName: e.target.value})}
                          placeholder="Annie Leonhardt"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-ngo-blue outline-none transition-all placeholder:text-slate-300 text-sm"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black text-ngo-blue uppercase tracking-widest ml-1">Email (Optional)</label>
                        <input 
                          type="email" 
                          value={formData.respondentEmail}
                          onChange={(e) => setFormData({...formData, respondentEmail: e.target.value})}
                          placeholder="annie@example.com"
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-ngo-blue outline-none transition-all placeholder:text-slate-300 text-sm"
                        />
                     </div>
                  </div>

                  {/* Survey Questions */}
                  <div className="space-y-8">
                     <div className="space-y-4">
                        <label className="text-sm font-bold text-ngo-blue">How satisfied are you with our latest initiative results?</label>
                        <div className="flex justify-between gap-2">
                           {[1,2,3,4,5].map(val => (
                             <button
                               type="button"
                               key={val}
                               onClick={() => setFormData({...formData, answers: {...formData.answers, satisfaction: val.toString()}})}
                               className={`w-full py-3 rounded-xl font-bold transition-all border-2 ${formData.answers.satisfaction === val.toString() ? 'bg-ngo-blue text-white border-ngo-blue' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'}`}
                             >
                               {val}
                             </button>
                           ))}
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase tracking-widest px-1">
                           <span>Needs Improvement</span>
                           <span>Excellent</span>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-sm font-bold text-ngo-blue">How often does your community require resource assistance?</label>
                        <select
                          value={formData.answers.needFrequency}
                          onChange={(e) => setFormData({...formData, answers: {...formData.answers, needFrequency: e.target.value}})}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-ngo-blue outline-none transition-all text-sm appearance-none cursor-pointer"
                        >
                           <option value="daily">Daily</option>
                           <option value="weekly">Weekly</option>
                           <option value="monthly">Monthly</option>
                           <option value="rarely">Rarely</option>
                        </select>
                     </div>

                     <div className="space-y-4">
                        <label className="text-sm font-bold text-ngo-blue">Describe the most significant positive impact you've seen:</label>
                        <textarea
                          rows={3}
                          value={formData.answers.communityImpact}
                          onChange={(e) => setFormData({...formData, answers: {...formData.answers, communityImpact: e.target.value}})}
                          placeholder="e.g. Access to clean water, job opportunities..."
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-ngo-blue outline-none transition-all text-sm resize-none"
                        ></textarea>
                     </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-6">
                   <button 
                     disabled={loading}
                     type="submit" 
                     className="flex-1 py-5 bg-gold text-ngo-blue rounded-[24px] font-black text-lg shadow-xl shadow-gold/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                   >
                     {loading ? 'Submitting...' : 'Submit Response'}
                     <Send size={20} />
                   </button>
                   <button type="button" className="p-5 bg-slate-50 border border-slate-100 rounded-[24px] text-slate-400 hover:text-ngo-blue transition-colors">
                      <Share2 size={24} />
                   </button>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="survey-success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[48px] p-16 border border-slate-100 shadow-xl text-center space-y-6"
              >
                 <div className="w-24 h-24 bg-gold rounded-full flex items-center justify-center text-ngo-blue mx-auto shadow-2xl shadow-gold/30">
                    <CheckCircle2 size={48} />
                 </div>
                 <h2 className="text-4xl font-black text-ngo-blue">Data Recorded</h2>
                 <p className="text-slate-500 text-lg leading-relaxed max-w-sm mx-auto">
                   Your valuable feedback has been securely added to our dataset. Our impact reporting will be updated accordingly.
                 </p>
                 <button 
                   onClick={() => setSubmitted(false)}
                   className="px-8 py-3 bg-ngo-blue text-white rounded-full font-bold shadow-lg"
                 >
                   Fill another survey
                 </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
