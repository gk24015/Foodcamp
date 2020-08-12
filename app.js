var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    passport    = require("passport"),
    cookieParser = require("cookie-parser"),
    LocalStrategy = require("passport-local"),
    flash        = require("connect-flash"),
    Campground  = require("./models/campground"),
    Comment     = require("./models/comment"),
    User        = require("./models/user"),
    session = require("express-session"),
    seedDB      = require("./seeds"),
    methodOverride = require("method-override");
    socket = require('socket.io');
// configure dotenv
//require('dotenv').load();
require('dotenv').config({path:'my-app/.env'});

//requiring routes
var commentRoutes    = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes      = require("./routes/index")
    mongoose.Promise = global.Promise;
   
    
    
    mongoose.connect('mongodb+srv://gk24015:gulshankumar@cluster0-syi4f.mongodb.net/test?retryWrites=true&w=majority',{
        useNewUrlParser:true,
        useCreateIndex:true,
        useUnifiedTopology: true
      }).then(() =>{
        console.log('Connected to db');
      }).catch(err=>{
        console.log("error",err.message);   
      });


app.use(bodyParser.urlencoded({extended: true}));  // so it could be expressed as req.body
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride('_method')); // enables to use put and delete for form where client doesn't support it.
app.use(cookieParser('secret'));
//require moment
app.locals.moment = require('moment');
// seedDB(); //seed the database

// PASSPORT CONFIGURATION
app.use(require("express-session")({ // sessions for responding
    secret: "Hey there delilah",
    resave: false,
    saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});


app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

var server=app.listen(process.env.PORT||4001, function(){
   console.log("Foodcamp Has Started!");
});

