const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(!token) return res.status(401).send('Access denied');
    try{
       const varified = jwt.verify(token, process.env.TOKEN_SECRECT);
       req.user = varified;
       next(); 
    } catch(err) {
        res.status(400).send('Invalid Token');
    }
}