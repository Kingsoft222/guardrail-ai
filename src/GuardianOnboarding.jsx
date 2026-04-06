import React, { useState } from 'react';
import { db } from './firebase'; 
import { ref, update } from "firebase/database";
import { MessageSquare, ShieldCheck, X, Phone } from 'lucide-react';

export default function GuardianOnboarding({ onClose }) { 
  const [phone, setPhone] = useState('');

  const handleActivate = () => {
    if (!phone || phone.length < 5) {
      return alert("Oga, please enter a valid WhatsApp number!");
    }

    // 1. Sync with Firebase 'stats' node
    // This tells the Cloud that Oga Kingsley is now guarded
    update(ref(db, 'stats'), {
      guardianPhone: phone,
      isGuardianActive: true,
      lastActivation: Date.now()
    });
    
    // 2. THE STABLE WHATSAPP LINK (No more 404)
    // Replace '2348123456789' with your actual Bot/Business WhatsApp number
    const myBotNumber = "2348123456789"; 
    const cleanUserPhone = phone.replace(/\D/g, ''); 
    const msg = encodeURIComponent(`Oga, activate my SolarGuard Guardian for: ${cleanUserPhone}`);
    
    // Using the most stable API format for mobile and web
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${myBotNumber}&text=${msg}`;
    
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
      <div className="bg-[#11141b] w-full max-w-sm rounded-[50px] border border-white/10 p-10 relative shadow-[0_0_60px_rgba(34,197,94,0.15)]">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-8 right-8 text-white/20 hover:text-white transition-all active:scale-90"
        >
          <X size={28} />
        </button>
        
        <div className="flex flex-col items-center text-center">
          {/* Animated Shield Icon */}
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20 shadow-inner">
            <ShieldCheck size={48} className="text-green-400 animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-black italic tracking-tight mb-3 uppercase text-white">
            Activate Guardian
          </h2>
          <p className="text-[11px] text-white/40 mb-10 px-4 leading-relaxed font-bold uppercase tracking-[0.2em]">
            Direct WhatsApp alerts for <span className="text-white">Rain Storms</span> & <span className="text-white">High Inverter Load</span>
          </p>

          {/* Phone Input Field */}
          <div className="w-full relative mb-8">
            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="tel" 
              placeholder="+234 812..." 
              className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-center text-lg font-black placeholder:text-white/5 focus:border-green-500/50 focus:bg-white/10 transition-all outline-none"
              onChange={(e) => setPhone(e.target.value)}
              value={phone}
            />
          </div>

          {/* Activation Button */}
          <button 
            onClick={handleActivate}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-black py-6 rounded-[30px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl shadow-green-500/30"
          >
            <MessageSquare size={20} fill="black" />
            SECURE MY ROOF
          </button>
          
          <p className="mt-8 text-[9px] text-white/20 font-bold uppercase tracking-widest">
            Instant sync with SolarGuard Cloud
          </p>
        </div>
      </div>
    </div>
  );
}