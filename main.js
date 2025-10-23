const modal = document.querySelector(".confirm-modal");
const columnsContainer = document.querySelector(".columns");
let columns = document.querySelectorAll(".column");
let currentTask = null;

// Nome della chiave usata in localStorage
const STORAGE_KEY = 'kanbanTasks';

// Utility
const formatTime = (value) => value < 10 ? `0${value}` : value;

// --- Logica di Persistenza ---

/**
 * Salva lo stato attuale di tutte le task e le loro posizioni in localStorage.
 */
const saveTasks = () => {
    const tasksData = [];
    
    // Itera su tutte le colonne e le task
    columnsContainer.querySelectorAll('.column').forEach(column => {
        const columnClass = Array.from(column.classList).find(cls => cls.endsWith('-col'));
        
        column.querySelectorAll('.task').forEach(taskElement => {
            const taskTitle = taskElement.querySelector('.card-title').textContent.trim();
            const dueDate = taskElement.querySelector('.task-countdown')?.getAttribute('data-due-date') || null;

            tasksData.push({
                title: taskTitle,
                dueDate: dueDate,
                column: columnClass 
            });
        });
    });

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksData));
    } catch (e) {
        console.error("Errore nel salvataggio in localStorage:", e);
    }
};

/**
 * Carica le task da localStorage e le ricrea nel DOM.
 */
const loadTasks = () => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
        console.log("Nessun dato salvato trovato. Carico le task di esempio.");
        // Se non ci sono dati salvati, potresti voler caricare alcune task iniziali
        // (Al momento il codice parte vuoto, che è la scelta più pulita)
        return;
    }

    try {
        const tasksData = JSON.parse(savedData);
        
        tasksData.forEach(taskData => {
            const { title, dueDate, column: columnClass } = taskData;
            
            // Trova il contenitore delle task corretto
            const tasksEl = columnsContainer.querySelector(`.${columnClass} .tasks`);
            
            if (tasksEl) {
                const newTask = createTask(title, dueDate);
                tasksEl.appendChild(newTask);
                // Avvia il countdown e la logica di expired
                if (dueDate) startTaskCountdown(newTask); 
            } else {
                console.warn(`Colonna ${columnClass} non trovata, task ignorata.`);
            }
        });
        
        // Ricalcola il conteggio delle task dopo il caricamento
        observeTaskChanges();

    } catch (e) {
        console.error("Errore nel parsing dei dati salvati:", e);
        localStorage.removeItem(STORAGE_KEY); // Pulisce i dati corrotti
    }
};

// --- Funzioni Countdown e Colore (omesse per brevità, sono invariate) ---

/**
 * Controlla e sposta la task nella colonna "Expired" se la scadenza è passata
 * e la task non è in "Done" o "Expired". (Invariata)
 */
const checkAndMoveExpiredTask = (taskElement, distance) => {
    // ... logica invariata ...
    // Controlla se la task è già in Done o Expired
    if (taskElement.closest('.done-col') || taskElement.closest('.expired-col')) {
        return false;
    }

    if (distance <= 0) {
        stopTaskCountdown(taskElement);
        const expiredColumn = columnsContainer.querySelector('.expired-col .tasks');
        if (expiredColumn) {
            expiredColumn.appendChild(taskElement);
            updateTaskColor(taskElement);
            // *CHIAMATA AGGIUNTA:* Salva lo stato dopo lo spostamento automatico
            saveTasks(); 
            return true;
        }
    }
    return false;
};

// ... updateTaskColor, updateCountdown, startTaskCountdown, stopTaskCountdown (invariate) ...

