const express = require('express');
const db = require('../Database.js');
const multer = require("multer");
var cors = require('cors');
var app = express();
app.use(cors());
const QRCode = require("qrcode");
const bwipjs = require("bwip-js");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  }
});

const upload = multer({ storage });




    app.get('/getProduct', (req, res, next) => {
    db.query(`SELECT 
  p.*,
  MIN(pi.image) AS images
FROM products p
LEFT JOIN product_images pi 
  ON pi.product_id = p.product_id
GROUP BY p.product_id
ORDER BY p.product_id DESC;`,
    (err, result) => {
      if (err) {
        console.log('error: ', err);
        return res.status(400).send({
          data: err,
          msg: 'failed',
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
  });
  }
    }
  );
  });

  app.get("/getCustomers", (req, res) => {
  db.query("SELECT * FROM customers ORDER BY customer_id DESC", (err, result) => {
    if (err) return res.json({ error: err });
    res.json({ data: result });
  });
});

  app.post("/addCustomer", (req, res) => {

  const data = req.body;

  db.query(
    `INSERT INTO customers 
    (name, phone, email, address, description, followup_date, visit_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.phone,
      data.email,
      data.address,
      data.description,
      data.followup_date,
      data.visit_date,
      data.status || "Pending"
    ],
    (err, result) => {
      if (err) return res.json({ error: err });
      res.json({ success: true });
    }
  );
});

app.post("/updateCustomer/:id", (req, res) => {

  const { id } = req.params;

  const {
    name,
    phone,
    email,
    address,
    description,
    followup_date,
    visit_date,
    status
  } = req.body;

  const sql = `
    UPDATE customers SET
      name = ?,
      phone = ?,
      email = ?,
      address = ?,
      description = ?,
      followup_date = ?,
      visit_date = ?,
      status = ?
    WHERE customer_id = ?
  `;

  db.query(
    sql,
    [
      name,
      phone,
      email,
      address,
      description,
      followup_date,
      visit_date,
      status,
      id
    ],
    (err, result) => {
      if (err) {
        console.log("❌ UPDATE ERROR:", err);
        return res.status(500).json({ error: err });
      }

      res.json({
        success: true,
        message: "Customer updated successfully"
      });
    }
  );
});

  app.get("/todayVisits", (req, res) => {

  db.query(
    `SELECT COUNT(*) as total FROM customers 
     WHERE DATE(visit_date) = CURDATE()`,
    (err, result) => {
      if (err) return res.json({ error: err });
      res.json(result[0]);
    }
  );

});

    app.get('/getProductEcom', (req, res, next) => {
    db.query(`SELECT 
  p.*, 
  pi.image
FROM products p
LEFT JOIN product_images pi 
ON p.product_id = pi.product_id
WHERE p.published = 1 AND pi.is_primary = 1;`,
    (err, result) => {
      if (err) {
        console.log('error: ', err);
        return res.status(400).send({
          data: err,
          msg: 'failed',
        });
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
  });
  }
    }
  );
  });

 app.post("/getProductByids", (req, res) => {
  db.query(
    "SELECT * FROM products WHERE product_id=?",
    [req.body.product_id],
    (err, result) => {
      if (err) return res.send(err);

      const product = result[0];

      res.send({ data: [product] });
    }
  );
});

app.post("/getProductByid", (req, res) => {

  const productId = req.body.product_id;
  console.log("id:",productId);
  db.query(
    "SELECT * FROM products WHERE product_id=?",
    [productId],
    (err, result) => {

      if (err) return res.send(err);

      // 🔥 முக்கியம் (check)
      if (!result || result.length === 0) {
        return res.send({
          success: false,
          message: "Product not found",
          data: []
        });
      }

      const product = result[0];
      db.query(
        "SELECT image_id, image FROM product_images WHERE product_id=?",
        [productId],
        (err2, images) => {

          if (err2) return res.send(err2);

          // ✅ images empty இருந்தாலும் safe
          product.images = images || [];

          res.send({
            success: true,
            data: [product]
          });
        }
      );

    }
  );

});

app.post("/insertProduct", upload.array("images", 10), (req, res) => {

  const {
    product_name,
    description,
    price,
    qty,
    pic,
    mrp,
    size,
    brand,
    finish
  } = req.body;

  const brandCode = "AK";
  const category = brand ? brand.split(" ")[0].toUpperCase() : "GEN";
  const prefix = `${brandCode}-${category}`;

  const getLastCodeSql = `
    SELECT product_code FROM products 
    WHERE product_code LIKE '${prefix}-%'
    ORDER BY CAST(SUBSTRING_INDEX(product_code, '-', -1) AS UNSIGNED) DESC
    LIMIT 1
  `;

  db.query(getLastCodeSql, (err, result) => {

    if (err) return res.send(err);

    let nextNumber = 1;

    if (result.length > 0) {
      const lastCode = result[0].product_code;
      const lastNumber = parseInt(lastCode.split("-")[2]);
      nextNumber = lastNumber + 1;
    }

    const formattedNumber = String(nextNumber).padStart(3, "0");
    const product_code = `${prefix}-${formattedNumber}`;

    const sql = `
      INSERT INTO products 
      (product_code, product_name, description, price, qty, pic, mrp, size, brand, finish, published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;

    db.query(sql, [
      product_code,
      product_name,
      description,
      price,
      qty,
      pic,
      mrp,
      size,
      brand,
      finish
    ], (err, result2) => {

      if (err) return res.send(err);

      const productId = result2.insertId;

      // ✅ IMAGE INSERT
      if (req.files && req.files.length > 0) {
        req.files.forEach((file, index) => {
          db.query(
            "INSERT INTO product_images (product_id, image, is_primary) VALUES (?, ?, ?)",
            [productId, file.filename, index === 0 ? 1 : 0]
          );
        });
      }

      // ✅ PATH FIX (IMPORTANT 🔥)
      const barcodePath = path.join(__dirname, "../uploads/barcodes", `${product_code}.png`);
      const qrPath = path.join(__dirname, "../uploads/qrcodes", `${product_code}.png`);

      // ✅ GENERATE QR
      QRCode.toFile(
        qrPath,
        `https://yourdomain.com/product/${product_code}`,
        (err3) => {
          if (err3) console.log("QR ERROR:", err3);
        }
      );

      // ✅ GENERATE BARCODE
      bwipjs.toBuffer({
        bcid: "code128",
        text: product_code,
        scale: 3,
        height: 10,
        includetext: true
      }, (err4, png) => {

        if (err4) {
          console.log("BARCODE ERROR:", err4);
        } else {
          fs.writeFileSync(barcodePath, png);
        }

        // ✅ SAVE FILE PATH DB
        const barcodeFile = `uploads/barcodes/${product_code}.png`;
        const qrFile = `uploads/qrcodes/${product_code}.png`;

        db.query(
          "UPDATE products SET barcode=?, qrcode=? WHERE product_id=?",
          [barcodeFile, qrFile, productId],
          (err5) => {

            if (err5) return res.send(err5);

            res.send({
              msg: "Product Added + Barcode + QR ✅",
              product_code,
              barcode: barcodeFile,
              qrcode: qrFile
            });

          }
        );

      });

    });

  });

});
  // Image
 app.get("/getProductFull/:id", (req, res) => {

  const id = req.params.id;

  db.query("SELECT * FROM products WHERE product_id=?", [id], (err, product) => {

    if (err) return res.send(err);

    db.query(
      "SELECT * FROM product_images WHERE product_id=?",
      [id],
      (err2, images) => {

        if (err2) return res.send(err2);

        res.send({
          product: product[0],
          images
        });

      }
    );

  });
});

