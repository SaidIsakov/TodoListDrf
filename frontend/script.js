// Конфигурация API - используем ваши пути
const API_BASE = 'http://localhost:8001/api/v1';
const REGISTER_URL = `${API_BASE}/user/registration/`;
const LOGIN_URL = `${API_BASE}/user/login/`;
const PROFILE_URL = `${API_BASE}/user/profile/`;
const TASKS_URL = `${API_BASE}/todos/`;
const CHANGE_PASSWORD_URL = `${API_BASE}/user/change-password/`;

// Токен авторизации
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Проверка авторизации при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.endsWith('todo.html') ||
        window.location.pathname.endsWith('task-detail.html') ||
        window.location.pathname.endsWith('profile.html')) {
        checkAuth();
    }

    if (window.location.pathname.endsWith('todo.html')) {
        loadTasks();
        updateUserDisplay();
    }

    if (window.location.pathname.endsWith('task-detail.html')) {
        loadTaskDetail();
    }

    if (window.location.pathname.endsWith('profile.html')) {
        loadProfile();
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
            authToken = data.access;
            currentUser = { username: username };

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

// ========== ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ==========

function viewProfile() {
    window.location.href = 'profile.html';
}

function goToTodos() {
    window.location.href = 'todo.html';
}

// Загрузка профиля
async function loadProfile() {
    try {
        updateUserDisplay();
        await loadUserProfile();
        await loadTaskStatistics();
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
    }
}

// Загрузка данных пользователя
async function loadUserProfile() {
    try {
        const response = await fetch(PROFILE_URL, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            displayUserProfile(userData);
        } else {
            displayFallbackProfile();
        }
    } catch (error) {
        displayFallbackProfile();
    }
}

// Отображение данных пользователя
function displayUserProfile(userData) {
    document.getElementById('profile-username').textContent = userData.username || currentUser?.username || 'Не указано';
    document.getElementById('profile-email').textContent = userData.email || currentUser?.email || 'Не указано';
    document.getElementById('profile-date-joined').textContent =
        userData.date_joined ? formatDate(userData.date_joined) : 'Неизвестно';

    if (document.getElementById('edit-username')) {
        document.getElementById('edit-username').value = userData.username || currentUser?.username || '';
        document.getElementById('edit-email').value = userData.email || currentUser?.email || '';
    }
}

// Fallback профиль
function displayFallbackProfile() {
    document.getElementById('profile-username').textContent = currentUser?.username || 'Не указано';
    document.getElementById('profile-email').textContent = currentUser?.email || 'Не указано';
    document.getElementById('profile-date-joined').textContent = 'Неизвестно';

    const message = document.createElement('div');
    message.className = 'message info';
    message.textContent = 'Некоторые функции профиля могут быть ограничены';
    document.querySelector('.profile-info').appendChild(message);
}

// Загрузка статистики задач
async function loadTaskStatistics() {
    try {
        const response = await fetch(TASKS_URL, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const tasks = await response.json();
            displayTaskStatistics(tasks);
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Отображение статистики задач
function displayTaskStatistics(tasks) {
    if (!Array.isArray(tasks)) {
        document.getElementById('profile-stats').textContent = 'Ошибка загрузки статистики';
        return;
    }

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const activeTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('completed-tasks').textContent = completedTasks;
    document.getElementById('active-tasks').textContent = activeTasks;
    document.getElementById('completion-rate').textContent = completionRate + '%';

    document.getElementById('profile-stats').textContent =
        `Всего задач: ${totalTasks}, Выполнено: ${completedTasks}`;

    displayRecentTasks(tasks);
}

// Отображение последних задач
function displayRecentTasks(tasks) {
    const recentTasksList = document.getElementById('recent-tasks-list');
    if (!recentTasksList) return;

    const sortedTasks = [...tasks].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    ).slice(0, 5);

    if (sortedTasks.length === 0) {
        recentTasksList.innerHTML = '<p>Нет задач</p>';
        return;
    }

    recentTasksList.innerHTML = sortedTasks.map(task => `
        <div class="recent-task-item ${task.completed ? 'completed' : ''}" onclick="viewTaskDetail(${task.id})" style="cursor: pointer;">
            <div class="recent-task-title">${task.title}</div>
            <div class="recent-task-date">${formatDate(task.created_at)}</div>
        </div>
    `).join('');
}

// Управление формами профиля
function showChangePassword() {
    document.getElementById('change-password-form').style.display = 'block';
    document.getElementById('edit-profile-form').style.display = 'none';
    hideMessage('password-message');
}

function hideChangePassword() {
    document.getElementById('change-password-form').style.display = 'none';
    clearPasswordForm();
}

function showEditProfile() {
    document.getElementById('edit-profile-form').style.display = 'block';
    document.getElementById('change-password-form').style.display = 'none';
    hideMessage('profile-message');
}

function hideEditProfile() {
    document.getElementById('edit-profile-form').style.display = 'none';
}

function clearPasswordForm() {
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
}

function hideMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
        element.className = 'message';
    }
}

function showMessage(elementId, message, type = 'success') {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `message ${type}`;
        element.style.display = 'block';
    }
}