const updateTaskColor = (taskElement) => {
    const countdownElement = taskElement.querySelector('.task-countdown');
    const dueDateString = countdownElement?.getAttribute('data-due-date');
    const isDone = taskElement.closest('.done-col');
    const isExpired = taskElement.closest('.expired-col');

    taskElement.classList.remove(
        'bg-green-100', 'bg-yellow-100', 'bg-red-100', 
        'bg-green-500', 'bg-yellow-400', 'bg-red-600', 'bg-lime-500', 'bg-orange-500', 'bg-pink-600', 'bg-red-800', 'text-white'
    );

    if (isDone) {
        taskElement.classList.add('bg-green-500', 'text-white');
        if (countdownElement) {
            countdownElement.innerHTML = '<span style="font-weight:bold;color:white;"><i class="bi bi-check-circle-fill"></i> COMPLETATA!!!</span>';
        }
        return;
    }

    if (isExpired) {
        taskElement.classList.add('bg-red-800', 'text-white');
        if (countdownElement) {
            countdownElement.innerHTML = '<span style="font-weight:bold;color:white;"><i class="bi bi-x-circle-fill"></i> SCADUTA!</span>';
        }
        return;
    }

    if (!dueDateString) return;

    const targetDate = new Date(dueDateString).getTime();
    const now = new Date().getTime();
    const distance = targetDate - now;
    const distanceInDays = Math.floor(distance / (1000 * 60 * 60 * 24));

    if (distance <= 0) {
        taskElement.classList.add('bg-red-600', 'text-white');
        if (countdownElement) {
            countdownElement.innerHTML = '<span style="font-weight:bold;color:#fff;"><i class="bi bi-x-circle-fill"></i> SCADUTA!</span>';
        }
    } else if (distanceInDays > 7) {
        taskElement.classList.add('bg-green-500', 'text-white');
    } else if (distanceInDays >= 1) {
        taskElement.classList.add('bg-orange-500', 'text-white');
    } else {
        taskElement.classList.add('bg-red-600', 'text-white');
    }
};

const updateCountdown = (taskElement) => {
    const countdownElement = taskElement.querySelector('.task-countdown');
    const dueDateString = countdownElement?.getAttribute('data-due-date');
    if (!dueDateString) return;

    const targetDate = new Date(dueDateString).getTime();
    const now = new Date().getTime();
    let distance = targetDate - now;

    if (checkAndMoveExpiredTask(taskElement, distance)) {
        return;
    }

    if (distance < 0) {
        if (countdownElement.timerId) clearInterval(countdownElement.timerId);
        updateTaskColor(taskElement);
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

    updateTaskColor(taskElement);
};

const startTaskCountdown = (taskElement) => {
    const countdownElement = taskElement.querySelector('.task-countdown');
    if (!countdownElement || !countdownElement.getAttribute('data-due-date')) return;

    const targetDate = new Date(countdownElement.getAttribute('data-due-date')).getTime();
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (!checkAndMoveExpiredTask(taskElement, distance)) {
        updateCountdown(taskElement);
        if (countdownElement.timerId) clearInterval(countdownElement.timerId);
        const timerId = setInterval(() => updateCountdown(taskElement), 1000);
        countdownElement.timerId = timerId;
    }
};

const stopTaskCountdown = (taskElement) => {
    const countdownElement = taskElement.querySelector('.task-countdown');
    if (countdownElement && countdownElement.timerId) {
        clearInterval(countdownElement.timerId);
        delete countdownElement.timerId;
    }
};

// --- Funzioni Drag & Drop e Task Management ---

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

    if (target.classList.contains("tasks")) {
        const lastTask = target.lastElementChild;
        if (!lastTask || lastTask === draggedTask) {
            target.appendChild(draggedTask);
        } else {
            const { bottom } = lastTask.getBoundingClientRect();
            if (event.clientY > bottom) target.appendChild(draggedTask);
        }
    } else {
        const { top, height } = target.getBoundingClientRect();
        const distance = top + height / 2;
        if (event.clientY < distance) {
            target.before(draggedTask);
        } else {
            target.after(draggedTask);
        }
    }
};

const handleDrop = (event) => {
    event.preventDefault();
    const draggedTask = document.querySelector(".dragging");
    const targetColumn = event.target.closest(".column");

    if (draggedTask && targetColumn && 
        targetColumn.classList.contains('expired-col') && 
        !draggedTask.closest('.expired-col')) {
        
        draggedTask.classList.remove("dragging");
        return; 
    }

    if (draggedTask) {
        stopTaskCountdown(draggedTask);

        if (draggedTask.querySelector('.task-countdown')?.getAttribute('data-due-date')) {
            startTaskCountdown(draggedTask);
        } else {
            updateTaskColor(draggedTask);
        }
        
        // *CHIAMATA AGGIUNTA:* Salva lo stato dopo aver spostato la task
        saveTasks();
    }
};

const handleDragend = (event) => {
    event.target.classList.remove("dragging");
    observeTaskChanges();
};

const handleDragstart = (event) => {
    if (event.target.closest('.expired-col')) {
        event.preventDefault(); 
        return;
    }

    event.dataTransfer.effectsAllowed = "move";
    event.dataTransfer.setData("text/plain", "");
    requestAnimationFrame(() => event.target.classList.add("dragging"));
};

const handleDelete = (event) => {
    currentTask = event.target.closest(".task");
    modal.querySelector(".preview").innerText = currentTask.querySelector('.card-title').innerText.substring(0, 100);
    modal.showModal();
};

