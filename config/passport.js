var LocalStrategy = require("passport-local").Strategy;

var mysql = require("mysql");
var bcrypt = require("bcrypt-nodejs");


var myconnection = mysql.createConnection({
  host: "localhost",
  user: "sweettoo_bakery",
  password: "0tFU?el!~A*_",
  database: "sweettoo_bakery",
  multipleStatements: true
});

myconnection.connect(err => {
  if (!err) {var LocalStrategy = require("passport-local").Strategy;
    console.log("connected");
  } else {
    console.log("unable to connect");
  }
});

module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    myconnection.query("SELECT * FROM admins WHERE id = ? ", [id], function(
      err,
      rows
    ) {
      done(err, rows[0]);
    });
  });

  passport.use(
    "local-signup",
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true
      },
      function(req, username, password, done) {
        myconnection.query(
          "SELECT * FROM admins WHERE username = ? ",
          [username],
          function(err, rows) {
            if (err) return done(err);
            if (rows.length) {
              return done(
                null,
                false,
                req.flash("signupMessage", "That is already taken")
              );
            } else {
              var newUserMysql = {
                username: username,
                password: bcrypt.hashSync(password, null, null)
              };

              var insertQuery =
                "INSERT INTO admins (username, password) values (?, ?)";

              myconnection.query(
                insertQuery,
                [newUserMysql.username, newUserMysql.password],
                function(err, rows) {
                  newUserMysql.id = rows.insertId;

                  return done(null, newUserMysql);
                }
              );
            }
          }
        );
      }
    )
  );

  passport.use(
    "local-login",
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true
      },
      function(req, username, password, done) {
        myconnection.query(
          "SELECT * FROM admins WHERE username = ? ",
          [username],
          function(err, rows) {
            if (err) return done(err);
            if (!rows.length) {
              return done(
                null,
                false,
                req.flash("loginMessage", "No User Found")
              );
            }
            if (!bcrypt.compareSync(password, rows[0].password))
              return done(
                null,
                false,
                req.flash("loginMessage", "Wrong Password")
              );

            return done(null, rows[0]);
          }
        );
      }
    )
  );
};
