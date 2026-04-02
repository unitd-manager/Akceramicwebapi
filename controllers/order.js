const express = require('express');
const db = require('../Database.js');
const fileUpload = require('express-fileupload');
var cors = require('cors');
var app = express();
app.use(cors());

app.use(fileUpload({
    createParentPath: true
}));

app.get("/getOrdersByUser/:user_id", (req, res) => {

  const { user_id } = req.params;

  db.query(
    `SELECT * FROM orders 
     WHERE user_id = ? 
     ORDER BY order_id DESC`,
    [user_id],
    (err, result) => {

      if (err) return res.json(err);

      res.json({
        success: true,
        data: result
      });

    }
  );

});

app.post("/createOrder", (req, res) => {

  const {
    user_id,
    name,
    phone,
    email,
    city,
    address,
    payment_method,
    cart
  } = req.body;

  let total_amount = 0;

  cart.forEach(item => {
    total_amount += (item.price || 0);
  });

  // ✅ 1. INSERT ORDER
  db.query(
    `INSERT INTO orders 
    (user_id, name, phone, email, city, address, payment_method, total_amount)
    VALUES (?,?,?,?,?,?,?,?)`,
    [user_id, name, phone, email, city, address, payment_method, total_amount],
    (err, orderResult) => {

      if (err) return res.json(err);

      const order_id = orderResult.insertId;

      let orderCartValues = [];
      let orderItemsValues = [];

      let completed = 0;

      // 🔥 LOOP CART
      cart.forEach((item) => {

        // 👉 PUSH INTO order_cart
        orderCartValues.push([
          order_id,
          item.cart_id,
          item.product_id,
          user_id
        ]);

        // 🔥 FETCH HISTORY
        db.query(
          `SELECT * FROM cart_history WHERE cart_id = ?`,
          [item.cart_id],
          (err2, history) => {

            if (err2) return res.json(err2);

            history.forEach(h => {
              orderItemsValues.push([
                order_id,
                item.cart_id,
                item.product_id,
                h.length,
                h.width,
                h.height,
                h.total_area || 0
              ]);
            });

            completed++;

            // ✅ AFTER ALL CART LOOP
            if (completed === cart.length) {

              // 👉 INSERT order_cart
              db.query(
                `INSERT INTO order_cart
                (order_id, cart_id, product_id,user_id)
                VALUES ?`,
                [orderCartValues],
                (err3) => {

                  if (err3) return res.json(err3);

                  // 👉 INSERT order_items
                  db.query(
                    `INSERT INTO order_items
                    (order_id, cart_id, product_id, length, width, height, total_area)
                    VALUES ?`,
                    [orderItemsValues],
                    (err4) => {

                      if (err4) return res.json(err4);

                      // 🧹 CLEAR CART
                      db.query(
                        "DELETE FROM cart WHERE user_id = ?",
                        [user_id],
                        () => {

                          res.json({
                            success: true,
                            msg: "Order Placed Successfully ✅",
                            order_id
                          });

                        }
                      );

                    }
                  );

                }
              );

            }

          }
        );

      });

    }
  );

});

app.get("/getFullOrderDetails/:order_id", (req, res) => {

  const { order_id } = req.params;

  // 🧾 ORDER
  db.query(
    "SELECT * FROM orders WHERE order_id = ?",
    [order_id],
    (err, orderResult) => {

      if (err) return res.json(err);

      const order = orderResult[0];

      // 📦 ORDER CART + PRODUCT
      db.query(
        `SELECT 
          oc.*,
          p.product_name,
          p.price,
          (
            SELECT image 
            FROM product_images 
            WHERE product_id = p.product_id 
            LIMIT 1
          ) AS image
         FROM order_cart oc
         LEFT JOIN products p ON oc.product_id = p.product_id
         WHERE oc.order_id = ?`,
        [order_id],
        (err2, cartItems) => {

          if (err2) return res.json(err2);

          // 📐 ORDER HISTORY
          db.query(
            `SELECT * FROM order_items WHERE order_id = ?`,
            [order_id],
            (err3, historyItems) => {

              if (err3) return res.json(err3);

              const finalData = cartItems.map(cart => {

                const history = historyItems.filter(h =>
                  Number(h.cart_id) === Number(cart.cart_id)
                );

                const total_area = history.reduce((sum, h) =>
                  sum + (Number(h.total_area) || 0), 0
                );

                return {
                  ...cart,
                  total_area,
                  history
                };

              });

              res.json({
                success: true,
                order,
                items: finalData
              });

            }
          );

        }
      );

    }
  );

});
app.get("/getAllOrders", (req, res) => {

  db.query("SELECT * FROM orders ORDER BY order_id DESC",
    (err, result) => {

      if (err) return res.json(err);

      res.json({ data: result });

    });
});
app.get("/getFullOrderDetails/:order_id", (req, res) => {

  const { order_id } = req.params;

  // 🧾 ORDER
  db.query(
    "SELECT * FROM orders WHERE order_id = ?",
    [order_id],
    (err, orderResult) => {

      if (err) return res.json(err);

      if (orderResult.length === 0) {
        return res.json({ success: false, msg: "Order not found" });
      }

      const order = orderResult[0];

      // 📦 ORDER CART
      db.query(
        `SELECT 
  oc.*, 
  p.product_name, 
  p.price,

  (
    SELECT pi.image 
    FROM product_images pi 
    WHERE pi.product_id = p.product_id 
    ORDER BY pi.image_id ASC
    LIMIT 1
  ) AS image

FROM order_cart oc
LEFT JOIN products p 
ON oc.product_id = p.product_id

WHERE oc.order_id = ?`,
        [order_id],
        (err2, cartItems) => {

          if (err2) return res.json(err2);

          // 📐 ORDER ITEMS (HISTORY)
          db.query(
            `SELECT * FROM order_items WHERE order_id = ?`,
            [order_id],
            (err3, historyItems) => {

              if (err3) return res.json(err3);

              const finalData = cartItems.map(cart => {

                const history = historyItems.filter(h =>
                  Number(h.cart_id) === Number(cart.cart_id)
                );

                const total_area = history.reduce((sum, h) => {
                  return sum + (Number(h.total_area) || 0);
                }, 0);

                return {
                  ...cart,
                  total_area,
                  history
                };

              });

              res.json({
                success: true,
                order,
                items: finalData
              });

            }
          );

        }
      );

    }
  );

});

// app.get('/secret-route', userMiddleware.isLoggedIn, (req, res, next) => {
//   console.log(req.userData);
//   res.send('This is the secret content. Only logged in users can see that!');
// });

module.exports = app;