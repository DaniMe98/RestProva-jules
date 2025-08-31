const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');

const STORAGE_TYPE = "json"; // Cambia a "mysql" per usare MySQL invece di JSON

// Configurazione file JSON
const jsonPath = path.join(__dirname, 'reservations.json');

// Configurazione MySQL (modifica con i tuoi dati se necessario)
const dbConfig = {
  host: process.env.MYSQL_HOST || 'http://sql7.freesqldatabase.com/',
  user: process.env.MYSQL_USER || 'sql7795836',
  password: process.env.MYSQL_PASSWORD || 'Lu8YUH21A5',
  database: process.env.MYSQL_DATABASE || 'sql7795836'
};

let pool;
if (STORAGE_TYPE === "mysql") {
  pool = mysql.createPool(dbConfig);
  // Crea la tabella se non esiste
  pool.query(`CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    date VARCHAR(32),
    people INT
  )`);
}

// Leggi tutte le prenotazioni
function getReservations(callback) {
  if (STORAGE_TYPE === "json") {
    fs.readFile(jsonPath, (err, data) => {
      if (err) return callback([]);
      try { callback(JSON.parse(data)); }
      catch { callback([]); }
    });
  } else if (STORAGE_TYPE === "mysql") {
    pool.query('SELECT * FROM reservations', (err, results) => {
      if (err) return callback([]);
      callback(results);
    });
  }
}

// Aggiungi una prenotazione
function addReservation(res, callback) {
  if (STORAGE_TYPE === "json") {
    getReservations((reservations) => {
      reservations.push(res);
      fs.writeFile(jsonPath, JSON.stringify(reservations, null, 2), () => {
        callback();
      });
    });
  } else if (STORAGE_TYPE === "mysql") {
    pool.query(
      'INSERT INTO reservations (name, date, people) VALUES (?, ?, ?)',
      [res.name, res.date, res.people],
      callback
    );
  }
}

module.exports = { getReservations, addReservation, STORAGE_TYPE };
