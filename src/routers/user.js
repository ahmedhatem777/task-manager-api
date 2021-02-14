const express = require('express');
var cookie = require('cookie');
const User = require('../models/user');
const auth = require('../middleware/auth');
// const {sendWelcomeEmail, sendCancelationEmail} = require('../emails/account')
const sharp =  require('sharp');
const multer = require('multer');

//Avatar options
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(file.originalname.match(/\.(jpg|jpeg|png)$/)){
            cb(undefined, true);
        }
        else{
            cb(new Error('Unsupported file type!'));
        }
    }
})

const router = new express.Router();

//Creating a user
router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        //sendWelcomeEmail(user.email, user.name);
        const token = await user.generateToken();
        res.setHeader('Set-Cookie', cookie.serialize('jot', token, {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            // Set true for https only
            // secure: true
        }));
        res.status(201);
        res.send({user});
    }
    catch(err){
        res.status(400).send(err);
    }

})

//Logging in a user
router.post('/users/login', async (req, res) => {
    var email = req.body.email;
    var password = req.body.password;
    try{
        const user = await User.findByCredentials(email, password);
        const token = await user.generateToken();
        res.setHeader('Set-Cookie', cookie.serialize('jot', token, {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            domain: null
            // Set true for "https" only
            // secure: true
        }));
        res.send({user});
    }
    catch(err){
        res.status(400).send('Login failed!')
    }
})

//User logging out
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
            maxAge: 1 // 1 second
        }))

        res.send('Logout Successfully!');
    }
    catch(err){
        res.status(500).send('Logout failed!')
    }
})

//User Logging out of all devices "deleting all tokens"
router.post('/users/logoutAll', auth, async (req, res) => {
    try{
        req.user.tokens = [];
        await req.user.save();

        res.setHeader('Set-Cookie', cookie.serialize('jot', 'buhbye', {
            httpOnly: true,
            path: "/",
            maxAge: 1 // 1 second
        }))

        res.send('Logged out of all devices!')
    }
    catch(err){
        res.status(500).send('Logout failed!')
    }
})

//Showing User profile
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
})

//Uploading user avatar
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    user = req.user;
    uploadedAvatar = req.file.buffer;
    avatar = await sharp(uploadedAvatar).resize({width:250, height:250}).png().toBuffer();
    user.avatar = avatar;
    await user.save();
    res.send('Uploaded successfully!')
}, (err, req, res, next) => res.status(400).send({error: err.message}))

//Deleting user avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    user = req.user;
    user.avatar = undefined;
    await user.save();
    res.send('Avatar deleted!');
})

//Showing a user's avatar
router.get('/users/:id/avatar', async (req, res) => {
    try{
        const user = await User.findById(req.params.id);
        if(!user || !user.avatar){
            throw new Error('User/Image not found!')
        }
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    }
    catch(err){
        res.status(404).send(err);
    }
})

//Updating a user
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
        console.log(err);
        res.status(400).send(err);
        
    }
})

//Deleting a user
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

