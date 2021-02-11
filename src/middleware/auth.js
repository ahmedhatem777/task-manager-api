const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try{
        console.log(req.headers);
        const cookies = cookie.parse(req.headers.cookie);
        const userToken = cookies.jot;
        const decodedToken = jwt.verify(userToken, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decodedToken._id, 'tokens.token': userToken});
        
        if(!user) {
            throw new Error('Authentication Failed!')
        }

        req.user = user;
        next();
    }
    catch(err){
        res.status(401).send({error: 'Unauthorized Access!'})
    }
    
}

module.exports = auth;