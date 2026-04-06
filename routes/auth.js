const express = require("express");
const router = express.Router(); // ✅ MUST
const db = require("../Database");
const bcrypt = require("bcryptjs");

/* =========================
   REGISTER
========================= */
router.post("/register", async (req, res) => {

  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, msg: "All fields required" });
  }

  db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {

    if (err) return res.json(err);

    if (result.length > 0) {
      return res.json({ success: false, msg: "User already exists ❌" });
    }

    const hash = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (name,email,phone,password) VALUES (?,?,?,?)",
      [name, email, phone, hash],
      (err) => {
        if (err) return res.json(err);

        res.json({ success: true, msg: "Registered ✅" });
      }
    );

  });

});


/* =========================
   LOGIN
========================= */
router.post("/login", (req, res) => {

  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {

    if (err) return res.json(err);

    if (result.length === 0) {
      return res.json({ success: false, msg: "User not found ❌" });
    }

    const user = result[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.json({ success: false, msg: "Wrong password ❌" });
    }

    res.json({
      success: true,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email
      }
    });

  });

});

module.exports = router; // ✅ MUST