import React, { useState } from 'react';
import { auth, provider } from '../firebase-config'; // Ensure this path matches your firebase config file
import { signInWithPopup } from 'firebase/auth';

const OnboardingForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    primaryPhone: '',
    secondaryPhone: '', 
    telegramHandle: '',
    systemSize: '',
    batteryType: 'Lithium'
  });

  // Manual Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Onboarding SolarGuard (Manual):", formData);
    alert("Guardian Activated! Check your Telegram for your welcome message.");
  };

  // Google Sign-In Logic
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Google User Onboarded:", user.displayName);
      alert(`Welcome, ${user.displayName}! Let's finish your setup.`);
      
      // Auto-fill available fields from Google
      setFormData({
        ...formData,
        fullName: user.displayName,
        email: user.email
      });
    } catch (error) {
      console.error("Google Auth Error:", error);
      alert("Google Sign-In failed. Please try the manual form.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="onboarding-wrapper" style={wrapperStyle}>
      <div style={containerStyle}>
        <h2 style={{ textAlign: 'center', color: '#f39c12', marginBottom: '10px' }}>SolarGuard Onboarding</h2>
        <p style={{ textAlign: 'center', color: '#aaa', marginBottom: '25px', fontSize: '14px' }}>
          Finalize your setup to activate your 24/7 Guardian.
        </p>

        {/* Google Continue Button */}
        <button onClick={handleGoogleSignIn} style={googleButtonStyle}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: '18px', marginRight: '10px' }} />
          Continue with Google
        </button>

        <div style={dividerStyle}><span>OR</span></div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" name="fullName" placeholder="Full Name" 
            value={formData.fullName} onChange={handleChange} required style={inputStyle} 
          />
          
          <input 
            type="email" name="email" placeholder="Email Address" 
            value={formData.email} onChange={handleChange} required style={inputStyle} 
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="tel" name="primaryPhone" placeholder="Phone 1 (Husband)" onChange={handleChange} required style={inputStyle} />
            <input type="tel" name="secondaryPhone" placeholder="Phone 2 (Wife)" onChange={handleChange} style={inputStyle} />
          </div>

          <input type="text" name="telegramHandle" placeholder="Telegram Handle (e.g. @oga_solar)" onChange={handleChange} required style={inputStyle} />

          <div style={{ display: 'flex', gap: '10px' }}>
            <select name="systemSize" onChange={handleChange} required style={selectStyle}>
              <option value="">System Size</option>
              <option value="1kva">1kVA - 2.5kVA</option>
              <option value="3.5kva">3.5kVA - 5kVA</option>
              <option value="7.5kva">7.5kVA+</option>
            </select>
            <select name="batteryType" onChange={handleChange} required style={selectStyle}>
              <option value="Lithium">Lithium (LiFePO4)</option>
              <option value="Tubular">Tubular / Gel</option>
              <option value="AGM">AGM / Lead Acid</option>
            </select>
          </div>

          <button type="submit" style={buttonStyle}>
            ACTIVATE MY GUARDIAN 🛡️
          </button>
        </form>
      </div>
    </div>
  );
};

// --- STYLES ---
const wrapperStyle = { backgroundColor: '#1a1a1a', padding: '40px 20px', minHeight: '100vh', color: '#fff' };
const containerStyle = { maxWidth: '500px', margin: 'auto', backgroundColor: '#2d2d2d', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#3d3d3d', color: '#fff', fontSize: '15px', width: '100%', outline: 'none' };
const selectStyle = { ...inputStyle, flex: 1 };
const buttonStyle = { padding: '16px', backgroundColor: '#f39c12', color: '#000', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', marginTop: '10px' };
const googleButtonStyle = { ...buttonStyle, backgroundColor: '#fff', color: '#757575', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '500', marginTop: '0', marginBottom: '20px' };
const dividerStyle = { textAlign: 'center', borderBottom: '1px solid #444', lineHeight: '0.1em', margin: '20px 0', color: '#777' };

export default OnboardingForm;