
// ==========================================
// STUDENT TASK MANAGER
// ==========================================

// Getting HTML Elements
const taskForm = document.getElementById("taskForm");
const taskName = document.getElementById("taskName");
const category = document.getElementById("category");
const priority = document.getElementById("priority");
const dueDate = document.getElementById("dueDate");

const taskList = document.getElementById("taskList");

const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const pendingTasks = document.getElementById("pendingTasks");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const categoryFilter = document.getElementById("categoryFilter");
const sortTasks = document.getElementById("sortTasks");

const submitBtn = document.getElementById("submitBtn");
const cancelEdit = document.getElementById("cancelEdit");
const formTitle = document.getElementById("formTitle");
const themeToggle = document.getElementById("themeToggle");

// ==========================================
// INITIAL DATA
// ==========================================

// Load tasks from localStorage
function loadTasks() {
    try {
        const savedTasks = localStorage.getItem("studentTasks");
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];

        return Array.isArray(parsedTasks) ? parsedTasks : [];
    } catch (error) {
        console.error("Could not load tasks:", error);
        return [];
    }
}

let tasks = loadTasks();

let editingId = null;
let draggedId = null;

// ==========================================
// SAVE TASKS
// ==========================================

function saveTasks() {
    localStorage.setItem("studentTasks", JSON.stringify(tasks));
}

// ==========================================
// GENERATE UNIQUE ID
// ==========================================

function generateId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return Date.now().toString() + Math.random().toString(16).slice(2);
}

// ==========================================
// ADD AND EDIT TASKS
// ==========================================

taskForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const name = taskName.value.trim();
    const selectedCategory = category.value;
    const selectedPriority = priority.value;
    const date = dueDate.value;

    if (!name || !date) {
        alert("Please enter a task name and due date.");
        return;
    }

    if (editingId !== null) {

        // Update existing task
        const task = tasks.find(t => t.id === editingId);

        if (task) {
            task.name = name;
            task.category = selectedCategory;
            task.priority = selectedPriority;
            task.dueDate = date;
        }

        editingId = null;

    } else {

        // Create new task
        const newTask = {
            id: generateId(),
            name: name,
            category: selectedCategory,
            priority: selectedPriority,
            dueDate: date,
            completed: false
        };

        tasks.push(newTask);
    }

    saveTasks();
    resetForm();
    displayTasks();
});

// ==========================================
// RESET FORM
// ==========================================

function resetForm() {

    taskForm.reset();

    editingId = null;

    formTitle.textContent = "Add New Task";
    submitBtn.textContent = "Add Task";

    cancelEdit.hidden = true;

    priority.value = "Medium";
}

// ==========================================
// EDIT TASK
// ==========================================

function editTask(id) {

    const task = tasks.find(t => t.id === id);

    if (!task) return;

    taskName.value = task.name;
    category.value = task.category;
    priority.value = task.priority;
    dueDate.value = task.dueDate;

    editingId = id;

    formTitle.textContent = "Edit Task";
    submitBtn.textContent = "Update Task";

    cancelEdit.hidden = false;

    taskName.focus();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// Cancel editing
cancelEdit.addEventListener("click", resetForm);

// ==========================================
// DELETE TASK
// ==========================================

function deleteTask(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmDelete) return;

    tasks = tasks.filter(task => task.id !== id);

    if (editingId === id) {
        resetForm();
    }

    saveTasks();
    displayTasks();
}

// ==========================================
// MARK TASK COMPLETED OR PENDING
// ==========================================

function toggleTask(id) {

    const task = tasks.find(t => t.id === id);

    if (!task) return;

    task.completed = !task.completed;

    saveTasks();
    displayTasks();
}

// ==========================================
// UPDATE DASHBOARD STATISTICS
// ==========================================

function updateStatistics() {

    const total = tasks.length;

    const completed = tasks.filter(
        task => task.completed
    ).length;

    const pending = total - completed;

    totalTasks.textContent = total;
    completedTasks.textContent = completed;
    pendingTasks.textContent = pending;
}

// ==========================================
// DISPLAY TASKS
// ==========================================

