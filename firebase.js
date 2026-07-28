// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {

getFirestore,
collection,
addDoc,
getDocs,
getDoc,
setDoc,
doc,
updateDoc,
deleteDoc,
increment,
serverTimestamp,
onSnapshot,
query,
orderBy

} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAJhjhcNzUSkgpFGT_qyaduicQMrIiGuWk",
  authDomain: "by-sann.firebaseapp.com",
  projectId: "by-sann",
  storageBucket: "by-sann.firebasestorage.app",
  messagingSenderId: "728626789243",
  appId: "1:728626789243:web:7e0f5fd23e1c1d4d7f9bde"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export {

db,
collection,
addDoc,
getDocs,
getDoc,
setDoc,
doc,
updateDoc,
deleteDoc,
increment,
serverTimestamp,
onSnapshot,
query,
orderBy

};