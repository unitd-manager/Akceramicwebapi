const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

const ProductRoutes = require("./routes/Product");
const EcomRoutes = require("./routes/Ecom");
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/order");
const offerRoutes = require("./routes/offer");

app.use("/Product", ProductRoutes);
app.use("/Ecom", EcomRoutes);
app.use("/auth", authRoutes);
app.use("/order", orderRoutes);
app.use("/offer", offerRoutes);

app.listen(5000, ()=>{
  console.log("Server running on port 5000");
});