app.post("/addImages", upload.array("images", 10), (req, res) => {
    console.log("BODY:", req.body);
  console.log("FILES:", req.files);

  const { product_id } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.send("No files uploaded");
  }

  const values = req.files.map(file => [
    product_id,
    file.filename,
    0
  ]);

  db.query(
    "INSERT INTO product_images (product_id, image, is_primary) VALUES ?",
    [values],
    (err) => {
      if (err) return res.send(err);

      res.send({ msg: "Images Uploaded ✅" });
    }
  );

});


app.delete("/deleteImage/:id", (req, res) => {

  const id = req.params.id;

  db.query(
    "SELECT image FROM product_images WHERE image_id=?",
    [id],
    (err, result) => {

      if (err) return res.send(err);

      if (result.length) {
        const fs = require("fs");

        try {
          fs.unlinkSync("uploads/" + result[0].image);
        } catch {
          console.log("file not found");
        }
      }

      db.query(
        "DELETE FROM product_images WHERE image_id=?",
        [id],
        (err2) => {
          if (err2) return res.send(err2);
          res.send({ msg: "Deleted ✅" });
        }
      );

    }
  );

});


app.post("/setPrimary", (req, res) => {

  const { image_id, product_id } = req.body;

  // reset all
  db.query(
    "UPDATE product_images SET is_primary=0 WHERE product_id=?",
    [product_id],
    () => {

      // set selected
      db.query(
        "UPDATE product_images SET is_primary=1 WHERE image_id=?",
        [image_id],
        (err) => {
          if (err) return res.send(err);
          res.send({ msg: "Primary Updated ⭐" });
        }
      );

    }
  );

});

