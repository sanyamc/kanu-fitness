import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Activity, 
  Heart, 
  Scale, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
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
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
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
  // Use React.ComponentType for cleaner icon cloning/rendering
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
    "Strong Mom, strong family.",
    "Do something today that your future self will thank you for.",
    "You are doing a great job, Kanu!",
    "You are getting strong, Dodu!",
];

const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'strength_a',
    name: 'Upper Body Build',
    type: 'strength',
    color: 'bg-blue-500',
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
    color: 'bg-purple-500',
    icon: TrendingUp,
    exercises: [
      { id: 'lp1', name: 'Leg Press', sets: 3, reps: '10-12', rest: '90s', notes: 'Drive through heels.' },
    ]
  },
  { id: 'yoga_flow', name: 'Morning Flow', type: 'yoga', color: 'bg-rose-400', icon: Heart, duration: 25 },
  { id: 'cardio_zone2', name: 'Zone 2 Burn', type: 'cardio', color: 'bg-orange-500', icon: Activity, duration: 30 }
];

// --- Optimized Mobile UI Components ---

const GlassCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick} 
    className={`bg-slate-900/60 backdrop-blur-xl rounded-[28px] shadow-2xl border border-white/10 p-6 transition-all active:scale-[0.97] touch-manipulation ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
);

const IconButton = ({ icon: Icon, onClick, className = "" }: any) => (
  <button 
    onClick={onClick}
    className={`p-4 rounded-full bg-slate-800/80 text-slate-200 active:bg-slate-700 active:scale-90 transition-all border border-white/5 touch-manipulation ${className}`}
  >
    <Icon size={24} />
  </button>
);

const PrimaryButton = ({ onClick, children, className = "", icon: Icon }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full bg-white text-slate-950 py-5 rounded-[24px] font-bold text-lg flex items-center justify-center gap-3 shadow-2xl active:scale-[0.96] active:bg-slate-200 transition-all touch-manipulation mb-env-safe ${className}`}
  >
    {Icon && <Icon size={24} />}
    {children}
  </button>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'log_workout' | 'log_weight' | 'history'>('dashboard');
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<WorkoutTemplate | null>(null);
  const [dailyQuote, setDailyQuote] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setIsConnected(!!u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const logsQuery = query(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), orderBy('date', 'desc'));
    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutLog)));
    });

    const weightsQuery = query(collection(db, 'artifacts', appId, 'users', user.uid, 'weights'), orderBy('date', 'desc'));
    const unsubWeights = onSnapshot(weightsQuery, (snap) => {
      setWeights(snap.docs.map(d => ({ id: d.id, ...d.data() } as WeightEntry)));
    });

    return () => { unsubLogs(); unsubWeights(); };
  }, [user]);

  useEffect(() => {
    const day = Math.floor(Date.now() / 86400000);
    setDailyQuote(QUOTES[day % QUOTES.length]);
  }, []);

  const Dashboard = () => (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <header className="flex justify-between items-start pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-black text-white tracking-tighter">MomStrong</h1>
            <Sparkles size={24} className="text-indigo-400 fill-indigo-400" />
          </div>
          <p className="text-slate-500 font-semibold flex items-center gap-2 text-sm tracking-wide">
            {isConnected ? <Wifi size={14} className="text-emerald-500"/> : <WifiOff size={14} className="text-rose-400"/>}
            HI, KANU
          </p>
        </div>
        <div className="bg-slate-800/80 px-5 py-2.5 rounded-2xl border border-white/10 flex items-center gap-2 shadow-lg backdrop-blur-md">
          <Trophy size={20} className="text-indigo-400" />
          <span className="font-black text-white text-lg leading-none">{logs.length}</span>
        </div>
      </header>

      {/* Dynamic Island Inspired Quote */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-[36px] p-8 text-white shadow-[0_20px_50px_rgba(79,70,229,0.3)] border border-white/10">
        <div className="relative z-10 space-y-4">
          <div className="bg-white/10 w-fit p-2 rounded-xl">
            <Quote className="text-white/80" size={24} fill="currentColor" />
          </div>
          <p className="text-xl font-bold leading-snug italic tracking-tight">"{dailyQuote}"</p>
        </div>
        <div className="absolute top-[-40%] right-[-20%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-purple-400/20 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <GlassCard onClick={() => setView('log_weight')} className="flex flex-col gap-3 py-7">
          <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 border border-rose-500/20">
            <Scale size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.15em] mb-1">Weight</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white tracking-tighter">{weights[0]?.weight || '--'}</span>
              <span className="text-[10px] font-black text-slate-500 uppercase">Lbs</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard onClick={() => setView('history')} className="flex flex-col gap-3 py-7">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.15em] mb-1">Session</p>
            <p className="text-sm font-black text-white truncate tracking-tight">
              {logs[0]?.templateName || 'Ready to go?'}
            </p>
          </div>
        </GlassCard>
      </div>

      <div className="space-y-5">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xl font-black text-white/90 tracking-tight">Stats</h2>
          <ChevronRight size={20} className="text-slate-600" />
        </div>
        <GlassCard className="py-6 border-white/5">
          <div className="flex justify-between items-center mb-4">
             <span className="text-sm font-bold text-slate-300">Training Momentum</span>
             <span className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-3 py-1.5 rounded-full border border-indigo-400/20 uppercase tracking-widest">
               {logs.length > 5 ? 'ON FIRE 🔥' : 'WARMING UP'}
             </span>
          </div>
          <div className="w-full h-3 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min((logs.length / 10) * 100, 100)}%` }}
            />
          </div>
        </GlassCard>
      </div>

      <div className="pt-2">
        <PrimaryButton onClick={() => setView('log_workout')} icon={Plus}>
          New Entry
        </PrimaryButton>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 max-w-md mx-auto relative px-6 pt-16 pb-12 font-sans text-slate-200 selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Safe Area Notch Padding for iPhone Pro Max */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-slate-950/80 backdrop-blur-md z-50 pointer-events-none" />
      
      {view === 'dashboard' && <Dashboard />}
      
      {view === 'log_workout' && !activeTemplate && (
        <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
            <IconButton icon={ArrowLeft} onClick={() => setView('dashboard')} />
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter">Routines</h2>
              <p className="text-slate-500 font-bold text-lg mt-1">Ready for today's sweat?</p>
            </div>
            <div className="space-y-5">
                {WORKOUT_TEMPLATES.map(t => (
                    <GlassCard key={t.id} onClick={() => setActiveTemplate(t)} className="flex items-center justify-between py-6 border-white/10 active:bg-slate-800">
                        <div className="flex items-center gap-5">
                            <div className={`p-4 ${t.color} rounded-[20px] shadow-2xl shadow-black/40 text-white`}>
                                <t.icon size={28} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white leading-tight">{t.name}</h3>
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">{t.type}</p>
                            </div>
                        </div>
                        <ChevronRight className="text-slate-700" size={20} />
                    </GlassCard>
                ))}
            </div>
        </div>
      )}

      {activeTemplate && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="flex justify-between items-center">
                <IconButton icon={ArrowLeft} onClick={() => setActiveTemplate(null)} />
                <h2 className="font-black text-white tracking-tight text-xl">{activeTemplate.name}</h2>
                <button 
                  onClick={async () => {
                      if (!user) return;
                      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), {
                          date: new Date().toISOString(),
                          templateId: activeTemplate.id,
                          templateName: activeTemplate.name,
                          type: activeTemplate.type,
                          duration: activeTemplate.duration || 45
                      });
                      setActiveTemplate(null);
                      setView('dashboard');
                  }} 
                  className="px-6 py-3 bg-indigo-600 text-white rounded-[18px] font-black text-sm shadow-2xl shadow-indigo-900/40 active:scale-95 transition-all"
                >FINISH</button>
              </div>

              <div className="text-center space-y-6 py-10">
                  <div className={`mx-auto w-32 h-32 ${activeTemplate.color} rounded-[40px] flex items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-4 border-white/10 text-white`}>
                    <activeTemplate.icon size={56} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-indigo-400 font-black uppercase tracking-[0.25em] text-[10px]">Session in progress</p>
                    <h3 className="text-4xl font-black text-white tracking-tighter">{activeTemplate.name}</h3>
                  </div>
              </div>

              {activeTemplate.exercises ? (
                  <div className="space-y-5">
                    {activeTemplate.exercises.map(ex => (
                      <GlassCard key={ex.id} className="border-white/10 py-7">
                        <div className="flex justify-between items-start mb-6 px-1">
                          <h4 className="text-xl font-black text-white tracking-tight">{ex.name}</h4>
                          <div className="p-1 bg-indigo-500/10 rounded-lg">
                            <CheckCircle2 size={22} className="text-indigo-500/50" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-1">
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sets</p>
                            <p className="text-lg font-black text-white tracking-tight">{ex.sets}</p>
                          </div>
                          <div className="w-px h-8 bg-slate-800" />
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Reps</p>
                            <p className="text-lg font-black text-white tracking-tight text-center">{ex.reps}</p>
                          </div>
                          <div className="w-px h-8 bg-slate-800" />
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Rest</p>
                            <p className="text-lg font-black text-white tracking-tight text-right">{ex.rest}</p>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
              ) : (
                <GlassCard className="text-center py-16">
                   <Activity size={48} className="mx-auto text-slate-800 mb-6" />
                   <p className="text-slate-400 font-bold text-lg tracking-tight italic">Enjoy your {activeTemplate.duration} min session!</p>
                </GlassCard>
              )}
          </div>
      )}

      {view === 'history' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
               <IconButton icon={ArrowLeft} onClick={() => setView('dashboard')} />
               <div className="flex items-center justify-between">
                 <h2 className="text-4xl font-black text-white tracking-tighter">History</h2>
                 <History size={28} className="text-indigo-500/50" />
               </div>
               
               {logs.length === 0 ? (
                 <div className="py-24 text-center space-y-6">
                   <div className="w-20 h-20 bg-slate-900 rounded-[32px] flex items-center justify-center mx-auto text-slate-800 border border-white/5">
                     <History size={40} />
                   </div>
                   <p className="text-slate-600 font-bold text-lg">No sessions logged yet.</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                    {logs.map(log => (
                        <GlassCard key={log.id} className="flex justify-between items-center py-5 border-white/5 active:bg-slate-800/80">
                            <div className="flex items-center gap-5">
                                <div className="w-2 h-12 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.4)]" />
                                <div>
                                    <p className="text-lg font-black text-white tracking-tight">{log.templateName}</p>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-0.5">
                                      {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                            <button 
                              onClick={async (e) => {
                                  e.stopPropagation();
                                  if(confirm("Delete this session from your history?")) {
                                    await deleteDoc(doc(db, 'artifacts', appId, 'users', user?.uid || '', 'logs', log.id));
                                  }
                              }}
                              className="text-slate-700 hover:text-rose-500 transition-colors p-3"
                            >
                                <Trash2 size={22}/>
                            </button>
                        </GlassCard>
                    ))}
                 </div>
               )}
          </div>
      )}

      {view === 'log_weight' && (
          <div className="space-y-16 pt-6 flex flex-col items-center animate-in slide-in-from-bottom-8 duration-400">
               <div className="w-full flex justify-start">
                <IconButton icon={ArrowLeft} onClick={() => setView('dashboard')} />
               </div>
               
               <div className="text-center space-y-3">
                 <h2 className="text-4xl font-black text-white tracking-tighter">Current Weight</h2>
                 <p className="text-slate-500 font-bold text-lg tracking-wide uppercase text-[12px]">Morning measurement</p>
               </div>

               <div className="relative w-full py-10">
                 <div className="absolute inset-0 bg-indigo-500/5 blur-[100px] rounded-full" />
                 <input 
                    type="number" 
                    step="0.1" 
                    autoFocus
                    placeholder="00.0" 
                    className="text-9xl font-black text-center w-full bg-transparent text-white placeholder:text-slate-900 focus:outline-none transition-all tracking-tighter select-all" 
                    id="weight-input"
                    inputMode="decimal"
                  />
                  <div className="flex justify-center mt-10">
                    <div className="bg-white text-slate-950 px-8 py-2.5 rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-[0_10px_30px_rgba(255,255,255,0.2)]">
                      LBS
                    </div>
                  </div>
               </div>

               <div className="w-full">
                 <PrimaryButton onClick={async () => {
                     const val = (document.getElementById('weight-input') as HTMLInputElement).value;
                     if (!user || !val) return;
                     await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'weights'), {
                         date: new Date().toISOString(),
                         weight: parseFloat(val)
                     });
                     setView('dashboard');
                 }}>
                   Save Log
                 </PrimaryButton>
               </div>
          </div>
      )}
      
      {/* Bottom Indicator Support */}
      <div className="h-4 w-full" />
    </div>
  );
}