# Kanban-web-app
 Dynamic Kanban board web application built with [daisyUI]. It allows users to create, track, and manage issues across Backlog, In Progress, Review, and Done columns. State persists locally using LocalStorage.

 # Spiagazione codice script.js
 ## 1. Selezione degli Elementi del DOM e Stato Iniziale 
All'inizio, il codice seleziona gli elementi HTML cruciali per l'interazione e definisce una variabile di stato:

const modal = document.querySelector(".confirm-modal");: Seleziona la modale (solitamente una finestra di dialogo) usata per la conferma dell'eliminazione di un'attività.

const columnsContainer = document.querySelector(".columns");: Seleziona il contenitore principale che ospita tutte le colonne della bacheca.

const columns = columnsContainer.querySelectorAll(".column");: Seleziona tutte le singole colonne all'interno del contenitore.

let currentTask = null;: Una variabile di stato globale per tenere traccia dell'attività corrente (ad esempio, l'attività che si sta per eliminare) in un contesto interattivo (come l'apertura della modale di conferma).

## 2. Funzioni di Supporto per la Creazione e l'Aggiornamento️
Queste funzioni sono responsabili della creazione dinamica degli elementi e della gestione dei conteggi delle attività.

createTask(content) // Crea un nuovo elemento div che rappresenta un'attività (task).

### Caratteristiche:

Imposta la classe a "task".

Rendo  l'elemento trascinabile (draggable = true).

Aggiunge il contenuto dell'attività, un bottone per modificare (data-edit) e un bottone per eliminare (data-delete).

Aggiunge i listener per gli eventi di trascinamento (dragstart e dragend).

createTaskInput(text = "")
Cosa fa: Crea un elemento div per permettere l'inserimento/modifica del testo di un'attività.

Caratteristiche:

Imposta la classe a "task-input".

Lo rende modificabile dall'utente (contentEditable = true).

Aggiunge un listener all'evento blur (quando l'elemento perde il focus), che attiva la funzione handleBlur per salvare l'attività.

updateTaskCount(column)
Cosa fa: Aggiorna il conteggio delle attività visualizzato nel titolo di una specifica colonna.

observeTaskChanges()
Cosa fa: Utilizza l'API MutationObserver per monitorare le modifiche alla lista delle attività (.tasks) in ogni colonna. Ogni volta che un'attività viene aggiunta o rimossa (cambia childList), chiama updateTaskCount per aggiornare il numero visualizzato.

## 3. Funzioni per la Gestione degli Eventi (Event Handlers) 
Queste funzioni gestiscono le interazioni dell'utente (trascinamento, click, modifica).

Trascinamento (Drag and Drop) 
handleDragstart(event):

Viene chiamata quando si inizia a trascinare un'attività.

Permette l'effetto di spostamento (effectsAllowed = "move").

Aggiunge la classe "dragging" all'elemento trascinato per applicare uno stile visivo (tramite requestAnimationFrame per assicurare l'applicazione dopo l'inizio del drag).

handleDragend(event):

Viene chiamata quando il trascinamento termina (che abbia avuto successo o meno).

Rimuove la classe "dragging".

handleDragover(event):

Viene chiamata quando un elemento trascinato si muove sopra un'area droppabile (.tasks).

event.preventDefault(): Essenziale per consentire l'operazione di rilascio (drop).

Contiene la logica chiave per determinare dove inserire l'attività trascinata:

Se l'attività viene trascinata su un'altra attività, calcola se posizionarla prima o dopo in base alla posizione verticale del mouse (event.clientY) rispetto al centro dell'attività target.

Se l'attività viene trascinata su un'area .tasks vuota, la aggiunge semplicemente.

handleDrop(event):

Viene chiamata quando un elemento viene rilasciato.

Contiene solo event.preventDefault() per evitare il comportamento di default del browser (non sono necessarie altre azioni qui, dato che handleDragover ha già gestito lo spostamento).

Operazioni sulle Attività (Add, Edit, Delete) 
handleAdd(event):

Viene chiamata al click del bottone "Aggiungi" di una colonna.

Crea un nuovo elemento di input (createTaskInput) e lo aggiunge alla fine della lista delle attività di quella colonna.

Imposta il focus sull'input per iniziare subito a digitare.

handleEdit(event):

Viene chiamata al click sul bottone "Modifica" (matita).

Prende il testo dell'attività e crea un nuovo elemento di input (createTaskInput) con quel testo.

Sostituisce l'attività esistente con il nuovo elemento di input e imposta il focus.

Sposta il cursore alla fine del testo per una modifica più agevole.

handleBlur(event):

Viene chiamata quando l'utente finisce di digitare nell'input (l'input perde il focus).

Prende il testo dall'input, lo pulisce (o usa "Untitled" se vuoto) e crea una nuova attività (createTask).

Sostituisce l'input con l'attività appena creata. Questo completa sia l'aggiunta che la modifica.

handleDelete(event):

Viene chiamata al click sul bottone "Elimina" (cestino).

Salva l'attività target in currentTask.

Popola la modale di conferma con un'anteprima del testo dell'attività.

Mostra la modale (modal.showModal()).

## 4. Configurazioni degli Event Listener Globali 
Questa sezione collega le funzioni agli eventi del DOM.

Drag & Drop: I listener dragover e drop sono aggiunti a tutti gli elementi .tasks (le aree droppabili).

Click Delegato: Un singolo listener click è aggiunto al contenitore delle colonne (columnsContainer). Sfrutta la delegazione degli eventi per gestire i click sui bottoni "Aggiungi" ([data-add]), "Modifica" ([data-edit]) ed "Elimina" ([data-delete]). Questo è efficiente perché non richiede l'aggiunta di listener a ogni singola attività.

Gestione Modale:

Al submit della modale (ad esempio, cliccando su "Conferma"), l'attività salvata in currentTask viene rimossa (currentTask.remove()).

Al click sul bottone "Annulla" (#cancel), la modale viene chiusa.

Alla chiusura della modale (close event), currentTask viene resettato a null.

5. Inizializzazione della Bacheca (Placeholder Tasks) 
Un array bidimensionale chiamato tasks contiene il testo delle attività iniziali, suddivise per colonna.

Un ciclo popola la bacheca: per ogni colonna nell'array, crea le attività corrispondenti e le aggiunge all'elemento .tasks della colonna HTML.

Infine, la funzione observeTaskChanges() viene chiamata per inizializzare l'osservatore e garantire che il conteggio delle attività venga aggiornato ogni volta che una task viene spostata o modificata.

