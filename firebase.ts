import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBe0DUWcgakCT8dor2Vodeca8jJyBeioV0",
  authDomain: "dsa-road-map.firebaseapp.com",
  projectId: "dsa-road-map",
  storageBucket: "dsa-road-map.firebasestorage.app",
  messagingSenderId: "91402709882",
  appId: "1:91402709882:web:7cfeea7d7f59bd2d0c04c3",
  measurementId: "G-ZV4CN28GRX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// const analytics = getAnalytics(app);

export { auth, db };
