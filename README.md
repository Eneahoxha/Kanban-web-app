# Kanban Task Manager

Un'applicazione web minimalista per la gestione delle task in stile Kanban, realizzata con **JavaScript**, **Tailwind CSS** e **DaisyUI**.  
Questo progetto permette agli utenti di organizzare, tracciare e gestire le task su diverse colonne (To Do, In Progress, ecc.) con funzionalità avanzate come **Drag & Drop**, la **persistenza dei dati** e un **conto alla rovescia visivo** per le scadenze.

---

## Caratteristiche Principali

- **Organizzazione Kanban:**  
  Struttura flessibile a colonne (To Do, In Progress, For Review, Done, Expired) con possibilità di aggiungere categorie personalizzate.

- **Drag & Drop Interattivo:**  
  Sposta facilmente le task tra le colonne grazie al Drag & Drop nativo.

- **Persistenza dei Dati:**  
  Tutte le task e le categorie sono salvate localmente nel browser tramite **localStorage** e ricaricate automaticamente.

- **Conto alla Rovescia Dinamico:**  
  Le task con data di scadenza mostrano un conto alla rovescia in tempo reale, formattato in giorni, ore, minuti e secondi.

- **Sistema di Allerta Visivo:**  
  Il colore delle task cambia automaticamente in base alla vicinanza della scadenza:  
  - Verde: scadenza lontana (oltre 7 giorni)  
  - Giallo: scadenza vicina (entro 7 giorni)  
  - Rosso: task scaduta o spostata nella colonna "Expired"

- **Modali Usabili:**  
  Interfacce pulite per l'aggiunta di task e categorie, ottimizzate per l'usabilità e il centraggio.

- **Modifica ed Eliminazione:**  
  Funzionalità per modificare il titolo di una task e eliminarla con conferma.

---

## Stack Tecnologico

| Componente       | Tecnologia       | Descrizione |
|-----------------|-----------------|------------|
| Logica           | JavaScript (ES6+) | Gestione della creazione di task, Drag & Drop, conto alla rovescia e persistenza dei dati |
| Struttura        | HTML5           | Struttura base del progetto |
| Stile & Layout   | Tailwind CSS    | Framework utility-first per styling rapido e responsive |
| Componenti UI    | DaisyUI         | Plugin per Tailwind che fornisce modali, bottoni, cards, ecc. |
| Icone            | Bootstrap Icons | Iconografia per azioni (modifica, elimina, scadenze) |

---

## Istruzioni per l'Avvio

### A. Esecuzione Semplice (Browser)
1. Scarica tutti i file (`index.html`, `main.js`, ecc.).  
2. Apri il file `index.html` direttamente nel browser.

### B. Esecuzione con Server Locale (Consigliato per Sviluppo)
Se hai Node.js installato, puoi utilizzare **Vite** per servire l'applicazione in locale con aggiornamento automatico:
# Istruzioni per l'Avvio

# Istruzioni per l'Avvio

Segui questi passaggi per installare le dipendenze e avviare l'applicazione in locale.

# 🧭 Istruzioni per l'Avvio

Segui questi passaggi per installare le dipendenze e avviare l'applicazione in locale.

---

## 1. Installa le Dipendenze

Per prima cosa, esegui il seguente comando nel tuo terminale per scaricare e installare tutti i pacchetti necessari:

```bash
npm install
2. Avvia l'Applicazione
Una volta completata l'installazione, puoi avviare l'applicazione con:

bash
Copy code
npm start
3. Accedi all'Applicazione
Dopo l'avvio, apri il browser e vai all'indirizzo:

arduino
Copy code
http://localhost:3000
