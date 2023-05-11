//jshint esversion:6
const express =  require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));

mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser: true});

const userSchema = {
    email: String,
    password: String
}

const User = mongoose.model("User",userSchema);


app.get("/", function(req, res){
    res.render("home");
});


app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/register", async function(req, res){
    const newUser = new User({
        email:req.body.username,
        password:req.body.password
    });

    try {
        await newUser.save();
        res.render("secrets");
      } catch (err) {
        res.send(err);
      }
});

app.post("/login", async function(req, res){
    const useremail = req.body.username;
    const password = req.body.password;

    try {
     const foundUser = await User.findOne({email:useremail});
       if(foundUser){
        if(foundUser.password === password){
            res.render("secrets");
        }
       } 
    } catch (error) {
        res.send(error);
    }
});

app.listen(3000,() =>{
  console.log("Server started on port 3000.");
});
