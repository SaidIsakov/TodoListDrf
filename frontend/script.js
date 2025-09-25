// Конфигурация API - используем ваши пути
const API_BASE = 'http://localhost:8001/api/v1';
const REGISTER_URL = `${API_BASE}/user/registration/`;
const LOGIN_URL = `${API_BASE}/user/login/`;
const TASKS_URL = `${API_BASE}/todos/`;

// Токен авторизации
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Проверка авторизации при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.endsWith('todo.html') ||
        window.location.pathname.endsWith('task-detail.html')) {
        checkAuth();
    }

    if (window.location.pathname.endsWith('todo.html')) {
        loadTasks();
        updateUserDisplay();
    }

    if (window.location.pathname.endsWith('task-detail.html')) {
        loadTaskDetail();
    }
});

// ========== АВТОРИЗАЦИЯ ==========

function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

function showLogin() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

// Обработчик формы входа
document.getElementById('login-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(LOGIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            // В зависимости от структуры ответа вашего API
            // Вариант 1: если токен в поле 'access'
            authToken = data.access || data.token;

            // Сохраняем данные пользователя
            currentUser = {
                username: username,
                // Добавьте другие поля, которые возвращает ваш API
            };

            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            window.location.href = 'todo.html';
        } else {
            showError(data.detail || data.message || 'Ошибка входа');
        }
    } catch (error) {
        showError('Ошибка сети: ' + error.message);
    }
});

// Обработчик формы регистрации
document.getElementById('register-form-element')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const password2 = document.getElementById('reg-password2').value;

    if (password !== password2) {
        showRegisterError('Пароли не совпадают');
        return;
    }

    try {
        const response = await fetch(REGISTER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password,
                password2: password2
            })
        });

        const data = await response.json();

        if (response.ok) {
            showLogin();
            showError('Регистрация успешна! Теперь войдите в систему.');
        } else {
            // Обработка ошибок валидации Django
            let errorMessage = 'Ошибка регистрации';
            if (data.username) errorMessage = data.username[0];
            else if (data.email) errorMessage = data.email[0];
            else if (data.password) errorMessage = data.password[0];
            else if (data.detail) errorMessage = data.detail;

            showRegisterError(errorMessage);
        }
    } catch (error) {
        showRegisterError('Ошибка сети: ' + error.message);
    }
});

// ========== ЗАДАЧИ ==========

// Загрузка задач
async function loadTasks() {
    try {
        const response = await fetch(TASKS_URL, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) throw new Error('Ошибка загрузки задач');

        const tasks = await response.json();
        renderTasks(tasks);
        updateStats(tasks);
    } catch (error) {
        console.error('Ошибка:', error);
        if (error.message.includes('401')) {
            logout();
        }
    }
}

// Отрисовка задач
function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    taskList.innerHTML = '';

    // Проверяем, что tasks - массив
    if (!Array.isArray(tasks)) {
        console.error('Ожидался массив задач, получено:', tasks);
        return;
    }

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;

        li.innerHTML = `
            <div class="task-content">
                <div class="task-title ${task.completed ? 'completed' : ''}"
                     onclick="viewTaskDetail(${task.id})">
                    ${task.title}
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                <div class="task-meta">
                    Создана: ${formatDate(task.created_at)}
                    ${task.updated_at !== task.created_at ?
                        ` | Обновлена: ${formatDate(task.updated_at)}` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button onclick="toggleTask(${task.id}, ${task.completed})"
                        class="${task.completed ? 'btn-secondary' : 'btn-primary'}">
                    ${task.completed ? 'Отменить' : 'Выполнить'}
                </button>
                <button onclick="deleteTask(${task.id})" class="btn-danger">Удалить</button>
            </div>
        `;

        taskList.appendChild(li);
    });
}

