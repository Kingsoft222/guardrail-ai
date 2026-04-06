import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Sky, Cloud, Stars } from '@react-three/drei';
import { Zap, LayoutGrid, BarChart3, Droplets, Sun, Moon, Monitor, CloudRain, Bell, ChevronRight, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { ref, onValue, update } from "firebase/database"; 
import { db } from './firebase'; 
import GuardianOnboarding from './GuardianOnboarding';

// --- Weather Engine (3D Sky Logic) ---
function WeatherSystem({ stormLevel, isNight, isGoldenHour, hasRain, isDashboardOpen }) {
  const cloudsRef = useRef();
  const lightningRef = useRef();
  
  useFrame((state) => {
    if (cloudsRef.current) cloudsRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 2;
    if (hasRain && lightningRef.current) {
      lightningRef.current.intensity = Math.random() > 0.94 ? 40 : 0;
    }
  });

  const cloudColor = isNight ? "#1e293b" : (hasRain ? "#1a202c" : "#cbd5e1");
  const cloudOpacity = isDashboardOpen ? 0.1 : (hasRain ? 1 : 0.4);

  return (
    <>
      <Sky 
        sunPosition={isNight ? [0, -10, -1] : (isGoldenHour ? [10, 0.5, 5] : [10, 10, 10])} 
        turbidity={hasRain ? 40 : 0.1}
        rayleigh={isNight ? 0.1 : 2}
      />
      {!isNight && (
        <group position={[4, 5, -5]}>
          <pointLight ref={lightningRef} position={[-5, 5, 2]} color="#cae9ff" intensity={0} />
        </group>
      )}
      <group ref={cloudsRef}>
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <Cloud opacity={cloudOpacity} speed={0.4} width={20} segments={40} position={[-2, 1, -2]} color={cloudColor} />
        </Float>
      </group>
      {isNight && <Stars radius={100} factor={4} speed={1} count={6000} />}
    </>
  );
}

export default function App() {
  const [hasRain, setHasRain] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [isGoldenHour, setIsGoldenHour] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(true); 
  const [locationName, setLocationName] = useState("Your Home");
  const [stormLevel, setStormLevel] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // --- LIVE DATA FROM FIREBASE ---
  const [battery, setBattery] = useState(84);
  const [totalWatts, setTotalWatts] = useState(0.1);
  const [isGuardianActive, setIsGuardianActive] = useState(false);

  useEffect(() => {
    const statsRef = ref(db, 'stats');
    const unsubscribe = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBattery(data.battery || 84);
        setTotalWatts(data.load || 0.1);
        setIsGuardianActive(data.isGuardianActive || false);
      }
    });

    const API_KEY = "34258ccaf916e18b22be44cb96ab063c";
    const fetchWeather = async (lat, lon) => {
      const hour = new Date().getHours();
      setIsNight(hour >= 19 || hour <= 6);
      setIsGoldenHour(hour === 18);
      try {
        const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
        const clouds = res.data.clouds.all;
        const weatherId = res.data.weather[0].id; 
        const humidity = res.data.main.humidity;
        setStormLevel(clouds);
        setLocationName(res.data.name);
        
        const rainDetected = (weatherId < 600) && (clouds > 90) && (humidity > 80);
        setHasRain(rainDetected);

        const statusRef = ref(db, 'stats');
        update(statusRef, { 
          hasRain: rainDetected,
          clouds: clouds,
          lastSync: new Date().toISOString()
        });

      } catch (err) { console.log("Re-syncing Sky...") }
    };

    navigator.geolocation.getCurrentPosition((pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude));
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude));
    }, 60000); 

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getSaviourMessage = () => {
    if (hasRain) {
      return totalWatts > 1.0 
        ? `⚠️ ALERT: Heavy rain detected above your roof. YOUR USAGE IS HIGH (${totalWatts}kW). Please reduce load immediately!` 
        : `Monitoring active. Heavy rain detected, but your current power usage is at a safe level.`;
    }
    if (stormLevel > 75) {
      return `The sky is darkening above your roof. Consider lowering usage in case of a sudden storm.`;
    }
    return isNight 
      ? `System stable. The night is peaceful above your roof. Monitoring your battery and environment.`
      : `Optimal performance. The sky is clear and your solar production is currently at peak.`;
  };

  return (
    <div className={`min-h-screen transition-all duration-1000 ${hasRain ? 'bg-black' : 'bg-[#05070a]'} p-6 flex flex-col overflow-hidden text-white font-sans`}>
      
      {/* 3D Scene Layer */}
      <div className={`absolute top-0 left-0 w-full transition-all duration-1000 ${isDashboardOpen ? 'h-[25vh] opacity-30' : 'h-[75vh]'}`}>
        <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
          <ambientLight intensity={isNight ? 0.05 : 1.5} />
          <Suspense fallback={null}>
            <WeatherSystem isNight={isNight} isGoldenHour={isGoldenHour} hasRain={hasRain} isDashboardOpen={isDashboardOpen} stormLevel={stormLevel} />
          </Suspense>
        </Canvas>
      </div>

      <div className="relative z-10 flex flex-col gap-6 h-full">
        {/* APP HEADER */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Kingsley" className="w-10 h-10 rounded-full bg-slate-800 border border-white/10" alt="user" />
            <div>
              <p className="text-[10px] opacity-50 font-bold uppercase tracking-wider">Saviour Mode</p>
              <h2 className="text-sm font-bold">Kingsley Aniukwu</h2>
            </div>
          </div>
          <Bell size={20} className="opacity-40" />
        </div>

        {isDashboardOpen ? (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
            
            {/* SAVIOUR VOICE BOX */}
            <div className={`p-5 rounded-[30px] border-l-8 shadow-2xl transition-all duration-500 ${hasRain && totalWatts > 1.0 ? 'bg-red-900/60 border-red-500 animate-pulse' : 'bg-white/5 border-amber-500'}`}>
               <p className="text-sm italic font-bold">"{getSaviourMessage()}"</p>
            </div>

            {/* ONBOARDING TRIGGER BOX */}
            <div 
              onClick={() => setShowOnboarding(true)}
              className={`p-5 rounded-[30px] border transition-all cursor-pointer flex justify-between items-center shadow-lg ${isGuardianActive ? 'bg-green-500/10 border-green-500/30' : 'bg-gradient-to-r from-gray-700 to-gray-800 border-white/10'}`}
            >
               <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${isGuardianActive ? 'bg-green-500/20' : 'bg-white/10'}`}>
                    <ShieldCheck size={22} className={isGuardianActive ? 'text-green-400' : 'text-white/40'} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black italic uppercase tracking-tight">
                      {isGuardianActive ? 'Guardian Active' : 'Upgrade Pro Version'}
                    </h3>
                    <p className="text-[10px] opacity-60 font-bold">
                      {isGuardianActive ? 'WhatsApp Alerts Enabled' : 'WhatsApp Guardian Inactive'}
                    </p>
                  </div>
               </div>
               <ChevronRight size={18} className="opacity-40" />
            </div>

            {/* LIVE METRICS */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-[#11141b] p-6 rounded-[30px] border border-white/5 text-center shadow-xl">
                  <p className="text-3xl font-black italic tracking-tighter">{battery}%</p>
                  <p className="text-[10px] opacity-40 font-bold uppercase mt-1">Inverter Battery</p>
               </div>
               <div className="bg-[#11141b] p-6 rounded-[30px] border border-white/5 text-center shadow-xl">
                  <p className="text-3xl font-black italic tracking-tighter">{totalWatts}<span className="text-xs">kW</span></p>
                  <p className="text-[10px] opacity-40 font-bold uppercase mt-1">Total Load</p>
               </div>
            </div>

            {/* DEVICE GRID */}
            <div className="grid grid-cols-2 gap-4">
               <div className={`p-6 rounded-[35px] border transition-all ${totalWatts > 1.0 ? 'bg-blue-600/20 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-[#11141b] border-white/5'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-white/5 rounded-xl">
                      <Droplets className={totalWatts > 1.0 ? 'text-blue-400' : 'text-white/20'} size={24} />
                    </div>
                  </div>
                  <p className="text-[13px] font-black uppercase mb-1 tracking-tight">Water Pump</p>
                  <p className="text-[10px] opacity-40 font-bold">• {totalWatts > 1.0 ? 'RUNNING' : 'OFF'}</p>
               </div>
               <div className="bg-[#11141b] p-6 rounded-[35px] border border-white/5">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-white/5 rounded-xl">
                      <Monitor className="text-white/20" size={24} />
                    </div>
                  </div>
                  <p className="text-[13px] font-black uppercase mb-1 tracking-tight">Smart TV</p>
                  <p className="text-[10px] opacity-40 font-bold">• STANDBY</p>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 mt-[35vh] animate-in fade-in duration-500">
            <div className="bg-white/5 backdrop-blur-[60px] p-10 rounded-[60px] border border-white/10 flex justify-between items-end">
              <div>
                <span className="text-8xl font-black tracking-tighter italic">{battery}%</span>
                <p className="text-[11px] opacity-50 uppercase font-black mt-2 tracking-[0.3em]">Battery Health</p>
              </div>
              <Sun className="text-amber-300" size={40} />
            </div>
            <div className={`p-10 rounded-[45px] border-l-8 shadow-2xl backdrop-blur-md ${hasRain ? 'bg-red-900/40 border-red-500' : 'bg-black/40 border-amber-500'}`}>
               <p className="text-2xl italic font-bold leading-tight">"{getSaviourMessage()}"</p>
            </div>
          </div>
        )}

        {/* PREMIUM FOOTER NAV */}
        <div className="mt-auto flex justify-around items-center bg-[#11141b]/95 py-7 rounded-[50px] border border-white/5 mb-2 shadow-2xl">
          <div onClick={() => setIsDashboardOpen(false)} className="cursor-pointer">
            <Zap size={24} className={!isDashboardOpen ? "text-white" : "text-white/30"} />
          </div>
          <div onClick={() => setHasRain(!hasRain)} className="cursor-pointer">
             <CloudRain size={24} className={hasRain ? "text-blue-400" : "text-white/30"} />
          </div>
          <div className="p-4 bg-white/5 rounded-3xl border border-white/10" onClick={() => setIsDashboardOpen(true)}>
             <LayoutGrid size={24} className={isDashboardOpen ? "text-amber-500" : "text-white"} />
          </div>
          <BarChart3 size={24} className="text-white/30" />
        </div>
      </div>

      {/* ONBOARDING MODAL */}
      {showOnboarding && <GuardianOnboarding onClose={() => setShowOnboarding(false)} />}
      
      {/* GOOGLE INFO BOX */}
      <div style={{
        position: 'fixed',
        bottom: '85px',
        left: '20px',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        color: '#f8fafc',
        padding: '12px',
        borderRadius: '12px',
        fontSize: '11px',
        maxWidth: '240px',
        zIndex: 1000,
        border: '1px solid #334155'
      }}>
        <strong style={{ color: '#38bdf8' }}>SolarGuard Platform</strong><br/>
        Protecting solar systems via real-time weather monitoring and automated WhatsApp alerts.
      </div>
    </div>
  );
}