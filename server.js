const express = require("express");
const cors = require("cors");
var fs = require('fs');
const app = express();

var http = require('http');
var https = require('https');

var privateKey  = fs.readFileSync('sslcrt/server.key', 'utf8');
var certificate = fs.readFileSync('sslcrt/server.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};

app.use(cors());
app.use(express.json());



var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);
httpServer.listen(4001);
httpsServer.listen(4000)

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
