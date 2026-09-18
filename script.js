// ---- Data ----
// Each task is an object, not just a string, so we can track its state
// (id, text, completed) independently and re-render from this array
// whenever anything changes.

const STORAGE_KEY = "taskManager.tasks";

let tasks = loadTasks();
let currentFilter = "all"; // "all" | "active" | "completed"

// ---- DOM references ----

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const emptyState = document.getElementById("emptyState");
const clearCompletedBtn = document.getElementById("clearCompleted");
const filterButtons = document.querySelectorAll(".filter-btn");

// ---- Storage ----

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Could not load saved tasks:", err);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error("Could not save tasks:", err);
  }
}

// ---- Rendering ----
// Every change (add/toggle/delete/edit) updates the `tasks` array,
// then calls render() to redraw the whole list from that array.
// This keeps the DOM and the data in sync with a single source of truth.

function render() {
  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  taskList.innerHTML = "";

  visibleTasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " completed" : "");
    li.dataset.id = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;
    text.title = "Click to edit";
    text.addEventListener("click", () => editTask(task.id, text));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.setAttribute("aria-label", "Delete task");
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });

  // Empty state: distinguish "no tasks at all" from "no tasks in this filter"
  const noTasksAtAll = tasks.length === 0;
  const noTasksInFilter = visibleTasks.length === 0;

  emptyState.classList.toggle("visible", noTasksInFilter);
  emptyState.textContent = noTasksAtAll
    ? "Nothing here yet. Add your first task above."
    : `No ${currentFilter} tasks.`;

  // Counter
  const activeCount = tasks.filter((t) => !t.completed).length;
  if (tasks.length === 0) {
    taskCount.textContent = "No tasks yet";
  } else {
    taskCount.textContent = `${activeCount} of ${tasks.length} remaining`;
  }

  // Clear completed button only shows if there's something to clear
  const hasCompleted = tasks.some((t) => t.completed);
  clearCompletedBtn.classList.toggle("visible", hasCompleted);

  saveTasks();
}

// ---- Actions ----

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  tasks.push({
    id: Date.now(),
    text: trimmed,
    completed: false,
  });

  render();
}

function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  render();
}

function editTask(id, element) {
  element.contentEditable = "true";
  element.focus();

  // Select all existing text so typing replaces it
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  function finishEdit() {
    element.contentEditable = "false";
    const newText = element.textContent.trim();

    if (newText === "") {
      deleteTask(id); // empty edit removes the task
      return;
    }

    tasks = tasks.map((task) =>
      task.id === id ? { ...task, text: newText } : task
    );
    render();
  }

  element.addEventListener("blur", finishEdit, { once: true });
  element.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      element.blur();
    }
    if (e.key === "Escape") {
      element.textContent = tasks.find((t) => t.id === id).text;
      element.blur();
    }
  });
}

function clearCompleted() {
  tasks = tasks.filter((task) => !task.completed);
  render();
}

function setFilter(filter) {
  currentFilter = filter;
  filterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
  render();
}

// ---- Event listeners ----

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addTask(taskInput.value);
  taskInput.value = "";
  taskInput.focus();
});

clearCompletedBtn.addEventListener("click", clearCompleted);

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
});

// ---- Initial render ----

render();
