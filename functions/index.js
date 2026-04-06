const { onValueUpdated } = require("firebase-functions/v2/database");
const logger = require("firebase-functions/logger");
const axios = require("axios");

const BOT_TOKEN = "8753203495:AAHJySXwWYDbQJAL73aXE3Kk-JLPR9Rb4xs";
const CHAT_ID = "5544479907";

exports.solarGuardGuardian = onValueUpdated("/stats", async (event) => {
    const data = event.data.after.val();
    if (!data || !data.hasRain) return null;

    const load = parseFloat(data.load) || 0;
    
    // Nigerian Home "Sugar" Phrasing
    let alertMsg = "";
    if (load > 1.0) {
        alertMsg = `🇳🇬 *SolarGuard Report*\n\n"Oga, it's really raining outside, and your energy usage is high (${load}kW). Can we step it down? Just to keep the batteries safe till the weather clears." ⛈️`;
    } else {
        alertMsg = `"Oga, rain is falling, but your light usage is steady. I'm watching the system for you." 🌧️`;
    }

    try {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: alertMsg,
            parse_mode: 'Markdown'
        });
    } catch (err) {
        logger.error("Telegram Error", err.message);
    }
    return null;
});