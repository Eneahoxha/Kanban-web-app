document.addEventListener('DOMContentLoaded', () => {
    // Selettori aggiornati per l'HTML modificato
    const columnsContainer = document.getElementById("columns-container"); 
    const confirmDeleteModal = document.querySelector(".confirm-modal");
    const categoryModal = document.getElementById("category-modal"); 
    const createTaskModal = document.getElementById("create-task-modal");

    let currentTask = null; // Task being deleted
    let targetColumnTasksContainer = null; // Tasks container to add a new task to

    const STORAGE_KEY = 'kanbanData'; // Updated key for new structure

    // UTILITY FUNCTIONS
    const formatTime = (value) => (value < 10 ? `0${value}` : value);

    // --- DATA PERSISTENCE ---
    const saveData = () => {
        const data = {
            columns: [],
        };
        // Seleziona gli elementi colonna creati dinamicamente
        columnsContainer.querySelectorAll('.column').forEach((column) => { 
            const columnData = {
                id: column.dataset.id,
                name: column.querySelector('.column-title h3').textContent,
                isRemovable: column.dataset.removable === 'true',
                tasks: [],
            };

            column.querySelectorAll('.task').forEach(taskElement => {
                const taskTitle = taskElement.querySelector('.card-title').textContent.trim();
                const dueDate = taskElement.querySelector('.task-countdown')?.getAttribute('data-due-date') || null;
                columnData.tasks.push({ title: taskTitle, dueDate });
            });
            data.columns.push(columnData);
        });

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Error saving to localStorage:", e);
        }
    };

    // --- TASK & COLUMN MANIPULATION ---
    const updateTaskColor = (taskElement) => {
        // Usa alert-success, alert-warning, alert-error come richiesto
        taskElement.classList.remove('alert-success', 'alert-warning', 'alert-error', 'text-white', 'bg-red-800');
        taskElement.classList.add('bg-base-100'); // Default background

        const countdownElement = taskElement.querySelector('.task-countdown');
        const dueDateString = countdownElement?.getAttribute('data-due-date');
        const isDone = taskElement.closest('[data-id="done-col"]'); 
        const isExpired = taskElement.closest('[data-id="expired-col"]'); 

        // 1. Task Completata
        if (isDone) {
            taskElement.classList.add('alert', 'alert-success', 'text-white');
            taskElement.classList.remove('bg-base-100');
            if (countdownElement) countdownElement.innerHTML = `<i class="bi bi-check-circle-fill"></i> Completata`;
            return;
        }

        // 2. Task Scaduta
        if (isExpired) {
            taskElement.classList.add('alert', 'alert-error', 'text-white');
            taskElement.classList.remove('bg-base-100');
            if (countdownElement) countdownElement.innerHTML = `<i class="bi bi-x-circle-fill"></i> Scaduta`;
            return;
        }
        
        if (!dueDateString) return;

        const distance = new Date(dueDateString).getTime() - new Date().getTime();
        
        // 3. Task in Scadenza (Warning/Orange)
        if (distance > 0 && distance <= 7 * 24 * 60 * 60 * 1000) { // Meno di 7 giorni
            taskElement.classList.add('alert', 'alert-warning');
            taskElement.classList.remove('bg-base-100');
        } 
        // 4. Task con Scadenza Lontana (Success/Green)
        else if (distance > 7 * 24 * 60 * 60 * 1000) {
             taskElement.classList.add('alert', 'alert-success', 'text-white');
             taskElement.classList.remove('bg-base-100');
        }
        // 5. Task Scaduta (anche se non ancora spostata)
        else if (distance <= 0) {
            taskElement.classList.add('alert', 'alert-error', 'text-white');
            taskElement.classList.remove('bg-base-100');
        }
    };

    const stopTaskCountdown = (taskElement) => {
        const countdownElement = taskElement.querySelector('.task-countdown');
        if (countdownElement && countdownElement.timerId) {
            clearInterval(countdownElement.timerId);
            delete countdownElement.timerId;
        }
    };

    /**
     * Controlla se una task è scaduta e la sposta nella colonna "Expired" se necessario.
     * @param {HTMLElement} taskElement - L'elemento task.
     * @param {number} distance - La distanza in millisecondi dalla data di scadenza.
     * @returns {boolean} True se la task è stata spostata, False altrimenti.
     */
    const checkAndMoveExpiredTask = (taskElement, distance) => {
        // Non muovere se è già in Done o Expired
        if (taskElement.closest('[data-id="done-col"]') || taskElement.closest('[data-id="expired-col"]')) return false;

        if (distance <= 0) {
            stopTaskCountdown(taskElement);
            // Seleziona il div tasks all'interno della colonna expired
            const expiredColumn = columnsContainer.querySelector('[data-id="expired-col"] .tasks'); 
            if (expiredColumn) {
                expiredColumn.appendChild(taskElement);
                updateTaskColor(taskElement);
                saveData();
                return true;
            }
        }
        return false;
    };

    // FUNZIONE DI COUNTDOWN MODIFICATA
    const updateCountdown = (taskElement) => {
        const countdownElement = taskElement.querySelector('.task-countdown');
        if (!countdownElement) return;
        const dueDateString = countdownElement.getAttribute('data-due-date');
        if (!dueDateString) return;

        const targetDate = new Date(dueDateString).getTime();
        let distance = targetDate - new Date().getTime();

        // **Punto chiave per lo spostamento automatico:**
        // Se la task è scaduta, viene spostata qui e la funzione si ferma.
        if (checkAndMoveExpiredTask(taskElement, distance)) return;

        if (distance < 0) {
            if (countdownElement.timerId) clearInterval(countdownElement.timerId);
            updateTaskColor(taskElement);
            countdownElement.innerHTML = `<i class="bi bi-x-circle-fill"></i> Scaduta!`;
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // NUOVA STRUTTURA: Visualizzazione countdown
        countdownElement.innerHTML = `
            <div class="grid grid-flow-col gap-2 text-center auto-cols-max justify-center">
                <div class="flex flex-col">
                    <span class="font-mono text-xl">${days}</span>
                    <span class="text-xs opacity-70">gg</span>
                </div> 
                <div class="text-xl font-mono">:</div>
                <div class="flex flex-col">
                    <span class="font-mono text-xl">${formatTime(hours)}</span>
                    <span class="text-xs opacity-70">ore</span>
                </div> 
                <div class="text-xl font-mono">:</div>
                <div class="flex flex-col">
                    <span class="font-mono text-xl">${formatTime(minutes)}</span>
                    <span class="text-xs opacity-70">min</span>
                </div>
                <div class="text-xl font-mono">:</div> 
                <div class="flex flex-col">
                    <span class="font-mono text-xl">${formatTime(seconds)}</span>
                    <span class="text-xs opacity-70">sec</span>
                </div>
            </div>
        `;
        // La colorazione viene aggiornata ogni secondo
        updateTaskColor(taskElement); 
    };
    // FINE FUNZIONE DI COUNTDOWN MODIFICATA

    const startTaskCountdown = (taskElement) => {
        const countdownElement = taskElement.querySelector('.task-countdown');
        if (!countdownElement || !countdownElement.getAttribute('data-due-date')) return;

        // Esegui un check immediato
        const distance = new Date(countdownElement.getAttribute('data-due-date')).getTime() - new Date().getTime();
        
        // Se non è stata spostata (cioè non è scaduta o è già in Done/Expired), avvia il timer.
        if (!checkAndMoveExpiredTask(taskElement, distance)) {
            updateCountdown(taskElement);
            if (countdownElement.timerId) clearInterval(countdownElement.timerId);
            countdownElement.timerId = setInterval(() => updateCountdown(taskElement), 1000);
        }
    };

    const createTask = (content, dueDate = null) => {
        const task = document.createElement("div");
        task.className = "task card w-full shadow-md mb-2 card-compact"; 
        task.draggable = true;

        const countdownHTML = dueDate ? `
            <div class="task-countdown mt-2" data-due-date="${dueDate}">
            </div>
        ` : '';

        task.innerHTML = `
            <div class="card-body p-3">
                <h2 class="card-title text-sm">${content}</h2>
                ${countdownHTML}
                <div class="justify-end card-actions mt-2">
                    <button data-edit class="btn btn-info btn-xs"><i class="bi bi-pencil-square"></i></button>
                    <button data-delete class="btn btn-error btn-xs"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        `;

        task.addEventListener("dragstart", handleDragstart);
        task.addEventListener("dragend", handleDragend);

        if (dueDate) startTaskCountdown(task);
        else updateTaskColor(task);
        
        return task;
    };

    function createCategory({ id, name, isRemovable = false }, tasks = []) {
        const col = document.createElement("div");
        col.className = "column w-full"; 
        col.dataset.id = id;
        col.dataset.removable = isRemovable;

        const removeBtnHTML = isRemovable ? '<button class="remove-category-btn btn btn-xs btn-circle btn-error absolute top-2 right-2">✕</button>' : '';
        const addBtnHTML = id !== 'expired-col' ? '<button class="btn btn-sm btn-info mt-3 add-task-btn">Aggiungi Task</button>' : '';

        // min-h-[40px] aggiunto per dare un'area droppable anche alle colonne vuote
        col.innerHTML = ` 
            <div class="card bg-base-200 rounded-box p-4">
                <div class="column-title relative">
                    <h3 class="font-semibold mb-2">${name}</h3>
                    ${removeBtnHTML}
                </div>
                <div class="tasks flex flex-col gap-3 max-h-80 overflow-y-auto min-h-[40px]"></div>
                ${addBtnHTML}
            </div>
        `;

        const tasksEl = col.querySelector(".tasks");
        tasks.forEach(taskData => tasksEl.appendChild(createTask(taskData.title, taskData.dueDate)));
        
        // L'evento dragover deve essere sull'elemento .tasks (il container droppable)
        tasksEl.addEventListener("dragover", handleDragover);
        tasksEl.addEventListener("drop", handleDrop);
        
        return col;
    }

    // --- DRAG & DROP HANDLERS ---
    const handleDragstart = (event) => {
        // Impedisci di iniziare il trascinamento da una task nella colonna "Expired"
        if (event.target.closest('[data-id="expired-col"]')) {
            event.preventDefault();
            return;
        }
        event.dataTransfer.effectsAllowed = "move";
        event.dataTransfer.setData("text/plain", "");
        requestAnimationFrame(() => event.target.classList.add("dragging"));
    };

    const handleDragend = (event) => {
        event.target.classList.remove("dragging");
        saveData();
    };

    const getDragAfterElement = (container, y) => {
        const draggableElements = [...container.querySelectorAll('.task:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    };

    const handleDragover = (event) => {
        event.preventDefault();
        const draggedTask = document.querySelector(".dragging");
        if (!draggedTask) return;

        const targetColumn = event.target.closest('.column');
        
        // 1. Impedisci il drop NELLA colonna "Expired" (se la task non è già lì)
        if (targetColumn && targetColumn.dataset.id === 'expired-col') {
             // Solo le task già scadute (o non in dragging) possono rimanere qui.
             // Ma blocchiamo attivamente il drag-in da altre colonne.
             if (!draggedTask.closest('[data-id="expired-col"]')) {
                 event.dataTransfer.dropEffect = "none";
                 return; 
             }
        }
        
        event.dataTransfer.dropEffect = "move";

        // Trova il container di task più vicino, che è la nostra area di rilascio
        const taskContainer = event.target.closest('.tasks');
        
        if (taskContainer) {
            // Logica per posizionare la task tra due elementi
            const afterElement = getDragAfterElement(taskContainer, event.clientY);
            if (afterElement == null) {
                // Se non ci sono elementi dopo (o colonna vuota), aggiungila in fondo
                taskContainer.appendChild(draggedTask);
            } else {
                // Inseriscila prima dell'elemento 'after'
                taskContainer.insertBefore(draggedTask, afterElement);
            }
        } else if (targetColumn) {
            // Se si trascina su un elemento della colonna ma non su un'altra task
            const tasksEl = targetColumn.querySelector('.tasks');
            if (tasksEl) {
                // Aggiungila in fondo al contenitore .tasks della colonna
                tasksEl.appendChild(draggedTask); 
            }
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const draggedTask = document.querySelector(".dragging");
        if (draggedTask) {
            stopTaskCountdown(draggedTask);
            startTaskCountdown(draggedTask);
            saveData();
        }
    };

    // --- EVENT HANDLERS & INITIALIZATION ---
    const handleEdit = (event) => {
        const task = event.target.closest(".task");
        const taskTitleEl = task.querySelector('.card-title');
        const currentTitle = taskTitleEl.textContent;
        
        const input = document.createElement('textarea');
        input.className = 'textarea textarea-bordered w-full';
        input.value = currentTitle;
        
        taskTitleEl.replaceWith(input);
        input.focus();
        // Permetti di uscire dalla modalità modifica anche con Invio/Enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur(); 
            }
        });
        input.addEventListener('blur', () => {
            const newTitle = input.value.trim() || 'Untitled';
            const newTitleEl = document.createElement('h2');
            newTitleEl.className = 'card-title text-sm';
            newTitleEl.textContent = newTitle;
            input.replaceWith(newTitleEl);
            saveData();
        }, { once: true });
    };

    const handleDelete = (event) => {
        currentTask = event.target.closest(".task");
        confirmDeleteModal.querySelector(".preview").textContent = currentTask.querySelector('.card-title').textContent.substring(0, 100);
        confirmDeleteModal.showModal();
    };

    const loadData = () => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        let data;
        
        // Definizioni di default per robustezza
        const defaultColumns = [
            { id: "todo-col", name: "To Do", isRemovable: false, tasks: [] },
            { id: "inprogress-col", name: "In Progress", isRemovable: false, tasks: [] },
            { id: "forreview-col", name: "For Review", isRemovable: false, tasks: [] },
            { id: "done-col", name: "Done", isRemovable: false, tasks: [] },
            { id: "expired-col", name: "Expired", isRemovable: false, tasks: [] }
        ];

        try {
            data = savedData ? JSON.parse(savedData) : { columns: [] };
            
            // Logica per assicurare che le colonne obbligatorie esistano
            if (!data.columns || data.columns.length === 0 || !data.columns.some(col => col.id === 'expired-col')) {
                 if (data.columns.length > 0) {
                     const existingIds = new Set(data.columns.map(c => c.id));
                     defaultColumns.forEach(defCol => {
                         if (!existingIds.has(defCol.id)) {
                             data.columns.push(defCol);
                         }
                     });
                 } else {
                     data.columns = defaultColumns;
                 }
            }
        } catch (e) {
            console.error("Failed to parse localStorage data:", e);
            data = { columns: defaultColumns };
        }

        columnsContainer.innerHTML = '';
        data.columns.forEach(columnData => {
            const columnEl = createCategory(columnData, columnData.tasks);
            columnsContainer.appendChild(columnEl);
        });
    };

    // --- MAIN EVENT LISTENERS ---
    
    // Mostra modale Aggiungi Categoria
    const addColumnButton = document.getElementById('add-column-btn'); 
    if(addColumnButton) {
        addColumnButton.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('category-name-input').value = ''; // Resetta input
            categoryModal.showModal();
        });
    }

    // Gestione della creazione di una Nuova Categoria
    document.getElementById('category-form').addEventListener('submit', (e) => { 
        e.preventDefault();
        const input = document.getElementById('category-name-input');
        const name = input.value.trim();
        if (name) {
            const newColumnData = {
                id: `custom-col-${Date.now()}`,
                name: name,
                isRemovable: true,
            };
            const newColumn = createCategory(newColumnData, []);
            columnsContainer.appendChild(newColumn);
            saveData();
            input.value = '';
            categoryModal.close();
        }
    });

    document.getElementById('category-cancel').addEventListener('click', () => categoryModal.close());

    // Gestione della creazione di una Nuova Task
    createTaskModal.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const titleInput = document.getElementById('task-title');
        const dueDateInput = document.getElementById('task-due-date');
        const title = titleInput.value.trim();

        if (title && targetColumnTasksContainer) {
            const newTask = createTask(title, dueDateInput.value);
            targetColumnTasksContainer.appendChild(newTask);
            saveData();
        }
        titleInput.value = '';
        dueDateInput.value = '';
        createTaskModal.close();
        targetColumnTasksContainer = null;
    });

    document.getElementById('create-cancel').addEventListener('click', () => createTaskModal.close());

    // Listener delegato per i bottoni all'interno delle colonne
    columnsContainer.addEventListener('click', (e) => {
        // Logica per i bottoni "Add Task" nelle colonne (Creazione Task)
        if (e.target.matches('.add-task-btn')) {
            const cardBody = e.target.closest('.card');
            targetColumnTasksContainer = cardBody ? cardBody.querySelector('.tasks') : null;
            
            if (targetColumnTasksContainer) {
                 document.getElementById('task-title').value = '';
                 document.getElementById('task-due-date').value = '';
                 createTaskModal.showModal();
            }
        }
        // Logica per la rimozione di una Categoria
        if (e.target.matches('.remove-category-btn')) {
            e.target.closest('.column').remove(); 
            saveData();
        }
        // Logica per l'Edit di una Task
        if (e.target.closest('button[data-edit]')) {
            handleEdit(e);
        }
        // Logica per la Delete di una Task
        if (e.target.closest('button[data-delete]')) {
            handleDelete(e);
        }
    });

    // Gestione del modale di conferma cancellazione
    confirmDeleteModal.addEventListener("submit", (e) => {
        e.preventDefault();
        if (currentTask) {
            stopTaskCountdown(currentTask);
            currentTask.remove();
            saveData();
            confirmDeleteModal.close();
        }
    });

    confirmDeleteModal.querySelector("#cancel").addEventListener("click", () => confirmDeleteModal.close());
    confirmDeleteModal.addEventListener("close", () => (currentTask = null));

    // Initial Load
    loadData();
});