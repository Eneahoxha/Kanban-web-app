/**
 * CODICE FINALE:
 * - Orologio globale aggiunto e si aggiorna ogni secondo (Posizionato in alto a destra via CSS).
 * - Le task si aggiungono SOLO tramite il bottone FAB.
 * - Le task scadute vanno automaticamente nella colonna 'Expired'.
 * - Le categorie si scrollano verticalmente.
 * - Le task all'interno delle categorie sono affiancate.
 */

// --- VARIABILI GLOBALI E CONFIGURAZIONE ---

const modalConfirm = document.querySelector(".confirm-modal");
const modalTask = document.getElementById("create-task-modal");
const modalCategory = document.querySelector(".category-modal");
const columnsContainer = document.querySelector(".columns");

const taskTitleInput = document.getElementById('task-title');
const taskDueDateInput = document.getElementById('task-due-date');

const STORAGE_KEY = 'kanbanTasks';

const taskInstances = new Map(); 

let currentTask = null; 

// --- FUNZIONI DI BASE (LIVELLO 0: Utility) ---

const formatTime = (value) => value < 10 ? `0${value}` : value;

const createTaskInput = (text = "") => {
    const input = document.createElement("div");
    input.className = "task-input card-title";
    input.dataset.placeholder = "Task name";
    input.contentEditable = true;
    input.innerText = text;
    return input;
};

// --- FUNZIONE OROLOGIO GLOBALE ---

const updateGlobalClock = () => {
    const clockElement = document.getElementById('global-clock');
    if (!clockElement) return;

    const now = new Date();
    
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    };
    
    const formattedTime = now.toLocaleDateString('it-IT', options);
    
    // Aggiungo l'icona e l'ora formattata
    clockElement.textContent = `Ora Attuale: ${formattedTime}`;
};


// --- CLASSE TASK (LIVELLO 1: Stato e Logica Incapsulata) ---

class KanbanTask {
    constructor({ id = crypto.randomUUID(), title, dueDate, columnId }) {
        this.id = id;
        this.title = title.trim() || "Untitled";
        this.dueDate = dueDate;
        this.columnId = columnId;
        this.timerId = null;
        this.element = this.createDomElement();
        
        taskInstances.set(this.id, this);
        this.updateColor();

        if (this.dueDate && this.columnId !== 'done-col' && this.columnId !== 'expired-col') {
            this.startCountdown();
        }
    }

    createDomElement() {
        const task = document.createElement("div");
        task.className = "task card w-full bg-base-100 card-sm shadow-md";
        task.draggable = true;
        task.dataset.taskId = this.id;
        task.dataset.dueDate = this.dueDate || "";
        
        const countdownHTML = this.dueDate 
            ? `<div class="task-countdown flex gap-2 justify-end text-xs mt-2" data-due-date="${this.dueDate}"></div>` 
            : '';

        task.innerHTML = `
            <div class="card-body p-4">
                <h2 class="card-title">${this.title}</h2>
                ${countdownHTML}
                <div class="justify-end card-actions mt-2">
                    <button data-action="edit" class="btn btn-info btn-xs"><i class="bi bi-pencil-square"></i></button>
                    <button data-action="delete" class="btn btn-error btn-xs"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        `;
        task.addEventListener("dragstart", handleDragstart);
        task.addEventListener("dragend", handleDragend);
        return task;
    }
    
    stopCountdown() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    updateColor() {
        this.element.classList.remove(
            'bg-green-500', 'bg-yellow-400', 'bg-red-600', 'bg-red-800', 'text-white'
        );
        
        const countdownElement = this.element.querySelector('.task-countdown');
        const isDone = this.columnId === 'done-col';
        const isExpired = this.columnId === 'expired-col';

        if (isDone) {
            this.element.classList.add('bg-green-500', 'text-white');
            if (countdownElement) countdownElement.innerHTML = '<span style="font-weight:bold;color:white;"><i class="bi bi-check-circle-fill"></i> COMPLETATA!!!</span>';
            return;
        }

        if (isExpired) {
            this.element.classList.add('bg-red-800', 'text-white');
            if (countdownElement) countdownElement.innerHTML = '<span style="font-weight:bold;color:white;"><i class="bi bi-x-circle-fill"></i> SCADUTA!</span>';
            return;
        }
        
        if (!this.dueDate) return;

        const targetDate = new Date(this.dueDate).getTime();
        const now = new Date().getTime();
        const distance = targetDate - now;
        const distanceInDays = Math.floor(distance / (1000 * 60 * 60 * 24));

        if (distance <= 0) {
            this.element.classList.add('bg-red-600', 'text-white');
            if (countdownElement) countdownElement.innerHTML = '<span style="font-weight:bold;color:#fff;"><i class="bi bi-x-circle-fill"></i> SCADUTA!</span>';
        } else if (distanceInDays > 7) {
            this.element.classList.add('bg-green-500', 'text-white');
        } else if (distanceInDays >= 1) {
            this.element.classList.add('bg-yellow-400', 'text-white');
        } else {
            this.element.classList.add('bg-red-600', 'text-white');
        }
    }
    
