const { onValueUpdated } = require("firebase-functions/v2/database");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const axios = require("axios");
const logger = require("firebase-functions/logger");

if (!admin.apps.length) admin.initializeApp();

const BOT_TOKEN = "8753203495:AAHJySXwWYDbQJAL73aXE3Kk-JLPR9Rb4xs";
const WEATHER_API_KEY = "0e202c926afc44769bd165226260604";

// Official Nigeria Time Logic
const getNGTime = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 1)); // UTC + 1 (WAT)
};

exports.weatherBackgroundMonitor = onSchedule("every 10 minutes", async (event) => {
    try {
        const res = await axios.get(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=Enugu`);
        const { current } = res.data;
        const rainMM = current.precip_mm || 0;
        const isRaining = rainMM > 0.5 || current.condition.text.toLowerCase().includes('rain');
        
        await admin.database().ref('stats').update({ 
          hasRain: isRaining, 
          precip: rainMM, 
          lastSync: getNGTime().toISOString() 
        });
    } catch (err) { logger.error("Sync Error", err.message); }
});

exports.solarGuardGuardian = onValueUpdated("/stats", async (event) => {
    const after = event.data.after.val() || {};
    const before = event.data.before.val() || {};
    const firstName = (after.userName || "Kingsley").split(' ')[0];
    const telegramId = after.telegramChatId || "5544479907";
    const load = parseFloat(after.load) || 0;
    
    const now = getNGTime();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
    const hour = now.getHours();
    const mins = now.getMinutes();
    const totalMins = (hour * 60) + mins;

    const isDaylight = totalMins >= 390 && totalMins <= 1110; // 6:30 AM to 6:30 PM

    let message = "";
    let shouldSend = false;

    if (!isDaylight) {
        if (load > 2.0 && (!after.lastNightAlert || (Date.now() - after.lastNightAlert > 3600000))) {
            message = `🌙 *Oga ${firstName}, Night Watch Alert!*\n\nHigh usage (${load}kW) at ${timeStr}. We are on battery.\n\n*Warning:* Reduce load to save power!`;
            shouldSend = true;
            await event.data.after.ref.update({ lastNightAlert: Date.now() });
        }
    } else if (after.hasRain && parseFloat(after.precip) > 0.5) {
        if (!after.lastAlertSent || (Date.now() - after.lastAlertSent > 1800000)) {
            message = `⛈️ *Oga ${firstName}, Rain Alert!*\n\nProduction is dropping. Current load: ${load}kW.`;
            shouldSend = true;
        }
    }

    if (shouldSend && message) {
        try {
            await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { chat_id: telegramId, text: message, parse_mode: 'Markdown' });
            await event.data.after.ref.update({ lastAlertSent: Date.now() });
        } catch (err) { logger.error("Telegram Error", err.message); }
    }
});