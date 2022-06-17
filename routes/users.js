const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { signupValidation, loginValidation } = require('../validation');
const router = express.Router();
const User = require('../models/user');
const RefreshToken = require('../models/refreshtoken');
const verify = require('../verifyToken'); 
const { v4: uuidv4 } = require('uuid');

//use refreshtoken to yield now accesstoken

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
      httpOnly : true,
      // Forces to use https in production
    });
    res.status(200).json({ accessToken });
  })
});

router.get('/get-cookies', (req, res) => {
 
  //const rawCookies = req.headers.cookie ? req.headers.cookie.split('; ') : null;
  
  //if(rawCookies === null) return res.sendStatus(403);

  //const [token, retoken] = rawCookies;

  //const [tokenName, tokenVal] = token.split('=');

  //const [reName, retokenVal] = retoken.split('=');

  
  res.status(200).json({ cookies: req.cookies })
})


//Getting this user
router.get('/', verify, async(req, res) => {
  
  const rawCookies = req.headers.cookie ? req.headers.cookie.split('; ') : null;
  
  if(rawCookies === null) return //res.status(400).json('you have to login');

    try {
      const user = await User.findOne({ email: req.user.email });
        res.status(200).json({ user })
    } catch (err) {
        res.status(500).json({ message: err.message })
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
        expires: new Date(Date.now() + 9999999),
        httpOnly : false,
         // Forces to use https in production
        secure: true,
        sameSite:'none',
      });
  
      res.cookie('retoken', refreshToken, {
        expires: new Date(Date.now() + 9999999),
        httpOnly : false,
        // Forces to use https in production
        sameSite: 'none',
        // Forces to use https in production
        secure: true,
        sameSite:'none',
      });

      res.status(201).json({
        accessToken,
        newToken,
        newUser    
      });

    } catch (err) {
      res.status(400).json({ message: err.message})
    } 
    
  });

//clear token need refreshtoken !!
router.delete('/logout', (req, res) => {
 
  try{
      //refreshTokens database have to delete when log out!!
      RefreshToken.deleteOne({ refresh_token: req.body.token })
      .then(res => console.log('success', res))
      .catch(err => console.log('fail', err));

      //  Clearing the cookie
      res.clearCookie('token');
      res.clearCookie('retoken');
      //refreshTokens = refreshTokens.filter(token => token !== req.body.token);
      res.status(204).json({ message: 'logout success!!' })  
  
  }catch{
    res.status(500).json({message: 'server error...'})
  }
  
});  


router.post('/login', getUser, async (req, res) => {   
     //let's validate the data before we add user
     const { error } = loginValidation(req.body);
     if (error) return res.status(400).json({ message: error.details[0].message });
    
     //check password is correct
    const validPass = await bcrypt.compare(req.body.password, res.user.password);
    if(!validPass) return res.status(400).json({ message: 'Invalid password' });

    //check user is login, check refreshtoken id 
    const findUser = await RefreshToken.findOne({ email: res.user.email })
    if(findUser) return res.status(400).json({ message: 'user is login!' });

    //Create and assign a token
   // generate refresh token and push in database
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
      expires: new Date(Date.now() + 8 * 3600000), // cookie will be removed after 8 hours
      httpOnly: false,
      // Forces to use https in production
      secure: true,
      sameSite:'none',
    });

    res.cookie('retoken', refreshToken, {
      expires: new Date(Date.now() + 8 * 3600000), // cookie will be removed after 8 hours, // 24 hours
      httpOnly: false,
      // Forces to use https in production
      secure: true,
      sameSite:'none',
    });

    res.status(201).json({
      accessToken, newToken, user: res.user
    });
       
  } catch (err) {
    res.status(400).json({ message: err.message})
  } 

  });
  
  router.put('/update-profile', verify, async(req, res) => {
    const { headers: { cookie } } = req;
    //if no cookie
    if (cookie === undefined) return res.status(404).json({ message: 'you are need authorization!!' });
    
    let hashedPassword;

    //check hash password is same 
    if(req.body.password === req.user.pwd){
      hashedPassword = req.user.pwd;
    }
    //if have value
    if(!hashedPassword){
      hashedPassword = await bcrypt.hash(req.body.password, 10);
    }
  
   
   try{
      const user = await User.updateOne(
        { _id: req.body._id}, 
        {$set: {
          name: req.body.name, 
          email: req.body.email, 
          password: hashedPassword}});
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

function generateAccessToken(user) {
  return jwt.sign(user, process.env.TOKEN_SECRECT, { expiresIn: '20m' })
}

module.exports = router