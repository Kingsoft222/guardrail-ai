const { onValueUpdated } = require("firebase-functions/v2/database");
const logger = require("firebase-functions/logger");
const axios = require("axios");

// Hardcoded for absolute reliability
const BOT_TOKEN = "8753203495:AAHJySXwWYDbQJAL73aXE3Kk-JLPR9Rb4xs";
const CHAT_ID = "5544479907";

exports.solarGuardGuardian = onValueUpdated("/stats", async (event) => {
    const data = event.data.after.val();
    if (!data) return null;

    logger.info("Guardian checking data...", data);

    const isRaining = data.hasRain === true;
    const currentLoad = parseFloat(data.load) || 0;

    if (isRaining) {
        let alertMsg = "";
        
        if (currentLoad > 1.0) {
            alertMsg = `⚠️ *URGENT ALERT*\nLoad: *${currentLoad}kW*\nStatus: *Heavy Rain* 🌧️\nPlease turn off heavy appliances!`;
        } else {
            alertMsg = "🌧️ *SolarGuard:* Rain detected. Monitoring your system...";
        }

        try {
            await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                chat_id: CHAT_ID,
                text: alertMsg,
                parse_mode: 'Markdown'
            });
            logger.info("✅ Alert sent to Telegram!");
        } catch (err) {
            logger.error("❌ Telegram Post Error:", err.message);
        }
    }
    return null;
});