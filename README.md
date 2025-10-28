# 🗂️ Kanban Task Manager

Un'applicazione web **minimalista** per la gestione delle task in stile **Kanban**, realizzata con **JavaScript**, **Tailwind CSS** e **DaisyUI**.  
Questo progetto permette di **organizzare**, **tracciare** e **gestire** le attività su diverse colonne (To Do, In Progress, ecc.) con funzionalità avanzate come **Drag & Drop**, **persistenza dei dati** e **conto alla rovescia visivo** per le scadenze.

---

## 🚀 Caratteristiche Principali

- 🧩 **Organizzazione Kanban**  
  Struttura flessibile a colonne (To Do, In Progress, For Review, Done, Expired) con possibilità di aggiungere categorie personalizzate.

- 🎯 **Drag & Drop Interattivo**  
  Sposta facilmente le task tra le colonne grazie al **Drag & Drop** nativo.

- 💾 **Persistenza dei Dati**  
  Tutte le task e le categorie vengono salvate localmente nel browser tramite **localStorage** e ricaricate automaticamente al riavvio.

- ⏳ **Conto alla Rovescia Dinamico**  
  Le task con data di scadenza mostrano un **countdown in tempo reale**, formattato in giorni, ore, minuti e secondi.

- ⚠️ **Sistema di Allerta Visivo**  
  Il colore delle card cambia automaticamente in base alla scadenza:
  
  🟢 Verde → scadenza oltre 7 giorni  
  🟡 Giallo → scadenza entro 7 giorni  
  🔴 Rosso → task scaduta o nella colonna *Expired*

- 💬 **Modali Usabili e Responsive**  
  Interfacce pulite per aggiungere task e categorie, ottimizzate per l'usabilità.

- 📝 **Modifica ed Eliminazione**  
  Possibilità di modificare il titolo di una task o eliminarla con conferma.

---

## 🧠 Stack Tecnologico

| Componente       | Tecnologia         | Descrizione |
|------------------|-------------------|-------------|
| **Logica**       | JavaScript (ES6+) | Gestione di creazione, Drag & Drop, countdown e persistenza |
| **Struttura**    | HTML5             | Layout e struttura base del progetto |
| **Stile**        | Tailwind CSS      | Framework utility-first per uno styling veloce e responsive |
| **UI Components**| DaisyUI           | Plugin per Tailwind che fornisce modali, bottoni e cards |
| **Icone**        | Bootstrap Icons   | Iconografia per azioni (modifica, elimina, scadenze) |

---

## ⚙️ Istruzioni per l'Avvio

### 🅰️ Esecuzione Semplice (Browser)

1. Scarica tutti i file del progetto (`index.html`, `main.js`, ecc.).  
2. Apri **index.html** direttamente nel browser.

---

### 🅱️ Esecuzione con Server Locale (Consigliato per Sviluppo)

Se hai **Node.js** installato, puoi usare **Vite** per servire l’app localmente con aggiornamento automatico.

#### 1 Installa le Dipendenze
Nel terminale, esegui:

npm install
#### 2 Avvia l'Applicazione Dopo l'installazione
Nel terminale, esegui:

npm run dev

#### 3 Apri nel Browser
Una volta avviato, accedi all'applicazione su:
http://localhost:5173
