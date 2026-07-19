/*
  CONFIGURAZIONE FIREBASE
  =======================
  Sostituisci i valori qui sotto con quelli del TUO progetto Firebase.
  Li trovi in: Console Firebase > Impostazioni progetto > Le tue app > Configurazione SDK.

  Istruzioni complete su come crearli sono nel README.md del repository.
*/

const firebaseConfig = {
  apiKey: "INSERISCI_API_KEY",
  authDomain: "INSERISCI_PROGETTO.firebaseapp.com",
  projectId: "INSERISCI_PROGETTO",
  storageBucket: "INSERISCI_PROGETTO.appspot.com",
  messagingSenderId: "INSERISCI_SENDER_ID",
  appId: "INSERISCI_APP_ID"
};

// Inizializza Firebase e rende disponibile il database a app.js
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
