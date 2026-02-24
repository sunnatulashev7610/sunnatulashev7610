class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.assessments = JSON.parse(localStorage.getItem('assessments')) || [];
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.currentTab = 'daily';
        this.currentEditingTask = null;
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        if (this.currentUser) {
            this.updateCurrentDate();
            this.renderTasks();
            this.updateProgress();
            this.setupReminders();
            this.generateMonthlyCalendar();
            this.updateYearlyOverview();
        }
    }

    checkAuthentication() {
        if (this.currentUser) {
            this.showMainApp();
            this.updateUserProfile();
        } else {
            this.showAuthForm();
        }
    }

    showAuthForm() {
        document.getElementById('authContainer').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
    }

    showMainApp() {
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
    }

    setupEventListeners() {
        // Authentication forms
        document.getElementById('loginFormElement')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        document.getElementById('registerFormElement')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });

        document.getElementById('showRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchAuthForm('register');
        });

        document.getElementById('showLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchAuthForm('login');
        });

        // Profile and logout
        document.getElementById('profileBtn')?.addEventListener('click', () => {
            this.openProfileModal();
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('profileForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });

        document.getElementById('cancelProfileBtn')?.addEventListener('click', () => {
            this.closeModal(document.getElementById('profileModal'));
        });

        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Add task button
        document.getElementById('addTaskBtn')?.addEventListener('click', () => {
            this.openTaskModal();
        });

        // Task form
        document.getElementById('taskForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        // Assessment form
        document.getElementById('assessmentForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAssessment();
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Cancel buttons
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal(document.getElementById('taskModal'));
        });

        document.getElementById('cancelAssessmentBtn').addEventListener('click', () => {
            this.closeModal(document.getElementById('assessmentModal'));
        });

        // Category filter
        document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
            this.filterTasks(e.target.value);
        });

        // Rating stars
        document.querySelectorAll('.rating i').forEach(star => {
            star.addEventListener('click', (e) => {
                this.setRating(parseInt(e.target.dataset.rating));
            });
        });

        // Month cards
        document.querySelectorAll('.month-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const month = e.currentTarget.dataset.month;
                this.showMonthlyTasks(month);
            });
        });

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
    }

    // Authentication Methods
    switchAuthForm(form) {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (form === 'register') {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        } else {
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        }
    }

    login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showMainApp();
            this.updateUserProfile();
            this.loadUserData();
            this.showNotification('Tizimga muvaffaqiyatli kirdingiz!', 'success');
        } else {
            this.showNotification('Email yoki parol noto\'g\'ri', 'error');
        }
    }

    register() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        // Validation
        if (password !== confirmPassword) {
            this.showNotification('Parollar mos kelmadi', 'error');
            return;
        }
        
        if (this.users.find(u => u.email === email)) {
            this.showNotification('Bu email allaqachon ro\'yxatdan o\'tgan', 'error');
            return;
        }
        
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            phone: '',
            bio: '',
            createdAt: new Date().toISOString()
        };
        
        this.users.push(newUser);
        localStorage.setItem('users', JSON.stringify(this.users));
        
        this.currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        this.showMainApp();
        this.updateUserProfile();
        this.showNotification('Ro\'yxatdan o\'tish muvaffaqiyatli yakunlandi!', 'success');
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showAuthForm();
        this.showNotification('Tizimdan muvaffaqiyatli chiqdingiz', 'success');
    }

    updateUserProfile() {
        if (this.currentUser) {
            document.getElementById('userName').textContent = this.currentUser.name;
            document.getElementById('userEmail').textContent = this.currentUser.email;
        }
    }

    loadUserData() {
        // Load user-specific tasks and assessments
        const userTasks = JSON.parse(localStorage.getItem(`tasks_${this.currentUser.id}`)) || [];
        const userAssessments = JSON.parse(localStorage.getItem(`assessments_${this.currentUser.id}`)) || [];
        
        this.tasks = userTasks;
        this.assessments = userAssessments;
        
        this.updateCurrentDate();
        this.renderTasks();
        this.updateProgress();
        this.setupReminders();
        this.generateMonthlyCalendar();
        this.updateYearlyOverview();
    }

    openProfileModal() {
        const modal = document.getElementById('profileModal');
        
        // Fill form with current user data
        document.getElementById('profileName').value = this.currentUser.name || '';
        document.getElementById('profileEmail').value = this.currentUser.email || '';
        document.getElementById('profilePhone').value = this.currentUser.phone || '';
        document.getElementById('profileBio').value = this.currentUser.bio || '';
        
        // Update statistics
        this.updateProfileStats();
        
        modal.style.display = 'block';
    }

    updateProfileStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const avgRating = this.assessments.length > 0 
            ? (this.assessments.reduce((sum, a) => sum + a.rating, 0) / this.assessments.length).toFixed(1)
            : 0;
        
        document.getElementById('totalTasksStat').textContent = totalTasks;
        document.getElementById('completedTasksStat').textContent = completedTasks;
        document.getElementById('completionRateStat').textContent = `${completionRate}%`;
        document.getElementById('avgRatingStat').textContent = avgRating;
    }

    saveProfile() {
        const updatedUser = {
            ...this.currentUser,
            name: document.getElementById('profileName').value,
            email: document.getElementById('profileEmail').value,
            phone: document.getElementById('profilePhone').value,
            bio: document.getElementById('profileBio').value
        };
        
        // Update user in users array
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        this.users[userIndex] = updatedUser;
        localStorage.setItem('users', JSON.stringify(this.users));
        
        this.currentUser = updatedUser;
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        this.updateUserProfile();
        this.closeModal(document.getElementById('profileModal'));
        this.showNotification('Profil muvaffaqiyatli yangilandi', 'success');
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(tab).classList.add('active');

        this.currentTab = tab;
        this.renderTasks();
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateStr = now.toLocaleDateString('uz-UZ', options);
        document.getElementById('currentDate').textContent = dateStr;
    }

    openTaskModal(task = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        
        if (task) {
            this.currentEditingTask = task;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskCategory').value = task.category;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskPeriod').value = task.period;
            document.getElementById('taskDeadline').value = task.deadline || '';
            document.getElementById('taskReminder').value = task.reminder || '';
            modal.querySelector('h2').textContent = 'Vazifani tahrirlash';
        } else {
            this.currentEditingTask = null;
            form.reset();
            modal.querySelector('h2').textContent = 'Yangi vazifa qo\'shish';
        }
        
        modal.style.display = 'block';
    }

    closeModal(modal) {
        modal.style.display = 'none';
        this.currentEditingTask = null;
    }

    saveTask() {
        const taskData = {
            id: this.currentEditingTask ? this.currentEditingTask.id : Date.now().toString(),
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            category: document.getElementById('taskCategory').value,
            priority: document.getElementById('taskPriority').value,
            period: document.getElementById('taskPeriod').value,
            deadline: document.getElementById('taskDeadline').value,
            reminder: document.getElementById('taskReminder').value,
            completed: this.currentEditingTask ? this.currentEditingTask.completed : false,
            createdAt: this.currentEditingTask ? this.currentEditingTask.createdAt : new Date().toISOString(),
            completedAt: this.currentEditingTask?.completedAt || null
        };

        if (this.currentEditingTask) {
            const index = this.tasks.findIndex(t => t.id === this.currentEditingTask.id);
            this.tasks[index] = taskData;
            this.showNotification('Vazifa muvaffaqiyatli yangilandi', 'success');
        } else {
            this.tasks.push(taskData);
            this.showNotification('Vazifa muvaffaqiyatli qo\'shildi', 'success');
        }

        this.saveTasks();
        this.renderTasks();
        this.updateProgress();
        this.closeModal(document.getElementById('taskModal'));
    }

    deleteTask(taskId) {
        if (confirm('Vazifani o\'chirishni istaysizmi?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.updateProgress();
            this.showNotification('Vazifa o\'chirildi', 'success');
        }
    }

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            
            if (task.completed) {
                this.openAssessmentModal(task);
            }
            
            this.saveTasks();
            this.renderTasks();
            this.updateProgress();
        }
    }

    openAssessmentModal(task) {
        const modal = document.getElementById('assessmentModal');
        document.getElementById('completedTask').value = task.title;
        document.getElementById('assessmentNotes').value = '';
        this.resetRating();
        this.currentAssessingTask = task;
        modal.style.display = 'block';
    }

    setRating(rating) {
        document.querySelectorAll('.rating i').forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
        this.currentRating = rating;
    }

    resetRating() {
        document.querySelectorAll('.rating i').forEach(star => {
            star.classList.remove('active');
        });
        this.currentRating = 0;
    }

    saveAssessment() {
        if (this.currentRating === 0) {
            this.showNotification('Iltimos, bahoni tanlang', 'warning');
            return;
        }

        const assessment = {
            taskId: this.currentAssessingTask.id,
            taskTitle: this.currentAssessingTask.title,
            rating: this.currentRating,
            notes: document.getElementById('assessmentNotes').value,
            date: new Date().toISOString()
        };

        this.assessments.push(assessment);
        this.saveAssessments();
        
        this.closeModal(document.getElementById('assessmentModal'));
        this.showNotification('Baholanganingiz uchun rahmat!', 'success');
    }

    renderTasks() {
        const containers = {
            daily: document.getElementById('dailyTasks'),
            weekly: this.getWeeklyContainers(),
            monthly: document.getElementById('monthlyTasks'),
            yearly: document.getElementById('yearlyTasks')
        };

        // Clear containers
        if (this.currentTab === 'weekly') {
            Object.values(containers.weekly).forEach(container => {
                container.innerHTML = '';
            });
        } else {
            containers[this.currentTab].innerHTML = '';
        }

        // Filter tasks for current period
        const filteredTasks = this.getTasksForPeriod(this.currentTab);
        
        if (filteredTasks.length === 0) {
            this.showEmptyState(this.currentTab === 'weekly' ? containers.weekly.monday : containers[this.currentTab]);
            return;
        }

        filteredTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            
            if (this.currentTab === 'weekly') {
                // For weekly view, we'd need to determine which day
                // For now, put all tasks in Monday
                containers.weekly.monday.appendChild(taskElement);
            } else {
                containers[this.currentTab].appendChild(taskElement);
            }
        });
    }

    getWeeklyContainers() {
        return {
            monday: document.getElementById('mondayTasks'),
            tuesday: document.getElementById('tuesdayTasks'),
            wednesday: document.getElementById('wednesdayTasks'),
            thursday: document.getElementById('thursdayTasks'),
            friday: document.getElementById('fridayTasks'),
            saturday: document.getElementById('saturdayTasks'),
            sunday: document.getElementById('sundayTasks')
        };
    }

    getTasksForPeriod(period) {
        return this.tasks.filter(task => task.period === period);
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-item ${task.completed ? 'completed' : ''} ${task.priority}-priority`;
        
        const categoryLabels = {
            ish: 'Ish',
            oqish: 'O\'qish',
            shaxsiy: 'Shaxsiy',
            soglik: 'Sog\'lik',
            oilaviy: 'Oilaviy',
            boshqa: 'Boshqa'
        };

        const priorityLabels = {
            low: 'Past',
            medium: 'O\'rtacha',
            high: 'Yuqori'
        };

        div.innerHTML = `
            <div class="task-header">
                <div class="task-title">${task.title}</div>
                <div class="task-actions">
                    <button onclick="taskManager.toggleTaskComplete('${task.id}')" title="${task.completed ? 'Bajarilmagan deb belgilash' : 'Bajarilgan deb belgilash'}">
                        <i class="fas ${task.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
                    </button>
                    <button onclick="taskManager.openTaskModal(taskManager.tasks.find(t => t.id === '${task.id}'))" title="Tahrirlash">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="taskManager.deleteTask('${task.id}')" title="O'chirish">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            <div class="task-meta">
                <span class="task-category">${categoryLabels[task.category]}</span>
                <span><i class="fas fa-flag"></i> ${priorityLabels[task.priority]}</span>
                ${task.deadline ? `<span><i class="fas fa-clock"></i> ${new Date(task.deadline).toLocaleDateString('uz-UZ')}</span>` : ''}
            </div>
        `;

        return div;
    }

    showEmptyState(container) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>Vazifalar yo'q</h3>
                <p>Yangi vazifa qo'shish uchun "Yangi vazifa" tugmasini bosing</p>
            </div>
        `;
    }

    filterTasks(category) {
        const allTaskItems = document.querySelectorAll('.task-item');
        
        allTaskItems.forEach(item => {
            if (category === '') {
                item.style.display = 'block';
            } else {
                const taskCategory = item.querySelector('.task-category').textContent;
                const categoryLabels = {
                    ish: 'Ish',
                    oqish: 'O\'qish',
                    shaxsiy: 'Shaxsiy',
                    soglik: 'Sog\'lik',
                    oilaviy: 'Oilaviy',
                    boshqa: 'Boshqa'
                };
                
                if (taskCategory === categoryLabels[category]) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            }
        });
    }

    updateProgress() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        document.getElementById('totalProgress').textContent = `${progress}%`;
    }

    generateMonthlyCalendar() {
        const calendar = document.getElementById('monthlyCalendar');
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Day headers
        const dayHeaders = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-header';
            header.textContent = day;
            header.style.fontWeight = 'bold';
            header.style.textAlign = 'center';
            calendar.appendChild(header);
        });
        
        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            calendar.appendChild(emptyDay);
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            if (day === now.getDate()) {
                dayElement.classList.add('today');
            }
            
            // Check if there are tasks for this day
            const dayTasks = this.tasks.filter(task => {
                if (task.deadline) {
                    const taskDate = new Date(task.deadline);
                    return taskDate.getDate() === day && 
                           taskDate.getMonth() === month && 
                           taskDate.getFullYear() === year;
                }
                return false;
            });
            
            if (dayTasks.length > 0) {
                dayElement.classList.add('has-tasks');
            }
            
            calendar.appendChild(dayElement);
        }
    }

    updateYearlyOverview() {
        const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
        
        months.forEach(month => {
            const monthCard = document.querySelector(`[data-month="${month}"]`);
            const taskCount = this.countTasksForMonth(parseInt(month));
            monthCard.querySelector('.task-count').textContent = `${taskCount} vazifa`;
        });
    }

    countTasksForMonth(month) {
        const now = new Date();
        const year = now.getFullYear();
        
        return this.tasks.filter(task => {
            if (task.deadline) {
                const taskDate = new Date(task.deadline);
                return taskDate.getMonth() + 1 === month && 
                       taskDate.getFullYear() === year;
            }
            return false;
        }).length;
    }

    showMonthlyTasks(month) {
        // Switch to monthly tab and filter for specific month
        this.switchTab('monthly');
        // Additional filtering logic could be implemented here
    }

    setupReminders() {
        // Check for reminders every minute
        setInterval(() => {
            this.checkReminders();
        }, 60000);
        
        // Check immediately on load
        this.checkReminders();
    }

    checkReminders() {
        const now = new Date();
        
        this.tasks.forEach(task => {
            if (task.reminder && !task.completed && !task.reminderShown) {
                const reminderTime = new Date(task.reminder);
                
                if (reminderTime <= now) {
                    this.showNotification(`Eslatma: ${task.title}`, 'warning');
                    task.reminderShown = true;
                    this.saveTasks();
                }
            }
        });
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    saveTasks() {
        if (this.currentUser) {
            localStorage.setItem(`tasks_${this.currentUser.id}`, JSON.stringify(this.tasks));
        }
    }

    saveAssessments() {
        if (this.currentUser) {
            localStorage.setItem(`assessments_${this.currentUser.id}`, JSON.stringify(this.assessments));
        }
    }
}

// Initialize the app
const taskManager = new TaskManager();
