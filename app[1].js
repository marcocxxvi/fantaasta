/* =========================================================================
   LAVAGNA ASTA FANTACALCIO
   -------------------------------------------------------------------------
   App React "senza build": Babel Standalone trasforma questo JSX nel
   browser al caricamento della pagina, quindi non serve npm/webpack.

   Dati condivisi tramite Firebase Firestore (vedi firebase-config.js):
   - collezione "players", un documento per ogni giocatore
   - nessun realtime: i dati si caricano all'apertura della pagina e con
     il pulsante "Aggiorna"; ogni modifica viene scritta subito su Firestore
     (auto-salvataggio, nessun pulsante "Salva")
   ========================================================================= */

const { useState, useEffect, useMemo, useCallback, useRef } = React;

const ROLES = [
  { key: "POR", label: "Portieri", num: 1 },
  { key: "DIF", label: "Difensori", num: 2 },
  { key: "CEN", label: "Centrocampisti", num: 3 },
  { key: "ATT", label: "Attaccanti", num: 4 },
];

const CATEGORIES = ["Top", "Semi Top", "Chicco Colpo", "Evitare"];

const PLAYERS_COLLECTION = "players";

// -------------------------------------------------------------------------
// Utility
// -------------------------------------------------------------------------

// Formatta una data in "dd/mm/yyyy hh:mm"
function formatDateTime(date) {
  if (!date) return "—";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Chiede/recupera il nome utente salvato su questo dispositivo (solo locale,
// serve solo per etichettare "chi ha modificato" un giocatore)
function getStoredUserName() {
  return window.localStorage.getItem("fanta_username") || "";
}
function setStoredUserName(name) {
  window.localStorage.setItem("fanta_username", name);
}

// -------------------------------------------------------------------------
// Accesso ai dati (Firestore)
// -------------------------------------------------------------------------

async function fetchAllPlayers() {
  const snapshot = await db.collection(PLAYERS_COLLECTION).get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || "",
      role: data.role || "POR",
      category: data.category || "",
      price: typeof data.price === "number" ? data.price : "",
      notes: data.notes || "",
      favorite: !!data.favorite,
      purchased: !!data.purchased,
      lastEditBy: data.lastEditBy || "",
      lastEditAt: data.lastEditAt && data.lastEditAt.toDate ? data.lastEditAt.toDate().toISOString() : null,
    };
  });
}