// Обработчик формы смены пароля
document.getElementById('password-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const oldPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const newPasswordConfirm = document.getElementById('confirm-password').value;

    // Валидация
    if (!oldPassword || !newPassword || !newPasswordConfirm) {
        showMessage('password-message', 'Все поля обязательны для заполнения', 'error');
        return;
    }

    if (newPassword !== newPasswordConfirm) {
        showMessage('password-message', 'Новые пароли не совпадают', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showMessage('password-message', 'Пароль должен содержать минимум 6 символов', 'error');
        return;
    }

    if (oldPassword === newPassword) {
        showMessage('password-message', 'Новый пароль должен отличаться от текущего', 'error');
        return;
    }

    try {
        const response = await fetch(CHANGE_PASSWORD_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword,
                new_password_confirm: newPasswordConfirm
            })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('password-message', 'Пароль успешно изменен!', 'success');
            clearPasswordForm();

            setTimeout(() => {
                hideChangePassword();
            }, 2000);

        } else {
            let errorMessage = 'Ошибка смены пароля';

            if (data.old_password) {
                errorMessage = data.old_password[0];
            } else if (data.new_password) {
                errorMessage = data.new_password[0];
            } else if (data.detail) {
                errorMessage = data.detail;
            } else if (data.non_field_errors) {
                errorMessage = data.non_field_errors[0];
            }

            showMessage('password-message', errorMessage, 'error');
        }
    } catch (error) {
        showMessage('password-message', 'Ошибка сети. Проверьте подключение к интернету', 'error');
    }
});

// Обработчик формы редактирования профиля
document.getElementById('profile-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('edit-username').value;
    const email = document.getElementById('edit-email').value;

    if (!username.trim()) {
        showMessage('profile-message', 'Имя пользователя обязательно', 'error');
        return;
    }

    try {
        const response = await fetch(PROFILE_URL, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username.trim(),
                email: email.trim()
            })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('profile-message', 'Профиль успешно обновлен', 'success');
            currentUser = { ...currentUser, ...data };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            setTimeout(() => {
                hideEditProfile();
                loadUserProfile();
                updateUserDisplay();
            }, 1500);
        } else {
            const errorMessage = data.username ? data.username[0] :
                               data.email ? data.email[0] :
                               data.detail || 'Ошибка обновления профиля';
            showMessage('profile-message', errorMessage, 'error');
        }
    } catch (error) {
        showMessage('profile-message', 'Функция редактирования профиля временно недоступна', 'info');
    }
});

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

// Функции для детальной страницы
async function toggleTaskCompletion() {
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('id');

    if (!taskId) return;

    try {
        const response = await fetch(`${TASKS_URL}${taskId}/`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Ошибка загрузки задачи');

        const task = await response.json();
        await toggleTask(taskId, task.completed);
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

function editTask() {
    document.getElementById('edit-form').style.display = 'block';

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
