const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/Database.js');
const userMiddleware = require('../middleware/UserModel.js');
var md5 = require('md5');
const fileUpload = require('express-fileupload');
const _ = require('lodash');
const mime = require('mime-types')
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
app.use(cors());

app.use(fileUpload({
    createParentPath: true
}));


    app.get('/getBlog', (req, res, next) => {
    db.query(`SELECT b.blog_id,
    b.title,
    b.description,
    b.author,
    b.date,
    b.meta_title,
    b.meta_description,
    b.category_id,
    b.creation_date,
    b.modification_date,
    b.published
    FROM blog b LEFT JOIN category c ON c.category_id=b.category_id;`,
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
  
  app.get("/getBlogImage", (req, res, next) => {
  db.query(
    `Select bl.blog_id
    ,bl.title
    ,m.record_id
    ,m.file_name
    ,bl.description
    ,bl.author
    ,bl.date
    ,bl.category_id
    ,bl.creation_date
    ,bl.modification_date
    ,bl.created_by
    ,bl.modified_by
    ,bl.published
  FROM blog bl
  LEFT JOIN category c ON c.category_id = bl.category_id
  INNER JOIN media m ON m.record_id=bl.blog_id
  AND m.room_name="Blog"
 GROUP BY bl.blog_id`,
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
  
  app.post("/getThoguppugal", (req, res, next) => {
  db.query(
    `SELECT b.blog_id,
    b.title,
    b.description,
    b.author,
    b.date,
    b.meta_title,
    b.meta_description,
    b.creation_date,
    b.modification_date,
    b.category_id,
    b.published
    ,b.category_id
    ,sc.category_title
    ,sc.category_id
     FROM blog b 
    LEFT JOIN category sc ON b.category_id = sc.category_id
    WHERE sc.section_id=80 AND sc.category_id ${db.escape(req.body.category_id)}`,
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
  
  
   app.post('/getBlogsByblogId', (req, res, next) => {
    db.query(`SELECT b.blog_id,
    b.title,
    b.description,
    b.author,
    b.date,
    b.meta_title,
    b.meta_description,
    b.creation_date,
    b.modification_date,
    b.category_id,
    b.sub_category_id,
    b.published
    FROM blog b 
    LEFT JOIN category c ON c.category_id=b.category_id
     WHERE b.blog_id = ${db.escape(req.body.blog_id)}`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
  })
  }
    }
  );
  });

 app.post('/getBlogsByCategoryId', (req, res, next) => {
    db.query(`SELECT b.blog_id,
    b.title,
    b.description,
    b.author,
    b.date,
    b.meta_title,
    b.meta_description,
    b.creation_date,
    b.modification_date,
    b.category_id,
    b.published
    FROM blog b 
    LEFT JOIN category c ON c.category_id=b.category_id
     WHERE c.routes = ${db.escape(req.body.routes)}
     order by b.blog_id`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
  })
  }
    }
  );
  });

  app.post('/getBlogsCategoryId', (req, res, next) => {
    db.query(`SELECT b.blog_id,
    b.title,
    b.description,
    b.author,
    b.date,
    b.meta_title,
    b.meta_description,
    b.creation_date,
    b.modification_date,
    b.category_id,
    b.published
    FROM blog b 
    LEFT JOIN content c ON c.category_id=b.category_id
     WHERE c.content_id = ${db.escape(req.body.content_id)}
     order by b.blog_id`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
  })
  }
    }
  );
  });

   app.post('/getBlogsBySubCategoryId', (req, res, next) => {
    db.query(`SELECT b.blog_id,
    b.title,
    b.description,
    b.author,
    b.date,
    b.meta_title,
    b.meta_description,
    b.creation_date,
    b.modification_date,
    b.category_id,
    b.sub_category_id,
    b.published
    FROM blog b 
    LEFT JOIN category c ON c.category_id=b.category_id
    LEFT JOIN sub_category sc ON c.category_id = sc.category_id
     WHERE b.sub_category_id = ${db.escape(req.body.sub_category_id)}
     group by b.blog_id`,
    (err, result) => {
      if (err) {
        console.log('error: ', err)
        return res.status(400).send({
          data: err,
          msg: 'failed',
        })
      } else {
        return res.status(200).send({
          data: result,
          msg: 'Success',
  })
  }
    }
  );
  });
  
   app.get("/getHomeBlog", (req, res, next) => {
  db.query(
    `Select bl.blog_id
    ,bl.title
    ,m.record_id
    ,m.file_name
    ,bl.description
    ,bl.author
    ,bl.date
    ,bl.category_id
    ,bl.creation_date
    ,bl.modification_date
    ,bl.created_by
    ,bl.modified_by
    ,bl.published
  FROM blog bl
  LEFT JOIN category c ON c.category_id = bl.category_id
  INNER JOIN media m ON m.record_id=bl.blog_id
  AND m.room_name="Blog"
 GROUP BY bl.blog_id
 limit 3`,
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
  

app.get("/getBlogCategory", (req, res, next) => {
  db.query(
    `SELECT c.category_title, COUNT(b.category_id) AS no_of_id
FROM blog b
LEFT JOIN category c ON c.category_id = b.category_id
GROUP BY b.category_id`,
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
  
 
   app.post('/getBlogBySearch', (req, res, next) => {
    db.query(`Select bl.blog_id
    ,bl.title
    ,m.record_id
    ,m.file_name
    ,bl.description
    ,bl.author
    ,bl.date
    ,bl.category_id
    ,bl.creation_date
    ,bl.modification_date
    ,bl.created_by
    ,bl.modified_by
    ,bl.published
   FROM blog bl
  LEFT JOIN category c ON c.category_id = bl.category_id
  INNER JOIN media m ON m.record_id=bl.blog_id
  AND m.room_name="Blog"
  where bl.title LIKE CONCAT('%', ${db.escape(req.body.keyword)}, '%')
     GROUP BY bl.blog_id`,
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
  
  app.post('/getBlogByCategoryId', (req, res, next) => {
    db.query(`select * from blog b
where b.category_id = ${db.escape(req.body.category_id)}`,
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
  
  
  
   app.post('/getBlogById', (req, res, next) => {
    db.query(`Select bl.blog_id
    ,bl.title
    ,m.record_id
    ,m.file_name
    ,bl.description
    ,bl.author
    ,bl.date
    ,bl.category_id
    ,bl.creation_date
    ,bl.modification_date
    ,bl.created_by
    ,bl.modified_by
    ,bl.published
  FROM blog bl
  LEFT JOIN category c ON c.category_id = bl.category_id
  INNER JOIN media m ON m.record_id=bl.blog_id
  AND m.room_name="Blog"
WHERE bl.blog_id = ${db.escape(req.body.blog_id)}
GROUP BY bl.blog_id`,
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

app.post('/editBlog', (req, res, next) => {
    db.query(`UPDATE blog 
              SET title=${db.escape(req.body.title)}
              ,description=${db.escape(req.body.description)}
              ,category_id=${db.escape(req.body.category_id)}
              ,sub_category_id=${db.escape(req.body.sub_category_id)}
             ,creation_date=${db.escape(req.body.creation_date)}
             ,modification_date=${db.escape(req.body.modification_date)}
             ,published=${db.escape(req.body.published)}
              ,author=${db.escape(req.body.author)}
              WHERE blog_id = ${db.escape(req.body.blog_id)}`,
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

//           app.post('/insertProduct', (req, res) => {

//   let imageName = "";

//   if (req.files && req.files.image) {
//     const file = req.files.image;

//     imageName = Date.now() + "_" + file.name;

//     file.mv("./uploads/" + imageName, (err) => {
//       if (err) return res.status(500).send(err);
//     });
//   }

//   let data = {
//     product_name: req.body.product_name,
//     description: req.body.description,
//     price: req.body.price,
//     image: imageName,
//     creation_date: new Date(),
//     modification_date: new Date(),
//     created_by: req.body.created_by,
//     modified_by: req.body.modified_by,
//     published: 1
//   };

//   db.query("INSERT INTO products SET ?", data, (err, result) => {
//     if (err) return res.status(400).send(err);

//     res.send({ msg: "Success" });
//   });
// });

          app.post('/insertBlog', (req, res, next) => {

            let data = {title	: req.body.title	
              , description: req.body.description
              , author: req.body.author
              , date: req.body.date
              , category_id	: req.body.category_id
              , creation_date	:  new Date()
              , modification_date: req.body.modification_date
              , created_by: req.body.created_by
              , modified_by: req.body.modified_by
              ,flag : req.body.flag	
              , meta_title	: req.body.meta_title
              , meta_description: req.body.meta_description
              , meta_keyword: req.body.meta_keyword
              , published: 1
              ,us_title : req.body.us_title	
              , us_description	: req.body.us_description};
            let sql = "INSERT INTO blog SET ?";
            let query = db.query(sql, data, (err, result) => {
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
          
  app.post("/deleteBlogs", (req, res, next) => {
  let data = { blog_id: req.body.blog_id };
  let sql = "DELETE FROM blog WHERE ?";
  let query = db.query(sql, data, (err, result) => {
    if (err) {
      console.log("error: ", err);
      return;
    } else {
      return res.status(200).send({
        data: result,
        msg: "Success",
      });
    }
  });
});

app.get('/secret-route', userMiddleware.isLoggedIn, (req, res, next) => {
  console.log(req.userData);
  res.send('This is the secret content. Only logged in users can see that!');
});

module.exports = app;