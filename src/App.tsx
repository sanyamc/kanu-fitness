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
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import type {User} from "firebase/auth";
import { getFirestore, collection, doc, addDoc, deleteDoc, onSnapshot, query } from "firebase/firestore";

// --- Configuration ---

// REPLACE THIS OBJECT with the one from your Firebase Console (Project Settings -> Web App)
const firebaseConfig = {
  apiKey: "AIzaSyCY_CqhZ8jP3IPeQi2ALvJOPwFdfjZ3Flc",
  authDomain: "kanu-fitness.firebaseapp.com",
  projectId: "kanu-fitness",
  storageBucket: "kanu-fitness.firebasestorage.app",
  messagingSenderId: "1036671364966",
  appId: "1:1036671364966:web:d5df00a193f0cf154862a7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "kanu-fit-v1"; // This creates a unique folder in your database

// --- Types & Constants ---

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
  exercises?: { id: string; name: string; weight: number; reps: number; setIndex: number }[];
};

type WeightEntry = {
  id: string;
  date: string;
  weight: number;
};

const QUOTES = [
  "Self-care is not selfish. You cannot serve from an empty vessel.",
  "The only bad workout is the one that didn't happen.",
  "Motivation is what gets you started. Habit is what keeps you going.",
  "Strong Mom, strong family.",
  "Do something today that your future self will thank you for.",
  "It's a slow process, but quitting won't speed it up.",
  "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't.",
  "You are doing a great job, Kanu!",
  "You are getting strong, Dodu!",
  "Every rep is a step closer to your goals.",
];

