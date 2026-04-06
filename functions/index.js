const { onValueUpdated } = require("firebase-functions/v2/database");
const axios = require("axios");

// --- CONFIGURATION ---
const EVOLUTION_BASE_URL = "https://your-api-url.com"; 
const INSTANCE_NAME = "SolarGuard";
const API_KEY = "YOUR_EVOLUTION_API_KEY";

exports.guardianWhatsAppWatcher = onValueUpdated("/stats", async (event) => {
  const data = event.data.after.val();
  const prevData = event.data.before.val();

  // Safety check: Ensure data exists
  if (!data || !prevData) return null;

  // LOGIC: It starts raining AND load is high AND guardian is opted-in
  if (data.hasRain && !prevData.hasRain && data.load > 1.0 && data.isGuardianActive) {
    
    const cleanPhone = data.guardianPhone.replace(/\D/g, '');
    const message = `⚠️ *OGA KINGSLEY!* Heavy rain detected above your roof and your load is ${data.load}kW. Abeg, shut down the pump!`;

    try {
      await axios.post(`${EVOLUTION_BASE_URL}/message/sendText/${INSTANCE_NAME}`, {
        number: cleanPhone,
        text: message
      }, {
        headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' }
      });
      console.log("Guardian Alert Sent Successfully!");
    } catch (err) {
      console.error("WhatsApp Error:", err.message);
    }
  }
  return null;
});