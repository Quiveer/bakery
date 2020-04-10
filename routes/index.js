const mysql = require("mysql");
const express = require("express");
const router = express.Router();
const fs = require("fs-extra");
var path = require("path");
var multer = require("multer");
var crypto = require("crypto");
const bcrypt = require("bcrypt-nodejs");
const passport = require("passport");
require("../config/passport")(passport);
var LocalStrategy = require("passport-local").Strategy;
var cors = require("cors");
var method = require("method-override");
router.use(cors());

const helmet = require("helmet");
router.use(helmet());

require("cookie-parser");
// Logger configuration
const {
    createLogger,
    transports,
    format
} = require('winston');
const logger = createLogger({
    transports: [
        new transports.File({
            filename: '../views/index.log',
            level: 'info',
            format: format.combine(format.timestamp(), format.json())
        })
    ]
})


// DB CONFIGURATION hope this works outs :-)
var myconnection = mysql.createConnection({
  host: "localhost",
  user: "sweettoo_bakery",
  password: "0tFU?el!~A*_",
  database: "sweettoo_bakery",
  multipleStatements: true
});
myconnection.connect(err => {
  if (!err) {
    logger.info("Database connected");
  } else {
    logger.info("unable to connect");
  }
});

//authentication
const { ensureAuthenticated } = require("../config/auth");

//Routes
//home
router.get("/", (req, res) => res.render("home"));
//menu
router.get("/menu", (req, res) => {
  let sql = "SELECT * FROM menus";
  let query = myconnection.query(sql, (err, rows) => {
    if (err) {
      console.log(err);
    }
    console.log(rows);
    res.render("menu", { alldocs: rows });
  });
});
//about
router.get("/about", (req, res) => res.render("about"));
//contact
router.get("/contact", (req, res) => res.render("contact"));
router.post("/contact", (req, res) => {
  var myData = req.body;
  console.log(myData);
  let sql = "INSERT INTO contacts SET ?";
  let query = myconnection.query(sql, myData, (err, results) => {
    if (err) throw err;
    res.redirect("/contact");
  });
});

//admin login
router.get("/index", ensureAuthenticated, (req, res) => res.render("index"));


// SET STORAGE
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./public/uploads/");
  },
  filename: function(req, file, cb) {
    const filex = Date.now() + file.originalname;
    cb(null, filex);
  }
});

var upload = multer({ storage: storage });

router.get("/admenu", ensureAuthenticated, (req, res) => {
  let sql = "SELECT * FROM menus";
  let query = myconnection.query(sql, (err, rows) => {
    if (err) {
      console.log(err);
    }
    res.render("admenu", { alldocs: rows });
  });
});

router.post(
  "/uploadpicture",
  upload.single("myImage"),
  ensureAuthenticated,
  (req, res) => {
    let myData = {
      description: req.body.description,
      filename: req.file.filename
    };
    let sql = "INSERT INTO menus SET ?";
    let query = myconnection.query(sql, myData, (err, results) => {
      if (err) throw err;
      res.redirect("/admenu");
    });
  }
);

router.get("/edit/(:id)", ensureAuthenticated, (req, res) => {
  const productId = req.params.id;
  let sql = "SELECT * FROM menus WHERE id = ?";
  myconnection.query(sql,[productId], (err, result, fields) => {
    if(err) throw err;
    res.render("./edit", { docs: result[0] });
  });
});

//rest api to update record into mysql database
router.post("/edit/:id", ensureAuthenticated, (req, res) => {
    const productId = req.params.id;
    let description = req.body.description;
    let sql = "UPDATE `menus` SET `description` = '" + description + "' WHERE `menus`.`id` = '" + productId + "'";
    myconnection.query(sql, (err, results) => {
	  if (err) {
                return res.status(500).send(err);
            }
	  res.redirect("/admenu");
	});
});

// update
// router.post("/edit/:id", ensureAuthenticated, (req, res) => {
//   const productId = req.params.id;
//   let sql = "UPDATE menus SET description= " + req.body.description + " WHERE id = " + productId;
//   myconnection.query(sql,(err, results) => {
//     if (err) throw err;
//     res.send(results);
//   });
// });
/////////////////////////////////////////////////////
////*****DON'T MESS WITH THIS ROUTE ********//////////
///////////////////////////////////////////////////

router.get("/delete/:id", ensureAuthenticated, (req, res) => {
  var productId = req.params.id;
  myconnection.query("SELECT * FROM menus WHERE id = ?",[productId],(err, rows, fields) => {
      if (!err) {
        var files = rows[0].filename;
        fs.unlink(path.join("public/uploads/", files), err => {
          if (err) throw err;
          console.log("image deleted succesfuly");
          let sql = "DELETE FROM menus WHERE id = ?";
          myconnection.query(sql,[productId], (err, result) => {
            if (err) throw err;
            res.redirect("/admenu");
          });
        });
      }
    }
  );
});
///////////////////////////////////////////////////////////

router.get("/adabout", ensureAuthenticated, (req, res) => {
  res.render("adabout");
});


router.get("/adcontact", ensureAuthenticated, (req, res) => {
  let sql = "SELECT * FROM contacts";
  let query = myconnection.query(sql, (err, rows) => {
    if (err) throw err;
    console.log(rows);
    res.render("adcontact", { allContacts: rows });
  });
});

router.get("/deletecontact/:id", ensureAuthenticated, (req, res) => {
  var contactId = req.params.id;
  let sql = 'DELETE FROM contacts WHERE id = ?';
  myconnection.query(sql,[contactId], (err, result) => {
    if (err) throw err;
    res.redirect("/adcontact");
  });
});

router.get("/signup", (req, res) => {
  res.render("signup");
});
router.post(
  "/signup",
  passport.authenticate("local-signup", {
    successRedirect: "/admin",
    failureRedirect: "/",
    failureFlash: true
  })
);

//Log in Handle
router.get("/admin", (req, res) => res.render("login"));

router.post(
  "/login",
  passport.authenticate("local-login", {
    successRedirect: "/index",
    failureRedirect: "/admin",
    failureFlash: true,
    successFlash: "welcome back!"
  }),
  function(req, res) {
    if (req.body.remember) {
      req.session.cookie.maxAge = 1000 * 60 * 3;
    } else {
      req.session.cookie.expires = false;
    }
    res.redirect("/index");
  }
);

//logout Handle
router.get("/logout", ensureAuthenticated, (req, res) => {
  req.logout();
  req.flash("error", "you've been logged out");
  res.redirect("/");
});

module.exports = router;