// Science-based beginner routine using machines for stability and safety
const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'strength_a',
    name: 'Machine Focus A (Legs/Push)',
    type: 'strength',
    exercises: [
      { id: 'lp1', name: 'Leg Press Machine', sets: 3, reps: '10-12', rest: '90s', notes: 'Keep feet flat. Don\'t lock knees.' },
      { id: 'cp1', name: 'Machine Chest Press', sets: 3, reps: '10-12', rest: '60s', notes: 'Focus on pushing with chest, not just arms.' },
      { id: 'le1', name: 'Leg Extensions', sets: 3, reps: '12-15', rest: '60s', notes: 'Squeeze your quads at the top.' },
      { id: 'sp1', name: 'Machine Shoulder Press', sets: 3, reps: '10-12', rest: '60s', notes: 'Sit tall, back against the pad.' },
      { id: 'ab1', name: 'Ab Crunch Machine', sets: 3, reps: '15-20', rest: '45s', notes: 'Exhale as you crunch down.' },
    ]
  },
  {
    id: 'strength_b',
    name: 'Machine Focus B (Pull/Hinge)',
    type: 'strength',
    exercises: [
      { id: 'lc1', name: 'Seated Leg Curl', sets: 3, reps: '10-12', rest: '90s', notes: 'Lower the weight slowly and controlled.' },
      { id: 'ld1', name: 'Lat Pulldown', sets: 3, reps: '10-12', rest: '60s', notes: 'Pull the bar to your upper chest.' },
      { id: 'sr1', name: 'Seated Cable Row', sets: 3, reps: '10-12', rest: '60s', notes: 'Pull your elbows back, squeeze shoulder blades.' },
      { id: 'gb1', name: 'Glute Bridges (Mat)', sets: 3, reps: '15-20', rest: '45s', notes: 'Great for hip stability and posture.' },
      { id: 'fp1', name: 'Cable Face Pulls', sets: 3, reps: '12-15', rest: '60s', notes: 'Pull towards your forehead, elbows high.' },
    ]
  },
  { id: 'yoga_flow', name: 'Restorative Yoga', type: 'yoga', duration: 30 },
  { id: 'cardio_zone2', name: 'Zone 2 Cardio (Elliptical/Bike)', type: 'cardio', duration: 30 }
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
    danger: "bg-red-50 text-red-600 hover:bg-red-100"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant as keyof typeof variants]} ${className} ${disabled ? 'opacity-50' : ''}`}>
      {children}
    </button>
  );
};

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'log_workout' | 'log_weight' | 'history'>('dashboard');
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<WorkoutTemplate | null>(null);
  const [dailyQuote, setDailyQuote] = useState("");

  // Handle Authentication
  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Sync Data with Firestore
  useEffect(() => {
    if (!user) return;

    const logsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'logs');
    const unsubLogs = onSnapshot(logsRef, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutLog));
      setLogs(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    const weightsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'weights');
    const unsubWeights = onSnapshot(weightsRef, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as WeightEntry));
      setWeights(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    return () => { unsubLogs(); unsubWeights(); };
  }, [user]);

  // Daily Quote Rotation
  useEffect(() => {
    const day = Math.floor(Date.now() / 86400000);
    setDailyQuote(QUOTES[day % QUOTES.length]);
  }, []);

  // --- Views ---

  const Dashboard = () => (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hi, Kanu!</h1>
          <p className="text-slate-500 text-xs">Your progress is safely stored in the cloud.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
          <Trophy size={14} /> {logs.length} Workouts
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
          <p className="text-slate-500 text-sm flex items-center gap-1"><Scale size={14} /> Weight</p>
          <p className="text-2xl font-bold text-slate-800">{weights[0]?.weight || '--'} <span className="text-sm font-normal text-slate-400">lbs</span></p>
        </Card>
        <Card className="p-4" onClick={() => setView('history')}>
          <p className="text-slate-500 text-sm flex items-center gap-1"><History size={14} /> Last Session</p>
          <p className="font-semibold text-slate-800 text-sm truncate">{logs[0]?.templateName || 'Ready to start?'}</p>
        </Card>
      </div>

      <Button onClick={() => setView('log_workout')} className="w-full py-4 text-lg">
        <Plus size={24} /> Log a Workout
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto relative px-5 pt-8">
      {view === 'dashboard' && <Dashboard />}

      {view === 'log_workout' && !activeTemplate && (
        <div className="space-y-4">
          <button onClick={() => setView('dashboard')} className="flex items-center gap-1 text-slate-500 mb-4 hover:text-indigo-600"><ArrowLeft size={18} /> Back to Home</button>
          <h2 className="text-xl font-bold mb-4">Choose a Routine</h2>
          {WORKOUT_TEMPLATES.map(t => (
            <Card key={t.id} onClick={() => setActiveTemplate(t)} className="cursor-pointer active:scale-[0.98] transition-all">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{t.name}</h3>
                  <p className="text-sm text-slate-500">{t.type === 'strength' ? 'Strength (Machine focus)' : `${t.duration} mins Flow`}</p>
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

          {activeTemplate.type === 'strength' ? (
            <div className="space-y-4">
              {activeTemplate.exercises?.map(ex => (
                <Card key={ex.id} className="p-4">
                  <h4 className="font-bold text-slate-800">{ex.name}</h4>
                  <p className="text-xs text-slate-500 mb-2">{ex.sets} sets • {ex.reps} reps</p>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Weight" className="w-1/2 p-2 bg-slate-50 rounded text-sm outline-none border border-transparent focus:border-indigo-200" />
                    <input type="number" placeholder="Reps" className="w-1/2 p-2 bg-slate-50 rounded text-sm outline-none border border-transparent focus:border-indigo-200" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-10">
              <Activity className="mx-auto text-indigo-200 mb-4" size={48} />
              <p className="text-slate-600 font-medium">Ready for your {activeTemplate.duration} minute session?</p>
            </Card>
          )}
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-4">
          <button onClick={() => setView('dashboard')} className="flex items-center gap-1 text-slate-500 mb-4"><ArrowLeft size={18} /> Back</button>
          <h2 className="text-xl font-bold">History</h2>
          {logs.map(log => (
            <Card key={log.id}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">{log.templateName}</p>
                  <p className="text-xs text-slate-400">{new Date(log.date).toLocaleDateString()} • {log.type}</p>
                </div>
                <button onClick={async () => {
                  if (confirm("Delete this entry?")) {
                    await deleteDoc(doc(db, 'artifacts', appId, 'users', user?.uid || '', 'logs', log.id));
                  }
                }}>
                  <Trash2 size={16} className="text-slate-300 hover:text-red-400 transition-colors" />
                </button>
              </div>
            </Card>
          ))}
          {logs.length === 0 && <p className="text-center text-slate-400 py-10">No sessions recorded yet.</p>}
        </div>
      )}

      {view === 'log_weight' && (
        <div className="space-y-6 text-center pt-10">
          <button onClick={() => setView('dashboard')} className="flex items-center gap-1 text-slate-500 absolute top-8 left-5"><ArrowLeft size={18} /> Back</button>
          <h2 className="text-2xl font-bold">Log Today's Weight</h2>
          <div className="flex items-center justify-center gap-2">
            <input type="number" step="0.1" placeholder="00.0" className="text-6xl font-bold text-center w-full bg-transparent border-b-2 border-indigo-100 focus:outline-none py-4 text-indigo-600" id="weight-input" />
            <span className="text-2xl font-bold text-slate-300">lbs</span>
          </div>
          <Button onClick={async () => {
            const val = (document.getElementById('weight-input') as HTMLInputElement).value;
            if (!user || !val) return;
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'weights'), {
              date: new Date().toISOString(),
              weight: parseFloat(val)
            });
            setView('dashboard');
          }} className="w-full py-4 shadow-xl">Save Entry</Button>
        </div>
      )}
    </div>
  );
}