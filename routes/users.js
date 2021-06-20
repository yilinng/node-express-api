const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { signupValidation, loginValidation } = require('../validation');
const router = express.Router();
const User = require('../models/user');
const RefreshToken = require('../models/refreshtoken');
const verify = require('../verifyToken'); 
const { token } = require('morgan');


router.post('/token', async (req, res) => {
  const refreshToken = req.body.token;
  if(refreshToken  == null) return res.sendStatus(401);
  const refreshTokens = await RefreshToken.findOne({ refresh_token: refreshToken});
  if(!refreshTokens) return res.sendStatus(403);
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRECT, (err, olduser) => {
    const user = { email: olduser.email, pwd: olduser.pwd }
    if (err) return res.sendStatus(403);
    const accessToken = generateAccessToken(user);
    res.cookie('token', accessToken, {
      expires  : new Date(Date.now() + 9999999),
      httpOnly : false
    })
    res.status(200).json({accessToken: accessToken});
  })
})  

//Getting this user
router.get('/', verify, async(req, res) => {

  const { headers: {cookie} } = req;
  //if no cookie
  if (cookie === undefined) return res.status(404).json({ message: 'you are need authorization!!'})
  
  const getCookie = getcookie(req);  
  const { retoken } = getCookie;

    try {
      const user = await User.findOne({email: req.user.email});
        res.status(200).json({user, retoken})
    } catch (err) {
        res.status(500).json({ message: err.message})
    }
    
});

//Creating One
router.post('/signup', async (req, res) => {
    //let's validate the data before we add user
    const { error } = signupValidation(req.body);
    if (error) return res.status(400).json({message: error.details[0].message});

    //checking if the user is already in the database
    const emailExist = await User.findOne({ email: req.body.email});
    if (emailExist) return res.status(400).json({message: 'email already exist!'});
  
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      name: req.body.name,
      email: req.body.email, 
      password: hashedPassword
    });

     //Create and assign a token
   // generate refresh token and put in database
   const genUser = { email: req.body.email, pwd: hashedPassword };
   const accessToken = generateAccessToken(genUser);
   const refreshToken = jwt.sign(genUser, process.env.REFRESH_TOKEN_SECRECT);
   const token = new RefreshToken({
    email: req.body.email,
    refresh_token: refreshToken
  });

    try {
      const newUser = await user.save(); 
      const newToken = await token.save();
      res.cookie('token', accessToken, {
        expires  : new Date(Date.now() + 9999999),
        httpOnly : false
      })      
      res.status(201).json({
        newToken,
        newUser    
      });

    } catch (err) {
      res.status(400).json({ message: err.message})
    } 
    
  });

//clear token need refreshtoken !!
router.delete('/logout', (req, res) => {
 
  //refreshTokens database have to delete when log out!!
   RefreshToken.remove({ refresh_token: req.body.token })
   .then(res => console.log('success', res))
   .catch(err => console.log('fail', err));

  //  Clearing the cookie
  res.clearCookie('token');
  res.clearCookie('retoken')
  //refreshTokens = refreshTokens.filter(token => token !== req.body.token);
  res.status(204).json({ message: 'logout success!!' })
  
});  


router.post('/login', getUser, async (req, res) => {   
     //let's validate the data before we add user
     const { error } = loginValidation(req.body);
     if (error) return res.status(400).json({message: error.details[0].message});
    
     //check password is correct
    const validPass = await bcrypt.compare(req.body.password, res.user.password);
    if(!validPass) return res.status(400).json({message: 'Invalid password'});

    //check user is login, check refreshtoken id 
    const findUser = await RefreshToken.findOne({ email: res.user.email })
    if(findUser) return res.status(400).json({message: 'user is login!'});

    //Create and assign a token
   // generate refresh token and put in database
   const user = { email: res.user.email, pwd: res.user.password };
   const accessToken = generateAccessToken(user);
   const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRECT);
   const token = new RefreshToken({
    email: res.user.email,
    refresh_token: refreshToken
  });
  
  try {
  
    const newToken = await token.save();
    res.cookie('token', accessToken, {
      expires  : new Date(Date.now() + 9999999),
      httpOnly : false
    });
    res.cookie('retoken', refreshToken, {
      expires  : new Date(Date.now() + 9999999),
      httpOnly : true
    });      
    res.status(201).json({
      newToken
    });
       
  } catch (err) {
    res.status(400).json({ message: err.message})
  } 

  });
  
  router.put('/update-profile',verify, async(req, res) => {
    const { headers: {cookie} } = req;
    //if no cookie
    if (cookie === undefined) return res.status(404).json({ message: 'you are need authorization!!'});
    
    let hashedPassword;
    //check password have mutation
    const validPass = await bcrypt.compare(req.body.password, req.user.pwd);
    if(!validPass){
      hashedPassword = await bcrypt.hash(req.body.password, 10);
    }else{
      hashedPassword = req.user.pwd;
    }
  
   try{
      const user = await User.updateOne(
        { email: req.body.email}, 
        {$set: {name: req.body.name, password: hashedPassword}});
      res.status(200).json(user);  
  } catch(err) {
    res.status(400).json(err);
  }
  
  });

async function getUser(req, res, next){
    let user
    try {
        user = await User.findOne({ email: req.body.email});
        if(!user) return res.status(404).json({message: 'cannot find user, please sign up'});
    } catch(err) {
        return res.status(500).json({message: err.message})
    }

    res.user = user
    next()
}


function getcookie(req) {
  const { headers: {cookie} } = req;
  // user=someone; session=QyhYzXhkTZawIb5qSl3KKyPVN (this is my cookie i get)
  return cookie.split('; ').reduce((res, item) => {
    const data = item.trim().split('=');
    return {...res, [data[0]] : data[1]};
  }, {});
}


function generateAccessToken(user) {
  return jwt.sign(user, process.env.TOKEN_SECRECT, { expiresIn: '1h' })
}

module.exports = router