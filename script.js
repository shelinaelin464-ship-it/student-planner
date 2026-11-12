/* =========================================
   STUDYFLOW - STUDENT PLANNER
========================================= */


/* =========================================
   1. LOCAL STORAGE
========================================= */

const STORAGE = {
    tasks: "studyflow_tasks",
    notes: "studyflow_notes",
    schedule: "studyflow_schedule",
    profile: "studyflow_profile",
    theme: "studyflow_theme"
};

function loadData(key, fallback = []) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return data ?? fallback;
    } catch {
        return fallback;
    }
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

let tasks = loadData(STORAGE.tasks);
let notes = loadData(STORAGE.notes);
let schedules = loadData(STORAGE.schedule);
let profile = loadData(STORAGE.profile, { name: "Student" });

let calendarDate = new Date();
let selectedDate = null;


/* =========================================
   2. GENERAL FUNCTIONS
========================================= */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(date) {
    if (!date) return "No deadline";

    const d = new Date(date + "T00:00:00");

    return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function showToast(message) {
    const toast = document.getElementById("toast");

    document.getElementById("toastMessage").textContent = message;

    toast.classList.add("show");

    clearTimeout(showToast.timeout);

    showToast.timeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function openModal(id) {
    document.getElementById(id).classList.add("show");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("show");
}

document.querySelectorAll(".modal-overlay").forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            modal.classList.remove("show");
        }
    });
});


/* =========================================
   3. MOBILE SIDEBAR NAVIGATION
   FIXED VERSION
========================================= */

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const sidebarClose = document.getElementById("sidebarClose");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");

const mobileBreakpoint = window.matchMedia("(max-width: 800px)");

function openSidebar() {

    if (!mobileBreakpoint.matches) return;

    sidebar.classList.add("open");
    sidebarBackdrop.classList.add("show");

    document.body.classList.add("menu-open");

    menuToggle.setAttribute("aria-expanded", "true");

    sidebar.setAttribute("aria-hidden", "false");
}

function closeSidebar() {

    sidebar.classList.remove("open");
    sidebarBackdrop.classList.remove("show");

    document.body.classList.remove("menu-open");

    menuToggle.setAttribute("aria-expanded", "false");

    sidebar.setAttribute(
        "aria-hidden",
        mobileBreakpoint.matches ? "true" : "false"
    );
}


// Hamburger button
menuToggle.addEventListener("click", () => {

    if (sidebar.classList.contains("open")) {
        closeSidebar();
    } else {
        openSidebar();
    }

});


// Close button inside sidebar
sidebarClose.addEventListener("click", closeSidebar);


// Click outside sidebar
sidebarBackdrop.addEventListener("click", closeSidebar);


// Escape key
document.addEventListener("keydown", event => {

    if (event.key === "Escape") {
        closeSidebar();
    }

});


// When changing from mobile to desktop
function handleResponsiveSidebar() {

    closeSidebar();

    if (!mobileBreakpoint.matches) {
        sidebar.setAttribute("aria-hidden", "false");
    } else {
        sidebar.setAttribute("aria-hidden", "true");
    }

}

mobileBreakpoint.addEventListener(
    "change",
    handleResponsiveSidebar
);


/* =========================================
   4. PROFILE
========================================= */

function updateProfile() {

    document.getElementById("profileName").textContent = profile.name;

    document.getElementById("welcomeName").textContent = profile.name;

    document.querySelector(".avatar").textContent =
        profile.name.charAt(0).toUpperCase();

}

function editProfile() {

    const name = prompt(
        "Enter your student name:",
        profile.name
    );

    if (name && name.trim()) {

        profile.name = name.trim();

        saveData(STORAGE.profile, profile);

        updateProfile();

        showToast("Profile updated!");

    }

}


/* =========================================
   5. NAVIGATION
========================================= */

function showPage(pageId) {

    const target = document.getElementById(pageId);

    if (!target) return;

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.querySelectorAll(".nav-item[data-page]").forEach(item => {

        item.classList.toggle(
            "active",
            item.dataset.page === pageId
        );

    });

    target.classList.add("active");

    const names = {
        dashboard: "Dashboard",
        tasks: "My Tasks",
        calendar: "Calendar",
        schedule: "Timetable",
        notes: "My Notes",
        focus: "Focus Room"
    };

    document.getElementById("currentPageName").textContent =
        names[pageId];

    // Close mobile sidebar after selecting a menu
    closeSidebar();

    // Render page content
    if (pageId === "calendar") renderCalendar();
    if (pageId === "schedule") renderSchedule();
    if (pageId === "notes") renderNotes();

    // Return page to top
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// Sidebar menu buttons
document.querySelectorAll(".nav-item[data-page]").forEach(item => {

    item.addEventListener("click", () => {

        showPage(item.dataset.page);

    });

});


// Close sidebar when clicking a quick access button
document.querySelectorAll(".quick-grid button").forEach(button => {

    button.addEventListener("click", closeSidebar);

});


/* =========================================
   6. DATE
========================================= */

document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });


