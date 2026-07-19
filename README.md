# Lavagna Asta Fantacalcio

Lavagna collaborativa semplicissima per preparare l'asta del fantacalcio in due.
Nessun database di calciatori, nessuna API: inserite voi manualmente i nomi.

**Stack:** HTML + CSS + React (via CDN, nessun build/npm) + Firebase Firestore
(solo per salvare i dati condivisi tra i due dispositivi).

---

## 1. Come funziona il salvataggio condiviso

Voi due aprite **lo stesso link**, ma ogni browser è indipendente: senza un
posto comune dove salvare i dati, le modifiche di uno non le vedrebbe l'altro.
La soluzione più semplice senza scrivere un backend è usare **Firebase
Firestore**: un database nel cloud, gratuito per questo utilizzo, che si
configura in 10 minuti senza scrivere codice server.

Ogni modifica (nome, prezzo, note, stella, checkbox) viene scritta subito su
Firestore. Quando l'altro ricarica la pagina (o preme "⟳ Aggiorna"), vede le
modifiche.

---

## 2. Creare il progetto Firebase (10 minuti, una volta sola)

1. Vai su https://console.firebase.google.com e accedi con un account Google.
2. Clicca **"Aggiungi progetto"**, dagli un nome (es. `fanta-asta`), avanti
   avanti fino a **Crea progetto**. Puoi disattivare Google Analytics, non
   serve.
3. Nel menu a sinistra vai su **Build > Firestore Database** e clicca
   **Crea database**.
   - Scegli la posizione (va bene quella europea di default, es. `eur3`).
   - Alla domanda sulle regole di sicurezza scegli **"Avvia in modalità di
     test"** (poi sistemiamo le regole al punto 4).
4. Vai su **Firestore Database > Regole** e sostituisci il contenuto con:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

   Clicca **Pubblica**.

   ⚠️ Nota: queste regole rendono il database scrivibile da chiunque conosca
   la configurazione. Va benissimo per un uso privato tra voi due (non ci
   sono dati sensibili, solo nomi di calciatori), ma non pubblicizzare le
   chiavi. Se in futuro vuoi più sicurezza, si può aggiungere un login con
   Firebase Authentication: fammi sapere e ti preparo anche quello.

5. Torna alla panoramica del progetto (icona ingranaggio in alto a sinistra
   > **Impostazioni progetto**). In basso, sotto "Le tue app", clicca
   sull'icona **`</>`** (Web) per registrare una nuova app web.
   - Dai un nickname (es. "lavagna-asta"), non serve Firebase Hosting.
   - Ti mostrerà un blocco `firebaseConfig = { apiKey: ..., ... }`: copia
     quei valori.

6. Apri il file **`firebase-config.js`** del progetto e incolla i valori al
   posto dei placeholder `INSERISCI_...`. Salva.

Fatto: da questo momento l'app legge/scrive su quel database.

---

## 3. Pubblicare su GitHub Pages

1. Crea un nuovo repository su GitHub (può essere privato o pubblico).
2. Carica tutti i file di questo progetto (`index.html`, `style.css`,
   `app.js`, `firebase-config.js`, `README.md`) nella root del repository.
3. Vai su **Settings > Pages** del repository.
4. In **Source** scegli **"Deploy from a branch"**, branch `main`, cartella
   `/ (root)`. Salva.
5. Dopo un minuto GitHub ti darà un link tipo:
   `https://tuonome.github.io/nome-repo/`
6. Condividi quel link con il tuo amico: è la vostra lavagna.

Ogni volta che modificate `index.html`/`style.css`/`app.js` e fate push su
`main`, GitHub Pages si aggiorna da solo in un minuto circa.

---

## 4. Uso durante l'asta

- Al primo accesso, ognuno di voi imposta il proprio nome (usato solo per
  "Ultima modifica"): resta salvato nel browser (`localStorage`), non va sul
  database.
- Aggiungete i giocatori manualmente dal box "Aggiungi giocatore" in ogni
  sezione di ruolo.
- Ogni modifica (nome, categoria, prezzo, note, stella, acquistato) si salva
  da sola: per i campi di testo/numero il salvataggio avviene quando si esce
  dal campo (tab/click altrove), per stella/categoria/checkbox è immediato.
- Premete **"⟳ Aggiorna"** in alto per vedere le modifiche fatte dall'altro
  (non è in tempo reale, va ricaricato).
- La barra di ricerca in alto cerca su tutti i ruoli insieme.
- I filtri per categoria e l'ordinamento valgono solo quando non state
  cercando (per non confondere le due modalità).

---

## 5. Struttura dei file

```
index.html           punto di ingresso, carica React/Firebase e i file sotto
style.css             tutto lo stile (palette, layout mobile-first)
app.js                componenti React (App, PlayerRow, AddPlayerForm, UserBadge)
firebase-config.js    le TUE chiavi Firebase (da compilare, vedi punto 2)
```

Non c'è alcun passaggio di build: apri semplicemente `index.html` (o il link
GitHub Pages) e l'app funziona, perché Babel trasforma il JSX direttamente
nel browser.

---

## 6. Se qualcosa non funziona

- Pagina bianca o "Caricamento…" che non finisce → apri la Console del
  browser (F12) e controlla l'errore: quasi sempre è `firebase-config.js`
  non compilato correttamente o le regole Firestore non pubblicate.
- "Impossibile caricare i dati" → controlla che il progetto Firestore sia
  stato creato e le regole di sicurezza pubblicate (punto 2.3-2.4).
- Le modifiche dell'altro non si vedono → ricordate di premere "⟳ Aggiorna"
  o ricaricare la pagina, non è automatico in tempo reale (come richiesto).