    checkAndMoveExpired() {
        if (!this.dueDate || this.columnId === 'done-col' || this.columnId === 'expired-col') {
            return false;
        }

        const targetDate = new Date(this.dueDate).getTime();
        const distance = targetDate - new Date().getTime();
        
        if (distance <= 0) {
            this.stopCountdown();
            this.updateColumn('expired-col');
            
            const expiredColumn = columnsContainer.querySelector('.expired-col .tasks'); 
            if (expiredColumn) expiredColumn.appendChild(this.element); 
            
            saveTasks(); 
            return true;
        }
        return false;
    }

    updateCountdown() {
        if (!this.dueDate) return;

        if (this.checkAndMoveExpired()) return; 

        const countdownElement = this.element.querySelector('.task-countdown');
        const targetDate = new Date(this.dueDate).getTime();
        let distance = targetDate - new Date().getTime();

        if (distance < 0) {
            this.stopCountdown();
            this.updateColor();
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        distance %= (1000 * 60 * 60 * 24);
        const hours = Math.floor(distance / (1000 * 60 * 60));
        distance %= (1000 * 60 * 60);
        const minutes = Math.floor(distance / (1000 * 60));
        distance %= (1000 * 60);
        const seconds = Math.floor(distance / 1000);

        countdownElement.innerHTML = `
            <span class="countdown font-mono text-sm"><span style="--value:${formatTime(days)};">${formatTime(days)}</span>g</span>
            <span class="countdown font-mono text-sm"><span style="--value:${formatTime(hours)};">${formatTime(hours)}</span>h</span>
            <span class="countdown font-mono text-sm"><span style="--value:${formatTime(minutes)};">${formatTime(minutes)}</span>m</span>
            <span class="countdown font-mono text-sm"><span style="--value:${formatTime(seconds)};">${formatTime(seconds)}</span>s</span>
        `;

        this.updateColor();
    }
    
    startCountdown() {
        this.updateCountdown();
        if (this.timerId) this.stopCountdown();
        
        if (!this.checkAndMoveExpired()) { 
            this.timerId = setInterval(() => this.updateCountdown(), 1000);
        }
    }
    
    updateColumn(newColumnId) {
        this.columnId = newColumnId;
        
        if (newColumnId === 'done-col' || newColumnId === 'expired-col') {
            this.stopCountdown();
        } else if (this.dueDate) {
            this.startCountdown();
        }
        this.updateColor();
    }
}


// --- FUNZIONI DI MANIPOLAZIONE STATO (LIVELLO 2) ---

const saveTasks = () => {
    const tasksData = [];
    
    columnsContainer.querySelectorAll('.column').forEach(column => {
        const columnId = Array.from(column.classList).find(cls => cls.endsWith('-col')) || column.id;
        
        column.querySelectorAll('.task').forEach(taskElement => {
            const instance = taskInstances.get(taskElement.dataset.taskId);
            if (instance) {
                 tasksData.push({
                    id: instance.id,
                    title: instance.element.querySelector('.card-title').innerHTML.trim().replace(/<br>/g, "\n"),
                    dueDate: instance.dueDate,
                    columnId: columnId 
                });
            }
        });
    });

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksData));
    } catch (e) {
        console.error("Errore nel salvataggio in localStorage:", e);
    }
}; 

const updateTaskCount = (column) => {
    const tasks = column.querySelector(".tasks").children;
    const taskCount = tasks.length;
    column.querySelector(".column-title h3").dataset.tasks = taskCount;
}; 

const observeTaskChanges = () => {
    const columns = document.querySelectorAll(".column");
    for (const column of columns) {
        if (column.observer) {
            column.observer.disconnect();
            delete column.observer;
        }

        const tasksEl = column.querySelector(".tasks");
        if (!tasksEl) continue;

        const observer = new MutationObserver(() => {
            updateTaskCount(column);
            saveTasks();
        });
        observer.observe(tasksEl, { childList: true });
        column.observer = observer;
        updateTaskCount(column);
    }
}; 

// --- HANDLERS DRAG & DROP (LIVELLO 3) ---

const handleDragstart = (event) => {
    const taskId = event.target.dataset.taskId;
    const taskInstance = taskInstances.get(taskId);
    
    if (taskInstance && taskInstance.columnId === 'expired-col') { 
        event.preventDefault(); 
        return;
    }
    event.dataTransfer.effectsAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
    requestAnimationFrame(() => event.target.classList.add("dragging"));
};

