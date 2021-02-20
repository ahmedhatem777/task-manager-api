const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema({
    name: { 
        type: String,
        required: true,
        maxLength: 64,
        trim: true
    },
    age: {
        type: Number,
        default: 0,
        max: 123,
        validate(value) {
            if(value < 0) {
                throw new Error('Age must be a positive number!');
            }
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        maxLength: 254,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Incorrect Email!')
            }
        }
    },
    password: {
        type: String,
        required:true,
        trim: true,
        minlength: 7,
        maxLength: 64,
        validate(value){
            if(value.includes('password')){
                throw new Error('Password can not contain the word password!.')
            }
        }
    },
    tokens: [
        {
            token: {
                type: String,
                required:true
            }
        }
    ],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

//This adds a virtual field/property to the model, it is not stored in the db, it is used to establish the relation between this collection and
//the task collection, where it'll use the user id to establish that.
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

//A mongoose middleware function, which runs using the user instance itself, hence it is not an arrow function.
//Here it turns the user instance it ran on to a userObject, and then it uses the delete operator to delete the fields that should be hidden.
//Naming the function to '.toJSON' and adding our operations does the same without having to call the function explicitly
//, since express call the function behind the scenes.
userSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject
}

userSchema.methods.generateToken = async function() {
    const user = this;
    const userID = user._id.toString();
    const token = jwt.sign( {_id: userID }, process.env.JWT_SECRET);
    user.tokens = user.tokens.concat({token});
    await user.save();
    return token;
}

//A mongoose middleware function, which runs using the User model.
//In this function it is used to authenticate a user, where it checks if the given credentials are valid or not
//it is used by the login route in the userRouter.
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email});
    if(!user) throw new Error('Not a registered email!');

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) throw new Error('Wrong password!');

    return user;
}

//Hashing the password before saving it to the DB.
//This middleware runs whenever the the .save() method is used.
userSchema.pre('save', async function (next) {
    const user = this;

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
})

//Delete the user's task when the user himself is deleted.
//This method is used whenever .remove() is used.
userSchema.pre('remove', async function(next) {
    const user = this;
    const owner = user._id;
    await Task.deleteMany({owner})
    next()
})

const User = mongoose.model('User', userSchema) 

module.exports = User;