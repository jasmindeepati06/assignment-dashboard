let appMode = localStorage.getItem("appMode") || "";
let users = JSON.parse(localStorage.getItem("usersData")) || [];
let activeUserIndex = parseInt(localStorage.getItem("activeUserIndex")) || 0;
let editingTaskIndex = -1;

// DARK MODE LOGIC 🌙
let isDarkMode = localStorage.getItem("darkMode") === "true";
if(isDarkMode) document.body.classList.add("dark-mode");

if(appMode && users.length > 0) showApp();

/* --- THEME TOGGLE --- */
function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle("dark-mode", isDarkMode);
  localStorage.setItem("darkMode", isDarkMode);
  document.getElementById("themeToggle").innerText = isDarkMode ? "☀️" : "🌙";
}

/* --- LOGIN & MODES --- */
function selectMode(mode) {
  appMode = mode;
  document.getElementById("modeSelection").classList.add("hidden");
  document.getElementById("nameInputBox").classList.remove("hidden");
  document.getElementById("namePromptTitle").innerText = mode === 'multi' ? "Name the first person 👤" : "Who is logging in? 🤔";
}

function goBackToMode() {
  document.getElementById("nameInputBox").classList.add("hidden");
  document.getElementById("modeSelection").classList.remove("hidden");
}

function login() {
  let name = document.getElementById("username").value.trim();
  if(!name) return alert("Please enter a name! 😊");

  if (users.length === 0) {
    users.push({ name: name, tasks: [], completedCount: 0 });
    activeUserIndex = 0;
  } else {
    let existingIndex = users.findIndex(u => u.name.toLowerCase() === name.toLowerCase());
    if (existingIndex >= 0) activeUserIndex = existingIndex; 
    else {
      users.push({ name: name, tasks: [], completedCount: 0 });
      activeUserIndex = users.length - 1;
    }
  }

  saveData();
  showApp();
}

function logout() {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("loginBox").classList.remove("hidden");
  goBackToMode();
  document.getElementById("username").value = "";
}

function showApp() {
  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("themeToggle").innerText = isDarkMode ? "☀️" : "🌙";
  
  if(appMode === 'multi') {
    document.getElementById("userTabsContainer").classList.remove("hidden");
    renderTabs();
  } else {
    document.getElementById("userTabsContainer").classList.add("hidden");
  }

  updateGreeting();
  display();
  showRemindersPopUp();
}

/* --- MULTI-USER LOGIC --- */
function renderTabs() {
  let tabsBox = document.getElementById("userTabs");
  tabsBox.innerHTML = "";
  users.forEach((u, index) => {
    let div = document.createElement("div");
    div.className = "user-tab " + (index === activeUserIndex ? "active" : "");
    div.innerText = "📁 " + u.name;
    div.onclick = () => switchUser(index);
    tabsBox.appendChild(div);
  });
}

function switchUser(index) {
  activeUserIndex = index;
  saveData();
  if(appMode === 'multi') renderTabs();
  updateGreeting();
  display();
  showRemindersPopUp();
}

function addPerson() {
  let name = prompt("Enter the new person's name: 👤");
  if(name && name.trim() !== "") {
    users.push({ name: name.trim(), tasks: [], completedCount: 0 });
    activeUserIndex = users.length - 1; 
    saveData();
    renderTabs();
    updateGreeting();
    display();
    showRemindersPopUp();
  }
}

/* --- USER PROFILE --- */
function updateGreeting() {
  let hour = new Date().getHours();
  let greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  document.getElementById("userName").innerText = `👋 ${greeting},\n${users[activeUserIndex].name}!`;
}

function editUserName() {
  let newName = prompt("Edit name (Emojis welcome!):", users[activeUserIndex].name);
  if (newName && newName.trim() !== "") {
    users[activeUserIndex].name = newName.trim();
    saveData();
    if(appMode === 'multi') renderTabs();
    updateGreeting();
  }
}

/* --- MODAL CONTROLS --- */
function openAdd() {
  editingTaskIndex = -1;
  document.getElementById("modalTitle").innerText = "Add Assignment 📝";
  document.getElementById("title").value = "";
  document.getElementById("desc").value = "";
  document.getElementById("date").value = "";
  document.getElementById("modal").classList.remove("hidden");
}

function closeAdd() { document.getElementById("modal").classList.add("hidden"); }

/* --- ADD / EDIT TASK --- */
function saveTask() {
  let t = document.getElementById("title").value.trim();
  let d = document.getElementById("desc").value.trim();
  let date = document.getElementById("date").value;

  if(!t || !date) return alert("⚠️ Please fill in the Name and Deadline!");

  if (editingTaskIndex > -1) {
    users[activeUserIndex].tasks[editingTaskIndex] = { t, d, date, done: false };
  } else {
    users[activeUserIndex].tasks.push({ t, d, date, done: false });
  }
  
  saveData();
  closeAdd();
  display();
}

