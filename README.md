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

# Spiegazione del codice main.js

## 🧭 Struttura e Obiettivo del Codice
Questo codice JavaScript è progettato per gestire in modo dinamico la logica e l'interazione (DOM manipulation) di una bacheca Kanban. Utilizza:

localStorage per salvare e caricare i dati (persistenza).

Una Classe KanbanTask per incapsulare lo stato e la logica di ogni singola "carta" o task.

Funzioni e Handler per gestire eventi come Drag & Drop, click e l'aggiornamento in tempo reale del countdown.

## 🧬 SEZIONE 1: Variabili Globali e Strutture Dati
Questa sezione definisce gli elementi DOM principali, le costanti e le strutture dati cruciali.

Variabili DOM: Vengono selezionati gli elementi HTML chiave, in particolare le modali (modalConfirm, modalTask, modalCategory) e il contenitore delle colonne (columnsContainer).

Input Modale Task: Vengono selezionati gli input specifici (taskTitleInput, taskDueDateInput, taskPriorityInput) utilizzati per creare o modificare una task.

STORAGE_KEY: La chiave ('kanbanTasks') usata per salvare i dati delle task nel localStorage del browser.

taskInstances = new Map(): Una struttura dati fondamentale (Map) che memorizza le istanze della classe KanbanTask con l'ID della task come chiave. Questo permette di accedere rapidamente alla logica JavaScript di una task a partire dal suo elemento DOM.

currentTask: Una variabile temporanea usata per memorizzare l'istanza della task attualmente in fase di gestione (es. prima dell'eliminazione in modale).

formatTime: Una semplice funzione utility per aggiungere uno zero iniziale ai numeri inferiori a 10 (es. 9 diventa "09"), usata per l'orologio e il countdown.

## 🕒 SEZIONE 2: Orologio e Timer Globali
#### updateGlobalClock(): 
Questa funzione aggiorna un elemento nell'interfaccia (global-clock-time) con l'ora e la data formattate in italiano ('it-IT').

#### L'aggiornamento Globale: 
Le ultime righe nel blocco DOMContentLoaded gestiscono l'avvio e la sincronizzazione dell'orologio globale, assicurando che si aggiorni ogni secondo.

## 🛠️ SEZIONE 3: La Classe KanbanTask (Il Cuore della Logica)
#### constructor:
"Crea una nuova istanza. Genera un ID univoco.

#### (crypto.randomUUID()):
inizializza le proprietà (titolo, scadenza, priorità, colonna) e chiama
#### createDomElement():
per creare l'HTML. Aggiunge l'istanza alla taskInstances Map. Avvia il countdown se è presente una scadenza."

#### createDomElement():
Genera l'elemento div HTML che rappresenta la task sulla bacheca. Configura gli attributi per il Drag & Drop e aggiunge i pulsanti di modifica/eliminazione. Aggiunge gli handler per dragstart e dragend.

#### getPriorityBadgeHtml():
"Restituisce il codice HTML per il badge di priorità con la classe di colore corretta (badge-error, badge-warning, badge-success)."

#### updateColor():
"Metodo complesso che determina l'aspetto visivo (colore di sfondo e bordo) della task in base a 3 fattori in ordine di precedenza: 
1. Stato Terminale (verde per ""Done"", rosso scuro per ""Expired""),
2. Scadenza (rosso se vicina o scaduta, giallo se prossima, verde se lontana),
3. Priorità (usata per il colore del bordo se non ci sono conflitti di scadenza)."

#### stopCountdown():
Interrompe il timer di countdown (clearInterval).

#### updatePriority():
"Aggiorna la priorità della task, ricrea il badge, chiama updateColor() e saveTasks()."

#### checkAndMoveExpired():
"Controlla se la data di scadenza è passata. Se è scaduta e non è nelle colonne ""Done"" o ""Expired"", ferma il countdown, aggiorna la colonna a 'expired-col' e sposta l'elemento DOM nella colonna scaduta."

#### updateCountdown():
"Calcola e aggiorna l'elemento HTML del countdown con giorni, ore, minuti e secondi rimanenti. Chiama checkAndMoveExpired() ad ogni tick per reagire in tempo reale."

