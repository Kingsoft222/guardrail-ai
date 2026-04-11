import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, Cloud, Stars, Float } from '@react-three/drei';
// Explicit imports - essential for Vite 8 / Rolldown tree-shaking
import { Zap, LayoutGrid, BarChart3, CloudRain, ShieldCheck, ChevronRight } from 'lucide-react';
import { ref, onValue } from "firebase/database"; 
import { db } from './firebase'; 
import GuardianOnboarding from './GuardianOnboarding';

function WeatherSystem({ isNight, hasRain, precip }) {
  const cloudsRef = useRef();
  const visualRain = hasRain && precip > 0.5;

  useFrame((state) => { 
    if (cloudsRef.current) {
      cloudsRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 2; 
    }
  });

  return (
    <>
      <Sky 
        sunPosition={isNight ? [0, -10, -1] : [10, 10, 10]} 
        turbidity={visualRain ? 40 : 0.1} 
      />
      <group ref={cloudsRef}>
        <Float speed={2} floatIntensity={1}>
          <Cloud 
            opacity={visualRain ? 1 : 0.2} 
            speed={0.4} 
            width={20} 
            position={[-2, 2, -5]} 
            color={visualRain ? "#1a202c" : "#ffffff"} 
          />
        </Float>
      </group>
      {isNight && <Stars radius={100} factor={4} />}
    </>
  );
}

export default function App() {
  const [data, setData] = useState({ 
    battery: 0, 
    load: 0, 
    hasRain: false, 
    precip: 0, 
    userName: "Kingsley" 
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const statsRef = ref(db, 'stats');
    const unsubscribe = onValue(statsRef, (snapshot) => { 
      if (snapshot.exists()) setData(prev => ({ ...prev, ...snapshot.val() })); 
    });
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { unsubscribe(); clearInterval(timer); };
  }, []);

  // Time Logic: 6:30 AM is 390 mins, 6:30 PM is 1110 mins
  const totalMins = (currentTime.getHours() * 60) + currentTime.getMinutes();
  const isNight = totalMins < 390 || totalMins > 1110; 
  const firstName = (data.userName || "Kingsley").split(' ')[0];
  const isStorming = data.hasRain && data.precip > 0.5;

  return (
    <div className={`min-h-screen transition-all duration-1000 ${isStorming ? 'bg-black' : 'bg-[#05070a]'} p-6 flex flex-col text-white overflow-hidden`}>
      {/* 3D Weather Layer */}
      <div className="absolute top-0 left-0 w-full h-[35vh] opacity-40 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 12] }}>
          <ambientLight intensity={isNight ? 0.1 : 1} />
          <Suspense fallback={null}>
            <WeatherSystem isNight={isNight} hasRain={data.hasRain} precip={data.precip} />
          </Suspense>
        </Canvas>
      </div>

      <div className="relative z-10 flex flex-col gap-6 h-full flex-1">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-xl font-bold text-black">
              {firstName[0]}
            </div>
            <div>
              <p className="text-[10px] opacity-50 font-bold tracking-wider uppercase">Guardian AI</p>
              <h2 className="text-sm font-bold">Oga {firstName}</h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold opacity-60">
              {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </p>
            <p className="text-lg font-black italic text-amber-500">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className={`p-6 rounded-[35px] border-l-8 transition-all duration-500 shadow-xl ${isStorming && data.load > 1.5 ? 'bg-red-900/40 border-red-500 animate-pulse' : 'bg-white/5 border-amber-500'}`}>
           <p className="text-lg italic font-bold leading-tight">
             "{isStorming 
                ? `Oga ${firstName}, rain is heavy. ${isNight ? 'Watch battery!' : 'Production down.'}` 
                : isNight && data.load > 2.0 
                ? `Oga ${firstName}, night usage high! Save battery.` 
                : `Oga ${firstName}, system is stable!`}"
           </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#11141b] p-8 rounded-[40px] text-center shadow-lg border border-white/5">
            <p className="text-4xl font-black italic">{data.battery || 0}%</p>
            <p className="text-[10px] opacity-40 uppercase font-bold mt-2">Battery</p>
          </div>
          <div className="bg-[#11141b] p-8 rounded-[40px] text-center shadow-lg border border-white/5">
            <p className="text-4xl font-black italic">{data.load || 0}<span className="text-sm ml-1">kW</span></p>
            <p className="text-[10px] opacity-40 uppercase font-bold mt-2">Usage</p>
          </div>
        </div>

        {/* Settings Toggle */}
        <div 
          onClick={() => setShowOnboarding(true)} 
          className="p-5 rounded-[30px] border border-white/10 bg-white/5 flex justify-between items-center cursor-pointer active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-4">
            <ShieldCheck size={22} className="text-green-400" />
            <div>
              <h3 className="text-sm font-black italic uppercase text-white">Settings</h3>
              <p className="text-[10px] opacity-60 text-white">Guardian Active</p>
            </div>
          </div>
          <ChevronRight size={18} className="opacity-40 text-white" />
        </div>

        {/* Navigation Bar */}
        <div className="mt-auto flex justify-around items-center bg-[#11141b]/95 py-6 rounded-[50px] border border-white/5 mb-2 shadow-2xl">
          <Zap 
            size={24} 
            className={data.load > 1.5 ? "text-amber-400 animate-pulse" : "text-white/30"} 
          />
          <CloudRain 
            size={24} 
            className={isStorming ? "text-blue-400" : "text-white/30"} 
          />
          <div className="p-4 bg-white/5 rounded-3xl border border-white/10 shadow-inner">
            <LayoutGrid size={24} className="text-amber-500" />
          </div>
          <BarChart3 size={24} className="text-white/30" />
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && <GuardianOnboarding onClose={() => setShowOnboarding(false)} />}
    </div>
  );
}