// Создание задачи
document.getElementById('task-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const title = document.getElementById('task-input').value;
    const description = document.getElementById('task-description').value;

    if (!title.trim()) {
        alert('Введите название задачи');
        return;
    }

    try {
        const response = await fetch(TASKS_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title.trim(),
                description: description.trim(),
                completed: false
            })
        });

        if (response.ok) {
            document.getElementById('task-input').value = '';
            document.getElementById('task-description').value = '';
            loadTasks();
        } else if (response.status === 401) {
            logout();
        } else {
            const errorData = await response.json();
            alert('Ошибка создания задачи: ' + (errorData.detail || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
});

// ========== ДЕТАЛЬНАЯ СТРАНИЦА ==========

function viewTaskDetail(taskId) {
    window.location.href = `task-detail.html?id=${taskId}`;
}

async function loadTaskDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('id');

    if (!taskId) {
        window.location.href = 'todo.html';
        return;
    }

    try {
        const response = await fetch(`${TASKS_URL}${taskId}/`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (!response.ok) throw new Error('Ошибка загрузки задачи');

        const task = await response.json();
        renderTaskDetail(task);
    } catch (error) {
        console.error('Ошибка:', error);
        window.location.href = 'todo.html';
    }
}

function renderTaskDetail(task) {
    document.getElementById('task-title').textContent = task.title;
    document.getElementById('task-status').textContent = task.completed ? 'Выполнена' : 'Активна';
    document.getElementById('task-status').className = `status ${task.completed ? 'completed' : 'active'}`;
    document.getElementById('task-created').textContent = formatDateTime(task.created_at);
    document.getElementById('task-updated').textContent = formatDateTime(task.updated_at);
    document.getElementById('task-description-text').textContent = task.description || 'Нет описания';

    const toggleBtn = document.getElementById('toggle-btn');
    toggleBtn.textContent = task.completed ? 'Отменить выполнение' : 'Отметить выполненной';
    toggleBtn.className = task.completed ? 'btn-secondary' : 'btn-primary';
}

// ========== ОБЩИЕ ФУНКЦИИ ==========

function checkAuth() {
    if (!authToken) {
        window.location.href = 'index.html';
    }
}

function updateUserDisplay() {
    if (currentUser && document.getElementById('username-display')) {
        document.getElementById('username-display').textContent = currentUser.username;
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function goBack() {
    window.location.href = 'todo.html';
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => errorDiv.style.display = 'none', 5000);
    }
}

function showRegisterError(message) {
    const errorDiv = document.getElementById('register-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => errorDiv.style.display = 'none', 5000);
    }
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return 'неизвестно';
    return new Date(dateString).toLocaleDateString('ru-RU');
}

function formatDateTime(dateString) {
    if (!dateString) return 'неизвестно';
    return new Date(dateString).toLocaleString('ru-RU');
}

// Фильтрация задач
function filterTasks(filter) {
    const buttons = document.querySelectorAll('.btn-filter');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    loadTasks();
}

// Обновление статистики
function updateStats(tasks) {
    if (!Array.isArray(tasks)) return;

    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;

    const tasksCount = document.getElementById('tasks-count');
    const completedCount = document.getElementById('completed-count');

    if (tasksCount) tasksCount.textContent = `Всего задач: ${total}`;
    if (completedCount) completedCount.textContent = `Выполнено: ${completed}`;
}

// Функции для работы с задачами
async function toggleTask(taskId, completed) {
    try {
        const response = await fetch(`${TASKS_URL}${taskId}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed: !completed })
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (window.location.pathname.endsWith('task-detail.html')) {
            loadTaskDetail();
        } else {
            loadTasks();
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

async function deleteTask(taskId) {
    if (!confirm('Удалить задачу?')) return;

    try {
        const response = await fetch(`${TASKS_URL}${taskId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (window.location.pathname.endsWith('task-detail.html')) {
            window.location.href = 'todo.html';
        } else {
            loadTasks();
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// Функции для детальной страницы (дополнительные)
async function toggleTaskCompletion() {
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('id');

    if (!taskId) return;

    try {
        // Получаем текущие данные задачи
        const response = await fetch(`${TASKS_URL}${taskId}/`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Ошибка загрузки задачи');

        const task = await response.json();

        // Меняем статус
        await toggleTask(taskId, task.completed);
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

function editTask() {
    document.getElementById('edit-form').style.display = 'block';

    // Заполняем форму текущими значениями
    const title = document.getElementById('task-title').textContent;
    const description = document.getElementById('task-description-text').textContent;

    document.getElementById('edit-title').value = title;
    document.getElementById('edit-description').value = description === 'Нет описания' ? '' : description;
}

function cancelEdit() {
    document.getElementById('edit-form').style.display = 'none';
}

async function saveTask() {
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('id');

    const title = document.getElementById('edit-title').value;
    const description = document.getElementById('edit-description').value;

    if (!title.trim()) {
        alert('Введите название задачи');
        return;
    }

    try {
        const response = await fetch(`${TASKS_URL}${taskId}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title.trim(),
                description: description.trim()
            })
        });

        if (response.ok) {
            document.getElementById('edit-form').style.display = 'none';
            loadTaskDetail();
        } else {
            const errorData = await response.json();
            alert('Ошибка обновления задачи: ' + (errorData.detail || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}
