const express = require('express');
const db = require('../Database.js');
const fileUpload = require('express-fileupload');
var cors = require('cors');
var app = express();
app.use(cors());

app.use(fileUpload({
    createParentPath: true
}));


    app.get('/getProductEcom', (req, res, next) => {
    db.query(`SELECT 
  p.*,
  MIN(pi.image) AS image
FROM products p
LEFT JOIN product_images pi 
ON p.product_id = pi.product_id
WHERE p.published = 1
GROUP BY p.product_id;`,
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

  app.get("/getCalculationHistory/:product_id", (req, res) => {

  const productId = req.params.product_id;

  db.query(
    "SELECT * FROM product_calculation_history WHERE product_id=? ORDER BY product_calculation_history_id DESC",
    [productId],
    (err, result) => {

      if (err) return res.send(err);

      res.send({ data: result });

    }
  );

});


  app.post("/saveCalculation", (req, res) => {

  const { product_id, rows, total_area, created_by } = req.body;
  

  // 🔥 multiple rows prepare
  const values = rows.map(r => [
    product_id,
    r.length,
    r.width,
    r.height || 0,
    (r.length || 0) * (r.width || 0), // per row area
    created_by || "Admin"
  ]);

  const query = `
    INSERT INTO product_calculation_history
    (product_id, length, width, height, total_area, created_by)
    VALUES ?
  `;

  db.query(query, [values], (err, result) => {

    if (err) {
      console.log(err);
      return res.status(500).send("Error");
    }

    res.send({
      msg: "Saved Successfully"
    });

  });

});

app.post("/deleteCalculation", (req, res) => {

  const { id } = req.body;

  db.query(
    "DELETE FROM product_calculation_history WHERE product_calculation_history_id=?",
    [id],
    (err) => {

      if (err) return res.send(err);

      res.send({ msg: "Deleted" });

    }
  );

});
app.post("/updateCalculation", (req, res) => {

  const { id, length, width, height } = req.body;

  const total_area = (length || 0) * (width || 0);

  db.query(
    `UPDATE product_calculation_history 
     SET length=?, width=?, height=?, total_area=? 
     WHERE product_calculation_history_id=?`,
    [length, width, height, total_area, id],
    (err) => {

      if (err) return res.send(err);

      res.send({ msg: "Updated" });

    }
  );

});
// cart

app.post("/insertCart", (req, res) => {

  const { product_id, user_id } = req.body;

  db.query(
    "INSERT INTO cart (product_id, user_id) VALUES (?, ?)",
    [product_id, user_id],
    (err, result) => {

      if (err) return res.send(err);

      res.send({ msg: "Inserted" });

    }
  );

});

app.get("/getCartByUser/:user_id", (req, res) => {

  const userId = req.params.user_id;

  const query = `
   SELECT 
  c.cart_id,
  c.product_id,
  p.product_name,
  p.price,
  p.size,
  p.description,
  pm.image
FROM cart c
LEFT JOIN products p 
  ON c.product_id = p.product_id

LEFT JOIN (
  SELECT product_id, MIN(image) AS image
  FROM product_images
  GROUP BY product_id
) pm 
  ON p.product_id = pm.product_id

WHERE c.user_id = 1
ORDER BY c.cart_id DESC;
  `;

  db.query(query, [userId], (err, result) => {

    if (err) {
      console.log(err);
      return res.status(500).send(err);
    }

    res.send({
      data: result
    });

  });

});

app.post("/removeCart", (req, res) => {

  const { cart_id } = req.body;

  db.query(
    "DELETE FROM cart WHERE cart_id = ?",
    [cart_id],
    (err) => {

      if (err) {
        console.log(err);
        return res.send({ success: false });
      }

      res.send({ success: true });

    }
  );

});

// cart history

app.get("/getCartHistory/:cart_id", (req, res) => {

  const cartId = req.params.cart_id;

  const sql = `
    SELECT *
    FROM cart_history
    WHERE cart_id = ?
    ORDER BY cart_history_id DESC
  `;

  db.query(sql, [cartId], (err, result) => {

    if (err) {
      console.log(err);
      return res.status(500).send({
        success: false,
        message: "Error fetching cart history",
        error: err
      });
    }

    res.send({
      success: true,
      data: result
    });

  });

});
app.post("/updateCartCalculation", (req, res) => {

  const { id, length, width, height } = req.body;

  const total_area = (Number(length) || 0) * (Number(width) || 0);

  db.query(
    `UPDATE cart_history 
     SET length=?, width=?, height=?, total_area=? 
     WHERE cart_history_id=?`,
    [length, width, height, total_area, id],
    (err) => {

      if (err) return res.send(err);

      res.send({ msg: "Updated" });

    }
  );

});

app.post("/deleteCartCalculation", (req, res) => {

  const { id } = req.body;

  db.query(
    "DELETE FROM cart_history WHERE cart_history_id=?",
    [id],
    (err) => {

      if (err) return res.send(err);

      res.send({ msg: "Deleted" });

    }
  );

});
 app.post("/saveCartCalculation", (req, res) => {

  const { product_id,cart_id, rows, total_area, created_by } = req.body;
  

  // 🔥 multiple rows prepare
  const values = rows.map(r => [
    product_id,
    cart_id,
    r.length,
    r.width,
    r.height || 0,
    (r.length || 0) * (r.width || 0), // per row area
    created_by || "Admin"
  ]);

  const query = `
    INSERT INTO cart_history
    (product_id,cart_id, length, width, height, total_area, created_by)
    VALUES ?
  `;

  db.query(query, [values], (err, result) => {

    if (err) {
      console.log(err);
      return res.status(500).send("Error");
    }

    res.send({
      msg: "Saved Successfully"
    });

  });

});

// product
  app.post("/getProductByid", (req, res, next) => {
    db.query(
      `SELECT * FROM products WHERE product_id = ${db.escape(req.body.product_id)}`,
      (err, result) => {
        if (err) {
          console.log("error: ", err);
          return res.status(400).send({
            data: err,
            msg: "failed",
          });
        } else {
          return res.status(200).send({
            data: result,
            msg: "Success",
          });
        }
      }
    );
  });

  app.post('/insertProduct', (req, res) => {

  let imageName = "";

  if (req.files && req.files.image) {
    const file = req.files.image;

    imageName = Date.now() + "_" + file.name;

    file.mv("./uploads/" + imageName, (err) => {
      if (err) return res.status(500).send(err);
    });
  }

  let data = {
    product_name: req.body.product_name,
    description: req.body.description,
    price: req.body.price,
    image: imageName,
    creation_date: new Date(),
    modification_date: new Date(),
    created_by: req.body.created_by,
    modified_by: req.body.modified_by,
     qty: req.body.qty,
      mrp: req.body.mrp,
    published: 1
  };

  db.query("INSERT INTO products SET ?", data, (err, result) => {
    if (err) return res.status(400).send(err);

    res.send({ msg: "Success" });
  });
});

app.post("/updateProduct", (req, res) => {

  let image = "";

  if (req.files && req.files.image) {
    let file = req.files.image;
    image = file.name;

    file.mv("./uploads/" + file.name);
  }

  let sql = `
    UPDATE products SET 
    product_name='${req.body.product_name}',
    description='${req.body.description}',
    price='${req.body.price}',
    qty='${req.body.qty}',
    mrp='${req.body.mrp}'
    ${image ? `, image='${image}'` : ""}
    WHERE product_id='${req.body.product_id}'
  `;

  db.query(sql, (err, result) => {
    if (err) return res.send(err);
    res.send({ msg: "Updated" });
  });

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


  

// app.get('/secret-route', userMiddleware.isLoggedIn, (req, res, next) => {
//   console.log(req.userData);
//   res.send('This is the secret content. Only logged in users can see that!');
// });

module.exports = app;