const handleEdit = (event) => {
    const task = event.target.closest(".task");
    const taskTitle = task.querySelector('.card-title');
    const input = createTaskInput(taskTitle.innerText);
    taskTitle.replaceWith(input);
    input.focus();

    const selection = window.getSelection();
    selection.selectAllChildren(input);
    selection.collapseToEnd();
};

const handleBlur = (event) => {
    const input = event.target;
    const content = input.innerText.trim() || "Untitled";
    const newTitle = document.createElement('h2');
    newTitle.className = "card-title";
    newTitle.innerHTML = content.replace(/\n/g, "<br>");
    const task = input.closest('.task');
    input.replaceWith(newTitle);
    
    // *CHIAMATA AGGIUNTA:* Salva lo stato dopo la modifica del titolo
    saveTasks();
};

const updateTaskCount = (column) => {
    const tasks = column.querySelector(".tasks").children;
    const taskCount = tasks.length;
    column.querySelector(".column-title h3").dataset.tasks = taskCount;
    
    // Non chiamo saveTasks qui, perché MutationObserver è un effetto collaterale 
    // di un'azione che salva già (drop, delete, add).
};

const observeTaskChanges = () => {
    columns = document.querySelectorAll(".column");
    for (const column of columns) {
        if (column.observer) {
            column.observer.disconnect();
            delete column.observer;
        }

        const tasksEl = column.querySelector(".tasks");
        if (!tasksEl) continue;

        const observer = new MutationObserver(() => updateTaskCount(column));
        observer.observe(tasksEl, { childList: true });
        column.observer = observer;
        updateTaskCount(column);
    }
};

// Crea task
const createTask = (content, dueDate = null) => {
    const task = document.createElement("div");
    task.className = "task card w-full bg-base-100 card-sm shadow-md mb-2";
    task.draggable = true;

    let countdownHTML = '';
    let validDueDate = dueDate;

    if (dueDate) {
        const dateCheck = new Date(dueDate);
        if (!isNaN(dateCheck.getTime())) {
            countdownHTML = `<div class="task-countdown flex gap-2 justify-end text-xs mt-2" data-due-date="${dueDate}"></div>`;
        } else {
            validDueDate = null;
        }
    }

    task.innerHTML = `
        <div class="card-body p-4">
            <h2 class="card-title">${content}</h2>
            ${countdownHTML}
            <div class="justify-end card-actions mt-2">
                <button data-edit class="btn btn-info btn-xs"><i class="bi bi-pencil-square"></i></button>
                <button data-delete class="btn btn-error btn-xs"><i class="bi bi-trash"></i></button>
            </div>
        </div>
    `;
    task.addEventListener("dragstart", handleDragstart);
    task.addEventListener("dragend", handleDragend);

    if (!validDueDate) {
        updateTaskColor(task);
    }

    return task;
};

const createTaskInput = (text = "") => {
    const input = document.createElement("div");
    input.className = "task-input card-title";
    input.dataset.placeholder = "Task name";
    input.contentEditable = true;
    input.innerText = text;
    input.addEventListener("blur", handleBlur);
    return input;
};

// --- Categorie ---

const defaultCategories = [
    { name: "To Do", class: "todo-col" },
    { name: "In Progress", class: "inprogress-col" },
    { name: "For Review", class: "review-col" }, 
    { name: "Done", class: "done-col" },
    { name: "Expired", class: "expired-col" } 
];

function createCategory({ name, class: className }, removable = false) {
    const col = document.createElement("div");
    col.className = `column ${className || ""}`;

    const protectedClasses = ['todo-col', 'inprogress-col', 'review-col', 'done-col', 'expired-col'];
    const showRemoveButton = removable && !protectedClasses.includes(className);

    col.innerHTML = `
        <div class="column-title">
            <h3 data-tasks="0">${name}</h3>
            ${showRemoveButton ? '<button class="remove-category-btn" title="Rimuovi categoria">&times;</button>' : ""}
            <button data-add class="btn btn-xs btn-circle btn-ghost text-lg leading-none" title="Aggiungi task">+</button>
        </div>
        <div class="tasks"></div>
    `;
    const tasksEl = col.querySelector(".tasks");
    tasksEl.addEventListener("dragover", handleDragover);
    tasksEl.addEventListener("drop", handleDrop);
    return col;
}

