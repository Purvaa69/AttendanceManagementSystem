
const bcrypt = require("bcryptjs");
const db = require("./db");

async function createTestAccounts() {
  let connection;

  try {
    connection = await db.getConnection();

    // 1. Create a teacher record if it doesn't exist.
    const teacherEmail = "teacher@markyourattendance.com";

    let [teachers] = await connection.execute(
      "SELECT id FROM teachers WHERE email = ?",
      [teacherEmail]
    );

    let teacherId;

    if (teachers.length > 0) {
      teacherId = teachers[0].id;
    } else {
      const [result] = await connection.execute(
        "INSERT INTO teachers (name, email) VALUES (?, ?)",
        ["Test Teacher", teacherEmail]
      );

      teacherId = result.insertId;
    }

    // 2. Define the test login accounts.
    const accounts = [
      {
        name: "Test Teacher",
        email: teacherEmail,
        password: "Teacher@123",
        role: "teacher",
        teacher_id: teacherId,
        student_id: null,
      },
      {
        name: "Test Student",
        email: "test@example.com",
        password: "Student@123",
        role: "student",
        student_id: 1,
        teacher_id: null,
      },
      {
        name: "Purva Rane",
        email: "prane85945@gmail.com",
        password: "Purva@123",
        role: "student",
        student_id: 2,
        teacher_id: null,
      },
      {
        name: "Bhargavi Ranade",
        email: "bhargavi@gmail.com",
        password: "Bhargavi@123",
        role: "student",
        student_id: 3,
        teacher_id: null,
      },
    ];

    // 3. Hash passwords and create/update login accounts.
    for (const account of accounts) {
      const passwordHash = await bcrypt.hash(
        account.password,
        10
      );

      const [existing] = await connection.execute(
        "SELECT id FROM users WHERE email = ?",
        [account.email]
      );

      if (existing.length > 0) {
        await connection.execute(
          `UPDATE users
           SET name = ?, password_hash = ?, role = ?,
               student_id = ?, teacher_id = ?
           WHERE email = ?`,
          [
            account.name,
            passwordHash,
            account.role,
            account.student_id,
            account.teacher_id,
            account.email,
          ]
        );
      } else {
        await connection.execute(
          `INSERT INTO users
           (name, email, password_hash, role, student_id, teacher_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            account.name,
            account.email,
            passwordHash,
            account.role,
            account.student_id,
            account.teacher_id,
          ]
        );
      }

      console.log(
        `Created/updated ${account.role} account: ${account.email}`
      );
    }

    console.log("\nAll test accounts are ready.");
    console.log("Change these temporary passwords before real use.");
  } catch (error) {
    console.error("Could not create accounts:", error.message);
  } finally {
    if (connection) connection.release();
    await db.end();
  }
}

createTestAccounts();
