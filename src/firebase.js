import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Added Auth imports

const firebaseConfig = {
  apiKey: "AIzaSyCszjVhHIvhj6TEm1h_sbFWHYVUwkiqeow",
  authDomain: "saviour-app-f0afe.firebaseapp.com",
  databaseURL: "https://saviour-app-f0afe-default-rtdb.firebaseio.com",
  projectId: "saviour-app-f0afe",
  storageBucket: "saviour-app-f0afe.firebasestorage.app",
  messagingSenderId: "297523924342",
  appId: "1:297523924342:web:38c1188928716bea62fe57",
  measurementId: "G-P7WMLB8L90"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the database so App.jsx can use it
export const db = getDatabase(app);

// Export Auth and Google Provider for the Onboarding form
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export default app;