app.post("/updateProduct", upload.array("images", 10), (req, res) => {

  const {
    product_id,
    product_name,
    description,
    price,
    qty,
    pic,
    mrp,
    size,
    brand,
    product_category,
    finish
  } = req.body;

  const sql = `
    UPDATE products SET 
      product_name=?,
      description=?,
      price=?,
      qty=?,
      pic=?,
      mrp=?,
      size=?,
      brand=?,
      product_category=?,
      finish=?
    WHERE product_id=?
  `;

  db.query(
    sql,
    [
      product_name,
      description,
      price,
      qty,
      pic,
      mrp,
      size,
      brand,
      product_category,
      finish,
      product_id   // ✅ ONLY ONCE
    ],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.send(err);
      }

      res.send({ msg: "Updated ✅" });
    }
  );
});
 app.post("/togglePublish", (req, res) => {
  const { product_id, published } = req.body;

  const sql = `
    UPDATE products 
    SET published = ? 
    WHERE product_id = ?
  `;

  db.query(sql, [published, product_id], (err, result) => {
    if (err) return res.send(err);

    res.send({ msg: "Updated" });
  });
});

//    app.post('/insertProduct', (req, res) => {

//   let imageName = "";

//   // ✅ check image
//   if (req.files && req.files.image) {
//     const file = req.files.image;

//     imageName = Date.now() + "_" + file.name;

//     // save to uploads folder
//     file.mv("./uploads/" + imageName, (err) => {
//       if (err) return res.status(500).send(err);
//     });
//   }

//   let data = {
//     product_name: req.body.product_name,
//     description: req.body.description,
//     price: req.body.price,
//     image: imageName, // ✅ save image name
//     creation_date: new Date(),
//     modification_date: new Date(),
//     created_by: req.body.created_by,
//     modified_by: req.body.modified_by,
//     published: 1
//   };

//   db.query("INSERT INTO products SET ?", data, (err, result) => {
//     if (err) {
//       console.log(err);
//       return res.status(400).send(err);
//     }
//     res.send({ msg: "Product Added" });
//   });
// });
  
  

// app.get('/secret-route', userMiddleware.isLoggedIn, (req, res, next) => {
//   console.log(req.userData);
//   res.send('This is the secret content. Only logged in users can see that!');
// });

module.exports = app;