const handleDragend = (event) => {
    event.target.classList.remove("dragging");
};

const handleDragover = (event) => {
    event.preventDefault();
    const draggedTask = document.querySelector(".dragging");
    const target = event.target.closest(".task, .tasks");

    if (!draggedTask || !target || target === draggedTask) return;
    
    if (target.closest('.expired-col') && !draggedTask.closest('.expired-col')) {
        event.dataTransfer.dropEffect = "none";
        return;
    }
    
    event.dataTransfer.dropEffect = "move";
    
    const tasksContainer = target.closest(".tasks") || target;

    if (tasksContainer.classList.contains("tasks")) {
        const children = Array.from(tasksContainer.children).filter(el => el.classList.contains('task') && el !== draggedTask);
        
        let afterElement = null;
        for (const child of children) {
            const rect = child.getBoundingClientRect();
            if (event.clientY > rect.top + rect.height / 2) { 
                afterElement = child;
            } else {
                break;
            }
        }
        
        if (afterElement == null) {
            tasksContainer.prepend(draggedTask); 
        } else {
            tasksContainer.insertBefore(draggedTask, afterElement.nextSibling); 
        }
    }
};

const handleDrop = (event) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain");
    const draggedTask = document.querySelector(`[data-task-id="${taskId}"]`);
    const targetColumn = draggedTask.closest(".column"); 

    if (!draggedTask || !targetColumn) return;

    const newColumnId = Array.from(targetColumn.classList).find(cls => cls.endsWith('-col')) || targetColumn.id;
    const instance = taskInstances.get(taskId);

    if (newColumnId === 'expired-col' && instance.columnId !== 'expired-col') {
        draggedTask.classList.remove("dragging");
        return;
    }

    instance.updateColumn(newColumnId);
};


// --- HANDLERS AZIONI TASK E MODALI (LIVELLO 3/4) ---

const handleBlur = (event) => {
    const input = event.target;
    const task = input.closest('.task');
    const instance = taskInstances.get(task.dataset.taskId);

    if (!instance) return;

    const content = input.innerText.trim() || "Untitled";
    
    instance.title = content;
    
    const newTitle = document.createElement('h2');
    newTitle.className = "card-title";
    newTitle.innerHTML = content.replace(/\n/g, "<br>");
    
    input.replaceWith(newTitle);
    
    saveTasks(); 
};

const handleTaskAction = (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const taskElement = button.closest('.task');
    const instance = taskInstances.get(taskElement.dataset.taskId);
    
    if (!instance) return;

    if (action === 'edit') {
        const taskTitle = taskElement.querySelector('.card-title');
        const input = createTaskInput(taskTitle.innerText);
        
        input.addEventListener("blur", handleBlur); 
        
        taskTitle.replaceWith(input);
        input.focus();

        const selection = window.getSelection();
        selection.selectAllChildren(input);
        selection.collapseToEnd();
        
    } else if (action === 'delete') {
        currentTask = instance; 
        modalConfirm.querySelector(".preview").innerText = instance.title.substring(0, 100); 
        modalConfirm.showModal();
    }
};

const resetTaskModal = () => {
    taskTitleInput.value = '';
    taskDueDateInput.value = '';
}

const handleAddTask = (columnId = 'todo-col') => {
    
    const handleFormSubmit = (event) => {
        event.preventDefault();
        
        const title = taskTitleInput.value;
        const dueDate = taskDueDateInput.value; 
        
        if (title.trim()) {
            const newTaskInstance = new KanbanTask({
                title: title.trim(), 
                dueDate: dueDate || null, 
                columnId: columnId
            });
            
            const tasksEl = columnsContainer.querySelector(`.${columnId} .tasks`); 
            if (tasksEl) {
                tasksEl.appendChild(newTaskInstance.element);
                saveTasks(); 
            } else {
                console.error(`Colonna ${columnId} non trovata.`);
            }
        }
        
        modalTask.close();
        modalTask.removeEventListener('submit', handleFormSubmit);
        resetTaskModal();
    };

    modalTask.addEventListener('submit', handleFormSubmit);
    modalTask.showModal();
};

const handleAddCategory = () => {
    
    const categoryNameInput = document.getElementById('category-name-input');

    const handleFormSubmit = (event) => {
        event.preventDefault();

        const name = categoryNameInput.value;
        
        if (name) {
            const className = name.toLowerCase().replace(/\s/g, '-') + '-col';
            const doneCol = columnsContainer.querySelector('.done-col');
            
            columnsContainer.insertBefore(createCategory({ name, class: className }, true), doneCol);
            observeTaskChanges();
            saveTasks(); 
        }
        
        modalCategory.close();
        modalCategory.removeEventListener('submit', handleFormSubmit);
        categoryNameInput.value = '';
    };

    modalCategory.addEventListener('submit', handleFormSubmit);
    modalCategory.showModal();
};

