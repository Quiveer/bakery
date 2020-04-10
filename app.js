const express = require("express");
const app = express();
var path = require("path");
const PORT = process.env.PORT || 5000;
var bodyParser = require("body-parser");
const passport = require("passport");
const flash = require("connect-flash");
const session = require("express-session");
var LocalStrategy = require("passport-local").Strategy;
require("cookie-parser");

//passport config
require("./config/passport")(passport);

// logger
const {
    createLogger,
    transports,
    format
} = require('winston');
const logger = createLogger({
    transports: [
        new transports.File({
            filename: './views/info.log',
            level: 'info',
            format: format.combine(format.timestamp(), format.json())
        })
    ]
})

//Express Session
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
  })
);

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

//connect flash
app.use(flash());

//Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

app.use(express.static("public"));
app.use(express.static(__dirname + "./public/"));
app.use("/edit/:id/", express.static("public"));
app.use("/delete/:id", express.static("public"));
app.set("trust proxy", true);
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// routes
app.get("/", require("./routes/index"));
app.get("/menu", require("./routes/index"));
app.get("/about", require("./routes/index"));
app.get("/contact", require("./routes/index"));
app.post("/contact", require("./routes/index"));

//admin
app.get("/signup", require("./routes/index"));
app.post("/signup", require("./routes/index"));
app.get("/admin", require("./routes/index"));
app.post("/login", require("./routes/index"));
app.get("/index", require("./routes/index"));
app.get("/admenu", require("./routes/index"));
app.post("/uploadpicture", require("./routes/index"));
app.get("/uploads/:filename", require("./routes/index"));
app.get("/edit/:id", require("./routes/index"));
app.post("/edit/:id", require("./routes/index"));
app.get("/delete/:id", require("./routes/index"));
app.get("/adabout", require("./routes/index"));
app.post("/about", require("./routes/index"));
app.get("/adcontact", require("./routes/index"));
app.get("/deletecontact/:id", require("./routes/index"));
app.get("/logout", require("./routes/index"));

app.listen(PORT, logger.info("Server started on port 5000"));