function editTask(i) {
  editingTaskIndex = i;
  let task = users[activeUserIndex].tasks[i];
  document.getElementById("modalTitle").innerText = "Edit Assignment ✏️";
  document.getElementById("title").value = task.t;
  document.getElementById("desc").value = task.d;
  document.getElementById("date").value = task.date;
  document.getElementById("modal").classList.remove("hidden");
}

/* --- FINISH / DELETE TASK (WITH FUN ANIMATION!) --- */
function finishTask(i) {
  let taskCards = document.querySelectorAll(".task");
  
  // Trigger the fun pop-out animation
  taskCards[i].classList.add("finishing");

  // Wait for the animation to finish before deleting
  setTimeout(() => {
    alert("Hurraayyy!! You have completed the assignment 🥳🎊🎉");
    // Add 1 to our completed score!
    users[activeUserIndex].completedCount = (users[activeUserIndex].completedCount || 0) + 1;
    users[activeUserIndex].tasks.splice(i, 1);
    
    saveData();
    display();
  }, 600); // 600ms matches the CSS animation time
}

function delTask(i) {
  if(confirm("Are you sure you want to cancel/delete this assignment? 🗑️")) {
    users[activeUserIndex].tasks.splice(i, 1);
    saveData();
    display();
  }
}

/* --- DISPLAY & STATS & PROGRESS BAR --- */
function display() {
  let box = document.getElementById("tasks");
  box.innerHTML = "";

  let today = new Date();
  let todayStr = today.toISOString().split("T")[0];
  let tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  let tomorrowStr = tomorrow.toISOString().split("T")[0];

  let activeTasks = users[activeUserIndex].tasks;
  let totalActive = activeTasks.length;
  let todayC = 0, tomorrowC = 0, overdue = 0, pending = 0;

  activeTasks.forEach((x, i) => {
    let statusText = "", statusClass = "";
    if (x.date === todayStr) { statusText = "🚨 DUE TODAY!"; statusClass = "status-today"; todayC++; } 
    else if (x.date === tomorrowStr) { statusText = "⏰ DUE TOMORROW!"; statusClass = "status-tomorrow"; tomorrowC++; }
    else if (x.date < todayStr) { statusText = "❗ OVERDUE!"; statusClass = "status-overdue"; overdue++; } 
    else { statusText = "⏳ Upcoming"; statusClass = "status-pending"; pending++; }

    let div = document.createElement("div");
    div.className = "task";
    div.innerHTML = `
      <h4>${x.t}</h4>
      <p>${x.d}</p>
      <small class="${statusClass}">Deadline: ${x.date} | ${statusText}</small>
      <div class="task-actions">
        <button class="btn-finish" onclick="finishTask(${i})">✅ Finished</button>
        <button class="btn-edit" onclick="editTask(${i})">✏️ Edit</button>
        <button class="btn-cancel" onclick="delTask(${i})">🗑️ Cancel</button>
      </div>
    `;
    box.appendChild(div);
  });

  // Calculate Progress Bar (Completed vs Total)
  let compCount = users[activeUserIndex].completedCount || 0;
  let totalAllTime = totalActive + compCount;
  let progressPct = totalAllTime === 0 ? 0 : Math.round((compCount / totalAllTime) * 100);
  
  document.getElementById("progressBar").style.width = progressPct + "%";
  
  let progressMessage = progressPct + "%";
  if (progressPct === 100 && totalAllTime > 0) progressMessage = "100% - You can chill! 😎🏆";
  document.getElementById("progressText").innerText = progressMessage;

  // Stats
  document.getElementById("total").innerText = totalActive;
  document.getElementById("pending").innerText = pending;
  document.getElementById("tomorrow").innerText = tomorrowC;
  document.getElementById("today").innerText = todayC;
  document.getElementById("overdue").innerText = overdue;
}

/* --- POP-UP REMINDER ALERT --- */
function showRemindersPopUp() {
  let activeTasks = users[activeUserIndex].tasks;
  let today = new Date();
  let todayStr = today.toISOString().split("T")[0];
  let tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  let tomorrowStr = tomorrow.toISOString().split("T")[0];

  let todayList = [], tomorrowList = [];
  activeTasks.forEach(task => {
    if (task.date === todayStr) todayList.push(task.t);
    if (task.date === tomorrowStr) tomorrowList.push(task.t);
  });

  if (todayList.length > 0 || tomorrowList.length > 0) {
    let msg = `🔔 HEY ${users[activeUserIndex].name.toUpperCase()}! QUICK REMINDER! 🔔\n\n`;
    if (todayList.length > 0) msg += `🚨 DUE TODAY:\n- ${todayList.join('\n- ')}\n\n`;
    if (tomorrowList.length > 0) msg += `⏰ DUE TOMORROW:\n- ${tomorrowList.join('\n- ')}\n\n`;
    msg += `You've got this! 💪✨`;
    setTimeout(() => alert(msg), 500);
  }
}

function saveData(){
  localStorage.setItem("appMode", appMode);
  localStorage.setItem("usersData", JSON.stringify(users));
  localStorage.setItem("activeUserIndex", activeUserIndex);
}