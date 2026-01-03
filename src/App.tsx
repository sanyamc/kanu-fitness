import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dumbbell, 
  Activity,
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
  type LucideProps,
  Timer,
  Save,
  Layers,
  LineChart,
  LayoutDashboard
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, doc, addDoc, deleteDoc, onSnapshot, query, orderBy, setDoc } from "firebase/firestore";

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

const FIXED_USER_ID = "kanu_primary_user"; 

// --- Types ---

type Exercise = {
  id: string;
  name: string;
  sets: number;
  targetReps: string;
  notes: string;
};

type WorkoutTemplate = {
  id: string;
  name: string;
  type: 'strength' | 'functional';
  icon: React.ComponentType<LucideProps>;
  color: string;
  duration: number;
  exercises: Exercise[];
};

type SetLog = {
  weight: string;
  reps: string;
};

type WorkoutLog = {
  id: string;
  date: string;
  templateId: string;
  templateName: string;
  type: string;
  duration: number;
  performance?: Record<string, SetLog[]>;
};

type WeightEntry = {
  id: string;
  date: string;
  weight: number;
};

type ExerciseHistory = {
  lastWeight: string;
  lastReps: string;
  date: string;
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
    id: 'machine_power',
    name: 'Machine Power',
    type: 'strength',
    color: 'bg-blue-600',
    icon: Dumbbell,
    duration: 45,
    exercises: [
      { id: 'warmup', name: 'Warmup: Walking & Dynamic Stretch', sets: 1, targetReps: '5 mins', notes: 'Get the blood flowing.' },
      { id: 'm_chest', name: 'Chest Press Machine', sets: 3, targetReps: '10-12', notes: 'Control the eccentric.' },
      { id: 'm_row', name: 'Seated Row Machine', sets: 3, targetReps: '10-12', notes: 'Squeeze shoulder blades.' },
      { id: 'm_legp', name: 'Leg Press', sets: 3, targetReps: '12-15', notes: 'Feet shoulder width.' },
      { id: 'm_lat', name: 'Lat Pulldown', sets: 3, targetReps: '10-12', notes: 'Wide grip.' },
      { id: 'm_shld', name: 'Shoulder Press Machine', sets: 3, targetReps: '10-12', notes: 'Keep core tight.' },
      { id: 'cool', name: 'Cool Down: Static Stretching', sets: 1, targetReps: '5 mins', notes: 'Relax the muscles.' }
    ]
  },
  {
    id: 'functional_flow',
    name: 'Functional Flow',
    type: 'functional',
    color: 'bg-purple-600',
    icon: Activity,
    duration: 45,
    exercises: [
      { id: 'warmup_f', name: 'Warmup: Mobility Drills', sets: 1, targetReps: '5 mins', notes: 'Joint circles and light movement.' },
      { id: 'kb_swing', name: 'Kettlebell Swings', sets: 4, targetReps: '15-20', notes: 'Hinge at the hips.' },
      { id: 'bw_squat', name: 'Goblet Squats (KB)', sets: 3, targetReps: '12-15', notes: 'Chest up, deep squat.' },
      { id: 'kb_row', name: 'Single Arm KB Row', sets: 3, targetReps: '10/side', notes: 'Flat back.' },
      { id: 'bw_pushup', name: 'Pushups', sets: 3, targetReps: 'Max-1', notes: 'Modify to knees if needed.' },
      { id: 'bw_lunge', name: 'Alternating Lunges', sets: 3, targetReps: '20 total', notes: 'Steady balance.' },
      { id: 'cool_f', name: 'Cool Down: Deep Breathing', sets: 1, targetReps: '5 mins', notes: 'Lower the heart rate.' }
    ]
  }
];

// --- Polished Mobile UI Components ---

const GlassCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick} 
    className={`bg-slate-900/40 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/10 p-6 transition-all active:scale-[0.98] touch-manipulation ${onClick ? 'cursor-pointer' : ''} ${className}`}
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
  const [view, setView] = useState<'dashboard' | 'log_workout' | 'log_weight' | 'history' | 'insights'>('dashboard');
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [exerciseHistory, setExerciseHistory] = useState<Record<string, ExerciseHistory>>({});
  const [activeTemplate, setActiveTemplate] = useState<WorkoutTemplate | null>(null);
  const [sessionData, setSessionData] = useState<Record<string, SetLog[]>>({});
  const [dailyQuote, setDailyQuote] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const updateHead = () => {
        document.title = "KanuStrong";
        let metaTheme = document.querySelector('meta[name="theme-color"]') || document.createElement('meta');
        metaTheme.setAttribute('name', 'theme-color');
        metaTheme.setAttribute('content', '#020617');
        document.head.appendChild(metaTheme);
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
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutLog));
      setLogs(data);
    });

    const weightsQuery = query(collection(db, 'artifacts', appId, 'users', FIXED_USER_ID, 'weights'), orderBy('date', 'desc'));
    const unsubWeights = onSnapshot(weightsQuery, (snap) => {
      setWeights(snap.docs.map(d => ({ id: d.id, ...d.data() } as WeightEntry)));
    });

    const historyQuery = query(collection(db, 'artifacts', appId, 'users', FIXED_USER_ID, 'exercise_history'));
    const unsubHistory = onSnapshot(historyQuery, (snap) => {
      const hist: Record<string, ExerciseHistory> = {};
      snap.docs.forEach(d => {
        hist[d.id] = d.data() as ExerciseHistory;
      });
      setExerciseHistory(hist);
    });

    return () => { unsubLogs(); unsubWeights(); unsubHistory(); };
  }, [user]);

  useEffect(() => {
    const day = Math.floor(Date.now() / 86400000);
    setDailyQuote(QUOTES[day % QUOTES.length]);
  }, []);

  const startWorkout = (template: WorkoutTemplate) => {
    const initialData: Record<string, SetLog[]> = {};
    template.exercises.forEach(ex => {
      initialData[ex.id] = Array.from({ length: ex.sets }, () => ({ weight: '', reps: '' }));
    });
    setSessionData(initialData);
    setActiveTemplate(template);
  };

  const saveWorkout = async () => {
    if (!activeTemplate) return;

    await addDoc(collection(db, 'artifacts', appId, 'users', FIXED_USER_ID, 'logs'), {
        date: new Date().toISOString(),
        templateId: activeTemplate.id,
        templateName: activeTemplate.name,
        type: activeTemplate.type,
        duration: activeTemplate.duration,
        performance: sessionData
    });

    for (const [exId, sets] of Object.entries(sessionData)) {
        const lastPopulatedSet = [...sets].reverse().find(s => s.weight || s.reps);
        if (lastPopulatedSet) {
            await setDoc(doc(db, 'artifacts', appId, 'users', FIXED_USER_ID, 'exercise_history', exId), {
                lastWeight: lastPopulatedSet.weight,
                lastReps: lastPopulatedSet.reps,
                date: new Date().toISOString()
            });
        }
    }

    setSessionData({});
    setActiveTemplate(null);
    setView('dashboard');
  };

  // --- Analytical Calculations ---
  
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const last30Days = logs.filter(l => {
        const d = new Date(l.date);
        return (now.getTime() - d.getTime()) < (30 * 24 * 60 * 60 * 1000);
    });
    return {
        count: last30Days.length,
        avgDuration: last30Days.length ? Math.round(last30Days.reduce((acc, curr) => acc + curr.duration, 0) / last30Days.length) : 0
    };
  }, [logs]);

  const dashboardStats = [
    { label: 'Workouts (30d)', value: weeklyStats.count, icon: Activity, color: 'text-indigo-400' },
    { label: 'Avg Duration', value: `${weeklyStats.avgDuration}m`, icon: Timer, color: 'text-emerald-400' }
  ];

  // --- Sub-Screens ---

  const Dashboard = () => (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700">
      <header className="flex justify-between items-start pt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-black text-white tracking-tighter">KanuStrong</h1>
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
        {dashboardStats.map((stat, idx) => (
          <GlassCard key={idx} className="flex flex-col gap-3 py-6">
            <stat.icon size={20} className={stat.color} />
            <div>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
            </div>
          </GlassCard>
        ))}
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
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Last Log</p>
            <p className="text-sm font-black text-white truncate tracking-tight">
              {logs[0]?.templateName || 'No Session'}
            </p>
          </div>
        </GlassCard>
      </div>

      <div className="pt-2">
        <PrimaryButton onClick={() => setView('log_workout')} icon={Plus}>
          START 45 MIN SESSION
        </PrimaryButton>
      </div>
    </div>
  );

  const InsightsView = () => {
    // Group logs by month for a historical perspective
    const monthlyGroups = useMemo(() => {
        const groups: Record<string, number> = {};
        logs.forEach(log => {
            const date = new Date(log.date);
            const month = date.toLocaleString('default', { month: 'short' });
            groups[month] = (groups[month] || 0) + 1;
        });
        return groups;
    }, [logs]);

    return (
        <div className="min-h-full space-y-8 animate-in slide-in-from-right-6 duration-400 pb-32">
            <div>
                <h2 className="text-4xl font-black text-white tracking-tighter">Insights</h2>
                <p className="text-slate-500 font-bold text-lg">Your growth journey</p>
            </div>

            <GlassCard className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-white font-black text-lg tracking-tight">Workout Consistency</h3>
                    <TrendingUp size={18} className="text-indigo-400" />
                </div>
                <div className="flex items-end gap-3 h-32 pt-4">
                    {Object.entries(monthlyGroups).reverse().slice(0, 5).map(([month, count]) => (
                        <div key={month} className="flex-1 flex flex-col items-center gap-2 group">
                            <div 
                                className="w-full bg-indigo-500/20 rounded-t-lg relative flex flex-col justify-end overflow-hidden" 
                                style={{ height: `${Math.min(100, (count / 15) * 100)}%` }}
                            >
                                <div className="absolute inset-0 bg-indigo-600 transition-all group-active:bg-indigo-400" />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{month}</span>
                            <span className="text-[10px] font-black text-white">{count}</span>
                        </div>
                    ))}
                    {Object.keys(monthlyGroups).length === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-slate-700 font-bold italic text-sm">
                            More data needed for chart...
                        </div>
                    )}
                </div>
            </GlassCard>

            <div className="space-y-4">
                <h3 className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] ml-2">Personal Records Tracking</h3>
                {WORKOUT_TEMPLATES.flatMap(t => t.exercises).filter(e => !e.id.includes('warmup') && !e.id.includes('cool')).slice(0, 4).map(ex => {
                    const hist = exerciseHistory[ex.id];
                    return (
                        <GlassCard key={ex.id} className="py-5 flex items-center justify-between">
                            <div>
                                <h4 className="text-white font-black tracking-tight">{ex.name}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Last Lifted</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-black text-indigo-400">{hist?.lastWeight || '--'}</span>
                                <span className="text-[10px] font-black text-slate-500 uppercase ml-1">lbs</span>
                                <div className="text-[10px] font-bold text-slate-600">for {hist?.lastReps || '--'} reps</div>
                            </div>
                        </GlassCard>
                    );
                })}
            </div>
        </div>
    );
  };

  return (
    <div className="h-[100dvh] w-full bg-slate-950 max-w-lg mx-auto relative font-sans text-slate-200 overflow-hidden selection:bg-indigo-500/30 flex flex-col">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-20%] w-[300px] h-[300px] bg-indigo-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-20%] w-[300px] h-[300px] bg-purple-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 overflow-y-auto pt-12 pb-10 px-6">
        {view === 'dashboard' && <Dashboard />}
        {view === 'insights' && <InsightsView />}
        
        {view === 'log_workout' && !activeTemplate && (
          <div className="min-h-full space-y-8 animate-in slide-in-from-left-6 duration-400 pb-20">
              <IconButton icon={ArrowLeft} onClick={() => setView('dashboard')} />
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter">Workouts</h2>
                <p className="text-slate-500 font-bold text-lg">Choose your 45-min routine</p>
              </div>
              <div className="space-y-4">
                  {WORKOUT_TEMPLATES.map(t => (
                      <GlassCard key={t.id} onClick={() => startWorkout(t)} className="flex items-center justify-between py-6 border-white/5">
                          <div className="flex items-center gap-5">
                              <div className={`p-4 ${t.color} rounded-[24px] shadow-xl text-white`}>
                                  <t.icon size={28} />
                              </div>
                              <div>
                                  <h3 className="text-xl font-black text-white leading-tight tracking-tight">{t.name}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Timer size={12} className="text-slate-500" />
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest opacity-70">{t.duration} mins</p>
                                  </div>
                              </div>
                          </div>
                          <ChevronRight className="text-slate-700" size={24} />
                      </GlassCard>
                  ))}
              </div>
          </div>
        )}

        {activeTemplate && (
            <div className="min-h-full space-y-6 animate-in fade-in slide-in-from-bottom-12 duration-500 pb-32">
                <div className="flex justify-between items-center bg-slate-950/80 sticky top-0 py-4 z-20 backdrop-blur-lg -mx-6 px-6">
                  <IconButton icon={ArrowLeft} onClick={() => setActiveTemplate(null)} />
                  <h2 className="font-black text-white tracking-tight text-xl">{activeTemplate.name}</h2>
                  <button 
                    onClick={saveWorkout}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-[20px] font-black text-sm shadow-xl active:scale-95 transition-all"
                  >
                    <Save size={18} />
                    DONE
                  </button>
                </div>

                <div className="space-y-6">
                  {activeTemplate.exercises.map(ex => {
                    const isSpecial = ex.id.includes('warmup') || ex.id.includes('cool');
                    const history = exerciseHistory[ex.id];
                    const currentExerciseData = sessionData[ex.id] || [];
                    
                    return (
                      <GlassCard key={ex.id} className={`border-white/10 p-5 ${isSpecial ? 'bg-slate-800/30' : ''}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-black text-white tracking-tighter">{ex.name}</h4>
                            <p className="text-[11px] text-slate-500 font-bold">{ex.notes}</p>
                          </div>
                          <div className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Layers size={10} />
                            {ex.sets} Sets
                          </div>
                        </div>

                        {!isSpecial && (
                          <div className="space-y-6">
                            <div className="flex gap-4 p-3 bg-slate-900/50 rounded-2xl border border-white/5">
                              <div className="flex-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Last Performance</p>
                                <p className="text-sm font-black text-slate-300">{history?.lastWeight || '--'} lbs x {history?.lastReps || '--'}</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              {currentExerciseData.map((set, setIdx) => (
                                <div key={setIdx} className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">
                                    {setIdx + 1}
                                  </div>
                                  <div className="flex-1">
                                    <input 
                                      type="number"
                                      placeholder="lbs"
                                      value={set.weight}
                                      onChange={(e) => {
                                        const newData = [...currentExerciseData];
                                        newData[setIdx] = { ...newData[setIdx], weight: e.target.value };
                                        setSessionData({ ...sessionData, [ex.id]: newData });
                                      }}
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-2 px-3 text-white font-black text-center focus:border-indigo-500 outline-none transition-all"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <input 
                                      type="number"
                                      placeholder="reps"
                                      value={set.reps}
                                      onChange={(e) => {
                                        const newData = [...currentExerciseData];
                                        newData[setIdx] = { ...newData[setIdx], reps: e.target.value };
                                        setSessionData({ ...sessionData, [ex.id]: newData });
                                      }}
                                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-2 px-3 text-white font-black text-center focus:border-indigo-500 outline-none transition-all"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {isSpecial && (
                          <div className="flex items-center gap-3 text-indigo-400">
                            <Timer size={18} />
                            <span className="font-black text-sm uppercase tracking-widest">{ex.targetReps} Duration</span>
                          </div>
                        )}
                      </GlassCard>
                    );
                  })}
                </div>
            </div>
        )}

        {view === 'history' && (
            <div className="min-h-full space-y-8 animate-in slide-in-from-right-6 duration-400 pb-32">
                 <h2 className="text-4xl font-black text-white tracking-tighter">Journal</h2>
                 
                 {logs.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-24 space-y-6">
                     <div className="w-24 h-24 bg-slate-900 rounded-[40px] flex items-center justify-center text-slate-800 border border-white/5">
                       <History size={48} />
                     </div>
                     <p className="text-slate-600 font-black text-xl">The journal is empty.</p>
                   </div>
                 ) : (
                   <div className="space-y-4">
                      {logs.map(log => (
                          <GlassCard key={log.id} className="py-6 border-white/5 space-y-4">
                              <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-4">
                                      <div className="w-2.5 h-12 bg-indigo-500 rounded-full" />
                                      <div>
                                          <p className="text-lg font-black text-white tracking-tight leading-tight">{log.templateName}</p>
                                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                            {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                          </p>
                                      </div>
                                  </div>
                                  <button 
                                    onClick={async () => { if(confirm("Delete entry?")) await deleteDoc(doc(db, 'artifacts', appId, 'users', FIXED_USER_ID, 'logs', log.id)); }}
                                    className="text-slate-800 hover:text-rose-500 p-2"
                                  >
                                      <Trash2 size={20}/>
                                  </button>
                              </div>
                              
                              {log.performance && (
                                <div className="space-y-2 pt-2">
                                  {Object.entries(log.performance).slice(0, 3).map(([id, sets]) => {
                                    const exName = WORKOUT_TEMPLATES.flatMap(t => t.exercises).find(e => e.id === id)?.name || id;
                                    const populatedSets = sets.filter(s => s.weight || s.reps);
                                    if (populatedSets.length === 0) return null;

                                    return (
                                      <div key={id} className="text-[10px] bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                        <span className="text-slate-500 block truncate font-black mb-1">{exName}</span>
                                        <div className="flex flex-wrap gap-2">
                                          {populatedSets.map((s, idx) => (
                                            <span key={idx} className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md font-bold">
                                              {s.weight}x{s.reps}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                          </GlassCard>
                      ))}
                   </div>
                 )}
            </div>
        )}

        {view === 'log_weight' && (
            <div className="min-h-full space-y-16 pt-4 flex flex-col items-center animate-in slide-in-from-bottom-10 duration-400 pb-10">
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

                 <div className="w-full mt-auto">
                   <PrimaryButton onClick={async () => {
                       const val = (document.getElementById('weight-input') as HTMLInputElement).value;
                       if (!val) return;
                       await addDoc(collection(db, 'artifacts', appId, 'users', FIXED_USER_ID, 'weights'), {
                           date: new Date().toISOString(),
                           weight: parseFloat(val)
                       });
                       setView('dashboard');
                   }}>
                     SAVE WEIGHT
                   </PrimaryButton>
                 </div>
            </div>
        )}
      </div>

      {/* Persistent Bottom Navigation */}
      {!activeTemplate && (
          <nav className="fixed bottom-0 left-0 w-full bg-slate-950/80 backdrop-blur-2xl border-t border-white/5 py-6 px-10 flex justify-between items-center z-50">
              <button 
                onClick={() => setView('dashboard')}
                className={`flex flex-col items-center gap-1.5 transition-all ${view === 'dashboard' ? 'text-indigo-400 scale-110' : 'text-slate-600'}`}
              >
                  <LayoutDashboard size={22} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
              </button>
              <button 
                onClick={() => setView('insights')}
                className={`flex flex-col items-center gap-1.5 transition-all ${view === 'insights' ? 'text-indigo-400 scale-110' : 'text-slate-600'}`}
              >
                  <LineChart size={22} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Insights</span>
              </button>
              <button 
                onClick={() => setView('history')}
                className={`flex flex-col items-center gap-1.5 transition-all ${view === 'history' ? 'text-indigo-400 scale-110' : 'text-slate-600'}`}
              >
                  <History size={22} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Journal</span>
              </button>
          </nav>
      )}
    </div>
  );
}