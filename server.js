const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const storage = require('./storage');
const app = express();

app.use(express.static('.'));

app.use(cors());
app.use(bodyParser.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'a-very-secret-key',
  resave: false,
  saveUninitialized: true
}));

app.get('/api/reservations', (req, res) => {
  storage.getReservations((reservations) => {
    res.json(reservations);
  });
});

// Admin Authentication
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

app.post('/admin/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false });
    }
    res.redirect('/admin.html');
  });
});

// Middleware to check if user is admin
function isAdmin(req, res, next) {
  if (req.session.isAdmin) {
    return next();
  }
  res.status(401).json({ success: false, error: 'Unauthorized' });
}

// Fields API
const fieldsPath = './fields.json';

app.get('/admin/fields', isAdmin, (req, res) => {
  fs.readFile(fieldsPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Error reading fields file' });
    }
    res.json(JSON.parse(data));
  });
});

app.post('/admin/fields', isAdmin, (req, res) => {
  const newFields = req.body;
  fs.writeFile(fieldsPath, JSON.stringify(newFields, null, 2), 'utf8', (err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Error writing fields file' });
    }
    res.json({ success: true });
  });
});

app.post('/api/reservations', (req, res) => {
  const reservation = req.body;
  storage.addReservation(reservation, (err) => {
    if (err) {
      console.error('Errore durante l\'inserimento:', err);
      res.status(500).json({ success: false, error: 'Errore durante l\'inserimento' });
    } else {
      res.status(201).json({ success: true });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} [storage: ${storage.STORAGE_TYPE}]`);
});