// --- FUNZIONI DI INIZIALIZZAZIONE STRUTTURA ---

function createCategory({ name, class: className }, removable = false) {
    const col = document.createElement("div");
    col.className = `column ${className || ""}`;
    col.id = className; 
    
    const protectedClasses = ['todo-col', 'inprogress-col', 'review-col', 'done-col', 'expired-col'];
    const showRemoveButton = removable && !protectedClasses.includes(className);
    
    col.innerHTML = `
        <div class="column-title">
            <h3 data-tasks="0">${name}</h3>
            ${showRemoveButton ? '<button class="remove-category-btn" title="Rimuovi categoria">&times;</button>' : ""}
        </div>
        <div class="tasks"></div>
    `;
    
    return col;
}

const defaultCategories = [
    { name: "To Do", class: "todo-col"},
    { name: "In Progress", class: "inprogress-col" },
    { name: "For Review", class: "review-col" }, 
    { name: "Done", class: "done-col" },
    { name: "Expired", class: "expired-col" }
];

const loadTasks = () => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
        console.log("Nessun dato salvato trovato.");
        return;
    }

    try {
        const tasksData = JSON.parse(savedData);
        
        tasksData.forEach(taskData => {
            const { columnId } = taskData;
            
            const tasksEl = columnsContainer.querySelector(`.${columnId} .tasks`);
            
            if (tasksEl) {
                const newTaskInstance = new KanbanTask(taskData); 
                tasksEl.appendChild(newTaskInstance.element);
            } else {
                console.warn(`Colonna ${columnId} non trovata, task ignorata.`);
            }
        });
        
        observeTaskChanges();

    } catch (e) {
        console.error("Errore nel parsing dei dati salvati:", e);
        localStorage.removeItem(STORAGE_KEY); 
    }
};

// --- INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', () => {

    // 1. Inizializzazione Struttura Colonne
    columnsContainer.innerHTML = "";
    defaultCategories.forEach(cat => {
        columnsContainer.appendChild(createCategory(cat, cat.class === 'review-col'));
    });
    observeTaskChanges();

    // 2. Caricamento Dati Persistenti
    loadTasks();

    // 3. Delegazioni Eventi Principali
    columnsContainer.addEventListener("dragover", handleDragover);
    columnsContainer.addEventListener("drop", handleDrop);

    // Gestione Azioni (Rimozione Categoria, Modifica/Eliminazione Task)
    columnsContainer.addEventListener("click", e => {
        if (e.target.classList.contains("remove-category-btn")) {
            e.target.closest(".column").remove();
            observeTaskChanges();
            saveTasks(); 
        } 
        else {
            handleTaskAction(e);
        }
    });

    // 4. Gestione Eventi FAB 
    const fabButton = document.getElementById('Aggiungi');
    if(fabButton) {
         fabButton.addEventListener('click', () => {
             document.querySelector('.fab').classList.toggle('active');
         });
         document.querySelector('.fab-close').addEventListener('click', () => {
             document.querySelector('.fab').classList.remove('active');
         });
    }

    const fabCategoryBtn = document.querySelector('[data-add][id="NuovaCategoria"]');
    if (fabCategoryBtn) {
        fabCategoryBtn.addEventListener('click', () => {
            document.querySelector('.fab').classList.remove('active');
            handleAddCategory();
        });
    }
    
    const fabTaskBtn = document.querySelector('[data-add="NuovaTask"]');
    if (fabTaskBtn) {
        fabTaskBtn.addEventListener('click', () => {
            document.querySelector('.fab').classList.remove('active');
            handleAddTask('todo-col'); 
        });
    }

    // 5. Gestione Modale Conferma (Eliminazione)
    modalConfirm.addEventListener("submit", () => {
        if (currentTask) {
            currentTask.stopCountdown();
            currentTask.element.remove();
            taskInstances.delete(currentTask.id); 
            observeTaskChanges();
            saveTasks(); 
        }
    });
    modalConfirm.querySelector("#cancel").addEventListener("click", () => modalConfirm.close());
    modalConfirm.addEventListener("close", () => (currentTask = null));

    // 6. Gestione Modale Creazione Task (Annulla/Chiudi)
    document.getElementById('create-cancel').addEventListener('click', () => {
        modalTask.close();
        resetTaskModal();
    });
    
    // 7. Gestione Modale Creazione Categoria (Annulla/Chiudi)
    document.getElementById('category-cancel').addEventListener('click', () => {
        modalCategory.close();
    });
    
    // 8. Avvio dell'orologio globale
    updateGlobalClock(); 
    setInterval(updateGlobalClock, 1000);
});