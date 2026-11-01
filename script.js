// Лабораторна робота №20
// Список справ із Firebase Realtime Database

const DATABASE_URL =
  'https://todo-list-lab20-default-rtdb.europe-west1.firebasedatabase.app';

const TODOS_URL = `${DATABASE_URL}/todos.json`;

const list = document.getElementById('todo-list');
const itemCountSpan = document.getElementById('item-count');
const uncheckedCountSpan = document.getElementById('unchecked-count');
const emptyMessage = document.getElementById('empty-message');
const statusBox = document.getElementById('status');
const errorBox = document.getElementById('error');
const addButton = document.getElementById('add-button');

let todos = [];
let busy = false;

// Повідомлення про завантаження
function setLoading(message) {
  busy = true;

  statusBox.textContent = message;
  statusBox.hidden = false;

  addButton.disabled = true;

  list.querySelectorAll('button, input').forEach(element => {
    element.disabled = true;
  });
}

// Завершення завантаження
function finishLoading() {
  busy = false;

  statusBox.hidden = true;
  addButton.disabled = false;

  render(todos);
  updateCounter();
}

// Повідомлення про помилку
function showError(error) {
  errorBox.textContent =
    `Помилка роботи з базою даних: ${error.message}`;

  errorBox.hidden = false;

  console.error(error);
}

// Очищення повідомлення про помилку
function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = '';
}

// Виконання HTTP-запиту
function request(url, options) {
  return fetch(url, options)
    .then(response => {
      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: перевірте адресу бази та правила доступу`
        );
      }

      return response.json();
    });
}

// POST — додавання нової справи
function addTodo(todo) {
  return request(TODOS_URL, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify(todo)
  });
}

// GET — отримання справ із Firebase
function getTodos() {
  return request(TODOS_URL)
    .then(data => {
      if (!data) {
        return [];
      }

      return Object.entries(data)
        .filter(([, value]) =>
          value && typeof value.text === 'string'
        )
        .map(([id, value]) => ({
          id: id,
          text: value.text,
          completed: value.completed === true
        }));
    });
}

// DELETE — видалення справи
function removeTodo(id) {
  const url =
    `${DATABASE_URL}/todos/${encodeURIComponent(id)}.json`;

  return request(url, {
    method: 'DELETE'
  });
}

// PATCH — оновлення справи
function updateTodo(id, changes) {
  const url =
    `${DATABASE_URL}/todos/${encodeURIComponent(id)}.json`;

  return request(url, {
    method: 'PATCH',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify(changes)
  });
}

// Створення нової справи
function newTodo() {
  if (busy) {
    return;
  }

  const input = prompt('Введіть назву нової справи:');

  if (input === null) {
    return;
  }

  const text = input.trim();

  if (!text) {
    alert('Назва справи не може бути порожньою.');
    return;
  }

  clearError();
  setLoading('Збереження нової справи...');

  addTodo({
    text: text,
    completed: false
  })
    .then(result => {
      if (!result || typeof result.name !== 'string') {
        throw new Error('Firebase не повернула ключ name');
      }

      todos.push({
        id: result.name,
        text: text,
        completed: false
      });
    })
    .catch(showError)
    .finally(finishLoading);
}

// Захист тексту від HTML-вставок
function escapeHTML(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Створення HTML для однієї справи
function renderTodo(todo) {
  return `
    <li class="list-group-item d-flex align-items-center gap-2">

      <input
        class="form-check-input mt-0"
        type="checkbox"
        data-action="check"
        data-id="${todo.id}"
        id="todo-${todo.id}"
        ${todo.completed ? 'checked' : ''}
      >

      <label
        class="flex-grow-1 todo-text"
        for="todo-${todo.id}"
      >
        <span class="${
          todo.completed
            ? 'text-success text-decoration-line-through'
            : ''
        }">
          ${escapeHTML(todo.text)}
        </span>
      </label>

      <button
        class="btn btn-outline-danger btn-sm"
        type="button"
        data-action="delete"
        data-id="${todo.id}"
      >
        Видалити
      </button>

    </li>
  `;
}

// Відображення списку справ
function render(items) {
  list.innerHTML = items.map(renderTodo).join('');

  emptyMessage.hidden = items.length > 0;
}

// Оновлення лічильників
function updateCounter() {
  itemCountSpan.textContent = todos.length;

  uncheckedCountSpan.textContent =
    todos.filter(todo => !todo.completed).length;
}

// Видалення справи
function deleteTodo(id) {
  if (busy) {
    return;
  }

  clearError();
  setLoading('Видалення справи...');

  removeTodo(id)
    .then(() => {
      todos = todos.filter(todo => todo.id !== id);
    })
    .catch(showError)
    .finally(finishLoading);
}

// Зміна статусу справи
function checkTodo(id) {
  if (busy) {
    return;
  }

  const todo = todos.find(item => item.id === id);

  if (!todo) {
    return;
  }

  clearError();
  setLoading('Оновлення справи...');

  const completed = !todo.completed;

  updateTodo(id, {
    completed: completed
  })
    .then(() => {
      todo.completed = completed;
    })
    .catch(showError)
    .finally(finishLoading);
}

// Обробка натискання на прапорець
list.addEventListener('change', event => {
  const element = event.target.closest(
    '[data-action="check"]'
  );

  if (element) {
    checkTodo(element.dataset.id);
  }
});

// Обробка видалення
list.addEventListener('click', event => {
  const element = event.target.closest(
    '[data-action="delete"]'
  );

  if (element) {
    deleteTodo(element.dataset.id);
  }
});

// Завантаження справ під час відкриття сторінки
function loadTodos() {
  clearError();

  setLoading('Завантаження справ із бази даних...');

  getTodos()
    .then(data => {
      todos = data;
    })
    .catch(showError)
    .finally(finishLoading);
}

// Початковий запуск програми
render(todos);
updateCounter();
loadTodos();