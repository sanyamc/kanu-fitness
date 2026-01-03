import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Activity, 
  Heart, 
  Scale, 
  TrendingUp, 
  Calendar, 
  Plus, 
  ChevronRight, 
  Trophy,
  History,
  ArrowLeft,
  Trash2,
  Quote,
  Wifi,
  WifiOff,
  Sparkles,
  type LucideProps
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, doc, addDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";

// --- Configuration ---

const firebaseConfig = {
  apiKey: "AIzaSyCY_CqhZ8jP3IPeQi2ALvJOPwFdfjZ3Flc",
  authDomain: "kanu-fitness.firebaseapp.com",
  projectId: "kanu-fitness",
  storageBucket: "kanu-fitness.firebasestorage.app",
  messagingSenderId: "1036671364966",
  appId: "1:1036671364966:web:d5df00a193f0cf154862a7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "kanu-fit-v1"; 

// CRITICAL: Fixed User ID to ensure data persistence across sessions/deployments
const FIXED_USER_ID = "kanu_primary_user"; 

// --- Types ---

type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes: string;
};

type WorkoutTemplate = {
  id: string;
  name: string;
  type: 'strength' | 'yoga' | 'cardio';
  icon: React.ComponentType<LucideProps>;
  color: string;
  duration?: number;
  exercises?: Exercise[];
};

type WorkoutLog = {
  id: string;
  date: string;
  templateId: string;
  templateName: string;
  type: 'strength' | 'yoga' | 'cardio';
  duration: number;
};

type WeightEntry = {
  id: string;
  date: string;
  weight: number;
};

const QUOTES = [
    "Self-care is not selfish. You cannot serve from an empty vessel.",
    "Strong Kanu, strong family.",
    "Strong Dodu means Strong Kavi and Strong Sanyam",
    "Do something today that your future self will thank you for.",
    "You are doing a great job, Kanu!",
    "You are getting strong, Dodu!",
];

const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'strength_a',
    name: 'Upper Body Build',
    type: 'strength',
    color: 'bg-blue-600',
    icon: Dumbbell,
    exercises: [
      { id: 'cp1', name: 'Chest Press', sets: 3, reps: '10-12', rest: '60s', notes: 'Focus on slow control.' },
      { id: 'ld1', name: 'Lat Pulldown', sets: 3, reps: '10-12', rest: '60s', notes: 'Squeeze shoulder blades.' },
    ]
  },
  {
    id: 'strength_b',
    name: 'Lower Body Sculpt',
    type: 'strength',
    color: 'bg-purple-600',
    icon: TrendingUp,
    exercises: [
      { id: 'lp1', name: 'Leg Press', sets: 3, reps: '10-12', rest: '90s', notes: 'Drive through heels.' },
    ]
  },
  { id: 'yoga_flow', name: 'Morning Flow', type: 'yoga', color: 'bg-rose-500', icon: Heart, duration: 25 },
  { id: 'cardio_zone2', name: 'Zone 2 Burn', type: 'cardio', color: 'bg-orange-500', icon: Activity, duration: 30 }
];

// --- Polished Mobile UI Components ---

const GlassCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick} 
    className={`bg-slate-900/40 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/10 p-6 transition-all active:scale-[0.96] touch-manipulation ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
);

const IconButton = ({ icon: Icon, onClick, className = "" }: any) => (
  <button 
    onClick={onClick}
    className={`p-4 rounded-full bg-slate-800/60 text-slate-200 active:bg-slate-700 active:scale-90 transition-all border border-white/5 touch-manipulation flex items-center justify-center ${className}`}
  >
    <Icon size={24} />
  </button>
);

const PrimaryButton = ({ onClick, children, className = "", icon: Icon }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black text-xl flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(79,70,229,0.4)] active:scale-[0.96] active:bg-indigo-700 transition-all touch-manipulation ${className}`}
  >
    {Icon && <Icon size={26} />}
    {children}
  </button>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<boolean>(false);
  const [view, setView] = useState<'dashboard' | 'log_workout' | 'log_weight' | 'history'>('dashboard');
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<WorkoutTemplate | null>(null);
  const [dailyQuote, setDailyQuote] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  // PWA & Icon Helper
  useEffect(() => {
    const iconUrl = "https://cdn-icons-png.flaticon.com/512/3663/3663335.png";
    const updateHead = () => {
        document.title = "MomStrong";
        let metaTheme = document.querySelector('meta[name="theme-color"]') || document.createElement('meta');
        metaTheme.setAttribute('name', 'theme-color');
        metaTheme.setAttribute('content', '#020617');
        document.head.appendChild(metaTheme);

        let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') || document.createElement('link');
        appleIcon.setAttribute('rel', 'apple-touch-icon');
        appleIcon.setAttribute('href', iconUrl);
        document.head.appendChild(appleIcon);
    };
    updateHead();
  }, []);

  useEffect(() => {
    signInAnonymously(auth).then(() => {
        setIsConnected(true);
        setUser(true);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!user) return;
    const logsQuery = query(collection(db, 'artifacts', appId, 'users', FIXED_USER_ID, 'logs'), orderBy('date', 'desc'));
    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutLog)));
    }, (err) => console.error("Logs fetch error:", err));

    const weightsQuery = query(collection(db, 'artifacts', appId, 'users', FIXED_USER_ID, 'weights'), orderBy('date', 'desc'));
    const unsubWeights = onSnapshot(weightsQuery, (snap) => {
      setWeights(snap.docs.map(d => ({ id: d.id, ...d.data() } as WeightEntry)));
    }, (err) => console.error("Weights fetch error:", err));

    return () => { unsubLogs(); unsubWeights(); };
  }, [user]);

  useEffect(() => {
    const day = Math.floor(Date.now() / 86400000);
    setDailyQuote(QUOTES[day % QUOTES.length]);
  }, []);

  const Dashboard = () => (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700">
      <header className="flex justify-between items-start pt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-black text-white tracking-tighter">MomStrong</h1>
            <Sparkles size={24} className="text-indigo-400 fill-indigo-400" />
          </div>
          <p className="text-slate-500 font-bold flex items-center gap-2 text-[13px] tracking-widest uppercase">
            {isConnected ? <Wifi size={14} className="text-emerald-500"/> : <WifiOff size={14} className="text-rose-400"/>}
            HI, KANU
          </p>
        </div>
        <div className="bg-slate-800/60 px-4 py-2 rounded-2xl border border-white/5 flex items-center gap-2 shadow-lg backdrop-blur-md">
          <Trophy size={18} className="text-amber-400" />
          <span className="font-black text-white text-lg leading-none">{logs.length}</span>
        </div>
      </header>

      {/* Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 rounded-[40px] p-8 text-white shadow-2xl border border-white/10">
        <div className="relative z-10 space-y-4">
          <div className="bg-white/10 w-fit p-2.5 rounded-2xl">
            <Quote className="text-white/80" size={24} fill="currentColor" />
          </div>
          <p className="text-2xl font-bold leading-tight tracking-tight italic">"{dailyQuote}"</p>
        </div>
        <div className="absolute top-[-50%] right-[-20%] w-72 h-72 bg-white/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-30%] left-[-10%] w-56 h-56 bg-purple-500/20 rounded-full blur-[60px]" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard onClick={() => setView('log_weight')} className="flex flex-col gap-3 py-8">
          <div className="w-12 h-12 bg-rose-500/10 rounded-[20px] flex items-center justify-center text-rose-400 border border-rose-500/20">
            <Scale size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Weight</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white tracking-tighter">{weights[0]?.weight || '--'}</span>
              <span className="text-[10px] font-black text-slate-500 uppercase">lbs</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard onClick={() => setView('history')} className="flex flex-col gap-3 py-8">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-[20px] flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Session</p>
            <p className="text-sm font-black text-white truncate tracking-tight">
              {logs[0]?.templateName || 'Log Activity'}
            </p>
          </div>
        </GlassCard>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-xs opacity-60">Your Streak</h2>
        </div>
        <GlassCard className="py-6 border-white/5">
          <div className="flex justify-between items-center mb-4">
             <span className="text-sm font-bold text-slate-400">Monthly Progress</span>
             <span className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full uppercase tracking-widest">
               {logs.length} Total
             </span>
          </div>
          <div className="w-full h-3.5 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min((logs.length / 12) * 100, 100)}%` }}
            />
          </div>
        </GlassCard>
      </div>

      <div className="pt-2">
        <PrimaryButton onClick={() => setView('log_workout')} icon={Plus}>
          START SESSION
        </PrimaryButton>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] w-full bg-slate-950 max-w-lg mx-auto relative px-6 font-sans text-slate-200 overflow-x-hidden selection:bg-indigo-500/30 flex flex-col">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-20%] w-[300px] h-[300px] bg-indigo-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-20%] w-[300px] h-[300px] bg-purple-900/20 rounded-full blur-[120px]" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pt-12 pb-10">
        {view === 'dashboard' && <Dashboard />}
        
        {view === 'log_workout' && !activeTemplate && (
          <div className="space-y-8 animate-in slide-in-from-left-6 duration-400 pb-20">
              <IconButton icon={ArrowLeft} onClick={() => setView('dashboard')} />
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter">Workouts</h2>
                <p className="text-slate-500 font-bold text-lg">Pick your focus</p>
              </div>
              <div className="space-y-4">
                  {WORKOUT_TEMPLATES.map(t => (
                      <GlassCard key={t.id} onClick={() => setActiveTemplate(t)} className="flex items-center justify-between py-6 border-white/5">
                          <div className="flex items-center gap-5">
                              <div className={`p-4 ${t.color} rounded-[24px] shadow-xl text-white`}>
                                  <t.icon size={28} />
                              </div>
                              <div>
                                  <h3 className="text-xl font-black text-white leading-tight tracking-tight">{t.name}</h3>
                                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1 opacity-70">{t.type}</p>
                              </div>
                          </div>
                          <ChevronRight className="text-slate-700" size={24} />
                      </GlassCard>
                  ))}
              </div>
          </div>
        )}

        {activeTemplate && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-12 duration-500 pb-24">
                <div className="flex justify-between items-center">
                  <IconButton icon={ArrowLeft} onClick={() => setActiveTemplate(null)} />
                  <h2 className="font-black text-white tracking-tight text-xl">{activeTemplate.name}</h2>
                  <button 
                    onClick={async () => {
                        await addDoc(collection(db, 'artifacts', appId, 'users', FIXED_USER_ID, 'logs'), {
                            date: new Date().toISOString(),
                            templateId: activeTemplate.id,
                            templateName: activeTemplate.name,
                            type: activeTemplate.type,
                            duration: activeTemplate.duration || 45
                        });
                        setActiveTemplate(null);
                        setView('dashboard');
                    }} 
                    className="px-6 py-3 bg-indigo-600 text-white rounded-[20px] font-black text-sm shadow-xl active:scale-95 transition-all"
                  >FINISH</button>
                </div>

                <div className="text-center space-y-4 py-6 relative">
                    <div className="absolute inset-0 bg-indigo-500/5 blur-[100px] -z-10" />
                    <div className={`mx-auto w-24 h-24 ${activeTemplate.color} rounded-[36px] flex items-center justify-center shadow-2xl border-4 border-white/10 text-white`}>
                      <activeTemplate.icon size={44} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px]">Active Session</p>
                      <h3 className="text-3xl font-black text-white tracking-tighter leading-none">{activeTemplate.name}</h3>
                    </div>
                </div>

                {activeTemplate.exercises ? (
                    <div className="space-y-4">
                      {activeTemplate.exercises.map(ex => (
                        <GlassCard key={ex.id} className="border-white/10 py-5">
                          <h4 className="text-xl font-black text-white tracking-tighter mb-4">{ex.name}</h4>
                          <div className="flex items-center justify-between px-2">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sets</p>
                              <p className="text-xl font-black text-white">{ex.sets}</p>
                            </div>
                            <div className="w-px h-8 bg-slate-800" />
                            <div className="space-y-1 text-center">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target</p>
                              <p className="text-xl font-black text-white">{ex.reps}</p>
                            </div>
                            <div className="w-px h-8 bg-slate-800" />
                            <div className="space-y-1 text-right">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rest</p>
                              <p className="text-xl font-black text-white">{ex.rest}</p>
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                ) : (
                  <GlassCard className="text-center py-16">
                     <Activity size={48} className="mx-auto text-slate-800 mb-4 opacity-40" />
                     <p className="text-slate-400 font-black text-lg tracking-tight">Focus on your breathing.</p>
                  </GlassCard>
                )}
            </div>
        )}

        {view === 'history' && (
            <div className="space-y-8 animate-in slide-in-from-right-6 duration-400 pb-20">
                 <IconButton icon={ArrowLeft} onClick={() => setView('dashboard')} />
                 <h2 className="text-4xl font-black text-white tracking-tighter">Journal</h2>
                 
                 {logs.length === 0 ? (
                   <div className="py-24 text-center space-y-6">
                     <div className="w-24 h-24 bg-slate-900 rounded-[40px] flex items-center justify-center mx-auto text-slate-800 border border-white/5">
                       <History size={48} />
                     </div>
                     <p className="text-slate-600 font-black text-xl">The journal is empty.</p>
                   </div>
                 ) : (
                   <div className="space-y-4">
                      {logs.map(log => (
                          <GlassCard key={log.id} className="flex justify-between items-center py-6 border-white/5">
                              <div className="flex items-center gap-5">
                                  <div className="w-2.5 h-12 bg-gradient-to-b from-indigo-500 to-indigo-700 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                                  <div>
                                      <p className="text-lg font-black text-white tracking-tight leading-tight">{log.templateName}</p>
                                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mt-1 opacity-60">
                                        {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </p>
                                  </div>
                              </div>
                              <button 
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if(confirm("Permanently delete this entry?")) {
                                      await deleteDoc(doc(db, 'artifacts', appId, 'users', FIXED_USER_ID, 'logs', log.id));
                                    }
                                }}
                                className="text-slate-800 hover:text-rose-500 transition-colors p-3"
                              >
                                  <Trash2 size={24}/>
                              </button>
                          </GlassCard>
                      ))}
                   </div>
                 )}
            </div>
        )}

        {view === 'log_weight' && (
            <div className="space-y-16 pt-4 flex flex-col items-center animate-in slide-in-from-bottom-10 duration-400 h-full">
                 <div className="w-full flex justify-start">
                  <IconButton icon={ArrowLeft} onClick={() => setView('dashboard')} />
                 </div>
                 
                 <div className="text-center space-y-4">
                   <h2 className="text-4xl font-black text-white tracking-tighter">Current Weight</h2>
                   <p className="text-indigo-400 font-black tracking-widest uppercase text-[12px]">Daily Check-in</p>
                 </div>

                 <div className="relative w-full py-6">
                   <div className="absolute inset-0 bg-indigo-500/10 blur-[120px] rounded-full" />
                   <input 
                      type="number" 
                      step="0.1" 
                      autoFocus
                      placeholder="00.0" 
                      className="text-9xl font-black text-center w-full bg-transparent text-white placeholder:text-slate-900 focus:outline-none transition-all tracking-tighter select-all" 
                      id="weight-input"
                      inputMode="decimal"
                    />
                    <div className="flex justify-center mt-12">
                      <div className="bg-white text-slate-950 px-10 py-3 rounded-full font-black text-[13px] uppercase tracking-[0.4em] shadow-2xl">
                        Lbs
                      </div>
                    </div>
                 </div>

                 <div className="w-full mt-auto pb-10">
                   <PrimaryButton onClick={async () => {
                       const val = (document.getElementById('weight-input') as HTMLInputElement).value;
                       if (!val) return;
                       await addDoc(collection(db, 'artifacts', appId, 'users', FIXED_USER_ID, 'weights'), {
                           date: new Date().toISOString(),
                           weight: parseFloat(val)
                       });
                       setView('dashboard');
                   }}>
                     SAVE LOG
                   </PrimaryButton>
                 </div>
            </div>
        )}
      </div>
      <div className="h-[env(safe-area-inset-bottom)] min-h-[20px] w-full" />
    </div>
  );
}