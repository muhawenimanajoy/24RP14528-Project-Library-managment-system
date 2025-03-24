const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const mysql = require('mysql2/promise');

// Database configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'library_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Validation middleware
const validateStudent = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('class').trim().notEmpty().withMessage('Class is required'),
  body('studentId').trim().notEmpty().withMessage('Student ID is required')
];

// Get all students
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching student' });
  }
});

// Create new student
router.post('/', validateStudent, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, class: studentClass, studentId } = req.body;
    const [result] = await pool.query(
      'INSERT INTO students (name, class, student_id) VALUES (?, ?, ?)',
      [name, studentClass, studentId]
    );
    res.status(201).json({
      id: result.insertId,
      name,
      class: studentClass,
      studentId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating student' });
  }
});

// Update student
router.put('/:id', validateStudent, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, class: studentClass, studentId } = req.body;
    const [result] = await pool.query(
      'UPDATE students SET name = ?, class = ?, student_id = ? WHERE id = ?',
      [name, studentClass, studentId, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      id: req.params.id,
      name,
      class: studentClass,
      studentId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating student' });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM students WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting student' });
  }
});

module.exports = router;