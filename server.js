const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// ---- CONFIG ----
const DB_FILE = path.join(__dirname, 'reservations.json');
const FIELDS_FILE = path.join(__dirname, 'fields.json');
const ADMIN_PASSWORD = 'changeme123'; // Change this!

// ---- MIDDLEWARE ----
app.use(cors());
app.use(bodyParser.json());
app.use(session({
    secret: 'pizza_secret_session',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// ---- UTILS ----
function loadJSON(file, fallback) {
    try {
        return JSON.parse(fs.readFileSync(file));
    } catch {
        return fallback;
    }
}
function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function isAuthenticated(req) {
    return req.session && req.session.admin === true;
}

// ---- API ----

// Get reservation form fields (for dynamic frontend)
app.get('/fields', (req, res) => {
    const fields = loadJSON(FIELDS_FILE, []);
    res.json(fields);
});

// Admin can view/change reservation fields
app.get('/admin/fields', (req, res) => {
    if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
    const fields = loadJSON(FIELDS_FILE, []);
    res.json(fields);
});
app.post('/admin/fields', (req, res) => {
    if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
    saveJSON(FIELDS_FILE, req.body);
    res.json({ success: true });
});

// Get available slots for a date
app.get('/available-slots', (req, res) => {
    const { date } = req.query;
    const fields = loadJSON(FIELDS_FILE, []);
    const timeField = fields.find(f => f.type === 'time');
    const slots = timeField && timeField.options ? timeField.options : [
        "11:00", "12:00", "13:00", "18:00", "19:00", "20:00"
    ];
    const reservations = loadJSON(DB_FILE, []);
    const booked = reservations.filter(r => r.date === date).map(r => r.time);
    const available = slots.filter(t => !booked.includes(t));
    res.json({ available });
});

// Make a reservation
app.post('/reserve', (req, res) => {
    const reservation = req.body;
    // Check for slot already booked
    const reservations = loadJSON(DB_FILE, []);
    if (reservations.some(r => r.date === reservation.date && r.time === reservation.time)) {
        return res.status(400).json({ error: 'Slot already booked!' });
    }
    reservations.push(reservation);
    saveJSON(DB_FILE, reservations);
    res.json({ success: true });
});

// Admin authentication
app.post('/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        req.session.admin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Wrong password' });
    }
});
app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Get all reservations (admin)
app.get('/reservations', (req, res) => {
    if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
    const reservations = loadJSON(DB_FILE, []);
    res.json(reservations);
});

// ---- STATIC FILES ----
app.use(express.static(__dirname));

// ---- START ----
if (!fs.existsSync(DB_FILE)) saveJSON(DB_FILE, []);
if (!fs.existsSync(FIELDS_FILE)) {
    saveJSON(FIELDS_FILE, [
        { name: "name", label: "Your Name", type: "text", required: true },
        { name: "email", label: "Your Email", type: "email", required: true },
        { name: "phone", label: "Phone Number", type: "tel", required: true },
        { name: "guests", label: "Guests", type: "number", required: true, min: 1, max: 20 },
        { name: "date", label: "Date", type: "date", required: true },
        { name: "time", label: "Time", type: "time", required: true, options: ["11:00", "12:00", "13:00", "18:00", "19:00", "20:00"] }
    ]);
}
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));