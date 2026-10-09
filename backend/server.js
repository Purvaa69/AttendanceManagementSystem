const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const db = require("./db");
const app = express();

app.use(cors());
app.use(express.json());

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Please log in to access this resource.",
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      message: "Authentication is not configured.",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        message: "Your session is invalid or expired. Please log in again.",
      });
    }

    req.user = decoded;
    next();
  });
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
}

// 1. Health check (public)
app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({
      message: "Backend and MySQL connected successfully!",
    });
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({
      error: "Database connection failed",
    });
  }
});

// 2. Login (public)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Authentication is not configured",
      });
    }

    const [users] = await db.execute(
      `SELECT id, name, email, password_hash, role,
              student_id, teacher_id
       FROM users
       WHERE email = ?`,
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        student_id: user.student_id,
        teacher_id: user.teacher_id,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      message: "Unable to log in. Please try again.",
    });
  }
});

// 3. Get all students (protected)
app.get("/api/students", authenticateToken, authorizeRoles("admin", "teacher"), async (req, res) => {
  try {
    const [students] = await db.query(
      "SELECT * FROM students ORDER BY id DESC"
    );
    res.json(students);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "Failed to fetch students",
    });
  }
});

// 4. Add a student (protected)
app.post("/api/students", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { roll_number, name, email } = req.body;

    if (
      typeof roll_number !== "string" ||
      !roll_number.trim() ||
      typeof name !== "string" ||
      !name.trim() ||
      (email != null && typeof email !== "string")
    ) {
      return res.status(400).json({
        error: "Valid roll number and name are required",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO students (roll_number, name, email)
       VALUES (?, ?, ?)`,
      [
        roll_number.trim(),
        name.trim(),
        email?.trim() || null,
      ]
    );

    res.status(201).json({
      message: "Student added successfully",
      id: result.insertId,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Roll number or email already exists",
      });
    }

    console.error(error.message);
    res.status(500).json({
      error: "Failed to add student",
    });
  }
});

// 5. Get all classes (protected)
app.get("/api/classes", authenticateToken, authorizeRoles("admin", "teacher"), async (req, res) => {
  try {
    const [classes] = await db.query(`
      SELECT
        c.id,
        c.class_name,
        c.subject,
        c.teacher_id,
        t.name AS teacher_name
      FROM classes c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      ORDER BY c.id DESC
    `);

    res.json(classes);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "Failed to fetch classes",
    });
  }
});

// 6. Create a class (protected)
app.post("/api/classes", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { class_name, subject, teacher_id } = req.body;

    if (
      typeof class_name !== "string" ||
      !class_name.trim() ||
      typeof subject !== "string" ||
      !subject.trim()
    ) {
      return res.status(400).json({
        error: "Class name and subject are required",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO classes (class_name, subject, teacher_id)
       VALUES (?, ?, ?)`,
      [
        class_name.trim(),
        subject.trim(),
        teacher_id || null,
      ]
    );

    res.status(201).json({
      message: "Class created successfully",
      id: result.insertId,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "Failed to create class",
    });
  }
});

// 7. Get attendance history (protected)
app.get("/api/attendance", authenticateToken, authorizeRoles("admin", "teacher"), async (req, res) => {
  try {
    const [records] = await db.query(`
      SELECT
        a.id,
        a.student_id,
        a.class_id,
        DATE_FORMAT(a.attendance_date, '%Y-%m-%d')
          AS attendance_date,
        a.status,
        s.roll_number,
        s.name AS student_name,
        c.class_name,
        c.subject
      FROM attendance a
      JOIN students s ON s.id = a.student_id
      JOIN classes c ON c.id = a.class_id
      ORDER BY a.attendance_date DESC, s.name
    `);

    res.json(records);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "Failed to fetch attendance records",
    });
  }
});

