import { useState, useEffect, type FormEvent } from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Image as ImageIcon, 
  Calendar, 
  LogOut,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Newspaper,
  Compass,
  History,
  User as UserIcon,
  Mail,
  BarChart2,
  GraduationCap,
  HeartPulse,
  ShoppingBag
} from 'lucide-react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getAboutInfo, 
  updateAboutInfo, 
  getProjects, 
  getEvents, 
  getNews,
  getVolunteers,
  getSurveys,
  getGallery,
  getBeneficiaries
} from '../services/cmsService';

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [data, setData] = useState<any>({
    volunteers: [],
    surveys: [],
    projects: [],
    news: [],
    gallery: [],
    events: [],
    beneficiaries: [],
    siteInfo: null
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState<any>({});
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [projectAnalysis, setProjectAnalysis] = useState<any>(null);

  const uploadFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `uploads/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // 5 minute timeout for large files or slow networks
      const timeout = setTimeout(() => {
        uploadTask.cancel();
        reject(new Error('Upload timed out after 5 minutes. Please check your network or Firebase Storage configuration.'));
      }, 300000);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        }, 
        (error) => {
          clearTimeout(timeout);
          console.error('Upload failed:', error);
          reject(error);
        }, 
        async () => {
          clearTimeout(timeout);
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const getCollectionName = (tab: string) => {
    const mapping: Record<string, string> = {
      'Volunteers': 'volunteers',
      'Surveys': 'surveys',
      'Projects': 'projects',
      'Impact Tracking': 'beneficiaries',
      'Events': 'events',
      'News': 'news',
      'Gallery': 'gallery'
    };
    return mapping[tab] || tab.toLowerCase();
  };

  const fetchData = async () => {
    try {
      console.log('Fetching admin data...');
      const results = await Promise.allSettled([
        getVolunteers(),
        getSurveys(),
        getProjects(),
        getNews(),
        getGallery(),
        getEvents(),
        getBeneficiaries(),
        getAboutInfo()
      ]);

      const [vols, survs, projs, newsItems, gall, evts, beneficiaries, siteInfoDoc] = results.map((r, i) => {
        if (r.status === 'fulfilled') return r.value;
        console.error(`Fetch failed for index ${i}:`, (r as PromiseRejectedResult).reason);
        return i === 7 ? {} : []; // Index 7 is aboutInfo
      }) as any[];

      console.log('Projects fetched:', (projs as any[])?.length || 0);

      setData({
        volunteers: vols || [],
        surveys: survs || [],
        projects: projs || [],
        news: newsItems || [],
        gallery: gall || [],
        events: evts || [],
        beneficiaries: beneficiaries || [],
        siteInfo: (siteInfoDoc as any) || {}
      });
    } catch (error) {
      console.error('Error in fetchData:', error);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const isAdminEmail = u.email === 'bondimadigitalworld@gmail.com';
        setIsAdmin(isAdminEmail);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  const saveSiteInfo = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalSiteInfo = { ...data.siteInfo };
      if (selectedFiles.length >= 1) {
        setUploading(true);
        const url = await uploadFile(selectedFiles[0]);
        finalSiteInfo.founderPhoto = url;
        setSelectedFiles([]);
      }
      await updateAboutInfo(finalSiteInfo);
      alert('Site information updated!');
      fetchData();
    } catch (err) {
      console.error('Save failed:', err);
      alert(`Error saving site info: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
      setUploading(false);
    }
  };

  const handleCreateOrUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const col = getCollectionName(activeTab);
      let payload = { ...newItem };

      if (selectedFiles.length > 0) {
        setUploading(true);
        if (col === 'gallery' && !editingItem) {
          const urls = await Promise.all(selectedFiles.map(file => uploadFile(file)));
          const batch = writeBatch(db);
          urls.forEach((url, index) => {
            const file = selectedFiles[index];
            const docRef = doc(collection(db, 'gallery'));
            batch.set(docRef, {
              title: newItem.title || file.name.split('.')[0],
              url,
              type: file.type.startsWith('video') ? 'video' : 'photo',
              createdAt: Timestamp.now()
            });
          });
          await batch.commit();
          alert(`${selectedFiles.length} items uploaded!`);
          setShowModal(false);
          setNewItem({});
          setSelectedFiles([]);
          fetchData();
          return;
        } else if (selectedFiles.length >= 1) {
          const url = await uploadFile(selectedFiles[0]);
          if (col === 'gallery') payload.url = url;
          else if (col === 'beneficiaries') payload.photoUrl = url;
          else payload.imageUrl = url;
        }
      }
      
      if (col === 'projects') {
        if (!payload.status) payload.status = 'Active';
        if (!payload.raisedAmount) payload.raisedAmount = 0;
      }

      if (editingItem) {
        await updateDoc(doc(db, col, editingItem.id), payload);
        alert(`${activeTab} item updated!`);
      } else {
        payload.createdAt = Timestamp.now();
        await addDoc(collection(db, col), payload);
        alert(`${activeTab} item created!`);
      }
      
      setShowModal(false);
      setNewItem({});
      setEditingItem(null);
      setSelectedFiles([]);
      fetchData();
    } catch (err) {
      console.error('Save failed:', err);
      alert(`Error saving item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
      setUploading(false);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleLogout = () => signOut(auth);

  const updateVolunteerStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'volunteers', id), { status });
    fetchData();
  };

  const deleteItem = async (col: string, id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteDoc(doc(db, col, id));
        fetchData();
      } catch (err) {
        console.error('Delete failed:', err);
        alert('Failed to delete item.');
      }
    }
  };

   const seedData = async () => {
    if (!confirm('This will seed the database with sample NGO data. Local admin account must be authorized. Continue?')) return;
    
    try {
      const projects = [
        { title: 'Clean Water Initiative', description: 'Providing sustainable filtration systems to rural communities.', status: 'Active', createdAt: Timestamp.now() },
        { title: 'Education for All', description: 'Building literacy centers across the western region.', status: 'Completed', createdAt: Timestamp.now() }
      ];
      const news = [
        { title: 'Annual Fundraiser Success', content: 'We raised ₦50k for our new health center!', publishedAt: Timestamp.now() },
        { title: 'New Partnership with UN', content: 'Sinarimam Foundation joins forces with the UN for climate resilience.', publishedAt: Timestamp.now() }
      ];
      const events = [
        { title: 'Community Gala', description: 'Dinner and music fundraiser.', date: Timestamp.now(), location: 'Main Hall' },
        { title: 'Volunteer Training', description: 'Onboarding session for new members.', date: Timestamp.now(), location: 'Zoom' }
      ];
      const gallery = [
        { title: 'Field Work 2023', url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1000', type: 'photo', createdAt: Timestamp.now() },
        { title: 'Community Meeting', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000', type: 'photo', createdAt: Timestamp.now() }
      ];

      for (const p of projects) await addDoc(collection(db, 'projects'), p);
      for (const n of news) await addDoc(collection(db, 'news'), n);
      for (const e of events) await addDoc(collection(db, 'events'), e);
      for (const g of gallery) await addDoc(collection(db, 'gallery'), g);
      
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'config', 'about'), {
        vision: "A future where every community has the resources it needs to thrive sustainably.",
        mission: "To catalyze positive social change through innovative, data-driven projects and grassroots education.",
        goal: "To empower marginalized groups by providing tools for self-sufficiency and local leadership development.",
        history: "Founded in 2008 by a group of passionate educators and environmentalists, Sinarimam Foundation began as a small community newsletter in the rural outskirts. Over the past 16 years, we have grown into a multi-national organization support 50+ active projects annually.",
        founderName: "Dr. Sarah Jenkins",
        founderBio: "A visionary leader with a PhD in Social Development and 25 years of experience in NGO management and environmental advocacy.",
        founderWelcome: "We believe that empowerment begins with a single step towards community resilience. Over the last decade, Sinarimam Foundation has worked tirelessly to bridge gaps in education, health, and economic stability. Our progress is a testament to the collective power of dedicated individuals working towards a common goal of sustainable development and social justice.",
        contactEmail: "info@sinarimam.org",
        contactPhone: "+234 800 123 4567"
      });
      
      alert('Database seeded successfully!');
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Error seeding database. Check console for details.');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-ngo-blue font-bold">Verifying Credentials...</div>;

  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center space-y-8 py-20">
        <div className="w-24 h-24 bg-ngo-blue rounded-[32px] flex items-center justify-center text-lemon mx-auto shadow-2xl">
           <ShieldCheck size={48} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-ngo-blue">Restricted Area</h1>
          <p className="text-slate-500 mt-2">Please sign in with an administrator account to access the management portal.</p>
        </div>
        <button 
          onClick={handleLogin}
          className="w-full py-4 bg-ngo-blue text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-transform"
        >
          Sign in with Google
        </button>
        {user && !isAdmin && (
           <p className="text-xs text-red-500 font-bold bg-red-50 p-4 rounded-xl border border-red-100">
             Account ({user.email}) does not have administrative privileges.
           </p>
        )}
      </div>
    );
  }

  const tabs = [
    { name: 'Overview', icon: <LayoutDashboard size={18} /> },
    { name: 'Volunteers', icon: <Briefcase size={18} />, count: data.volunteers.length },
    { name: 'Surveys', icon: <FileText size={18} />, count: data.surveys.length },
    { name: 'Projects', icon: <CheckCircle size={18} />, count: data.projects.length },
    { name: 'Impact Tracking', icon: <Compass size={18} />, count: data.beneficiaries.length },
    { name: 'Events', icon: <Calendar size={18} /> },
    { name: 'News', icon: <Newspaper size={18} /> },
    { name: 'Gallery', icon: <ImageIcon size={18} /> },
    { name: 'Site Info', icon: <FileText size={18} /> }
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-lemon flex items-center justify-center text-ngo-blue font-bold">AD</div>
           <div>
              <h2 className="font-bold text-ngo-blue">Portal Admin</h2>
              <p className="text-xs text-slate-400">{user.email}</p>
           </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-all uppercase tracking-widest">
           Sign Out <LogOut size={16} />
        </button>
      </header>

      <div className="flex gap-4 p-1 bg-white rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar">
         {tabs.map(t => (
           <button 
             key={t.name}
             onClick={() => setActiveTab(t.name)}
             className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${activeTab === t.name ? 'bg-ngo-blue text-white shadow-lg' : 'text-slate-400 hover:text-ngo-blue hover:bg-slate-50'}`}
           >
             {t.icon} {t.name} {t.count !== undefined && <span className="opacity-50 ml-1">({t.count})</span>}
           </button>
         ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-ngo-blue/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden"
             >
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                   <h3 className="text-2xl font-black text-ngo-blue">
                     {editingItem ? 'Edit' : 'Create New'} {
                       activeTab === 'Gallery' ? 'Media' : 
                       activeTab === 'News' ? 'Article' : 
                       activeTab.slice(0, -1)
                     }
                   </h3>
                   <button onClick={() => { setShowModal(false); setEditingItem(null); }} className="bg-slate-50 p-2 rounded-xl text-slate-400 hover:text-red-500 transition-colors"><XCircle size={20} /></button>
                </div>
                <form onSubmit={handleCreateOrUpdate} className="p-0 flex flex-col max-h-[80vh]">
                   <div className="p-8 pb-4 flex-1 overflow-y-auto no-scrollbar space-y-6">
                   {activeTab === 'Projects' && (
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Project Title</label>
                            <input 
                              required 
                              type="text" 
                              placeholder="e.g. Clean Water Initiative"
                              value={newItem.title || ''} 
                              onChange={e => setNewItem({...newItem, title: e.target.value})} 
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Description</label>
                            <textarea 
                              required 
                              placeholder="Describe the project goal and impact..."
                              value={newItem.description || ''} 
                              onChange={e => setNewItem({...newItem, description: e.target.value})} 
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white h-32 resize-none outline-none transition-all placeholder:text-slate-300" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Project Image</label>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={e => setSelectedFiles(e.target.files ? Array.from(e.target.files) : [])}
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-lemon transition-all cursor-pointer text-sm" 
                            />
                            {selectedFiles.length > 0 && <p className="text-[10px] font-bold text-lemon px-1">{selectedFiles.length} file(s) selected</p>}
                            <p className="text-[10px] text-slate-400 px-1 mt-1 italic">Or provided Image URL (optional)</p>
                            <input 
                              type="text" 
                              placeholder="https://images.unsplash.com/..."
                              value={newItem.imageUrl || ''} 
                              onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} 
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300" 
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Target Amount (₦)</label>
                               <input 
                                 type="number" 
                                 placeholder="e.g. 5000"
                                 value={newItem.targetAmount || ''} 
                                 onChange={e => setNewItem({...newItem, targetAmount: Number(e.target.value)})} 
                                 className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300" 
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Raised Amount (₦)</label>
                               <input 
                                 type="number" 
                                 placeholder="e.g. 1500"
                                 value={newItem.raisedAmount || ''} 
                                 onChange={e => setNewItem({...newItem, raisedAmount: Number(e.target.value)})} 
                                 className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300" 
                               />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Status</label>
                            <select 
                              value={newItem.status || 'Active'} 
                              onChange={e => setNewItem({...newItem, status: e.target.value})} 
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                            >
                               <option>Active</option>
                               <option>Completed</option>
                               <option>Upcoming</option>
                            </select>
                         </div>
                      </div>
                   )}

                   {activeTab === 'Events' && (
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Event Title</label>
                            <input 
                              required 
                              type="text" 
                              placeholder="e.g. Annual Fundraising Gala"
                              value={newItem.title || ''} 
                              onChange={e => setNewItem({...newItem, title: e.target.value})} 
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Date</label>
                            <input 
                              required 
                              type="date" 
                              value={newItem.date || ''} 
                              onChange={e => setNewItem({...newItem, date: e.target.value})} 
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Location</label>
                            <input 
                              required 
                              type="text" 
                              placeholder="e.g. Main Hall, Abuja"
                              value={newItem.location || ''} 
                              onChange={e => setNewItem({...newItem, location: e.target.value})} 
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Description</label>
                            <textarea 
                              required 
                              placeholder="Tell us more about the event..."
                              value={newItem.description || ''} 
                              onChange={e => setNewItem({...newItem, description: e.target.value})} 
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white h-32 resize-none outline-none transition-all placeholder:text-slate-300" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Event Image</label>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={e => setSelectedFiles(e.target.files ? Array.from(e.target.files) : [])}
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-lemon transition-all cursor-pointer text-sm" 
                            />
                            {selectedFiles.length > 0 && <p className="text-[10px] font-bold text-lemon px-1">{selectedFiles.length} file(s) selected</p>}
                            <p className="text-[10px] text-slate-400 px-1 mt-1 italic">Or provided Image URL (optional)</p>
                            <input 
                              type="text" 
                              placeholder="https://images.unsplash.com/..."
                              value={newItem.imageUrl || ''} 
                              onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} 
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300" 
                            />
                         </div>
                      </div>
                   )}

                   {activeTab === 'News' && (
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Article Title</label>
                            <input 
                              required 
                              type="text" 
                              placeholder="e.g. Major Achievement in Q1"
                              value={newItem.title || ''} 
                              onChange={e => setNewItem({...newItem, title: e.target.value})} 
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Content</label>
                            <textarea 
                              required 
                              placeholder="Write the full report here..."
                              value={newItem.content || ''} 
                              onChange={e => setNewItem({...newItem, content: e.target.value})} 
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white h-48 resize-none outline-none transition-all placeholder:text-slate-300" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Lead Image</label>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={e => setSelectedFiles(e.target.files ? Array.from(e.target.files) : [])}
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-lemon transition-all cursor-pointer text-sm" 
                            />
                            {selectedFiles.length > 0 && <p className="text-[10px] font-bold text-lemon px-1">{selectedFiles.length} file(s) selected</p>}
                            <p className="text-[10px] text-slate-400 px-1 mt-1 italic">Or Lead Image URL (optional)</p>
                            <input 
                              type="text" 
                              placeholder="https://images.unsplash.com/..."
                              value={newItem.imageUrl || ''} 
                              onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} 
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300" 
                            />
                         </div>
                      </div>
                   )}

                   {activeTab === 'Gallery' && (
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Media Title</label>
                            <input 
                              required 
                              type="text" 
                              placeholder="e.g. Field Visit Photos"
                              value={newItem.title || ''} 
                              onChange={e => setNewItem({...newItem, title: e.target.value})} 
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Upload Media (Bulk supported)</label>
                            <input 
                              type="file" 
                              multiple={!editingItem}
                              accept="image/*,video/*"
                              onChange={e => setSelectedFiles(e.target.files ? Array.from(e.target.files) : [])}
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-lemon transition-all cursor-pointer text-sm" 
                            />
                            {selectedFiles.length > 0 && <p className="text-[10px] font-bold text-lemon px-1">{selectedFiles.length} file(s) selected</p>}
                            <p className="text-[10px] text-slate-400 px-1 mt-1 italic">Or enter Media URL manually</p>
                            <input 
                              type="text" 
                              placeholder="https://images.unsplash.com/..."
                              value={newItem.url || ''} 
                              onChange={e => setNewItem({...newItem, url: e.target.value})} 
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all placeholder:text-slate-300" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Type</label>
                            <select 
                              value={newItem.type || 'photo'} 
                              onChange={e => setNewItem({...newItem, type: e.target.value})} 
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                            >
                               <option value="photo">Photo</option>
                               <option value="video">Video</option>
                            </select>
                         </div>
                      </div>
                   )}

                   {activeTab === 'Impact Tracking' && (
                      <div className="space-y-6">
                         <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                            <h4 className="text-xs font-black text-ngo-blue uppercase tracking-widest">Project Context</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Project</label>
                                  <select 
                                    required
                                    value={newItem.projectId || ''} 
                                    onChange={e => {
                                      const p = data.projects.find((proj: any) => proj.id === e.target.value);
                                      setNewItem({...newItem, projectId: e.target.value, projectName: p?.title});
                                    }} 
                                    className="w-full p-4 bg-white rounded-2xl border-2 border-transparent focus:border-lemon outline-none transition-all appearance-none cursor-pointer text-sm"
                                  >
                                     <option value="">Select Project</option>
                                     {data.projects.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
                                  </select>
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Date</label>
                                  <input 
                                    type="date" 
                                    value={newItem.date || ''} 
                                    onChange={e => setNewItem({...newItem, date: e.target.value})} 
                                    className="w-full p-4 bg-white rounded-2xl border-2 border-transparent focus:border-lemon outline-none transition-all text-sm" 
                                  />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Location</label>
                               <input 
                                 type="text" 
                                 placeholder="Event/Center Location"
                                 value={newItem.location || ''} 
                                 onChange={e => setNewItem({...newItem, location: e.target.value})} 
                                 className="w-full p-4 bg-white rounded-2xl border-2 border-transparent focus:border-lemon outline-none transition-all placeholder:text-slate-300 text-sm" 
                               />
                            </div>
                         </div>

                         <div className="space-y-4">
                            <h4 className="text-xs font-black text-ngo-blue uppercase tracking-widest border-b border-slate-100 pb-2">Beneficiary Bio</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="space-y-2 lg:col-span-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                                  <input 
                                    required
                                    type="text" 
                                    value={newItem.name || ''} 
                                    onChange={e => setNewItem({...newItem, name: e.target.value})} 
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm" 
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">DOB</label>
                                  <input 
                                    type="date" 
                                    value={newItem.dob || ''} 
                                    onChange={e => setNewItem({...newItem, dob: e.target.value})} 
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm" 
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Gender</label>
                                  <select 
                                    value={newItem.gender || 'Female'} 
                                    onChange={e => setNewItem({...newItem, gender: e.target.value})} 
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all appearance-none cursor-pointer text-sm"
                                  >
                                     <option>Female</option>
                                     <option>Male</option>
                                     <option>Other</option>
                                  </select>
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nationality</label>
                                  <input 
                                    type="text" 
                                    value={newItem.nationality || 'Nigerian'} 
                                    onChange={e => setNewItem({...newItem, nationality: e.target.value})} 
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm" 
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">State of Origin</label>
                                  <input 
                                    type="text" 
                                    value={newItem.stateOfOrigin || ''} 
                                    onChange={e => setNewItem({...newItem, stateOfOrigin: e.target.value})} 
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm" 
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">State of Birth</label>
                                  <input 
                                    type="text" 
                                    value={newItem.stateOfBirth || ''} 
                                    onChange={e => setNewItem({...newItem, stateOfBirth: e.target.value})} 
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm" 
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">LG of Origin</label>
                                  <input 
                                    type="text" 
                                    value={newItem.lgOfOrigin || ''} 
                                    onChange={e => setNewItem({...newItem, lgOfOrigin: e.target.value})} 
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm" 
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Residential Address</label>
                                  <input 
                                    type="text" 
                                    value={newItem.residentialAddress || ''} 
                                    onChange={e => setNewItem({...newItem, residentialAddress: e.target.value})} 
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm" 
                                  />
                               </div>
                               <div className="space-y-2 lg:col-span-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Photo Upload</label>
                                  <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={e => setSelectedFiles(e.target.files ? Array.from(e.target.files) : [])}
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-lemon transition-all cursor-pointer text-sm" 
                                  />
                                  {selectedFiles.length > 0 && <p className="text-[10px] font-bold text-lemon px-1">{selectedFiles.length} file(s) selected</p>}
                               </div>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <h4 className="text-xs font-black text-ngo-blue uppercase tracking-widest border-b border-slate-100 pb-2">Parent/Guardian Contact</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Parent Name</label>
                                  <input 
                                    type="text" 
                                    value={newItem.parentName || ''} 
                                    onChange={e => setNewItem({...newItem, parentName: e.target.value})} 
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm" 
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                                  <input 
                                    type="text" 
                                    value={newItem.parentPhone || ''} 
                                    onChange={e => setNewItem({...newItem, parentPhone: e.target.value})} 
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm" 
                                  />
                               </div>
                               <div className="space-y-2 lg:col-span-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Address</label>
                                  <input 
                                    type="text" 
                                    value={newItem.parentAddress || ''} 
                                    onChange={e => setNewItem({...newItem, parentAddress: e.target.value})} 
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm" 
                                  />
                               </div>
                            </div>
                         </div>

                         <div className="space-y-6">
                            <h4 className="text-xs font-black text-ngo-blue uppercase tracking-widest border-b border-slate-100 pb-2">Benefits Provided</h4>
                            
                            <div className="space-y-4 p-4 lg:p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                               <label className="text-[10px] font-black text-ngo-blue uppercase tracking-widest">Education</label>
                               <div className="grid grid-cols-2 gap-3">
                                  {['School Bag', 'Shoe', 'Socks', 'Books', 'Writing Materials', 'WAEC/NECO/JAMB Fees'].map(item => (
                                    <button 
                                      key={item}
                                      type="button"
                                      onClick={() => {
                                        const current = newItem.educationBenefits || [];
                                        const next = current.includes(item) ? current.filter((i: string) => i !== item) : [...current, item];
                                        setNewItem({...newItem, educationBenefits: next});
                                      }}
                                      className={`p-3 rounded-xl text-[10px] font-bold transition-all border ${newItem.educationBenefits?.includes(item) ? 'bg-ngo-blue text-white border-ngo-blue' : 'bg-white text-slate-400 border-slate-100 hover:border-lemon'}`}
                                    >
                                       {item}
                                    </button>
                                  ))}
                               </div>
                               <div className="pt-4 border-t border-slate-200 space-y-4">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scholarship Details</p>
                                  <input 
                                    type="text" 
                                    placeholder="Name of School"
                                    value={newItem.scholarship?.schoolName || ''}
                                    onChange={e => setNewItem({...newItem, scholarship: {...(newItem.scholarship || {}), schoolName: e.target.value}})}
                                    className="w-full p-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-lemon text-xs"
                                  />
                                  <div className="grid grid-cols-2 gap-3">
                                     <input 
                                       type="number" 
                                       placeholder="Amount Paid (₦)"
                                       value={newItem.scholarship?.amount || ''}
                                       onChange={e => setNewItem({...newItem, scholarship: {...(newItem.scholarship || {}), amount: Number(e.target.value)}})}
                                       className="w-full p-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-lemon text-xs"
                                     />
                                     <input 
                                       type="text" 
                                       placeholder="Duration"
                                       value={newItem.scholarship?.duration || ''}
                                       onChange={e => setNewItem({...newItem, scholarship: {...(newItem.scholarship || {}), duration: e.target.value}})}
                                       className="w-full p-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-lemon text-xs"
                                     />
                                  </div>
                               </div>
                            </div>

                            <div className="space-y-4 p-4 lg:p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                               <label className="text-[10px] font-black text-ngo-blue uppercase tracking-widest">Health</label>
                               <div className="grid grid-cols-2 gap-3">
                                  {['Sanitary Pads'].map(item => (
                                    <button 
                                      key={item}
                                      type="button"
                                      onClick={() => {
                                        const current = newItem.healthBenefits || [];
                                        const next = current.includes(item) ? current.filter((i: string) => i !== item) : [...current, item];
                                        setNewItem({...newItem, healthBenefits: next});
                                      }}
                                      className={`p-3 rounded-xl text-[10px] font-bold transition-all border ${newItem.healthBenefits?.includes(item) ? 'bg-ngo-blue text-white border-ngo-blue' : 'bg-white text-slate-400 border-slate-100 hover:border-lemon'}`}
                                    >
                                       {item}
                                    </button>
                                  ))}
                               </div>
                               <div className="pt-4 border-t border-slate-200 space-y-4">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Outreach</p>
                                  <input 
                                    type="text" 
                                    placeholder="Diagnosis"
                                    value={newItem.medicalOutreach?.diagnosis || ''}
                                    onChange={e => setNewItem({...newItem, medicalOutreach: {...(newItem.medicalOutreach || {}), diagnosis: e.target.value}})}
                                    className="w-full p-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-lemon text-xs"
                                  />
                                  <input 
                                    type="text" 
                                    placeholder="Drugs Given"
                                    value={newItem.medicalOutreach?.drugs || ''}
                                    onChange={e => setNewItem({...newItem, medicalOutreach: {...(newItem.medicalOutreach || {}), drugs: e.target.value}})}
                                    className="w-full p-3 bg-white rounded-xl border border-slate-200 outline-none focus:border-lemon text-xs"
                                  />
                               </div>
                            </div>

                            <div className="space-y-4 p-4 lg:p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                               <label className="text-[10px] font-black text-ngo-blue uppercase tracking-widest">Social Protection - Clothing</label>
                               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                  {['Shirts', 'Trousers', 'Skirts', 'Blouse', 'Shoes', 'Gowns', 'Wrappers', 'Others'].map(item => (
                                    <button 
                                      key={item}
                                      type="button"
                                      onClick={() => {
                                        const current = newItem.clothing || [];
                                        const next = current.includes(item) ? current.filter((i: string) => i !== item) : [...current, item];
                                        setNewItem({...newItem, clothing: next});
                                      }}
                                      className={`p-3 rounded-xl text-[10px] font-bold transition-all border ${newItem.clothing?.includes(item) ? 'bg-ngo-blue text-white border-ngo-blue' : 'bg-white text-slate-400 border-slate-100 hover:border-lemon'}`}
                                    >
                                       {item}
                                    </button>
                                  ))}
                               </div>
                               <div className="pt-4 border-t border-slate-200 space-y-4">
                                  <label className="text-[10px] font-black text-ngo-blue uppercase tracking-widest">Accessories</label>
                                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                     {['Wristwatch', 'Handbag', 'Bangles', 'Belt', 'Others'].map(item => (
                                       <button 
                                         key={item}
                                         type="button"
                                         onClick={() => {
                                           const current = newItem.accessories || [];
                                           const next = current.includes(item) ? current.filter((i: string) => i !== item) : [...current, item];
                                           setNewItem({...newItem, accessories: next});
                                         }}
                                         className={`p-3 rounded-xl text-[10px] font-bold transition-all border ${newItem.accessories?.includes(item) ? 'bg-ngo-blue text-white border-ngo-blue' : 'bg-white text-slate-400 border-slate-100 hover:border-lemon'}`}
                                       >
                                          {item}
                                       </button>
                                     ))}
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
                   )}
                   </div>

                   <div className="p-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 bg-white rounded-b-[40px]">
                      <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); setSelectedFiles([]); }} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                      <button type="submit" disabled={isSaving || uploading} className="flex-[2] py-4 bg-ngo-blue text-white rounded-2xl font-black shadow-xl shadow-ngo-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                        {uploading ? `Uploading... ${uploadProgress > 0 ? uploadProgress + '%' : ''}` : isSaving ? 'Saving...' : (editingItem ? 'Update Item' : 'Create Item')}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
           key={activeTab}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8"
        >
           {/* Volunteers Tab */}
           {activeTab === 'Volunteers' && (
             <div className="space-y-6">
                <div className="flex justify-between items-end mb-4 px-2">
                   <h3 className="text-2xl font-black text-ngo-blue">Volunteer Applications</h3>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data.volunteers.length} Total</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                   {data.volunteers.map((v: any) => (
                     <div key={v.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-ngo-blue rounded-2xl flex items-center justify-center text-white font-bold uppercase">{v.fullName.charAt(0)}</div>
                           <div>
                              <p className="font-bold text-ngo-blue">{v.fullName}</p>
                              <p className="text-xs text-slate-400">{v.email} • {v.phone}</p>
                           </div>
                        </div>
                        <div className="max-w-md flex-1 text-xs text-slate-500 italic px-6 border-x border-slate-100 line-clamp-2">
                           "{v.experience}"
                        </div>
                        <div className="flex items-center gap-3">
                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${v.status === 'Approved' ? 'bg-green-100 text-green-700' : v.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-gold/20 text-gold'}`}>
                              {v.status}
                           </span>
                           <div className="flex gap-2">
                              <button onClick={() => updateVolunteerStatus(v.id, 'Approved')} className="p-2 bg-white rounded-xl text-green-500 shadow-sm hover:bg-green-50 hover:scale-110 active:scale-95 transition-all"><CheckCircle size={18} /></button>
                              <button onClick={() => updateVolunteerStatus(v.id, 'Rejected')} className="p-2 bg-white rounded-xl text-red-400 shadow-sm hover:bg-red-50 hover:scale-110 active:scale-95 transition-all"><XCircle size={18} /></button>
                              <button onClick={() => deleteItem('volunteers', v.id)} className="p-2 bg-white rounded-xl text-slate-300 hover:text-red-500 shadow-sm hover:scale-110 active:scale-95 transition-all"><Trash2 size={18} /></button>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {/* Surveys Tab */}
           {activeTab === 'Surveys' && (
              <div className="space-y-6">
                 <h3 className="text-2xl font-black text-ngo-blue px-2">Community Feedback</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.surveys.map((s: any) => (
                      <div key={s.id} className="p-6 rounded-3xl border border-slate-100 flex flex-col gap-4 relative group">
                         <button onClick={() => deleteItem('surveys', s.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                         </button>
                         <div className="flex justify-between items-start">
                            <div className="space-y-1">
                               <p className="text-[10px] font-bold text-gold uppercase tracking-widest">Survey: {s.surveyTitle}</p>
                               <h4 className="font-bold text-ngo-blue">{s.respondentName || 'Anonymous Respondent'}</h4>
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 italic">{new Date(s.submittedAt?.toDate()).toLocaleString()}</span>
                         </div>
                         <div className="space-y-3 bg-slate-50 p-4 rounded-2xl text-xs">
                            <div className="flex justify-between">
                               <span className="text-slate-400">Satisfaction Score:</span>
                               <span className="font-black text-ngo-blue">{s.answers.satisfaction}/5</span>
                            </div>
                            <div className="flex justify-between">
                               <span className="text-slate-400">Resource Needs:</span>
                               <span className="font-bold uppercase text-ngo-blue">{s.answers.needFrequency}</span>
                            </div>
                            {s.answers.communityImpact && (
                               <p className="mt-2 text-slate-500 leading-relaxed border-t border-slate-200 pt-2 italic">
                                  "{s.answers.communityImpact}"
                               </p>
                           )}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           )}

           {activeTab === 'Impact Tracking' && (
              <div className="space-y-12">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-2">
                    <div>
                       <h3 className="text-2xl font-black text-ngo-blue">Impact & Beneficiary Logs</h3>
                       <p className="text-sm text-slate-400 font-medium">Tracking the real-world difference per project</p>
                    </div>
                    <button 
                      onClick={() => {
                        setNewItem({ gender: 'Female', nationality: 'Nigerian' });
                        setEditingItem(null);
                        setShowModal(true);
                      }}
                      className="w-full sm:w-auto bg-lemon text-ngo-blue px-10 py-4 rounded-2xl sm:rounded-full text-sm font-black shadow-lg shadow-lemon/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                       <Plus size={20} /> Register Beneficiary
                    </button>
                 </div>

                 {/* General Project Analysis/Summary */}
                 <div className="grid grid-cols-1 gap-8">
                    <div className="p-8 bg-slate-900 rounded-[48px] text-white shadow-2xl overflow-hidden relative group">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-lemon opacity-5 blur-[100px] -mr-32 -mt-32"></div>
                       <div className="relative z-10">
                          <h4 className="text-xs font-black text-lemon uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Project Summary & Analysis</h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                             <div className="space-y-6">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Project to Analyze</label>
                                <select 
                                   className="w-full p-6 bg-white/5 rounded-3xl border-2 border-white/10 text-white font-bold text-lg outline-none focus:border-lemon transition-all appearance-none cursor-pointer"
                                   onChange={(e) => {
                                      const projId = e.target.value;
                                      if (!projId) {
                                         setProjectAnalysis(null);
                                         return;
                                      }
                                      const beneficiaries = data.beneficiaries.filter((b: any) => b.projectId === projId);
                                      const summaries = {
                                         total: beneficiaries.length,
                                         female: beneficiaries.filter((b: any) => b.gender === 'Female').length,
                                         male: beneficiaries.filter((b: any) => b.gender === 'Male').length,
                                         scholarships: beneficiaries.filter((b: any) => b.scholarship?.amount > 0).length,
                                         totalScholarshipAmount: beneficiaries.reduce((acc: number, b: any) => acc + (Number(b.scholarship?.amount) || 0), 0),
                                         medicalOutreach: beneficiaries.filter((b: any) => b.medicalOutreach?.diagnosis).length,
                                         clothingItems: beneficiaries.reduce((acc: number, b: any) => acc + (b.clothing?.length || 0), 0),
                                         accessoryItems: beneficiaries.reduce((acc: number, b: any) => acc + (b.accessories?.length || 0), 0),
                                      };
                                      setProjectAnalysis(summaries);
                                   }}
                                >
                                   <option value="" className="bg-slate-900">Choose a project...</option>
                                   {data.projects.map((p: any) => <option key={p.id} value={p.id} className="bg-slate-900">{p.title}</option>)}
                                </select>

                                {projectAnalysis && (
                                   <div className="grid grid-cols-2 gap-4 mt-8">
                                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Beneficiaries</p>
                                         <p className="text-4xl font-black text-lemon mt-2">{projectAnalysis.total}</p>
                                      </div>
                                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Female Reach</p>
                                         <p className="text-4xl font-black text-pink-400 mt-2">{projectAnalysis.female}</p>
                                      </div>
                                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scholarships</p>
                                         <p className="text-4xl font-black text-gold mt-2">{projectAnalysis.scholarships}</p>
                                      </div>
                                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Schol. Aid</p>
                                         <p className="text-2xl font-black text-green-400 mt-2">₦{projectAnalysis.totalScholarshipAmount.toLocaleString()}</p>
                                      </div>
                                   </div>
                                )}
                             </div>

                             <div className="space-y-6">
                                {projectAnalysis ? (
                                   <div className="space-y-6">
                                      <div className="p-6 lg:p-8 bg-lemon rounded-[40px] text-ngo-blue">
                                         <p className="text-xs font-black uppercase tracking-widest opacity-60">Impact Snapshot</p>
                                         <div className="mt-8 space-y-4">
                                            <div className="flex justify-between items-center bg-white/40 p-4 rounded-2xl">
                                               <span className="text-sm font-black">Medical Aids</span>
                                               <span className="text-lg font-black">{projectAnalysis.medicalOutreach}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white/40 p-4 rounded-2xl">
                                               <span className="text-sm font-black">Clothing Items</span>
                                               <span className="text-lg font-black">{projectAnalysis.clothingItems}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white/40 p-4 rounded-2xl">
                                               <span className="text-sm font-black">Accessories</span>
                                               <span className="text-lg font-black">{projectAnalysis.accessoryItems}</span>
                                            </div>
                                         </div>
                                      </div>
                                      <p className="text-xs text-slate-500 italic font-medium leading-relaxed px-4">
                                        * Analysis is generated based on current beneficiary records synced with this project ID. Ensure all field logs are updated for accuracy.
                                      </p>
                                   </div>
                                ) : (
                                   <div className="h-full flex flex-col items-center justify-center p-12 bg-white/5 rounded-[40px] border border-dashed border-white/10 text-center space-y-4">
                                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
                                         <BarChart2 size={32} />
                                      </div>
                                      <p className="text-slate-500 font-bold max-w-xs">Select a project to generate a real-time impact analysis and demographic summary.</p>
                                   </div>
                                )}
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Beneficiary Logs List */}
                 <div className="space-y-6">
                    <h4 className="text-xl font-bold text-ngo-blue px-2 flex items-center gap-2">
                       <CheckCircle className="text-green-500" /> Beneficiary Record Logs
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                       {data.beneficiaries.map((b: any) => (
                         <div key={b.id} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                               <div className="flex items-center gap-6">
                                  <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden shadow-inner flex-shrink-0">
                                     {b.photoUrl ? (
                                       <img src={b.photoUrl} className="w-full h-full object-cover" />
                                     ) : (
                                       <div className="w-full h-full flex items-center justify-center text-slate-300">
                                          <UserIcon size={24} />
                                       </div>
                                     )}
                                  </div>
                                  <div>
                                     <h5 className="font-black text-ngo-blue text-lg">{b.name}</h5>
                                     <div className="flex flex-wrap gap-2 mt-1">
                                        <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-md uppercase tracking-wider">{b.gender}</span>
                                        <span className="px-2 py-0.5 bg-lemon/20 text-[10px] font-bold text-ngo-blue rounded-md uppercase tracking-wider">{b.projectName || 'General'}</span>
                                     </div>
                                  </div>
                               </div>
                               
                               <div className="flex flex-wrap gap-4 items-center">
                                  <div className="flex gap-1">
                                     {b.educationBenefits?.length > 0 && <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center" title="Education aid provided"><GraduationCap size={12} /></div>}
                                     {b.healthBenefits?.length > 0 && <div className="w-6 h-6 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center" title="Health aid provided"><HeartPulse size={12} /></div>}
                                     {b.clothing?.length > 0 && <div className="w-6 h-6 rounded-full bg-green-50 text-green-500 flex items-center justify-center" title="Clothing provided"><ShoppingBag size={12} /></div>}
                                  </div>
                                  <div className="h-10 w-px bg-slate-100 hidden md:block mx-2"></div>
                                  <div className="flex gap-2">
                                     <button 
                                       onClick={() => {
                                         setEditingItem(b);
                                         setNewItem({...b});
                                         setShowModal(true);
                                       }}
                                       className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-gold hover:text-ngo-blue flex items-center justify-center transition-all"
                                     >
                                        <Edit2 size={16} />
                                     </button>
                                     <button 
                                       onClick={() => deleteItem('beneficiaries', b.id)}
                                       className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                                     >
                                        <Trash2 size={16} />
                                     </button>
                                  </div>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           )}

           {/* Content Management (Shared for Projects, Events, News, Gallery) */}
           {['Projects', 'Events', 'News', 'Gallery'].includes(activeTab) && (
              <div className="space-y-8">
                 <div className="flex justify-between items-end px-2">
                     <div className="space-y-1">
                        <h3 className="text-2xl font-black text-ngo-blue">{activeTab} Management</h3>
                        {activeTab === 'Projects' && data.projects.length === 0 && (
                          <p className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded inline-block uppercase tracking-widest animate-pulse">Debug: Check Firestore Collection "projects" / Refresh</p>
                        )}
                     </div>
                     <div className="flex gap-3 items-center">
                        <button 
                          onClick={fetchData}
                          className="p-3.5 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all font-bold text-xs flex items-center gap-2"
                        >
                          <BarChart2 size={16} /> Sync
                        </button>
                     </div>

                    <button 
                      onClick={() => {
                        setNewItem({});
                        setEditingItem(null);
                        setShowModal(true);
                      }}
                      className="w-full sm:w-auto bg-lemon text-ngo-blue px-8 py-3.5 rounded-2xl sm:rounded-full text-sm font-black shadow-lg shadow-lemon/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                       <Plus size={20} /> Create New
                    </button>
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    {(() => {
                      const list = activeTab === 'Projects' ? (data.projects || []) : 
                                  activeTab === 'Events' ? (data.events || []) : 
                                  activeTab === 'News' ? (data.news || []) : 
                                  (data.gallery || []);
                      
                      if (list.length === 0) {
                        return (
                          <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200 w-full">
                             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No {activeTab} Records Found</p>
                             <p className="text-[10px] text-slate-300 mt-1">Add your first item using the create button above.</p>
                          </div>
                        );
                      }

                      return list.map((item: any) => (
                        <div key={item.id} className="p-4 rounded-3xl border border-slate-100 bg-white flex items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                           <div className="flex items-center gap-4">
                              <div className="w-16 h-12 bg-slate-200 rounded-xl overflow-hidden relative flex items-center justify-center text-slate-400">
                                 {item.imageUrl || item.url ? (
                                   <img src={item.imageUrl || item.url} className="w-full h-full object-cover" />
                                 ) : activeTab === 'Events' ? (
                                   <Calendar size={24} />
                                 ) : null}
                              </div>
                              <div className="max-w-md">
                                 <h4 className="font-bold text-ngo-blue truncate">{item.title}</h4>
                                 <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                                   {activeTab === 'Projects' 
                                     ? item.status 
                                     : activeTab === 'Events'
                                       ? `${item.date?.toDate ? new Date(item.date.toDate()).toLocaleDateString() : item.date} @ ${item.location}`
                                       : activeTab === 'News' 
                                         ? (item.publishedAt ? new Date(item.publishedAt.toDate()).toLocaleDateString() : 'Draft') 
                                         : item.type}
                                 </p>
                              </div>
                           </div>
                           <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  const editData = { ...item };
                                  if (activeTab === 'Events' && editData.date?.toDate) {
                                    editData.date = new Date(editData.date.toDate()).toISOString().split('T')[0];
                                  }
                                  setEditingItem(item);
                                  setNewItem(editData);
                                  setShowModal(true);
                                }}
                                className="p-2 text-slate-400 hover:text-ngo-blue transition-colors"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button onClick={() => deleteItem(getCollectionName(activeTab), item.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                           </div>
                        </div>
                      ));
                    })()}
                 </div>
              </div>
           )}

           {activeTab === 'Site Info' && (
              <form onSubmit={saveSiteInfo} className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-2">
                   <h3 className="text-2xl font-black text-ngo-blue">Core Website Content</h3>
                   <button 
                     disabled={isSaving}
                     className="w-full sm:w-auto bg-ngo-blue text-white px-10 py-4 rounded-2xl sm:rounded-full text-sm font-black shadow-xl shadow-ngo-blue/30 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                   >
                      {isSaving ? 'Saving Changes...' : 'Save Site Info'}
                   </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <h4 className="font-bold text-ngo-blue border-b border-slate-100 pb-2 flex items-center gap-2"><Compass size={18} className="text-lemon" /> Mission & Vision</h4>
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Our Vision</label>
                            <textarea 
                              placeholder="Where do we see this NGO in 5 years?"
                              value={data.siteInfo?.vision || ''} 
                              onChange={(e) => setData({...data, siteInfo: {...data.siteInfo, vision: e.target.value}})}
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm h-24 resize-none placeholder:text-slate-300"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Our Mission</label>
                            <textarea 
                              placeholder="Our daily commitment to the community..."
                              value={data.siteInfo?.mission || ''} 
                              onChange={(e) => setData({...data, siteInfo: {...data.siteInfo, mission: e.target.value}})}
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm h-24 resize-none placeholder:text-slate-300"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Our Goal</label>
                            <textarea 
                              placeholder="Specific objectives we are striving for..."
                              value={data.siteInfo?.goal || ''} 
                              onChange={(e) => setData({...data, siteInfo: {...data.siteInfo, goal: e.target.value}})}
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm h-24 resize-none placeholder:text-slate-300"
                            />
                         </div>
                      </div>

                      <h4 className="font-bold text-ngo-blue border-b border-slate-100 pb-2 flex items-center gap-2 mt-8"><History size={18} className="text-gold" /> History</h4>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Foundation Story</label>
                         <textarea 
                           placeholder="How it all started..."
                           value={data.siteInfo?.history || ''} 
                           onChange={(e) => setData({...data, siteInfo: {...data.siteInfo, history: e.target.value}})}
                           className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm h-48 resize-none placeholder:text-slate-300"
                         />
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h4 className="font-bold text-ngo-blue border-b border-slate-100 pb-2 flex items-center gap-2"><UserIcon size={18} className="text-blue-400" /> Founder Details</h4>
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Founder Name</label>
                            <input 
                              type="text"
                              placeholder="Full Name"
                              value={data.siteInfo?.founderName || ''} 
                              onChange={(e) => setData({...data, siteInfo: {...data.siteInfo, founderName: e.target.value}})}
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm placeholder:text-slate-300"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Founder Bio</label>
                            <textarea 
                              placeholder="Brief professional background..."
                              value={data.siteInfo?.founderBio || ''} 
                              onChange={(e) => setData({...data, siteInfo: {...data.siteInfo, founderBio: e.target.value}})}
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm h-32 resize-none placeholder:text-slate-300"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Founder Photo</label>
                            <input 
                              type="file"
                              accept="image/*"
                              onChange={(e) => setSelectedFiles(e.target.files ? Array.from(e.target.files) : [])}
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-lemon transition-all cursor-pointer text-sm"
                            />
                            {selectedFiles.length > 0 && <p className="text-[10px] font-bold text-lemon px-1">{selectedFiles.length} file(s) selected</p>}
                            <p className="text-[10px] text-slate-400 px-1 mt-1 italic">Or Photo URL (optional)</p>
                            <input 
                              type="text"
                              placeholder="https://images.unsplash.com/..."
                              value={data.siteInfo?.founderPhoto || ''} 
                              onChange={(e) => setData({...data, siteInfo: {...data.siteInfo, founderPhoto: e.target.value}})}
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm placeholder:text-slate-300"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Founder Welcome Note</label>
                            <textarea 
                              placeholder="Welcome message for the home page..."
                              value={data.siteInfo?.founderWelcome || ''} 
                              onChange={(e) => setData({...data, siteInfo: {...data.siteInfo, founderWelcome: e.target.value}})}
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm h-32 resize-none placeholder:text-slate-300"
                            />
                         </div>
                      </div>

                      <h4 className="font-bold text-ngo-blue border-b border-slate-100 pb-2 flex items-center gap-2 mt-8"><Mail size={18} className="text-lemon" /> Contact Information</h4>
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Official Email</label>
                            <input 
                              type="email"
                              placeholder="contact@ngoname.org"
                              value={data.siteInfo?.contactEmail || ''} 
                              onChange={(e) => setData({...data, siteInfo: {...data.siteInfo, contactEmail: e.target.value}})}
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm placeholder:text-slate-300"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                            <input 
                              type="text"
                              placeholder="+1 (234) 567 890"
                              value={data.siteInfo?.contactPhone || ''} 
                              onChange={(e) => setData({...data, siteInfo: {...data.siteInfo, contactPhone: e.target.value}})}
                              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-lemon focus:bg-white outline-none transition-all text-sm placeholder:text-slate-300"
                            />
                         </div>
                      </div>
                   </div>
                </div>
              </form>
           )}

           {activeTab === 'Overview' && (
              <div className="space-y-12">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-ngo-blue">Administrative Overview</h3>
                    <button 
                      onClick={seedData}
                      className="text-xs font-bold text-slate-400 hover:text-gold transition-colors border-b border-dashed border-slate-200"
                    >
                      Seed Demo Data
                    </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 bg-lemon rounded-[40px] text-ngo-blue shadow-lg shadow-lemon/20">
                       <p className="text-xs font-black uppercase tracking-widest opacity-60">Pending Volunteers</p>
                       <p className="text-5xl font-black mt-2">{data.volunteers.filter((v: any) => v.status === 'Pending').length}</p>
                    </div>
                    <div className="p-8 bg-gold rounded-[40px] text-ngo-blue shadow-lg shadow-gold/20">
                       <p className="text-xs font-black uppercase tracking-widest opacity-60">Impact Points</p>
                       <p className="text-5xl font-black mt-2">{data.surveys.length}</p>
                    </div>
                    <div className="p-8 bg-ngo-blue rounded-[40px] text-white shadow-xl shadow-ngo-blue/20">
                       <p className="text-xs font-black uppercase tracking-widest text-blue-300">Live Projects</p>
                       <p className="text-5xl font-black mt-2 text-lemon">{data.projects.length}</p>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
                    <div className="space-y-6">
                       <h4 className="text-xl font-bold text-ngo-blue flex items-center gap-2">
                          <CheckCircle className="text-green-500" /> Recent Activity
                       </h4>
                       <div className="space-y-4">
                          {[1,2,3].map(i => (
                            <div key={i} className="flex gap-4 items-center p-4 bg-slate-50 rounded-2xl">
                               <div className="w-2 h-2 rounded-full bg-lemon"></div>
                               <p className="text-sm text-slate-600">New volunteer application received from community member.</p>
                               <span className="ml-auto text-[10px] text-slate-300 font-bold uppercase tracking-widest">{i*5}m ago</span>
                            </div>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-6">
                       <h4 className="text-xl font-bold text-ngo-blue flex items-center gap-2">
                          <ImageIcon className="text-gold" /> Media Quick View
                       </h4>
                       <div className="grid grid-cols-4 gap-4">
                          {data.gallery.slice(0, 8).map((g: any) => (
                            <div key={g.id} className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                               <img src={g.url} className="w-full h-full object-cover" />
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