/* =========================================
   7. TASK MANAGER
========================================= */

function openTaskModal(id = null) {

    const form = document.getElementById("taskForm");

    form.reset();

    document.getElementById("taskId").value = "";

    document.getElementById("taskModalTitle").textContent =
        "Create New Task";

    if (id !== null) {

        const task = tasks.find(t => t.id === id);

        if (!task) return;

        document.getElementById("taskId").value = task.id;
        document.getElementById("taskTitle").value = task.title;
        document.getElementById("taskSubject").value = task.subject;
        document.getElementById("taskDeadline").value = task.deadline;
        document.getElementById("taskPriority").value = task.priority;
        document.getElementById("taskDescription").value = task.description;

        document.getElementById("taskModalTitle").textContent =
            "Edit Task";

    }

    openModal("taskModal");

}


document.getElementById("taskForm").addEventListener("submit", event => {

    event.preventDefault();

    const id = document.getElementById("taskId").value;

    const existingTask = tasks.find(t => t.id === id);

    const taskData = {

        id: id || String(Date.now()),

        title: document.getElementById("taskTitle").value.trim(),

        subject: document.getElementById("taskSubject").value,

        deadline: document.getElementById("taskDeadline").value,

        priority: document.getElementById("taskPriority").value,

        description: document.getElementById("taskDescription").value.trim(),

        completed: existingTask?.completed || false

    };

    if (!taskData.title || !taskData.deadline) return;

    if (id) {

        tasks = tasks.map(t =>
            t.id === id ? taskData : t
        );

        showToast("Task updated successfully!");

    } else {

        tasks.push(taskData);

        showToast("New task added!");

    }

    saveData(STORAGE.tasks, tasks);

    closeModal("taskModal");

    renderAll();

});


function toggleTask(id) {

    tasks = tasks.map(task => {

        if (task.id === id) {

            return {
                ...task,
                completed: !task.completed
            };

        }

        return task;

    });

    saveData(STORAGE.tasks, tasks);

    renderAll();

}


function deleteTask(id) {

    if (!confirm("Are you sure you want to delete this task?")) {
        return;
    }

    tasks = tasks.filter(task => task.id !== id);

    saveData(STORAGE.tasks, tasks);

    renderAll();

    showToast("Task deleted!");

}


function getTaskHTML(task) {

    const priorityClass = {
        High: "priority-high",
        Medium: "priority-medium",
        Low: "priority-low"
    }[task.priority] || "priority-low";

    return `

        <div class="task-item ${task.completed ? "done" : ""}">

            <input
                type="checkbox"
                class="task-check"
                ${task.completed ? "checked" : ""}
                onchange="toggleTask('${task.id}')"
                aria-label="Mark task complete"
            >

            <div class="task-info">

                <h4>${escapeHTML(task.title)}</h4>

                <p>
                    ${escapeHTML(task.subject)}
                    · ${formatDate(task.deadline)}
                </p>

            </div>

            <span class="task-badge ${priorityClass}">
                ${escapeHTML(task.priority)}
            </span>

            <div class="task-actions">

                <button
                    onclick="openTaskModal('${task.id}')"
                    title="Edit"
                >
                    <i class="fa-solid fa-pen"></i>
                </button>

                <button
                    onclick="deleteTask('${task.id}')"
                    title="Delete"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>

            </div>

        </div>

    `;

}


