const express = require('express');
const db = require('../Database.js');
const multer = require("multer");
const fs = require("fs");

var app = express();

// ============================
// 🔥 STORAGE (IMAGE + VIDEO)
// ============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/offers/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  }
});

const upload = multer({ storage });

// ============================
// 🔥 GET ALL OFFERS
// ============================
app.get("/getAllOffers", (req, res) => {
  db.query("SELECT * FROM offers ORDER BY offer_id DESC", (err, result) => {
    if (err) return res.send(err);

    res.send({
      data: result,
      msg: "Success"
    });
  });
});

// ============================
// 🔥 GET ONLY ACTIVE OFFERS
// ============================
app.get("/getOffersEcom", (req, res) => {
  db.query(
    "SELECT * FROM offers WHERE published=1 ORDER BY offer_id DESC",
    (err, result) => {
      if (err) return res.send(err);

      res.send({
        data: result,
        msg: "Success"
      });
    }
  );
});

// ============================
// 🔥 INSERT OFFER
// ============================
app.post("/addOffer", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 }
]), (req, res) => {

  const { title, description } = req.body;

  let image = "";
  let video = "";

  if (req.files.image) {
    image = req.files.image[0].filename;
  }

  if (req.files.video) {
    video = req.files.video[0].filename;
  }

  const sql = `
    INSERT INTO offers (title, description, image, video, published)
    VALUES (?, ?, ?, ?, 1)
  `;

  db.query(sql, [title, description, image, video], (err) => {
    if (err) return res.send(err);

    res.send({ msg: "Offer Added ✅" });
  });

});

// ============================
// 🔥 UPDATE OFFER
// ============================
app.post("/updateOffer", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 }
]), (req, res) => {

  const { offer_id, title, description } = req.body;

  let image = req.body.oldImage || "";
  let video = req.body.oldVideo || "";

  if (req.files.image) {
    image = req.files.image[0].filename;
  }

  if (req.files.video) {
    video = req.files.video[0].filename;
  }

  const sql = `
    UPDATE offers SET
      title=?,
      description=?,
      image=?,
      video=?
    WHERE offer_id=?
  `;

  db.query(sql, [title, description, image, video, offer_id], (err) => {
    if (err) return res.send(err);

    res.send({ msg: "Offer Updated ✅" });
  });

});

// ============================
// 🔥 DELETE OFFER
// ============================
app.delete("/deleteOffer/:id", (req, res) => {

  const id = req.params.id;

  db.query("SELECT image, video FROM offers WHERE offer_id=?", [id], (err, result) => {

    if (result.length) {
      const { image, video } = result[0];

      if (image) {
        try { fs.unlinkSync("uploads/offers/" + image); } catch {}
      }

      if (video) {
        try { fs.unlinkSync("uploads/offers/" + video); } catch {}
      }
    }

    db.query("DELETE FROM offers WHERE offer_id=?", [id], (err2) => {
      if (err2) return res.send(err2);

      res.send({ msg: "Deleted ✅" });
    });

  });

});

// ============================
// 🔥 TOGGLE PUBLISH
// ============================
app.post("/toggleOfferPublish", (req, res) => {

  const { offer_id, published } = req.body;

  db.query(
    "UPDATE offers SET published=? WHERE offer_id=?",
    [published, offer_id],
    (err) => {
      if (err) return res.send(err);

      res.send({ msg: "Updated" });
    }
  );

});

module.exports = app;