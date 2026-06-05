let currentUser = null;
let mp = 0;
let streak = 0;
let isPremium = false;
let isAdmin = false;

const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const loginBtn = document.getElementById("login-btn");

const mpDisplay = document.getElementById("mp-display");
const streakDisplay = document.getElementById("streak-display");

const authSection = document.getElementById("auth-section");
const coursesSection = document.getElementById("courses-section");
const coursesList = document.getElementById("courses-list");

const sectionSection = document.getElementById("section-section");
const sectionTitle = document.getElementById("section-title");
const sectionsList = document.getElementById("sections-list");

const unitSection = document.getElementById("unit-section");
const unitTitle = document.getElementById("unit-title");
const unitsList = document.getElementById("units-list");

const lessonSection = document.getElementById("lesson-section");
const lessonTitle = document.getElementById("lesson-title");
const lessonContent = document.getElementById("lesson-content");
const completeLessonBtn = document.getElementById("complete-lesson-btn");

const leaderboardSection = document.getElementById("leaderboard-section");
const leaderboardList = document.getElementById("leaderboard-list");

const adsSection = document.getElementById("ads-section");
const premiumBtn = document.getElementById("premium-btn");

const adminSection = document.getElementById("admin-section");
const adminCodeView = document.getElementById("admin-code-view");

let coursesData = null;
let currentCourse = null;
let currentSectionObj = null;
let currentUnitObj = null;
let currentLessonObj = null;

function updateHUD() {
  mpDisplay.textContent = `MP: ${mp}`;
  streakDisplay.textContent = `Streak: ${streak}🔥`;
}

async function fetchCourses() {
  const res = await fetch("/api/courses");
  coursesData = await res.json();
}

function showCourses() {
  coursesSection.classList.remove("hidden");
  sectionSection.classList.add("hidden");
  unitSection.classList.add("hidden");
  lessonSection.classList.add("hidden");

  coursesList.innerHTML = "";
  coursesData.courses.forEach(course => {
    const div = document.createElement("div");
    div.className = "course-card";
    div.innerHTML = `
      <div>
        <div class="course-title">${course.name}</div>
        <div class="course-meta">${course.sections.length} sections</div>
      </div>
      <button class="btn secondary" data-course="${course.id}">Start</button>
    `;
    coursesList.appendChild(div);
  });

  coursesList.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const courseId = btn.getAttribute("data-course");
      currentCourse = coursesData.courses.find(c => c.id === courseId);
      showSections(currentCourse);
    });
  });
}

function showSections(course) {
  coursesSection.classList.add("hidden");
  sectionSection.classList.remove("hidden");
  unitSection.classList.add("hidden");
  lessonSection.classList.add("hidden");

  sectionTitle.textContent = course.name;
  sectionsList.innerHTML = "";

  course.sections.forEach(section => {
    const div = document.createElement("div");
    div.className = "section-card";
    div.innerHTML = `
      <div>
        <div class="section-title">${section.name}</div>
        <div class="section-meta">${section.units.length} units</div>
      </div>
      <button class="btn secondary" data-section="${section.id}">Open</button>
    `;
    sectionsList.appendChild(div);
  });

  sectionsList.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const sectionId = btn.getAttribute("data-section");
      currentSectionObj = course.sections.find(s => s.id === sectionId);
      showUnits(currentSectionObj);
    });
  });
}

function showUnits(section) {
  sectionSection.classList.add("hidden");
  unitSection.classList.remove("hidden");
  lessonSection.classList.add("hidden");

  unitTitle.textContent = section.name;
  unitsList.innerHTML = "";

  section.units.forEach(unit => {
    const div = document.createElement("div");
    div.className = "unit-card";
    div.innerHTML = `
      <div>
        <div class="unit-title">${unit.name}</div>
        <div class="unit-meta">${unit.lessons.length} lessons</div>
      </div>
      <button class="btn secondary" data-unit="${unit.id}">Open</button>
    `;
    unitsList.appendChild(div);
  });

  unitsList.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const unitId = btn.getAttribute("data-unit");
      currentUnitObj = section.units.find(u => u.id === unitId);
      showLessons(currentUnitObj);
    });
  });
}

function showLessons(unit) {
  unitSection.classList.add("hidden");
  lessonSection.classList.remove("hidden");

  // just show first lesson for now
  currentLessonObj = unit.lessons[0];
  lessonTitle.textContent = currentLessonObj.title;
  lessonContent.textContent =
    "Lesson type: " +
    currentLessonObj.type +
    ". Replace this with real math visuals, graphs, and interactive questions.";
}

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (data.error) {
    alert(data.error);
    return;
  }

  currentUser = { email: data.email };
  mp = data.mp || 0;
  streak = data.streak || 0;
  isPremium = data.premium;
  isAdmin = data.role === "admin";

  updateHUD();

  if (isPremium) {
    adsSection.classList.add("hidden");
  } else {
    adsSection.classList.remove("hidden");
  }

  if (isAdmin) {
    adminSection.classList.remove("hidden");
    adminCodeView.textContent =
      "Admin view: you can show logs, user list, or even source code snippets here.";
  } else {
    adminSection.classList.add("hidden");
  }

  authSection.classList.add("hidden");
  await fetchCourses();
  showCourses();
});

completeLessonBtn.addEventListener("click", async () => {
  mp += 10;
  streak += 1;
  updateHUD();

  if (currentUser) {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: currentUser.email, mp, streak })
    });
  }

  alert("Lesson completed! +10 MP");
});

premiumBtn.addEventListener("click", async () => {
  if (isPremium) {
    alert("You already have Premium (no ads).");
    return;
  }

  if (!currentUser) {
    alert("Log in first to upgrade.");
    return;
  }

  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: currentUser.email })
  });

  const data = await res.json();
  if (data.url) {
    window.location.href = data.url;
  } else {
    alert("Stripe checkout error.");
  }
});

// you can later implement leaderboard by reading users.json on backend