function displayTasks() {

    taskList.innerHTML = "";

    updateStatistics();

    let filteredTasks = [...tasks];

    // Search by task name
    const searchText = searchInput.value.toLowerCase().trim();

    filteredTasks = filteredTasks.filter(task =>
        task.name.toLowerCase().includes(searchText)
    );

    // Filter by completion status
    const selectedStatus = statusFilter.value;

    if (selectedStatus === "Completed") {

        filteredTasks = filteredTasks.filter(
            task => task.completed
        );

    } else if (selectedStatus === "Pending") {

        filteredTasks = filteredTasks.filter(
            task => !task.completed
        );
    }

    // Filter by category
    const selectedCategory = categoryFilter.value;

    if (selectedCategory !== "All") {

        filteredTasks = filteredTasks.filter(
            task => task.category === selectedCategory
        );
    }

    // Sort by due date
    if (sortTasks.value === "date") {

        filteredTasks.sort((a, b) =>
            a.dueDate.localeCompare(b.dueDate)
        );

    }

    // Sort by priority
    else if (sortTasks.value === "priority") {

        const priorityOrder = {
            High: 1,
            Medium: 2,
            Low: 3
        };

        filteredTasks.sort((a, b) =>
            priorityOrder[a.priority] - priorityOrder[b.priority]
        );
    }

    // Show message when no tasks exist
    if (filteredTasks.length === 0) {

        const message = document.createElement("p");
        message.className = "empty-message";
        message.textContent = "No tasks found. Add a new task!";

        taskList.appendChild(message);
        return;
    }

    // Display each task
    filteredTasks.forEach(task => {

        const card = document.createElement("div");

        card.className = "task-card";

        // Check whether task is overdue
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        const todayString = `${year}-${month}-${day}`;

        const isOverdue =
            !task.completed && task.dueDate < todayString;

        if (task.completed) {
            card.classList.add("completed");
        }

        if (isOverdue) {
            card.classList.add("overdue");
        }

        // Drag and drop is enabled only in default order
        card.draggable = sortTasks.value === "default";

        // Task information
        const info = document.createElement("div");
        info.className = "task-info";

        const heading = document.createElement("h3");
        heading.textContent = task.name;

        const categoryText = document.createElement("p");
        categoryText.textContent = "Category: " + task.category;

        const priorityText = document.createElement("p");
        priorityText.className = "priority " + task.priority;
        priorityText.textContent = "Priority: " + task.priority;

        const dateText = document.createElement("p");
        dateText.textContent = "Due Date: " + task.dueDate;

        if (isOverdue) {
            dateText.textContent += " - OVERDUE!";
            dateText.classList.add("overdue-text");
        }

        if (task.completed) {
            dateText.textContent += " - Completed";
        }

        info.appendChild(heading);
        info.appendChild(categoryText);
        info.appendChild(priorityText);
        info.appendChild(dateText);

        // Task action buttons
        const actions = document.createElement("div");
        actions.className = "task-actions";

        const completeButton = document.createElement("button");
        completeButton.className = "complete-btn";
        completeButton.textContent =
            task.completed ? "Undo" : "Complete";

        completeButton.addEventListener("click", () => {
            toggleTask(task.id);
        });

        const editButton = document.createElement("button");
        editButton.className = "edit-btn";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            editTask(task.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });

        actions.appendChild(completeButton);
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        card.appendChild(info);
        card.appendChild(actions);

        // Drag and drop events
        card.addEventListener("dragstart", function(event) {

            draggedId = task.id;

            card.classList.add("dragging");

            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", task.id);
        });

        card.addEventListener("dragend", function() {

            draggedId = null;

            document.querySelectorAll(".task-card").forEach(item => {
                item.classList.remove("dragging", "drag-over");
            });
        });

        card.addEventListener("dragover", function(event) {

            event.preventDefault();

            if (draggedId !== task.id) {
                card.classList.add("drag-over");
            }
        });

        card.addEventListener("dragleave", function() {
            card.classList.remove("drag-over");
        });

        card.addEventListener("drop", function(event) {

            event.preventDefault();

            const sourceId = event.dataTransfer.getData("text/plain");

            if (!sourceId || sourceId === task.id) return;

            const fromIndex = tasks.findIndex(
                t => t.id === sourceId
            );

            const toIndex = tasks.findIndex(
                t => t.id === task.id
            );

            if (fromIndex === -1 || toIndex === -1) return;

            const [movedTask] = tasks.splice(fromIndex, 1);

            tasks.splice(toIndex, 0, movedTask);

            saveTasks();
            displayTasks();
        });

        taskList.appendChild(card);
    });
}

// ==========================================
// SEARCH TASKS
// ==========================================

searchInput.addEventListener("input", displayTasks);

// ==========================================
// FILTER TASKS
// ==========================================

statusFilter.addEventListener("change", displayTasks);

categoryFilter.addEventListener("change", displayTasks);

// ==========================================
// SORT TASKS
// ==========================================

sortTasks.addEventListener("change", displayTasks);

// ==========================================
// DARK MODE
// ==========================================

function loadTheme() {

    const savedTheme = localStorage.getItem("studentTheme");

    if (savedTheme === "dark") {

        document.body.classList.add("dark");
        themeToggle.textContent = "☀️ Light Mode";

    } else {

        document.body.classList.remove("dark");
        themeToggle.textContent = "🌙 Dark Mode";
    }
}

themeToggle.addEventListener("click", function() {

    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    localStorage.setItem(
        "studentTheme",
        isDark ? "dark" : "light"
    );

    themeToggle.textContent = isDark
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";
});

// ==========================================
// INITIALIZE APPLICATION
// ==========================================

loadTheme();
displayTasks();
