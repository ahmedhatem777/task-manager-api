const express = require('express');
var cookie = require('cookie');
const User = require('../models/user');
const auth = require('../middleware/auth');
const sharp =  require('sharp');
const multer = require('multer');
// const {sendWelcomeEmail, sendCancelationEmail} = require('../emails/account');

// Avatar options
const upload = multer({
    limits: {
        fileSize: 1000000  
    },
    fileFilter(req, file, cb) {
        // if (file.size > 1000000) cb(new Error('FILE TOO LARGE: 1MB SIZE LIMIT!'));
        if(file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)){
            cb(undefined, true);
        }
        else{
            cb(new Error('UNSUPPORTED FILE TYPE!'));
        }
    }
})

const router = new express.Router();

// Creating a user
router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        //sendWelcomeEmail(user.email, user.name);
        const token = await user.generateToken();
        res.setHeader('Set-Cookie', cookie.serialize('jot', token, {
            httpOnly: true,
            path: "/",
            // strict/lax for security reasons, but deployment limits 
            sameSite: "none",
            secure: true
        }))
        res.status(201);
        res.send({user});
    }
    catch(err){
        if(err.code === 11000) {
            res.status(400).send('Email already registered!');
        }
        else if( err.errors.password ) {
            res.status(400).send('Invalid password length!');
        }
        else {
            res.status(400).send('Something went wrong, please try again!');
        }
    }

})

// Logging in a user
router.post('/users/login', async (req, res) => {
    var email = req.body.email;
    var password = req.body.password;
    try{
        const user = await User.findByCredentials(email, password);
        const token = await user.generateToken();
        res.setHeader('Set-Cookie', cookie.serialize('jot', token, {
            httpOnly: true,
            path: "/",
            // strict/lax for security reasons, but deployment limits 
            sameSite: "none",
            secure: true
        }));
        res.send({user});
    }
    catch(err){
        res.status(400).send(err.message);
    }
})

// Loggin in with cookie
router.get('/users/cookie', auth, async (req, res) => {
    try {
        res.status(200).send('Still Logged In');
    }
    catch(err){
        res.status(401).send(err.message);
    }
})

// User logging out
router.post('/users/logout', auth, async (req, res) => {
    try{
        const cookies = cookie.parse(req.headers.cookie);
        const userToken = cookies.jot;
        req.user.tokens = req.user.tokens.filter( (token) => {
            return token.token !== userToken;
        })

        await req.user.save();

        res.setHeader('Set-Cookie', cookie.serialize('jot', 'buhbye', {
            httpOnly: true,
            path: "/",
            // strict/lax for security reasons, but deployment limits 
            sameSite: "none",
            secure: true,
            maxAge: 1 // 1 second
        }))

        res.send('Logout Successfully!');
    }
    catch(err){
        res.status(500).send('Logout failed!')
    }
})

// User Logging out of all devices "deleting all tokens"
router.post('/users/logoutAll', auth, async (req, res) => {
    try{
        req.user.tokens = [];
        await req.user.save();

        res.setHeader('Set-Cookie', cookie.serialize('jot', 'buhbye', {
            httpOnly: true,
            path: "/",
            sameSite: "strict",
            maxAge: 1 // 1 second
        }))

        res.send('Logged out of all devices!')
    }
    catch(err){
        res.status(500).send('Logout failed!')
    }
})

// Showing User profile
router.get('/users/me', auth, async (req, res) => {
    const user = req.user;
    if(user.avatar){
        res.send({...req.user, hasAvatar: true});
    }
    else {
        res.send({ ...req.user, hasAvatar: false });
    }
    
})

// Uploading user avatar
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    user = req.user;
    try {
        uploadedAvatar = req.file.buffer;
        avatar = await sharp(uploadedAvatar).resize({ width: 200, height: 200 }).png().toBuffer();
        user.avatar = avatar;
        await user.save();
        res.send('UPLOADED SUCCESSFULLY!')
    }
    catch(e){ console.log(e) };
    
}, (err, req, res, next) => { 
        if (err instanceof multer.MulterError && err.message === "File too large" ) {
            res.status(400).send('FILE TOO LARGE! 1MB SIZE LIMIT.');
        }
        else {
            if(err.message) {
                res.status(400).send(err.message);
            }
            else{
                res.status(400).send('SOMETHING WENT WRONG, TRY AGAIN!');
            }
        }
    })

// Deleting user avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    user = req.user;
    user.avatar = undefined;
    await user.save();
    res.send('Avatar deleted!');
})

// Showing a user's avatar
router.get('/users/me/avatar', auth ,async (req, res) => {
    try{
        const user = await User.findById(req.user._id);
        if(!user || !user.avatar){
            throw new Error('No avatar was uploaded :(')
        }
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    }
    catch(err){
        res.status(404).send(err);
    }
})

// Updating a user
router.patch('/users/:id', auth, async (req, res) => {
    const user = req.user;
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every( (update) => allowedUpdates.includes(update) )
    if(!isValidOperation) return res.status(400).send('Not an allowed update!');

    try {
        updates.forEach((update) => user[update] = req.body[update]);
        await user.save();
        res.send(user);
    }
    catch(err){
        res.status(400).send('Something went wrong, please try again!');
    }
})

// Deleting a user
router.delete('/users/me',auth, async (req, res) => {
    try{
        await req.user.remove()
        // sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user);
    }
    catch(err){
        res.status(500).send(err)
    }
})

module.exports = router;

