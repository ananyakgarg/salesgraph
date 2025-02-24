import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCvgm-PHCDhQ-Z6B-L5q7lZDv0nFpnGG5I",
  authDomain: "salesgraph-b3a41.firebaseapp.com",
  projectId: "salesgraph-b3a41",
  storageBucket: "salesgraph-b3a41.firebasestorage.app",
  messagingSenderId: "111013289112",
  appId: "1:111013289112:web:0bc74403262bb234ac44ed",
  measurementId: "G-9M1LS1GF89"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics only on client side
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, auth, db, storage, analytics };
