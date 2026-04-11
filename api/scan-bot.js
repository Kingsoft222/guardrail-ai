import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // Privacy check: Only runs if the secret token matches
  const { auth } = req.query;
  if (auth !== process.env.BOT_SECRET_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const lat = "4.8156"; // Port Harcourt
    const lon = "7.0498";
    const apiKey = process.env.OPENWEATHER_API_KEY; 
    
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    );
    const data = await weatherRes.json();

    // Update Firebase with your specific Bot Title
    await db.collection('weather_logs').doc('latest_scan').set({
      bot_title: "SolarGuard Weather Scan Bot",
      temp: data.main.temp,
      humidity: data.main.humidity,
      condition: data.weather[0].description,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "Online"
    });

    return res.status(200).json({ 
      success: true, 
      title: "SolarGuard Weather Scan Bot",
      message: "Data updated in Firebase" 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}