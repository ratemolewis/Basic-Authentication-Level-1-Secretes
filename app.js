require('dotenv').config();
const express =  require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
//setup session options, read documentation recommendations
app.use(session({
secret:"My big secrete.",
resave:false,
saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser: true});
//
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId:String
}); 
//passportLocalMongoose, used to hash and salt users passwords as well as to save them 
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User",userSchema);
// CHANGE: USE "createStrategy" INSTEAD OF "authenticate" 
passport.use(User.createStrategy());

//serialize and deserialize universal methods for working with different stategies
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });
//setup our googlestategy and configure. 
passport.use(new GoogleStrategy({
    clientID:  process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  //callback function
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
    res.render("home");
});

app.get("/auth/google",
//use passport to authenticate our users, using the google stategy. once we hit google we tell them we need the users profile.
  passport.authenticate("google", { scope: ["profile"] }
  ));

// This get request is made by google with the users details/callback,
  app.get("/auth/google/secrets", 
  //Authenticae the use inside our app.
  passport.authenticate("google", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/login", (req, res) => {
    res.render("login");
});


app.get("/secrets", function (req, res){
 if(req.isAuthenticated()){
    //through thte use of session, we are able allow to the use to see the restricted areas of the app.
    res.render("secrets");
 }else{
    res.redirect("/login");
 }
});

app.post("/register",  function(req, res){
 User.register({username:req.body.username}, req.body.password, function(err, user){
    if(err){
        res.send(err);
        res.redirect("/register");
    }else{
     passport.authenticate("local")(req, res, function(){
        //here a cookie has been created and the sassion saved
        res.redirect("/secrets");
     })
    }
 });
    
});

app.post("/login", async function(req, res){
    const newUser = new User({
        username:req.body.username,
        password:req.body.password
    });
    req.logIn(newUser, function(err){
         if(err){
            res.send(err);
         }else{
            passport.authenticate("local")(req, res, function(){
              res.redirect("/secrets");
            });
         }
    });
});

app.listen(3000,() =>{
  console.log("Server started on port 3000.");
});
