
import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBlFxQvk8b0RtC6OI1q8_QwKdiKI5snFRo",
  authDomain: "invitesann-14037.firebaseapp.com",
  projectId: "invitesann-14037",
  storageBucket: "invitesann-14037.firebasestorage.app",
  messagingSenderId: "316287076932",
  appId: "1:316287076932:web:eddc45a72ab2aaafda0a11",
  measurementId: "G-CGMQS2VX9X"
};

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export {
  app,
  db,
  auth,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  setDoc,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