// 8. Mark or update attendance (protected)
app.post("/api/attendance", authenticateToken, authorizeRoles("admin", "teacher"), async (req, res) => {
  try {
    const {
      student_id,
      class_id,
      attendance_date,
      status,
    } = req.body;

    if (
      !Number.isInteger(student_id) ||
      student_id <= 0 ||
      !Number.isInteger(class_id) ||
      class_id <= 0
    ) {
      return res.status(400).json({
        error: "Valid student and class IDs are required",
      });
    }

    if (
      typeof attendance_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(attendance_date)
    ) {
      return res.status(400).json({
        error: "Date must be in YYYY-MM-DD format",
      });
    }

    const parsedDate = new Date(
      `${attendance_date}T00:00:00Z`
    );

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== attendance_date
    ) {
      return res.status(400).json({
        error: "Invalid attendance date",
      });
    }

    if (!["Present", "Absent", "Late"].includes(status)) {
      return res.status(400).json({
        error: "Status must be Present, Absent, or Late",
      });
    }

    const [result] = await db.execute(
      `INSERT INTO attendance
        (student_id, class_id, attendance_date, status)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         status = VALUES(status)`,
      [student_id, class_id, attendance_date, status]
    );

    res.json({
      message: "Attendance saved successfully",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error(error.message);

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "Student or class does not exist",
      });
    }

    res.status(500).json({
      error: "Failed to save attendance",
    });
  }
});

// 9. Attendance reports (protected)
// Optional filter: /api/reports/attendance?class_id=1
app.get("/api/reports/attendance", authenticateToken, authorizeRoles("admin", "teacher"), async (req, res) => {
    try {
      const classIdParam = req.query.class_id;
      let classId = null;

      if (classIdParam !== undefined) {
        classId = Number(classIdParam);

        if (!Number.isInteger(classId) || classId <= 0) {
          return res.status(400).json({
            message: "Please provide a valid class ID.",
          });
        }
      }

      const joinFilter =
        classId !== null ? " AND a.class_id = ?" : "";

      const params = classId !== null ? [classId] : [];

      const query = `
        SELECT
          s.id AS student_id,
          s.roll_number,
          s.name AS student_name,
          COUNT(a.id) AS total_classes,
          COALESCE(
            SUM(
              CASE
                WHEN a.status IN ('Present', 'Late') THEN 1
                ELSE 0
              END
            ), 0
          ) AS attended_classes,
          COALESCE(
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END),
            0
          ) AS present_count,
          COALESCE(
            SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END),
            0
          ) AS absent_count,
          COALESCE(
            SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END),
            0
          ) AS late_count,
          COALESCE(
            ROUND(
              100.0 * SUM(
                CASE
                  WHEN a.status IN ('Present', 'Late') THEN 1
                  ELSE 0
                END
              ) / NULLIF(COUNT(a.id), 0),
              2
            ), 0
          ) AS attendance_percentage
        FROM students s
        LEFT JOIN attendance a
          ON a.student_id = s.id${joinFilter}
        GROUP BY s.id, s.roll_number, s.name
        ORDER BY s.name ASC
      `;

      const [reports] = await db.execute(query, params);
      res.json(reports);
    } catch (error) {
      console.error("Attendance report error:", error);
      res.status(500).json({
        message: "Failed to generate attendance reports.",
      });
    }
  }
);

// Start server
const PORT = process.env.PORT || 5000;
// Get attendance records for the logged-in student
app.get(
  "/api/student/attendance",
  authenticateToken,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const [users] = await db.execute(
        "SELECT student_id FROM users WHERE id = ? AND role = 'student'",
        [req.user.userId]
      );

      if (!users.length || !users[0].student_id) {
        return res.status(404).json({
          message: "No student record is linked to this account.",
        });
      }

      const studentId = users[0].student_id;

      const [records] = await db.execute(
        `SELECT
           a.id,
           DATE_FORMAT(a.attendance_date, '%Y-%m-%d') AS attendance_date,
           a.status,
           c.class_name,
           c.subject
         FROM attendance a
         JOIN classes c ON c.id = a.class_id
         WHERE a.student_id = ?
         ORDER BY a.attendance_date DESC`,
        [studentId]
      );

      const totalClasses = records.length;
      const attendedClasses = records.filter(
        (record) =>
          record.status === "Present" || record.status === "Late"
      ).length;

      const attendancePercentage =
        totalClasses === 0
          ? 0
          : Number(((attendedClasses / totalClasses) * 100).toFixed(2));

      res.json({
        total_classes: totalClasses,
        attended_classes: attendedClasses,
        attendance_percentage: attendancePercentage,
        records,
      });
    } catch (error) {
      console.error("Student attendance error:", error.message);
      res.status(500).json({
        message: "Failed to load student attendance.",
      });
    }
  }
);
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});