const { onValueUpdated } = require("firebase-functions/v2/database");
const axios = require("axios");

// --- CONFIGURATION ---
const EVOLUTION_BASE_URL = "https://your-api-url.com"; 
const INSTANCE_NAME = "SolarGuard";
const API_KEY = "YOUR_EVOLUTION_API_KEY";

exports.guardianWhatsAppWatcher = onValueUpdated("/stats", async (event) => {
  const data = event.data.after.val();

  if (!data) return null;

  // 1. THE LOGIC: Is it Raining? Is Guardian Active? Is Load High?
  if (data.hasRain && data.isGuardianActive && data.load > 1.0) {
    
    const phone = data.guardianPhone || "2348000000000"; 
    const cleanPhone = phone.replace(/\D/g, '');
    
    // 2. RANDOMIZED WARNINGS (No more "Pump" obsession)
    const warnings = [
      `⚠️ *ATTENTION KINGSLEY:* Heavy rain detected and your current usage is high (${data.load}kW). Please reduce the load now.`,
      `⚠️ *SOLARGUARD ALERT:* Storm conditions detected. Your power consumption is critically high at ${data.load}kW. Suggesting immediate shutdown of heavy appliances.`,
      `⚠️ *URGENT:* Weather risk detected above your roof. Power draw is currently ${data.load}kW. Protect your inverter by lowering the usage.`
    ];
    
    const randomMessage = warnings[Math.floor(Math.random() * warnings.length)];

    try {
      console.log(`Sending dynamic alert to ${cleanPhone}...`);
      
      await axios.post(`${EVOLUTION_BASE_URL}/message/sendText/${INSTANCE_NAME}`, {
        number: cleanPhone,
        text: randomMessage
      }, {
        headers: { 
          'apikey': API_KEY, 
          'Content-Type': 'application/json' 
        }
      });
      
      console.log("✅ Guardian Alert Sent Successfully!");
    } catch (err) {
      console.error("❌ WhatsApp Error:", err.response ? err.response.data : err.message);
    }
  }
  
  return null;
});