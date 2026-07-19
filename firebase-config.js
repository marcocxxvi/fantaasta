/*
  CONFIGURAZIONE FIREBASE
  =======================
  Chiavi del progetto "fanta-asta-4f67b".
*/

const firebaseConfig = {
  apiKey: "AIzaSyA9CjgWg5jmRG4EoLMGJ3Fn9Apezu784I0",
  authDomain: "fanta-asta-4f67b.firebaseapp.com",
  projectId: "fanta-asta-4f67b",
  storageBucket: "fanta-asta-4f67b.firebasestorage.app",
  messagingSenderId: "245290291255",
  appId: "1:245290291255:web:519a7d6505fbe7b1212fb2"
};

// Inizializza Firebase e rende disponibile il database a app.js
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
