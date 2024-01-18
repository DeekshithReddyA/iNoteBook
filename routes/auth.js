const express = require('express');
var jwt = require('jsonwebtoken');
const User = require('../models/User');
var bcrypt = require('bcryptjs');
const router = express.Router()
const { body,query, validationResult } = require('express-validator');
const fetchuser = require('../middleware/fetchuser');

const JWT_SECRET = 'DeekshithReddy';


//ROUTE 1: Create a User using: POST "/api/auth/createuser". No Login required
router.post('/createuser',[
    body('name','Enter your name.').isLength({min: 2}),
    body('email','Enter a valid email.').isEmail(),
    body('password','Password must be atleast 5 characters.').isLength({min: 5})
], async (req,res)=>{

    // If there are errors, return Bad request and the errors


    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return   res.send({ errors: errors.array() });
    }



    //Chck whether the user with this email exists already
    try{
    let user = await User.findOne({email: req.body.email});
    if(user){
        return res.status(400).json({error: "Sorry a user with this email exists already"})
    }
    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(req.body.password,salt);
    // Create a new user
    user = await User.create({
        name:req.body.name,
        password: secPass,
        email:req.body.email
    });
    const data={
        user:{
            id: user.id
        }
    }
    const authtoken = jwt.sign(data, JWT_SECRET);

    res.json({authtoken})

    
}
// Catch errors
catch(error){
    console.error(error.message);
    res.status(500).send("Internal Server Error occured")
}
    
  
})

// ROUTE 2: Authenticate a User using : POST "/api/auth/login",No login required.
router.post('/login',[
    body('email','Enter a valid email.').isEmail(),
    body('password','Password cannot be blank').exists(),
], async (req,res)=>{
   // Check errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return   res.status(400).json({errors:errors.array()});
    }

    const {email,password} = req.body;
    try{
        let user = await User.findOne({email});
        if(!user){
            return res.status(400).json({error:"Account with this email doesn't exit"});
        }

        const passwordCompare = await bcrypt.compare(password, user.password);
        if(!passwordCompare){
            return res.status(400).json({error:"Wrong Password! Enter correct credentials"});
        }

        const data={
            user:{
                id: user.id
            }
        }
        const authtoken = jwt.sign(data, JWT_SECRET);
        res.json({authtoken})
    }
    catch(error){
        console.error(error.message);
        res.status(500).send("Internal Server Error occured")
    }
})




// ROUTE 3: Get logged in user details using :POST "/api/auth/getuser" .Login required.
router.post('/getuser',fetchuser, async (req,res)=>{
   

try{
   const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.send(user)
} catch(error){
    console.error(error.message);
        res.status(500).send("Internal Server Error occured")
}
 
})

module.exports = router
