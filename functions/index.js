const { onValueUpdated } = require("firebase-functions/v2/database");
const logger = require("firebase-functions/logger");
const axios = require("axios");

const BOT_TOKEN = "8753203495:AAHJySXwWYDbQJAL73aXE3Kk-JLPR9Rb4xs";
const CHAT_ID = "5544479907";

exports.solarGuardGuardian = onValueUpdated("/stats", async (event) => {
    const dataBefore = event.data.before.val() || {};
    const dataAfter = event.data.after.val() || {};
    
    const wasRaining = dataBefore.hasRain === true;
    const isRainingNow = dataAfter.hasRain === true;
    const currentLoad = parseFloat(dataAfter.load) || 0;
    const now = Date.now();
    const lastAlert = dataAfter.lastAlertSent || 0;
    const quietPeriod = 25 * 60 * 1000; 

    let alertMsg = "";
    let shouldSend = false;

    // CASE 1: RAIN START / CONTINUED RAIN WITH HIGH LOAD
    if (isRainingNow) {
        // Skip if we already alerted recently
        if (now - lastAlert < quietPeriod) return null;

        if (currentLoad > 1.0) {
            alertMsg = `🇳🇬 *SolarGuard Report*\n\n"Oga, it's really raining outside, and your energy usage is high (${currentLoad}kW). Can we step it down? Just to keep the batteries safe till the weather clears." ⛈️`;
            shouldSend = true;
        } else if (!dataAfter.initialRainAlertSent) {
            alertMsg = `"Oga, rain is falling, but your light usage is steady. I'm watching the system for you." 🌧️`;
            shouldSend = true;
        }
    } 
    // CASE 2: RECOVERY (Rain just stopped)
    else if (wasRaining && !isRainingNow) {
        alertMsg = `☀️ *Good News Oga!*\n\n"The rain has cleared up and the sun is coming back out. You can now use your heavy appliances safely. Energy production is improving!" ⚡`;
        shouldSend = true;
    }

    if (shouldSend) {
        try {
            await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                chat_id: CHAT_ID,
                text: alertMsg,
                parse_mode: 'Markdown'
            });
            
            await event.data.after.ref.update({ 
                lastAlertSent: now,
                initialRainAlertSent: isRainingNow 
            });
            logger.info("✅ Telegram notification sent.");
        } catch (err) {
            logger.error("Telegram Error", err.message);
        }
    }
    return null;
});