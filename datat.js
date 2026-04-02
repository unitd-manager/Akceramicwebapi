var express = require('express');
var app = express();
var fs = require('fs');
var http = require('http');
var https = require('https');
const fileUpload = require('express-fileupload');
var flash = require('connect-flash')
const session = require('express-session');

global.__basedir = __dirname;

var privateKey  = fs.readFileSync('sslcrt/server.key', 'utf8');
var certificate = fs.readFileSync('sslcrt/server.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);
let port = 2061;
let secureport = 2062;
httpServer.listen(port, () => {
    console.log(Server Running in port:${port});
  });
httpsServer.listen(secureport, () => {
    console.log(Server Running in secure port:${secureport});
  });
    
var bodyParser = require('body-parser');
var cors = require('cors');
const _ = require('lodash');
const mime = require('mime-types')

app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
	secret: 'my_secret',
	resave: true,
	saveUninitialized: true,
	cookie: { maxAge: 60000 }
}))
app.use(flash());


const attendance = require('./routes/attendance.js');
const product = require('./routes/product.js');
const comment = require('./routes/comment.js');
const content = require('./routes/content.js');
const setting = require('./routes/setting.js');
const valuelist = require('./routes/valuelist.js');
const subcategory = require('./routes/subcategory.js');
const category = require('./routes/category.js');
const media = require('./routes/media.js');
const section = require('./routes/section.js');
const contact = require('./routes/contact.js');
const support = require('./routes/support.js');
const Auth = require('./routes/auth.js');
const blog = require('./routes/blog.js');
const commonApi = require('./routes/commonApi.js');
const enquiry = require('./routes/enquiry.js');
const staff = require('./routes/staff.js');
const usergroup = require('./routes/usergroup.js');
const purchaseorder = require('./routes/purchaseorder.js');  
const note = require('./routes/note.js');   
const supplier = require('./routes/supplier.js');
const geocountry = require('./routes/geocountry.js');
const inventory = require('./routes/inventory.js');
const student = require('./routes/student.js');
const teachers = require('./routes/teachers.js');
const clients = require('./routes/clients.js');

app.use('/attendance', attendance);
app.use('/product', product);
app.use('/comment', comment);
app.use('/category', category);
app.use('/setting', setting);
app.use('/valuelist', valuelist);
app.use('/subcategory', subcategory);
app.use('/content', content);
app.use('/media', media);
app.use('/section', section);
app.use('/contact', contact);
app.use('/support', support);
app.use('/api', Auth);
app.use('/blog', blog);
app.use('/commonApi', commonApi);
app.use('/enquiry', enquiry);
app.use('/staff', staff);
app.use('/usergroup', usergroup);
app.use('/purchaseorder', purchaseorder);
app.use('/note', note);
app.use('/supplier', supplier);
app.use('/geocountry', geocountry);
app.use('/inventory', inventory);
app.use('/student', student);
app.use('/teachers', teachers);
app.use('/clients', clients);

const indexRouter = require('./routes/fileUpload'); 
app.use('/file', indexRouter);

app.use(fileUpload({
    createParentPath: true
}));
module.exports = app;