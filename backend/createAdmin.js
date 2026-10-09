
require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("./db");

async function createAdmin() {
  try {
    const name = "Admin";
    const email = "admin@markyourattendance.com";
    const password = "Admin@12345";

    const passwordHash = await bcrypt.hash(password, 12);

    await db.execute(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password_hash = VALUES(password_hash),
         role = 'admin'`,
      [name, email, passwordHash]
    );

    console.log("Admin account created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
  } catch (error) {
    console.error("Error creating admin:", error.message);
  } finally {
    await db.end();
  }
}

createAdmin();
