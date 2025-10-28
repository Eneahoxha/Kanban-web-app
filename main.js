// --- SEZIONE VARIABILI GLOBALI ---
const modalConfirm = document.getElementById("confirm-modal-id");
const modalTask = document.getElementById("create-task-modal");
const modalCategory = document.getElementById("category-modal-id");
const columnsContainer = document.querySelector(".columns");

const taskTitleInput = document.getElementById('task-title');
const taskDueDateInput = document.getElementById('task-due-date');
const taskPriorityInput = document.getElementById('task-priority'); 

const STORAGE_KEY = 'kanbanTasks';

const taskInstances = new Map(); 

let currentTask = null; 

const formatTime = (value) => value < 10 ? `0${value}` : value;

// --- FUNZIONE OROLOGIO GLOBALE ---

const updateGlobalClock = () => {
    const clockElement = document.getElementById('global-clock-time'); 
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
    
    clockElement.textContent = formattedTime;
};


// --- CLASSE TASK (LIVELLO 1: Stato e Logica Incapsulata) ---

class KanbanTask {
    constructor({ id = crypto.randomUUID(), title, dueDate, priority = 'Bassa', columnId }) { 
        this.id = id;
        this.title = title.trim() || "Untitled";
        this.dueDate = dueDate;
        this.priority = priority; 
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
        task.dataset.priority = this.priority; 
        
        const countdownHTML = this.dueDate 
            ? `<div class="task-countdown flex gap-2 justify-end text-xs mt-2" data-due-date="${this.dueDate}"></div>` 
            : '';

        const priorityBadge = this.getPriorityBadgeHtml();
        
        task.innerHTML = `
            <div class="card-body p-4">
                <div class="flex justify-between items-start">
                    <h2 class="card-title text-lg" contenteditable="false">${this.title}</h2>
                    ${priorityBadge}
                </div>
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
    
    getPriorityBadgeHtml() {
        let colorClass;
        switch (this.priority) {
            case 'Alta':
                colorClass = 'badge-error'; 
                break;
            case 'Media':
                colorClass = 'badge-warning';
                break;
            case 'Bassa':
            default:
                colorClass = 'badge-success'; 
                break;
        }
        return `<span class="badge ${colorClass} badge-sm">${this.priority}</span>`;
    }

    stopCountdown() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }
    
    updatePriority(newPriority) {
        this.priority = newPriority;
        this.element.dataset.priority = newPriority;
        const priorityBadgeContainer = this.element.querySelector('.badge');
        if (priorityBadgeContainer) {
             priorityBadgeContainer.outerHTML = this.getPriorityBadgeHtml();
        }
        this.updateColor(); 
        saveTasks();
    }

    updateColor() {
        // Rimuove tutte le classi di colore/sfondo e classi di bordo
        this.element.classList.remove(
            'bg-success', 'bg-warning', 'bg-error', 'bg-info', 'bg-red-800', 'text-white', 'text-black', 'bg-base-100',
            'border-2', 'border-l-4', 'border-red-600', 'border-yellow-500', 'border-green-500' 
        );
        this.element.classList.add('bg-base-100', 'text-black'); 
        
        const countdownElement = this.element.querySelector('.task-countdown');
        const isDone = this.columnId === 'done-col';
        const isExpired = this.columnId === 'expired-col';

        // 1. GESTIONE STATI TERMINALI (DONE/EXPIRED)
        if (isDone) {
            this.element.classList.add('bg-success', 'text-white');
            if (countdownElement) countdownElement.innerHTML = `<span class="font-bold text-white"><i class="bi bi-check-circle-fill"></i> COMPLETATA!</span>`;
            return;
        }

        if (isExpired) {
            this.element.classList.add('bg-error', 'text-white');
            if (countdownElement) countdownElement.innerHTML = `<span class="font-bold text-white"><i class="bi bi-x-circle-fill"></i> SCADUTA!</span>`;
            return;
        }
        
        // 2. GESTIONE PRIORITÀ (Bordo COMPLETO)
        this.element.classList.add('border-2'); 

        switch (this.priority) {
            case 'Alta':
                this.element.classList.add('border-red-600'); 
                break;
            case 'Media':
                this.element.classList.add('border-yellow-500');
                break;
            case 'Bassa':
            default:
                this.element.classList.add('border-green-500'); 
                break;
        }


        // 3. GESTIONE SCADENZA (Come Sfondo - Sovrascrive il default)
        if (!this.dueDate) {
             return;
        }

        const targetDate = new Date(this.dueDate).getTime();
        const now = new Date().getTime();
        const distance = targetDate - now;
        const distanceInDays = Math.floor(distance / (1000 * 60 * 60 * 24)); 

        // Rimuove i precedenti sfondi standard (bg-base-100)
        this.element.classList.remove('bg-base-100', 'text-black');

        if (distance <= 0) {
            this.element.classList.add('bg-error', 'text-white');
        } else if (distanceInDays > 7) {
            this.element.classList.add('bg-success', 'text-white'); 
        } else if (distanceInDays >= 1) {
            this.element.classList.add('bg-warning', 'text-black'); 
        } else {
            // Meno di 24 ore
            this.element.classList.add('bg-error', 'text-white'); 
        }
    }
    
    /**
     * Controlla la scadenza e sposta la task nella colonna 'expired-col' se necessario.
     * @returns {boolean} True se la task è stata spostata, False altrimenti.
     */
    checkAndMoveExpired() {
        if (!this.dueDate || this.columnId === 'done-col' || this.columnId === 'expired-col') {
            return false;
        }

        const targetDate = new Date(this.dueDate).getTime();
        const distance = targetDate - new Date().getTime();
        
        if (distance <= 0) {
            this.stopCountdown();
            this.updateColumn('expired-col');
            
            const expiredColumnTasksContainer = columnsContainer.querySelector('.expired-col .tasks'); 
            if (expiredColumnTasksContainer) {
                 expiredColumnTasksContainer.appendChild(this.element); 
            }
            return true;
        }
        return false;
    }

    updateCountdown() {
        if (this.checkAndMoveExpired()) {
             saveTasks(); 
             return;
        }

        const countdownElement = this.element.querySelector('.task-countdown');
        if (!countdownElement) return;
        
        const targetDate = new Date(this.dueDate).getTime();
        let distance = targetDate - new Date().getTime();

        if (distance < 0) {
            this.stopCountdown();
            this.updateColor();
            return;
        }

        // Calcolo giorni, ore, minuti, secondi
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        distance %= (1000 * 60 * 60 * 24);
        const hours = Math.floor(distance / (1000 * 60 * 60));
        distance %= (1000 * 60 * 60);
        const minutes = Math.floor(distance / (1000 * 60));
        distance %= (1000 * 60);
        const seconds = Math.floor(distance / 1000);

        countdownElement.innerHTML = `
            <span class="countdown font-mono text-sm">
                <span style="--value:${formatTime(days)};">${formatTime(days)}</span>g
            </span>
            <span class="countdown font-mono text-sm">
                <span style="--value:${formatTime(hours)};">${formatTime(hours)}</span>h
            </span>
            <span class="countdown font-mono text-sm">
                <span style="--value:${formatTime(minutes)};">${formatTime(minutes)}</span>m
            </span>
            <span class="countdown font-mono text-sm">
                <span style="--value:${formatTime(seconds)};">${formatTime(seconds)}</span>s
            </span>
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
        const columnId = column.id;
        
        column.querySelectorAll('.task').forEach(taskElement => {
            const instance = taskInstances.get(taskElement.dataset.taskId);
            if (instance) {
                 tasksData.push({
                    id: instance.id,
                    title: taskElement.querySelector('.card-title').innerText.trim(), 
                    dueDate: instance.dueDate,
                    priority: instance.priority, 
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
    
    const badgeElement = column.querySelector("[data-task-count]");
    if(badgeElement) badgeElement.textContent = taskCount;
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

const checkAllTasksOnLoad = () => {
    let movedCount = 0;
    
    for (const instance of taskInstances.values()) {
        const wasMoved = instance.checkAndMoveExpired();
        if (wasMoved) {
            movedCount++;
        }
    }

    if (movedCount > 0) {
        console.log(`[SYSTEM] Mosse ${movedCount} task scadute durante il caricamento.`);
        observeTaskChanges(); 
        saveTasks(); 
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
    const targetColumn = event.target.closest(".column");

    if (!draggedTask || !targetColumn || target === draggedTask) return;
    
    if (targetColumn.classList.contains('expired-col') && !draggedTask.closest('.expired-col')) {
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
    const targetColumn = event.target.closest(".column"); 

    if (!draggedTask || !targetColumn) return;

    const newColumnId = targetColumn.id;
    const instance = taskInstances.get(taskId);

    if (newColumnId === 'expired-col' && instance.columnId !== 'expired-col') {
        draggedTask.classList.remove("dragging");
        return;
    }

    instance.updateColumn(newColumnId);
    saveTasks(); 
};


// --- HANDLERS AZIONI TASK E MODALI (LIVELLO 3/4) ---

const handleBlur = (event) => {
    const titleElement = event.target;
    
    if (!titleElement.classList.contains('card-title') || titleElement.contentEditable !== 'true') return;
    
    const task = titleElement.closest('.task');
    const instance = taskInstances.get(task.dataset.taskId);

    if (!instance) return;

    const content = titleElement.innerText.trim() || "Untitled";
    
    instance.title = content;
    titleElement.contentEditable = 'false'; 
    titleElement.innerText = content; 
    
    saveTasks(); 
};

const handleKeyDown = (event) => {
    if (event.key === 'Enter' && event.target.classList.contains('card-title') && event.target.contentEditable === 'true') {
        event.preventDefault(); 
        event.target.blur();    
    }
}


const handleTaskAction = (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const taskElement = button.closest('.task');
    const instance = taskInstances.get(taskElement.dataset.taskId);
    
    if (!instance) return;

    if (action === 'edit') {
        const taskTitle = taskElement.querySelector('.card-title');
        
        taskTitle.contentEditable = 'true'; 
        taskTitle.focus();

        taskTitle.removeEventListener("blur", handleBlur); 
        taskTitle.addEventListener("blur", handleBlur, { once: true });
        
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(taskTitle);
        range.collapse(false); 
        selection.removeAllRanges();
        selection.addRange(range);
        
    } else if (action === 'delete') {
        currentTask = instance; 
        modalConfirm.querySelector(".preview").innerText = instance.title.substring(0, 100); 
        modalConfirm.showModal();
    }
};

const resetTaskModal = () => {
    taskTitleInput.value = '';
    taskDueDateInput.value = '';
    taskPriorityInput.value = 'Bassa'; 
}

const handleAddTask = (columnId = 'todo-col') => {
    
    const handleFormSubmit = (event) => {
        event.preventDefault();
        
        const title = taskTitleInput.value;
        const dueDate = taskDueDateInput.value; 
        const priority = taskPriorityInput.value; 
        
        if (title.trim()) {
            const newTaskInstance = new KanbanTask({
                title: title.trim(), 
                dueDate: dueDate || null, 
                priority: priority, 
                columnId: columnId
            });
            
            const tasksEl = columnsContainer.querySelector(`#${columnId} .tasks`); 
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

    modalTask.removeEventListener('submit', handleFormSubmit); 
    modalTask.addEventListener('submit', handleFormSubmit);
    modalTask.showModal();
};

const handleAddCategory = () => {
    
    const categoryNameInput = document.getElementById('category-name-input');

    const handleFormSubmit = (event) => {
        event.preventDefault();

        const name = categoryNameInput.value;
        
        if (name && name.trim()) {
            const className = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '-col';
            
            const doneCol = columnsContainer.querySelector('.done-col');
            
            columnsContainer.insertBefore(createCategory({ name, class: className }, true), doneCol);
            observeTaskChanges(); 
            saveTasks(); 
        }
        
        modalCategory.close();
        modalCategory.removeEventListener('submit', handleFormSubmit);
        categoryNameInput.value = '';
    };

    modalCategory.removeEventListener('submit', handleFormSubmit);
    modalCategory.addEventListener('submit', handleFormSubmit);
    modalCategory.showModal();
};

// --- FUNZIONI DI INIZIALIZZAZIONE STRUTTURA ---

function createCategory({ name, class: className }, removable = false) {
    let borderClass = '';
    switch (className) {
        case 'todo-col':
            borderClass = 'border-col-blue';
            break;
        case 'inprogress-col':
            borderClass = 'border-col-yellow';
            break;
        case 'review-col':
            borderClass = 'border-col-purple';
            break;
        case 'done-col':
            borderClass = 'border-col-green';
            break;
        case 'expired-col':
            borderClass = 'border-col-red';
            break;
        default:
            borderClass = 'border-col-default'; 
            break;
    }

    const col = document.createElement("div");
    col.className = `column ${className || ""} ${borderClass}`;
    col.id = className; 
    
    const protectedClasses = ['todo-col', 'inprogress-col', 'review-col', 'done-col', 'expired-col'];
    const showRemoveButton = removable && !protectedClasses.includes(className);
    
    col.innerHTML = `
        <div class="column-title">
            <h3 data-tasks="0">
                ${name} 
                <span class="badge badge-lg badge-neutral ml-2" data-task-count>0</span>
            </h3>
            ${showRemoveButton ? '<button class="remove-category-btn" title="Rimuovi categoria">&times;</button>' : ""}
        </div>
        <div class="tasks"></div>
    `;
    
    return col;
}

const defaultCategories = [
    { name: "📝 To Do", class: "todo-col" },
    { name: "⚙️ In Progress", class: "inprogress-col" },
    { name: "🔍 For Review", class: "review-col" },
    { name: "✅ Done", class: "done-col" },
    { name: "❌ Expired", class: "expired-col" }
];

const loadTasks = () => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
        return;
    }

    try {
        const tasksData = JSON.parse(savedData);
        
        tasksData.forEach(taskData => {
            const { columnId } = taskData;
            
            const tasksEl = columnsContainer.querySelector(`#${columnId} .tasks`);
            
            if (tasksEl) {
                const newTaskInstance = new KanbanTask(taskData); 
                tasksEl.appendChild(newTaskInstance.element);
            } else {
                 console.warn(`Colonna ${columnId} non trovata, spostamento su To Do.`);
                 taskData.columnId = 'todo-col';
                 const tasksElTodo = columnsContainer.querySelector('#todo-col .tasks');
                 const newTaskInstance = new KanbanTask(taskData); 
                 if (tasksElTodo) tasksElTodo.appendChild(newTaskInstance.element);
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
        columnsContainer.appendChild(createCategory(cat, false));
    });
    
    // 2. Caricamento Dati Persistenti
    loadTasks();
    
    // 3. CONTROLLO IMMEDIATO DELLE SCADENZE AL CARICAMENTO
    checkAllTasksOnLoad(); 

    // 4. Delegazioni Eventi Principali
    columnsContainer.addEventListener("dragover", handleDragover);
    columnsContainer.addEventListener("drop", handleDrop);
    document.addEventListener("keydown", handleKeyDown); 

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

    // 5. Gestione Eventi FAB 
    const fab = document.querySelector('.fab');
    const fabButton = document.getElementById('Aggiungi');
    
    if(fab && fabButton) {
         fabButton.addEventListener('click', (e) => {
             e.stopPropagation(); 
             fab.classList.toggle('active');
         });
    }

    // Chiude il FAB se l'utente clicca fuori
    document.addEventListener('click', (e) => {
        if (fab && fab.classList.contains('active') && !e.target.closest('.fab')) {
            fab.classList.remove('active');
        }
    });

    const fabCategoryBtn = document.getElementById('NuovaCategoria');
    if (fabCategoryBtn) {
        fabCategoryBtn.addEventListener('click', () => {
            if(fab) fab.classList.remove('active');
            handleAddCategory();
        });
    }
    
    const fabTaskBtn = document.querySelector('[data-add="NuovaTask"]');
    if (fabTaskBtn) {
        fabTaskBtn.addEventListener('click', () => {
            if(fab) fab.classList.remove('active');
            handleAddTask('todo-col'); 
        });
    }

    // 6. Gestione Modale Conferma (Eliminazione)
    modalConfirm.querySelector('form').addEventListener("submit", (e) => {
        const submittedButton = e.submitter; 

        // Eseguiamo l'eliminazione SOLO SE il pulsante premuto è 'confirm'
        if (submittedButton && submittedButton.id === 'confirm' && currentTask) {
            currentTask.stopCountdown();
            currentTask.element.remove();
            taskInstances.delete(currentTask.id); 
            observeTaskChanges();
            saveTasks(); 
        }
    });
    modalConfirm.addEventListener("close", () => (currentTask = null));

    // 7. Gestione Modale Creazione Task (Annulla/Chiudi)
    document.getElementById('create-cancel').addEventListener('click', () => {
        modalTask.close();
        resetTaskModal();
    });
    
    // 8. Gestione Modale Creazione Categoria (Annulla/Chiudi)
    document.getElementById('category-cancel').addEventListener('click', () => {
        modalCategory.close();
    });
    
    
    // 9. Avvio dell'orologio globale
    updateGlobalClock(); 
    setInterval(updateGlobalClock, 1000);
});