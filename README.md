# Kanban Task Manager
Un'applicazione web minimalista per la gestione delle task in stile Kanban, realizzata con JavaScript puro, Tailwind CSS e DaisyUI. Questo progetto permette agli utenti di organizzare, tracciare e gestire le task su diverse colonne (To Do, In Progress, ecc.) con funzionalità avanzate come il Drag & Drop, la persistenza dei dati e un conto alla rovescia visivo per le scadenze.

Caratteristiche Principali
Organizzazione Kanban: Struttura flessibile a colonne (To Do, In Progress, For Review, Done, Expired) con possibilità di aggiungere categorie personalizzate.

Drag & Drop Interattivo: Sposta facilmente le task tra le colonne grazie al Drag & Drop nativo.

Persistenza dei Dati: Tutte le task e le categorie sono salvate localmente nel browser (tramite localStorage) e ricaricate automaticamente.

Conto alla Rovescia Dinamico: Le task con data di scadenza (due date) mostrano un conto alla rovescia in tempo reale, chiaramente formattato in giorni, ore, minuti e secondi.

Sistema di Allerta Visivo: Il colore delle task cambia automaticamente in base alla vicinanza della scadenza:

Verde/Successo: Scadenza lontana (oltre 7 giorni).

Giallo/Avviso: Scadenza vicina (entro 7 giorni).

Rosso/Errore: Task scaduta o spostata nella colonna "Expired".

Modali Usabili: Interfacce pulite per l'aggiunta di task e categorie, corrette per garantire un'ottima usabilità e centraggio.

Modifica ed Eliminazione: Funzionalità complete per modificare il titolo di una task e per eliminarla con conferma.


Stack Tecnologico
Questo progetto è un'applicazione "Vanilla" (senza framework complessi) costruita su tecnologie standard del web, potenziata con utility CSS moderne:

Componente,Tecnologia,Descrizione
Logica,JavaScript (ES6+),"Gestione della creazione di task, Drag & Drop, conto alla rovescia, e persistenza dei dati."
Struttura,HTML5,Struttura base del progetto.
Stile & Layout,Tailwind CSS,Framework utility-first per lo styling rapido e responsive.
Componenti UI,DaisyUI,"Plugin per Tailwind che fornisce componenti UI pre-disegnati (modali, bottoni, cards, etc.)."
Icone,Bootstrap Icons,"Iconografia per le azioni (modifica, elimina, scadenze)." 

Istruzioni per l'Avvio
Questo progetto è interamente basato su file statici (HTML, JS) con librerie caricate tramite CDN. Non richiede alcun processo di build o dipendenza Node.js per l'esecuzione, ma il package.json suggerisce l'uso di Vite per lo sviluppo locale, il che è consigliato.

A. Esecuzione Semplice (Browser)
Scarica tutti i file (index.html, main.js, etc.).

Apri il file index.html direttamente nel tuo browser.

B. Esecuzione con Server Locale (Consigliato per Sviluppo)
Se hai Node.js installato, puoi utilizzare Vite per servire l'applicazione in locale, il che è utile per lo sviluppo e l'aggiornamento in tempo reale (Hot Reload).

Installa le dipendenze:

Bash

npm install
Avvia il server di sviluppo:

Bash

npm run dev
L'applicazione sarà disponibile all'indirizzo http://localhost:5173 (o porta simile).
