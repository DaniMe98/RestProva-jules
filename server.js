const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const storage = require('./storage');
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/api/reservations', (req, res) => {
  storage.getReservations((reservations) => {
    res.json(reservations);
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
