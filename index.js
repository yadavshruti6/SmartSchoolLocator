const express = require('express');
const mysql = require('mysql');
const app = express();
const port = 3000;

app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'School_Management'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to the database.');
});

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to School API');
});

// Students list route (example)
app.get('/students', (req, res) => {
  const students = [
    { id: 1, name: "Shruti", class: "12th" },
    { id: 2, name: "Shreya", class: "10th" },
    { id: 3, name: "Adarsh", class: "8th" }
  ];
  res.json(students);
});

// Add school route
app.post('/addSchool', (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  if (!name || !address || !latitude || !longitude) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
  const values = [name, address, latitude, longitude];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(201).json({ message: 'School added successfully', schoolId: result.insertId });
  });
});

// Distance calculation function (Haversine formula)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// List schools route
app.get('/listSchools', (req, res) => {
  const userLat = parseFloat(req.query.latitude);
  const userLon = parseFloat(req.query.longitude);

  if (isNaN(userLat) || isNaN(userLon)) {
    return res.status(400).json({ error: 'Invalid or missing latitude/longitude' });
  }

  const sql = 'SELECT * FROM schools';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const schoolsWithDistance = results.map(school => {
      const distance = getDistanceFromLatLonInKm(userLat, userLon, school.latitude, school.longitude);
      return { ...school, distance };
    });

    schoolsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json(schoolsWithDistance);
  });
});

// Start server
app.listen(port, () => {
  console.log('Server is running on port ${port}');
});