function renderTasks() {

    const upcoming = document.getElementById("upcomingTasks");

    const allTasks = document.getElementById("allTasks");

    const pending = tasks
        .filter(t => !t.completed)
        .sort((a, b) => a.deadline.localeCompare(b.deadline));


    upcoming.innerHTML = pending.length

        ? pending.slice(0, 5).map(getTaskHTML).join("")

        : `
            <div class="empty-state">
                <i class="fa-solid fa-circle-check"></i>
                No upcoming tasks. Enjoy your free time!
            </div>
        `;


    const search =
        document.getElementById("taskSearch").value.toLowerCase();

    const status =
        document.getElementById("taskFilter").value;

    const subject =
        document.getElementById("subjectFilter").value;


    const filtered = tasks.filter(task => {

        const matchesSearch =
            task.title.toLowerCase().includes(search) ||
            task.subject.toLowerCase().includes(search);

        const matchesStatus =
            status === "all" ||
            (status === "completed" && task.completed) ||
            (status === "pending" && !task.completed);

        const matchesSubject =
            subject === "all" || task.subject === subject;

        return matchesSearch && matchesStatus && matchesSubject;

    }).sort((a, b) => a.deadline.localeCompare(b.deadline));


    allTasks.innerHTML = filtered.length

        ? filtered.map(getTaskHTML).join("")

        : `
            <div class="empty-state">
                <i class="fa-solid fa-folder-open"></i>
                No tasks found.
            </div>
        `;


    document.getElementById("taskResultCount").textContent =
        `${filtered.length} tasks`;

    document.getElementById("taskCount").textContent =
        pending.length;

}


document.getElementById("taskSearch").addEventListener("input", renderTasks);

document.getElementById("taskFilter").addEventListener("change", renderTasks);

document.getElementById("subjectFilter").addEventListener("change", renderTasks);


/* =========================================
   8. STATISTICS
========================================= */

function renderStatistics() {

    const total = tasks.length;

    const completed = tasks.filter(t => t.completed).length;

    const pending = total - completed;

    const percentage = total
        ? Math.round(completed / total * 100)
        : 0;

    document.getElementById("totalTasks").textContent = total;

    document.getElementById("completedTasks").textContent = completed;

    document.getElementById("pendingTasks").textContent = pending;

    document.getElementById("progressPercent").textContent =
        percentage + "%";

    document.getElementById("circlePercent").textContent =
        percentage + "%";

    const degrees = percentage * 3.6;

    document.getElementById("progressCircle").style.background =
        `conic-gradient(
            #8065e8 0deg,
            #a58af5 ${degrees}deg,
            var(--border) ${degrees}deg
        )`;

}


/* =========================================
   9. CALENDAR
========================================= */

