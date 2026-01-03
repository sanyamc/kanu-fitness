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
  Quote
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore, collection, doc, addDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";

// --- Configuration ---

// REPLACE THIS OBJECT with the one from your Firebase Console
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
  icon: React.ReactNode;
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
    name: 'Machine Focus A',
    type: 'strength',
    icon: <Dumbbell size={20} className="text-indigo-500" />,
    exercises: [
      { id: 'lp1', name: 'Leg Press', sets: 3, reps: '10-12', rest: '90s', notes: 'Don\'t lock knees.' },
      { id: 'cp1', name: 'Chest Press', sets: 3, reps: '10-12', rest: '60s', notes: 'Push with chest.' },
    ]
  },
  {
    id: 'strength_b',
    name: 'Machine Focus B',
    type: 'strength',
    icon: <TrendingUp size={20} className="text-emerald-500" />,
    exercises: [
      { id: 'ld1', name: 'Lat Pulldown', sets: 3, reps: '10-12', rest: '60s', notes: 'Squeeze back.' },
    ]
  },
  { id: 'yoga_flow', name: 'Restorative Yoga', type: 'yoga', icon: <Heart size={20} className="text-pink-500" />, duration: 30 },
  { id: 'cardio_zone2', name: 'Zone 2 Cardio', type: 'cardio', icon: <Activity size={20} className="text-orange-500" />, duration: 30 }
];

// --- Helper Components ---

const Card = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div onClick={onClick} className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = 'primary', className = "", disabled = false }: any) => {
  const base = "px-4 py-3 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant as keyof typeof variants]} ${className} ${disabled ? 'opacity-50' : ''}`}>
      {children}
    </button>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'log_workout' | 'log_weight' | 'history'>('dashboard');
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<WorkoutTemplate | null>(null);
  const [dailyQuote, setDailyQuote] = useState("");

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Using 'query' and 'orderBy' here to satisfy TypeScript and sort data
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
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hi, Kanu!</h1>
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <Calendar size={12} /> {new Date().toLocaleDateString()}
          </div>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
          <Trophy size={14} /> {logs.length}
        </div>
      </header>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex gap-3">
          <Quote className="shrink-0 opacity-50" size={24} />
          <p className="font-medium italic">"{dailyQuote}"</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4" onClick={() => setView('log_weight')}>
          <p className="text-slate-500 text-sm flex items-center gap-1"><Scale size={14}/> Weight</p>
          <p className="text-2xl font-bold text-slate-800">{weights[0]?.weight || '--'}</p>
        </Card>
        <Card className="p-4" onClick={() => setView('history')}>
          <p className="text-slate-500 text-sm flex items-center gap-1"><CheckCircle2 size={14}/> Recent</p>
          <p className="font-semibold text-slate-800 text-sm truncate">{logs[0]?.templateName || 'None yet'}</p>
        </Card>
      </div>

      <Button onClick={() => setView('log_workout')} className="w-full py-4 text-lg">
        <Plus size={24} /> Start Session
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto relative px-5 pt-8">
      {view === 'dashboard' && <Dashboard />}
      
      {view === 'log_workout' && !activeTemplate && (
        <div className="space-y-4">
            <button onClick={() => setView('dashboard')} className="flex items-center gap-1 text-slate-500 mb-4"><ArrowLeft size={18}/> Back</button>
            <h2 className="text-xl font-bold mb-4 text-slate-800">Choose Routine</h2>
            {WORKOUT_TEMPLATES.map(t => (
                <Card key={t.id} onClick={() => setActiveTemplate(t)} className="cursor-pointer active:scale-95 transition-transform">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-50 rounded-lg">{t.icon}</div>
                            <div>
                                <h3 className="font-bold text-slate-800">{t.name}</h3>
                                <p className="text-xs text-slate-500">{t.type}</p>
                            </div>
                        </div>
                        <ChevronRight className="text-slate-300" />
                    </div>
                </Card>
            ))}
        </div>
      )}

      {activeTemplate && (
          <div className="pb-20">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setActiveTemplate(null)} className="text-slate-500">Cancel</button>
                <h2 className="font-bold text-lg">{activeTemplate.name}</h2>
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
                  className="text-indigo-600 font-bold"
                >Finish</button>
              </div>
              <Card className="text-center py-10">
                  <div className="mb-4 inline-block p-4 bg-indigo-50 rounded-full">{activeTemplate.icon}</div>
                  <p className="text-slate-600 font-medium">Ready for your {activeTemplate.duration || 45} min session?</p>
              </Card>
          </div>
      )}

      {view === 'history' && (
          <div className="space-y-4">
               <button onClick={() => setView('dashboard')} className="flex items-center gap-1 text-slate-500 mb-4"><ArrowLeft size={18}/> Back</button>
               <h2 className="text-xl font-bold flex items-center gap-2"><History size={20}/> History</h2>
               {logs.map(log => (
                   <Card key={log.id}>
                       <div className="flex justify-between items-center">
                           <div>
                               <p className="font-bold text-slate-800">{log.templateName}</p>
                               <p className="text-xs text-slate-400">{new Date(log.date).toLocaleDateString()}</p>
                           </div>
                           <button onClick={async () => {
                               if(confirm("Delete entry?")) await deleteDoc(doc(db, 'artifacts', appId, 'users', user?.uid || '', 'logs', log.id));
                           }}>
                               <Trash2 size={16} className="text-slate-300 hover:text-red-400"/>
                           </button>
                       </div>
                   </Card>
               ))}
          </div>
      )}

      {view === 'log_weight' && (
          <div className="space-y-6 text-center pt-10">
               <button onClick={() => setView('dashboard')} className="flex items-center gap-1 text-slate-500 absolute top-8 left-5"><ArrowLeft size={18}/> Back</button>
               <h2 className="text-2xl font-bold">Log Weight</h2>
               <input type="number" step="0.1" placeholder="00.0" className="text-6xl font-bold text-center w-full bg-transparent border-b-2 border-indigo-100 focus:outline-none py-4" id="weight-input"/>
               <Button onClick={async () => {
                   const val = (document.getElementById('weight-input') as HTMLInputElement).value;
                   if (!user || !val) return;
                   await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'weights'), {
                       date: new Date().toISOString(),
                       weight: parseFloat(val)
                   });
                   setView('dashboard');
               }} className="w-full">Save Weight</Button>
          </div>
      )}
    </div>
  );
}