async function createPlayer({ name, role, userName }) {
  const docRef = await db.collection(PLAYERS_COLLECTION).add({
    name,
    role,
    category: "",
    price: "",
    notes: "",
    favorite: false,
    purchased: false,
    lastEditBy: userName,
    lastEditAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

async function updatePlayerFields(id, fields, userName) {
  await db.collection(PLAYERS_COLLECTION).doc(id).update({
    ...fields,
    lastEditBy: userName,
    lastEditAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

async function deletePlayerById(id) {
  await db.collection(PLAYERS_COLLECTION).doc(id).delete();
}

// -------------------------------------------------------------------------
// Componente: badge utente (in alto a destra nell'header)
// -------------------------------------------------------------------------
function UserBadge({ userName, onChangeUserName }) {
  const handleClick = () => {
    const next = window.prompt("Il tuo nome (per tracciare le modifiche):", userName || "");
    if (next && next.trim()) {
      onChangeUserName(next.trim());
    }
  };
  return (
    <button className="user-badge" onClick={handleClick} title="Cambia il tuo nome">
      👤 {userName || "Imposta nome"}
    </button>
  );
}

// -------------------------------------------------------------------------
// Componente: riga/card di un giocatore
// -------------------------------------------------------------------------
function PlayerRow({ player, userName, onUpdate, onDelete }) {
  // Stato locale per gli input di testo, così l'utente può scrivere
  // liberamente e il salvataggio avviene solo quando serve (blur/change)
  const [name, setName] = useState(player.name);
  const [notes, setNotes] = useState(player.notes);
  const [price, setPrice] = useState(player.price);

  useEffect(() => setName(player.name), [player.name]);
  useEffect(() => setNotes(player.notes), [player.notes]);
  useEffect(() => setPrice(player.price), [player.price]);

  const commitName = () => {
    if (name !== player.name) onUpdate(player.id, { name });
  };
  const commitNotes = () => {
    if (notes !== player.notes) onUpdate(player.id, { notes });
  };
  const commitPrice = () => {
    const numeric = price === "" ? "" : Number(price);
    if (numeric !== player.price) onUpdate(player.id, { price: numeric });
  };

  return (
    <div className={`player-row${player.purchased ? " purchased" : ""}`} data-cat={player.category}>
      <div className="player-row__top">
        <button
          className={`star-btn${player.favorite ? " active" : ""}`}
          title="Preferito"
          onClick={() => onUpdate(player.id, { favorite: !player.favorite })}
        >
          {player.favorite ? "★" : "☆"}
        </button>

        <input
          className="player-name-input"
          value={name}
          placeholder="Nome giocatore"
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
        />

        <select
          className="category-select"
          data-cat={player.category}
          value={player.category}
          onChange={(e) => onUpdate(player.id, { category: e.target.value })}
        >
          <option value="">Nessuna</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="player-row__mid">
        <div className="price-field">
          <label>Crediti</label>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={commitPrice}
          />
        </div>

        <label className="purchased-toggle">
          <input
            type="checkbox"
            checked={player.purchased}
            onChange={(e) => onUpdate(player.id, { purchased: e.target.checked })}
          />
          Acquistato
        </label>

        <button className="delete-btn" title="Elimina giocatore" onClick={() => onDelete(player.id)}>
          🗑
        </button>
      </div>

      <textarea
        className="notes-textarea"
        placeholder="Note libere…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={commitNotes}
      />

      <div className="player-row__footer">
        <span className="role-pill">{player.role}</span>
        <span>
          {player.lastEditBy ? `Modificato da ${player.lastEditBy} · ` : ""}
          {formatDateTime(player.lastEditAt)}
        </span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// Componente: form per aggiungere un giocatore al ruolo selezionato
// -------------------------------------------------------------------------
function AddPlayerForm({ role, userName, onAdd }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    await onAdd(trimmed, role);
    setName("");
    setBusy(false);
  };

  return (
    <form className="add-player-form" onSubmit={submit}>
      <input
        placeholder={`Aggiungi giocatore (${role})…`}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit" disabled={busy}>+ Aggiungi</button>
    </form>
  );
}

// -------------------------------------------------------------------------
// Componente principale
// -------------------------------------------------------------------------
function App() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState(getStoredUserName());
  const [activeRole, setActiveRole] = useState("POR");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Tutti");
  const [sortBy, setSortBy] = useState("name");

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllPlayers();
      setPlayers(data);
    } catch (err) {
      console.error(err);
      setError("Impossibile caricare i dati. Controlla la configurazione Firebase in firebase-config.js.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  useEffect(() => {
    if (!userName) {
      const next = window.prompt("Benvenuto! Come ti chiami? (per tracciare le modifiche)");
      if (next && next.trim()) {
        setStoredUserName(next.trim());
        setUserName(next.trim());
      }
    }
  }, []); // eslint-disable-line

  const handleChangeUserName = (name) => {
    setStoredUserName(name);
    setUserName(name);
  };

  // Aggiorna un giocatore: aggiornamento ottimistico locale + scrittura su Firestore
  const handleUpdate = useCallback(
    async (id, fields) => {
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, ...fields, lastEditBy: userName || p.lastEditBy, lastEditAt: new Date().toISOString() }
            : p
        )
      );
      try {
        await updatePlayerFields(id, fields, userName || "Anonimo");
      } catch (err) {
        console.error(err);
        setError("Errore nel salvataggio automatico. Controlla la connessione.");
      }
    },
    [userName]
  );

  const handleAdd = useCallback(
    async (name, role) => {
      try {
        const id = await createPlayer({ name, role, userName: userName || "Anonimo" });
        setPlayers((prev) => [
          ...prev,
          {
            id,
            name,
            role,
            category: "",
            price: "",
            notes: "",
            favorite: false,
            purchased: false,
            lastEditBy: userName || "Anonimo",
            lastEditAt: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.error(err);
        setError("Errore nell'aggiunta del giocatore.");
      }
    },
    [userName]
  );

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Eliminare questo giocatore dalla lavagna?")) return;
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    try {
      await deletePlayerById(id);
    } catch (err) {
      console.error(err);
      setError("Errore nell'eliminazione del giocatore.");
    }
  }, []);

  // Lista filtrata: se c'è una ricerca attiva, cerca su TUTTI i ruoli;
  // altrimenti mostra solo il ruolo attivo con i filtri di categoria.
  const visiblePlayers = useMemo(() => {
    let list = players;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    } else {
      list = list.filter((p) => p.role === activeRole);
      if (categoryFilter !== "Tutti") {
        list = list.filter((p) => p.category === categoryFilter);
      }
    }

    const sorted = [...list].sort((a, b) => {
      if (sortBy === "price") return (Number(b.price) || 0) - (Number(a.price) || 0);
      if (sortBy === "category") return (a.category || "zzz").localeCompare(b.category || "zzz");
      return a.name.localeCompare(b.name);
    });

    return sorted;
  }, [players, activeRole, categoryFilter, search, sortBy]);

  const isSearching = search.trim().length > 0;

  return (
    <>
      <header className="app-header">
        <div className="app-header__top">
          <h1 className="app-title">
            Lavagna Asta
            <small>Fantacalcio · 1000 crediti</small>
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="refresh-btn" onClick={loadPlayers} title="Ricarica i dati dal database">
              ⟳ Aggiorna
            </button>
            <UserBadge userName={userName} onChangeUserName={handleChangeUserName} />
          </div>
        </div>
        <input
          className="search-bar"
          placeholder="Cerca un giocatore in tutti i ruoli…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      {!isSearching && (
        <nav className="role-tabs">
          {ROLES.map((r) => (
            <button
              key={r.key}
              className={`role-tab${activeRole === r.key ? " active" : ""}`}
              onClick={() => setActiveRole(r.key)}
            >
              <span className="role-tab__num">{r.num}</span>
              <span>{r.label}</span>
              <span className="role-tab__count">
                {players.filter((p) => p.role === r.key).length}
              </span>
            </button>
          ))}
        </nav>
      )}

      {!isSearching && (
        <div className="controls-bar">
          {["Tutti", ...CATEGORIES].map((c) => (
            <button
              key={c}
              className={`filter-chip${categoryFilter === c ? " active" : ""}`}
              data-cat={c}
              onClick={() => setCategoryFilter(c)}
            >
              {c}
            </button>
          ))}
          <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Ordina: Nome</option>
            <option value="price">Ordina: Prezzo ideale</option>
            <option value="category">Ordina: Categoria</option>
          </select>
        </div>
      )}

      {!isSearching && (
        <AddPlayerForm role={activeRole} userName={userName} onAdd={handleAdd} />
      )}

      {error && (
        <div style={{ margin: "0 16px 12px", color: "#C4342F", fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div className="table-wrap">
        <div className="table-header">
          <span></span>
          <span>Nome</span>
          <span>Categoria</span>
          <span>Crediti</span>
          <span>Acquistato</span>
          <span>Note</span>
          <span>Ruolo</span>
          <span>Ultima modifica</span>
          <span></span>
        </div>

        {loading ? (
          <div className="empty-state">Caricamento…</div>
        ) : visiblePlayers.length === 0 ? (
          <div className="empty-state">
            {isSearching ? "Nessun giocatore trovato." : "Nessun giocatore in questa sezione. Aggiungine uno qui sopra."}
          </div>
        ) : (
          <div className="player-card-list">
            {visiblePlayers.map((p) => (
              <PlayerRow key={p.id} player={p} userName={userName} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// -------------------------------------------------------------------------
// Bootstrap dell'app
// -------------------------------------------------------------------------
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