// Logica di aggiunta task unificata (per il FAB)
const handleAddTaskFromFab = () => {
    const content = prompt("Nome della nuova task?");
    if (content && content.trim()) {
        const dueDate = prompt("Data e ora di scadenza (es: 2025-12-31T23:59:00)? Lascia vuoto per nessuna scadenza.");
        const newTask = createTask(content.trim(), dueDate);
        
        const tasksEl = columnsContainer.querySelector('.todo-col .tasks'); 
        if (tasksEl) {
            tasksEl.appendChild(newTask);
            if (dueDate) startTaskCountdown(newTask);
            
            // *CHIAMATA AGGIUNTA:* Salva lo stato dopo la creazione
            saveTasks();
        } else {
            alert("Colonna 'To Do' non trovata. Impossibile aggiungere la task.");
        }
    }
};

// Logica di aggiunta categoria unificata (per il FAB)
const handleAddCategory = () => {
    const name = prompt("Nome nuova categoria?");
    if (name && name.trim()) {
        const className = name.trim().toLowerCase().replace(/\s+/g, '-');
        
        const doneCol = columnsContainer.querySelector('.done-col');
        columnsContainer.insertBefore(createCategory({ name, class: `${className}-col` }, true), doneCol);
        observeTaskChanges();
        
        // Non è strettamente necessario salvare le categorie, ma garantisce 
        // che l'indice della task sia corretto se si basa sul DOM.
    }
};

// --- Inizializzazione ---

// Crea la struttura iniziale delle colonne, poi carica i dati
const initializeColumns = () => {
    columnsContainer.innerHTML = "";
    defaultCategories.forEach(cat => {
        const isRemovableDefault = cat.class === 'review-col';
        columnsContainer.appendChild(createCategory(cat, isRemovableDefault));
    });
    observeTaskChanges();
};

// --- Delegazioni Eventi ---

// Rimozione Categoria, Aggiunta/Modifica/Eliminazione Task (logica per i pulsanti interni)
columnsContainer.addEventListener("click", e => {
    if (e.target.closest("button[data-add]")) {
        const column = e.target.closest(".column");
        
        if (column.classList.contains('done-col') || column.classList.contains('expired-col')) {
            alert("Non è possibile aggiungere task direttamente nelle colonne Done o Expired.");
            return;
        }

        const tasksEl = column.querySelector(".tasks");
        const content = prompt("Nome della nuova task?");
        if (content && content.trim()) {
            const dueDate = prompt("Data e ora di scadenza (es: 2025-12-31T23:59:00)? Lascia vuoto per nessuna scadenza.");
            const newTask = createTask(content.trim(), dueDate);
            tasksEl.appendChild(newTask);
            if (dueDate) startTaskCountdown(newTask);
            
            // *CHIAMATA AGGIUNTA:* Salva lo stato dopo la creazione
            saveTasks();
        }
    } else if (e.target.closest("button[data-edit]")) {
        handleEdit(e);
    } else if (e.target.closest("button[data-delete]")) {
        handleDelete(e);
    } else if (e.target.classList.contains("remove-category-btn")) {
        e.target.closest(".column").remove();
        observeTaskChanges();
        
        // *CHIAMATA AGGIUNTA:* Salva lo stato dopo la rimozione della categoria
        saveTasks();
    }
});

// --- Eventi Modali e Inizializzazione Finale ---

document.querySelectorAll(".tasks").forEach(tasksEl => {
    tasksEl.addEventListener("dragover", handleDragover);
    tasksEl.addEventListener("drop", handleDrop);
});

modal.addEventListener("submit", () => {
    if (currentTask) {
        stopTaskCountdown(currentTask);
        currentTask.remove();
        observeTaskChanges();
        
        // *CHIAMATA AGGIUNTA:* Salva lo stato dopo l'eliminazione
        saveTasks();
    }
});
modal.querySelector("#cancel").addEventListener("click", () => modal.close());
modal.addEventListener("close", () => (currentTask = null));

// --- Inizializzazione del DOM (Modificata) ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inizializza la struttura vuota delle colonne
    initializeColumns(); 
    
    // 2. Carica le task salvate da localStorage
    loadTasks();
    
    // 3. Collega gli eventi FAB
    const fabCategoryBtn = document.getElementById('NuovaCategoria');
    if (fabCategoryBtn) {
        fabCategoryBtn.addEventListener('click', handleAddCategory);
    }
    
    const fabTaskBtn = document.querySelector('[data-add="NuovaTask"]');
    if (fabTaskBtn) {
        fabTaskBtn.addEventListener('click', handleAddTaskFromFab);
    }
});