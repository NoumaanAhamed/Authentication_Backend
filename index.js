import express from 'express';
// import path from 'path'
import mongoose, { Mongoose, mongo } from 'mongoose';
import cookieParser from 'cookie-parser';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

// console.log("Hello");

mongoose.connect('mongodb://localhost:27017',{
  dbName: "Auth"
}).then(() => {
  console.log("Database Connected")
}).catch((e) => {
  console.log(e);
})

const messageSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

const Message = mongoose.model("Database",messageSchema);// Replace Message with User

const port = 5000;
const app = express();

app.use(cookieParser());

app.use(express.urlencoded({extended: true}));

app.use(express.static('public'));

app.set('view engine','ejs'); 

const isAuthenticated = async (req,res,next) => {

  const {token} = req.cookies;

  if(token){

    const decoded = jwt.verify(token, "ernhobni")

    // console.log(decoded);

    req.user = await Message.findById(decoded._id)//variable in req

    next();
  }

  else{
    res.redirect("/login")
  }
};

app.get('/',isAuthenticated,(req,res)=>{

  // console.log(req.user);

  // console.log(req.cookies);

  res.render("logout",{name: req.user.name})

});

app.get("/register",(req,res) => {
  res.render("register")
})

app.get("/login",(req,res) => {
  res.render("login")
})

app.get("/logout",(req,res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now())
  })
  res.redirect('/')
})

app.post("/login",async (req,res) => {

  const {email,password} = req.body;
  
  let user = await Message.findOne({email})

  if(!user){

    return res.redirect("/register")
  }

  // const isMatch = user.password === password

  const isMatch = await bcrypt.compare(password,user.password)

  if(!isMatch){
    return res.render('login',{email,message:"Incorrect Password"})
  }

  const token = jwt.sign({_id:user._id},"ernhobni")

  // console.log(token);

  res.cookie("token",token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000)
  })
  
  res.redirect("/")


})

app.post("/register",async (req,res) => {
    
  const {name,email,password} = req.body;
  
  
  let user = await Message.findOne({email})
  
  if(user){

    return res.render("login",{message: "User Already Exists"});
  }

  const hashedPassword = await bcrypt.hash(password,10);
  
  const messageData = {name,email,password:hashedPassword}
  
  user = await Message.create(messageData);

  const token = jwt.sign({_id:user._id},"ernhobni")

  // console.log(token);

  res.cookie("token",token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000)
  })
  
  res.redirect("/")

})

app.listen(port,() => {
    console.log("Listening..");  
})