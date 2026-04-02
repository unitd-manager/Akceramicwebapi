const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

const ProductRoutes = require("./controllers/Product");
const EcomRoutes = require("./controllers/Ecom");
const authRoutes = require("./controllers/auth");
const orderRoutes = require("./controllers/order");


app.use("/Product", ProductRoutes);
app.use("/Ecom", EcomRoutes);
app.use("/auth", authRoutes);
app.use("/order", orderRoutes);

app.listen(5000, ()=>{
  console.log("Server running on port 5000");
});