function renderCalendar() {

    const year = calendarDate.getFullYear();

    const month = calendarDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();

    const lastDate = new Date(year, month + 1, 0).getDate();

    const previousLastDate = new Date(year, month, 0).getDate();

    document.getElementById("calendarMonth").textContent =
        calendarDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
        });

    let html = "";

    for (let i = 0; i < 42; i++) {

        let day;
        let dateString;
        let muted = false;

        if (i < firstDay) {

            day = previousLastDate - firstDay + i + 1;

            dateString = localDateString(
                new Date(year, month - 1, day)
            );

            muted = true;

        } else if (i >= firstDay + lastDate) {

            day = i - firstDay - lastDate + 1;

            dateString = localDateString(
                new Date(year, month + 1, day)
            );

            muted = true;

        } else {

            day = i - firstDay + 1;

            dateString =
                `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        }


        const today = localDateString();

        const hasTask = tasks.some(t =>
            t.deadline === dateString
        );

        const selected = selectedDate === dateString;

        html += `

            <button
                class="calendar-day
                ${muted ? "muted" : ""}
                ${dateString === today ? "today" : ""}
                ${hasTask ? "has-task" : ""}
                ${selected ? "selected" : ""}"
                onclick="selectCalendarDate('${dateString}')"
            >
                ${day}
            </button>

        `;

    }

    document.getElementById("calendarDays").innerHTML = html;

    if (selectedDate) {
        showSelectedDateTasks();
    }

}


function selectCalendarDate(date) {

    selectedDate = date;

    renderCalendar();

    showSelectedDateTasks();

}


function showSelectedDateTasks() {

    const container =
        document.getElementById("selectedDateTasks");

    const dateTasks = tasks.filter(t =>
        t.deadline === selectedDate
    );

    container.innerHTML = `

        <h3>Assignments — ${formatDate(selectedDate)}</h3>

        ${
            dateTasks.length
                ? dateTasks.map(getTaskHTML).join("")
                : `<p class="empty-state">No assignments on this date.</p>`
        }

    `;

}


document.getElementById("prevMonth").addEventListener("click", () => {

    calendarDate.setMonth(calendarDate.getMonth() - 1);

    renderCalendar();

});


document.getElementById("nextMonth").addEventListener("click", () => {

    calendarDate.setMonth(calendarDate.getMonth() + 1);

    renderCalendar();

});


/* =========================================
   10. TIMETABLE
========================================= */

function openScheduleModal() {

    document.getElementById("scheduleForm").reset();

    openModal("scheduleModal");

}


document.getElementById("scheduleForm").addEventListener("submit", event => {

    event.preventDefault();

    const start = document.getElementById("scheduleStart").value;

    const end = document.getElementById("scheduleEnd").value;

    if (end <= start) {

        showToast("End time must be later than start time!");

        return;

    }

    schedules.push({

        id: String(Date.now()),

        subject: document.getElementById("scheduleSubject").value.trim(),

        day: document.getElementById("scheduleDay").value,

        start,

        end,

        room: document.getElementById("scheduleRoom").value.trim()

    });

    saveData(STORAGE.schedule, schedules);

    closeModal("scheduleModal");

    renderSchedule();

    showToast("Class schedule added!");

});


function deleteSchedule(id) {

    if (!confirm("Delete this class schedule?")) return;

    schedules = schedules.filter(s => s.id !== id);

    saveData(STORAGE.schedule, schedules);

    renderSchedule();

    showToast("Schedule deleted!");

}


function renderSchedule() {

    const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    const container =
        document.getElementById("timetableList");

    container.innerHTML = days.map(day => {

        const daySchedules = schedules
            .filter(s => s.day === day)
            .sort((a, b) => a.start.localeCompare(b.start));

        return `

            <div class="day-group">

                <h3>${day}</h3>

                ${
                    daySchedules.length

                    ? daySchedules.map(s => `

                        <div class="schedule-item">

                            <div>
                                <h4>${escapeHTML(s.subject)}</h4>

                                <p>
                                    ${escapeHTML(s.room || "No room specified")}
                                </p>
                            </div>

                            <span class="schedule-time">
                                ${s.start} - ${s.end}
                            </span>

                            <button
                                class="icon-button"
                                onclick="deleteSchedule('${s.id}')"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>

                        </div>

                    `).join("")

                    : `<p class="empty-state">No classes scheduled.</p>`
                }

            </div>

        `;

    }).join("");

}


/* =========================================
   11. NOTES
========================================= */

function openNoteModal(id = null) {

    document.getElementById("noteForm").reset();

    document.getElementById("noteId").value = "";

    if (id !== null) {

        const note = notes.find(n => n.id === id);

        if (!note) return;

        document.getElementById("noteId").value = note.id;

        document.getElementById("noteTitle").value = note.title;

        document.getElementById("noteCategory").value = note.category;

        document.getElementById("noteContent").value = note.content;

    }

    openModal("noteModal");

}


document.getElementById("noteForm").addEventListener("submit", event => {

    event.preventDefault();

    const id = document.getElementById("noteId").value;

    const note = {

        id: id || String(Date.now()),

        title: document.getElementById("noteTitle").value.trim(),

        category: document.getElementById("noteCategory").value,

        content: document.getElementById("noteContent").value.trim(),

        date: new Date().toLocaleDateString()

    };

    if (id) {

        notes = notes.map(n =>
            n.id === id ? note : n
        );

    } else {

        notes.unshift(note);

    }

    saveData(STORAGE.notes, notes);

    closeModal("noteModal");

    renderNotes();

    showToast(id ? "Note updated!" : "New note saved!");

});


function deleteNote(id) {

    if (!confirm("Delete this note?")) return;

    notes = notes.filter(n => n.id !== id);

    saveData(STORAGE.notes, notes);

    renderNotes();

    showToast("Note deleted!");

}


function renderNotes() {

    const container = document.getElementById("notesGrid");

    container.innerHTML = notes.length

        ? notes.map(note => `

            <article class="note-card">

                <span class="note-category">
                    ${escapeHTML(note.category)}
                </span>

                <h3>${escapeHTML(note.title)}</h3>

                <p>${escapeHTML(note.content)}</p>

                <small style="color:var(--muted)">
                    ${escapeHTML(note.date)}
                </small>

                <div class="note-actions">

                    <button onclick="openNoteModal('${note.id}')">
                        <i class="fa-solid fa-pen"></i> Edit
                    </button>

                    <button onclick="deleteNote('${note.id}')">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>

                </div>

            </article>

        `).join("")

        : `

            <div class="empty-state" style="grid-column:1/-1">

                <i class="fa-regular fa-note-sticky"></i>

                No notes yet. Create your first study note!

            </div>

        `;

}


/* =========================================
   12. POMODORO TIMER
========================================= */

let timerDuration = 25 * 60;

let timerRemaining = timerDuration;

let timerInterval = null;

let timerRunning = false;

const timerDisplay =
    document.getElementById("timerDisplay");

const startButton =
    document.getElementById("startTimer");


function updateTimerDisplay() {

    const minutes = Math.floor(timerRemaining / 60);

    const seconds = timerRemaining % 60;

    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}


function setTimer(minutes, mode) {

    clearInterval(timerInterval);

    timerRunning = false;

    timerDuration = minutes * 60;

    timerRemaining = timerDuration;

    document.getElementById("focusMode").textContent = mode;

    document.querySelectorAll(".mode-button").forEach(button => {

        button.classList.toggle(
            "active",
            Number(button.dataset.time) === minutes
        );

    });

    startButton.innerHTML =
        '<i class="fa-solid fa-play"></i> Start';

    updateTimerDisplay();

}


document.querySelectorAll(".mode-button").forEach(button => {

    button.addEventListener("click", () => {

        setTimer(
            Number(button.dataset.time),
            button.dataset.mode
        );

    });

});


startButton.addEventListener("click", () => {

    if (timerRunning) {

        clearInterval(timerInterval);

        timerRunning = false;

        startButton.innerHTML =
            '<i class="fa-solid fa-play"></i> Resume';

        return;

    }

    if (timerRemaining <= 0) {
        timerRemaining = timerDuration;
    }

    timerRunning = true;

    startButton.innerHTML =
        '<i class="fa-solid fa-pause"></i> Pause';

    let lastTime = Date.now();

    timerInterval = setInterval(() => {

        const now = Date.now();

        const elapsed = Math.floor((now - lastTime) / 1000);

        if (elapsed < 1) return;

        lastTime += elapsed * 1000;

        timerRemaining = Math.max(
            0,
            timerRemaining - elapsed
        );

        updateTimerDisplay();

        if (timerRemaining <= 0) {

            clearInterval(timerInterval);

            timerRunning = false;

            startButton.innerHTML =
                '<i class="fa-solid fa-play"></i> Start';

            showToast("Session complete! Great work! 🎉");

            if (
                "Notification" in window &&
                Notification.permission === "granted"
            ) {

                new Notification("StudyFlow", {
                    body: "Your timer session has finished!"
                });

            }

        }

    }, 250);

});


document.getElementById("resetTimer").addEventListener("click", () => {

    setTimer(
        timerDuration / 60,
        document.getElementById("focusMode").textContent
    );

});


/* =========================================
   13. DARK MODE
========================================= */

const themeToggle =
    document.getElementById("themeToggle");


function applyTheme() {

    const dark =
        localStorage.getItem(STORAGE.theme) === "dark";

    document.body.classList.toggle("dark", dark);

    themeToggle.innerHTML = dark

        ? '<i class="fa-solid fa-sun"></i> Light Mode'

        : '<i class="fa-solid fa-moon"></i> Dark Mode';

}


themeToggle.addEventListener("click", () => {

    const dark =
        document.body.classList.toggle("dark");

    localStorage.setItem(
        STORAGE.theme,
        dark ? "dark" : "light"
    );

    applyTheme();

});


/* =========================================
   14. NOTIFICATIONS
========================================= */

document.getElementById("notificationBtn").addEventListener("click", () => {

    const pending = tasks.filter(t => !t.completed);

    const today = localDateString();

    const overdue = pending.filter(
        t => t.deadline < today
    ).length;

    const dueToday = pending.filter(
        t => t.deadline === today
    ).length;

    showToast(
        overdue + " overdue · " +
        dueToday + " due today"
    );

    if (
        "Notification" in window &&
        Notification.permission === "default"
    ) {

        Notification.requestPermission();

    }

});


/* =========================================
   15. RENDER EVERYTHING
========================================= */

function renderAll() {

    renderTasks();

    renderStatistics();

    renderNotes();

    renderSchedule();

    renderCalendar();

    updateProfile();

}


/* =========================================
   16. INITIALIZE APPLICATION
========================================= */

function initializeApp() {

    applyTheme();

    updateProfile();

    renderAll();

    updateTimerDisplay();

    handleResponsiveSidebar();

    console.log(
        "StudyFlow Student Planner initialized successfully!"
    );

}

initializeApp();
