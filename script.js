const STORAGE_KEY = "todo-list-student-project-tasks";

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const summary = document.querySelector("#task-summary");
const emptyState = document.querySelector("#empty-state");
const filterButtons = document.querySelectorAll("[data-filter]");
const clearCompletedButton = document.querySelector("#clear-completed");

let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored.filter(task =>
      task && typeof task.id === "string" && typeof task.title === "string"
      && typeof task.completed === "boolean"
    ) : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    summary.textContent = "Unable to save tasks in this browser";
  }
}

function makeButton(label, className, action, task) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = className;
  button.addEventListener("click", () => action(task));
  return button;
}

function renderTasks() {
  taskList.replaceChildren();
  const visibleTasks = tasks.filter(task => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  visibleTasks.forEach(task => {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " completed" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark "${task.title}" completed`);
    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const actions = document.createElement("div");
    actions.className = "item-actions";
    actions.append(
      makeButton("Edit", "edit", editTask, task),
      makeButton("Delete", "delete", deleteTask, task)
    );

    item.append(checkbox, title, actions);
    taskList.append(item);
  });

  const remaining = tasks.filter(task => !task.completed).length;
  summary.textContent = `${remaining} active · ${tasks.length} total`;
  emptyState.hidden = visibleTasks.length > 0;
  emptyState.textContent = tasks.length === 0
    ? "No tasks yet. Add your first task above!"
    : "No tasks in this filter.";
  filterButtons.forEach(button => {
    const active = button.dataset.filter === currentFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  tasks.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, title, completed: false });
  saveTasks();
  input.value = "";
  currentFilter = "all";
  renderTasks();
  input.focus();
});

function editTask(task) {
  const item = [...taskList.children].find(element =>
    element.querySelector(".task-title")?.textContent === task.title
  );
  if (!item) return;
  const title = item.querySelector(".task-title");
  const editInput = document.createElement("input");
  editInput.className = "edit-input";
  editInput.value = task.title;
  editInput.maxLength = 160;
  editInput.setAttribute("aria-label", "Edit task");
  title.replaceWith(editInput);
  editInput.focus();
  editInput.select();

  const finish = save => {
    if (save && editInput.value.trim()) task.title = editInput.value.trim();
    saveTasks();
    renderTasks();
  };
  editInput.addEventListener("keydown", event => {
    if (event.key === "Enter") finish(true);
    if (event.key === "Escape") finish(false);
  });
  editInput.addEventListener("blur", () => finish(true), { once: true });
}

function deleteTask(task) {
  tasks = tasks.filter(item => item.id !== task.id);
  saveTasks();
  renderTasks();
}

filterButtons.forEach(button => button.addEventListener("click", () => {
  currentFilter = button.dataset.filter;
  renderTasks();
}));

clearCompletedButton.addEventListener("click", () => {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  renderTasks();
});

renderTasks();
