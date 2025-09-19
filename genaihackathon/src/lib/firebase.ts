
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "skillsculptor-53ylh",
  appId: "1:707507060238:web:501fc11de216d9a9fd465f",
  storageBucket: "skillsculptor-53ylh.firebasestorage.app",
  apiKey: "AIzaSyC2sw9ayBvW-jwfYFmMQi79Hl0rlYKJl4Q",
  authDomain: "skillsculptor-53ylh.web.app",
  measurementId: "",
  messagingSenderId: "707507060238"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app, 'default');
const storage = getStorage(app);


export { app, auth, db, storage };