#### startCountdown():
Avvia il timer di aggiornamento di 1 secondo per il countdown.

#### updateColumn(newColumnId):
"Aggiorna l'ID della colonna della task (usato dal Drop Handler). Ferma o avvia il countdown a seconda che la nuova colonna sia ""Done"" / ""Expired"" o meno."

## 💾 SEZIONE 4: Manipolazione Stato e Persistenza
Queste funzioni gestiscono il salvataggio dei dati e l'aggiornamento dell'interfaccia.

#### saveTasks(): 
Itera su tutte le colonne e gli elementi task nel DOM. Per ogni elemento, recupera l'istanza KanbanTask dalla Map e crea un oggetto di dati JSON con le sue proprietà. Infine, salva l'array JSON nel localStorage con la chiave STORAGE_KEY.

#### updateTaskCount(): 
Aggiorna il badge numerico che mostra quante task sono presenti in una specifica colonna.

#### observeTaskChanges(): 
Utilizza la MutationObserver per monitorare i cambiamenti (aggiunta/rimozione di task) all'interno del contenitore delle task di ogni colonna. Quando viene rilevato un cambiamento (es. Drag & Drop o eliminazione), chiama updateTaskCount() e saveTasks().

#### checkAllTasksOnLoad(): 
Al caricamento, scorre tutte le task esistenti e chiama instance.checkAndMoveExpired() per spostare immediatamente eventuali task scadute (es. scadute mentre il browser era chiuso).

## 🖱️ SEZIONE 5: Handlers Eventi Principali (Drag & Drop, Modifica)
handleDragstart/handleDragend: Gestiscono l'inizio e la fine dell'azione di trascinamento, aggiungendo/rimuovendo la classe .dragging. Impediscono il trascinamento delle task già scadute.

#### handleDragover: 
Gestisce il movimento di trascinamento. Contiene la logica per impedire che le task vengano rilasciate nella colonna "Expired" e per determinare la posizione esatta di rilascio tra le altre task.

#### handleDrop: 
Gestisce il rilascio. Aggiorna l'istanza della task con il nuovo columnId chiamando instance.updateColumn(), e poi salva lo stato.

#### handleBlur/handleKeyDown: 
Gestiscono la modifica in linea del titolo della task. Quando l'utente clicca fuori o preme "Invio" su un titolo modificabile (contenteditable='true'), il titolo viene salvato e l'attributo contenteditable viene disattivato.

#### handleTaskAction: 
Gestisce i click sui pulsanti all'interno di una task:

#### Edit: 
Rende il titolo modificabile e sposta il cursore alla fine del testo.

#### Delete: 
Imposta la task corrente in currentTask e mostra la modale di conferma eliminazione.

## ➕ SEZIONE 6: Gestione Aggiunta (Modali)
#### handleAddTask(): 
Gestisce la creazione di una Nuova Task. Mostra la modale di creazione e, al submit del form, crea una nuova istanza KanbanTask con i dati inseriti, l'aggiunge al DOM della colonna corretta e salva le modifiche.

#### handleAddCategory(): 
Gestisce la creazione di una Nuova Categoria (colonna). Crea l'elemento DOM della nuova colonna e la inserisce prima della colonna "Done".

## 🚀 SEZIONE 7: Inizializzazione
Il blocco document.addEventListener('DOMContentLoaded', ...) è il punto di partenza:

Inizializza la Struttura: Crea le colonne di default (To Do, In Progress, ecc.) e le aggiunge al columnsContainer.

Carica i Dati: Chiama loadTasks() per recuperare i dati dal localStorage e ricreare le istanze KanbanTask e i loro elementi DOM.

Controlla Scadenze: Chiama checkAllTasksOnLoad() per gestire le task scadute.

Associa Eventi Globali: Configura i listener per Drag & Drop (dragover, drop), tastiera (keydown) e il listener generico sui click per le azioni delle task e la rimozione delle colonne.

Gestione FAB: Implementa la logica per il pulsante d'azione fluttuante (FAB) che apre il menu per aggiungere task o categorie.

Gestione Modali: Aggiunge i listener per i pulsanti di conferma e annullamento delle modali.
