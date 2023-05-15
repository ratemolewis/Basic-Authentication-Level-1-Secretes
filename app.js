require('dotenv').config();
const express =  require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

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
    password: String
}); 
//passportLocalMongoose, used to hash and salt users passwords as well as to save them 
userSchema.plugin(passportLocalMongoose);
 

const User = mongoose.model("User",userSchema);
// CHANGE: USE "createStrategy" INSTEAD OF "authenticate" 
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
    res.render("home");
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
