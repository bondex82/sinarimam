import React, { StrictMode, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  LayoutDashboard, 
  Image as ImageIcon, 
  Newspaper, 
  Calendar, 
  ClipboardList, 
  Info, 
  Mail, 
  Menu, 
  X, 
  ChevronRight,
  ShieldCheck,
  Heart
} from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { getAboutInfo, getProjects } from './services/cmsService';

// Pages
import Home from './pages/Home';
import Services from './pages/Services';
import About from './pages/About';
import Board from './pages/Board';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Gallery from './pages/Gallery';
import News from './pages/News';
import NewsArticle from './pages/NewsArticle';
import Volunteer from './pages/Volunteer';
import DataCollection from './pages/DataCollection';
import Admin from './pages/Admin';
import Contact from './pages/Contact';

function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const [projectCount, setProjectCount] = useState<number>(12);

  useEffect(() => {
    getAboutInfo().then((info: any) => {
      if (info && info.logo) {
        setLogoUrl(info.logo);
      }
    });
  }, []);

  useEffect(() => {
    getProjects()
      .then((projs) => {
        if (projs && Array.isArray(projs)) {
          setProjectCount(projs.length);
        }
      })
      .catch((err) => console.error("Error setting project count:", err));
  }, [location.pathname]);

  const NavLinks = () => (
    <>
      <Link to="/" className={`${location.pathname === '/' ? 'text-ngo-blue' : ''} hover:text-ngo-blue transition-colors`}>Overview</Link>
      <Link to="/about" className={`${location.pathname === '/about' ? 'text-ngo-blue' : ''} hover:text-ngo-blue transition-colors`}>Our Story</Link>
      <Link to="/board" className={`${location.pathname === '/board' ? 'text-ngo-blue' : ''} hover:text-ngo-blue transition-colors`}>Board</Link>
      <Link to="/services" className={`${location.pathname === '/services' ? 'text-ngo-blue' : ''} hover:text-ngo-blue transition-colors`}>Services</Link>
      <Link to="/projects" className={`${location.pathname === '/projects' ? 'text-ngo-blue' : ''} hover:text-ngo-blue transition-colors`}>Projects</Link>
      <Link to="/news" className={`${location.pathname === '/news' ? 'text-ngo-blue' : ''} hover:text-ngo-blue transition-colors`}>News</Link>
      <Link to="/gallery" className={`${location.pathname === '/gallery' ? 'text-ngo-blue' : ''} hover:text-ngo-blue transition-colors`}>Gallery</Link>
      <Link to="/events" className={`${location.pathname === '/events' ? 'text-ngo-blue' : ''} hover:text-ngo-blue transition-colors`}>Events</Link>
      <Link to="/contact" className={`${location.pathname === '/contact' ? 'text-ngo-blue' : ''} hover:text-ngo-blue transition-colors`}>Contact</Link>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="h-20 bg-white border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            {logoUrl ? (
              <img src={logoUrl} className="w-10 h-10 object-contain rounded-lg group-hover:scale-105 transition-transform" alt="Sinarimam Foundation Logo" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 bg-ngo-blue rounded-lg flex items-center justify-center text-lemon font-bold text-xl group-hover:rotate-12 transition-transform shadow-lg shadow-ngo-blue/20">S</div>
            )}
            <span className="text-xl font-bold tracking-tight text-ngo-blue uppercase">Sinarimam <span className="text-gold">Foundation</span></span>
          </Link>
        </div>
        
        <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-500">
          <NavLinks />
          <Link to="/admin" className="bg-ngo-blue text-white px-5 py-2.5 rounded-full shadow-lg shadow-ngo-blue/20 hover:scale-105 transition-transform flex items-center gap-2">
            <ShieldCheck size={18} />
            Admin Portal
          </Link>
        </div>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 text-ngo-blue"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 top-20 bg-white z-40 p-8 flex flex-col lg:hidden"
          >
            <div className="flex flex-col gap-6 text-2xl font-black text-ngo-blue uppercase tracking-tighter">
              <NavLinks />
              <Link to="/admin" className="mt-8 bg-ngo-blue text-white p-6 rounded-3xl flex items-center justify-between shadow-xl shadow-ngo-blue/20">
                <span className="flex items-center gap-4"><ShieldCheck size={28} /> Admin Portal</span>
                <ChevronRight size={24} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {location.pathname === '/admin' && (
          <aside className="hidden lg:flex w-72 bg-ngo-blue text-white p-8 flex-col gap-10">
            <div className="space-y-6">
              <p className="text-[10px] uppercase tracking-widest text-blue-300/50 font-bold">Data & Impact</p>
              <div className="space-y-3">
                <Link to="/data-collection" className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full bg-lemon"></div>
                  <span className="text-sm font-medium">Data Survey</span>
                </Link>
                <Link to="/volunteer" className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full bg-gold"></div>
                  <span className="text-sm font-medium">Volunteer Portal</span>
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] uppercase tracking-widest text-blue-300/50 font-bold">Quick Links</p>
              <nav className="flex flex-col gap-4 text-sm text-blue-100/70">
                <Link to="/news" className="flex items-center gap-3 hover:text-lemon transition-colors">
                  <Newspaper size={18} /> News & Updates
                </Link>
                <Link to="/events" className="flex items-center gap-3 hover:text-lemon transition-colors">
                  <Calendar size={18} /> Upcoming Events
                </Link>
                <Link to="/about" className="flex items-center gap-3 hover:text-lemon transition-colors">
                  <Info size={18} /> Mission & Vision
                </Link>
                <Link to="/contact" className="flex items-center gap-3 hover:text-lemon transition-colors">
                  <Mail size={18} /> Contact Us
                </Link>
              </nav>
            </div>

            <div className="mt-auto p-5 bg-white/5 rounded-[24px] border border-white/10 backdrop-blur-sm">
              <p className="text-xs text-blue-200 font-medium mb-1">Active Projects</p>
              <p className="text-3xl font-bold text-lemon">{projectCount}</p>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (projectCount / 10) * 100)}%` }}
                  className="bg-lemon h-full" 
                />
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
            
            <footer className="mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-medium">
              <div className="flex gap-6">
                <span>© 2026 Sinarimam Foundation</span>
                <span>Active since 2020</span>
                <span>support@sinarimamfoundation.org.ng</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm border border-slate-100">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-ngo-blue">Cloud Infrastructure Connected</span>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/board" element={<Board />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsArticle />} />
          <Route path="/volunteer" element={<Volunteer />} />
          <Route path="/data-collection" element={<DataCollection />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

