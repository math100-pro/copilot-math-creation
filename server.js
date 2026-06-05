const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const { createCheckoutSession } = require("./stripe");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const SPECIAL_EMAIL = "omerobdr@gmail.com";
const SPECIAL_PASSWORD = "152181isA";

const USERS_FILE = path.join(__dirname, "users.json");

// simple file-based users
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// login / signup
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required." });
  }

  let users = readUsers();
  let user = users.find(u => u.email === email);

  if (!user) {
    user = {
      email,
      password,
      mp: 0,
      streak: 0,
      premium: false,
      role: "user"
    };
    users.push(user);
    writeUsers(users);
  } else {
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid password." });
    }
  }

  // special admin account
  if (email === SPECIAL_EMAIL && password === SPECIAL_PASSWORD) {
    user.premium = true;
    user.role = "admin";
    writeUsers(users);
  }

  return res.json({
    email: user.email,
    mp: user.mp,
    streak: user.streak,
    premium: user.premium,
    role: user.role
  });
});

// save progress
app.post("/api/progress", (req, res) => {
  const { email, mp, streak } = req.body;
  if (!email) return res.status(400).json({ error: "Email required." });

  let users = readUsers();
  let user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: "User not found." });

  user.mp = mp;
  user.streak = streak;
  writeUsers(users);

  res.json({ success: true });
});

// get courses
app.get("/api/courses", (req, res) => {
  const coursesPath = path.join(__dirname, "public", "courses.json");
  const data = JSON.parse(fs.readFileSync(coursesPath, "utf8"));
  res.json(data);
});

// Stripe checkout (placeholder)
app.post("/api/stripe/checkout", async (req, res) => {
  const { email } = req.body;
  try {
    const session = await createCheckoutSession(email);
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stripe error." });
  }
});

app.listen(PORT, () => {
  console.log(`MathVerse server running on http://localhost:${PORT}`);
});
