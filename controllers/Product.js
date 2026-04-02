const express = require('express');
const db = require('../Database.js');
const multer = require("multer");
var cors = require('cors');
var app = express();
app.use(cors());

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
    db.query(`SELECT * FROM products;`,
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
    mrp,
    size,
    brand,
    finish
  } = req.body;

  const sql = `
    INSERT INTO products 
    (product_name, description, price, qty, mrp, size, brand, finish, published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `;

  db.query(sql, [
    product_name,
    description,
    price,
    qty,
    mrp,
    size,
    brand,
    finish
  ], (err, result) => {

    if (err) return res.send(err);

    const productId = result.insertId;

    console.log("PRODUCT ID:", productId);

    // ✅ INSERT IMAGES (LOOP METHOD)
    if (req.files && req.files.length > 0) {

      req.files.forEach((file, index) => {

        db.query(
          "INSERT INTO product_images (product_id, image, is_primary) VALUES (?, ?, ?)",
          [productId, file.filename, index === 0 ? 1 : 0],
          (err2) => {
            if (err2) console.log("IMG ERROR:", err2);
          }
        );

      });

      res.send({ msg: "Product + Images Added ✅" });

    } else {
      res.send({ msg: "No images ❌" });
    }

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
    mrp,
    size,
    brand,
    finish
  } = req.body;

  const sql = `
    UPDATE products SET 
      product_name=?,
      description=?,
      price=?,
      qty=?,
      mrp=?,
      size=?,
      brand=?,
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
      mrp,
      size,
      brand,
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