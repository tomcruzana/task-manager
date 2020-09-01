const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./tasks");

//User
const userSchema = new mongoose.Schema({name: {
    trim: true,
    type: String,
    required: true //basic validation
},

email: {
    trim: true,
    unique: true, //this will make sure that this field is distinctive
    type: String,
    required: true,
    lowercase: true,
    validate(value){
        if(!validator.isEmail(value)){
            throw new Error("Email is invalid");
        }
    }
},

age: {
    type: Number,
    default: 0,
    validate(value){
        if (value < 0){ 
            throw new Error("Must be a positive number");
        }
    }
},

password: {
    type: String,
    required: true,
    trim: true,
    validate(value){
        if(value.toLowerCase() === "password"){
            throw new Error("This is not allowed. Try a different one.");
        }
    }
},

tokens: [{
    token: {
        type: String,
        required: true
    }
}],

avatar: {
    type: Buffer
}

}, {
    timestamps: true //generate timestamps
});

//virtual for specifying db relationships
userSchema.virtual("tasks", {
    ref: "Tasks",
    localField: "_id",
    foreignField: "owner"
})

//middlewares
userSchema.methods.toJSON = function(){ 
    const user = this;
    const userObject = user.toObject();

    //delete these field on the response
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
};

userSchema.methods.generateAuthToken = async function(){
    const user = this;
    const token = jwt.sign({_id : user._id.toString()}, process.env.JWT_SECRET);
    user.tokens = user.tokens.concat({token});
    await user.save();
    return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email }); //find the email
    if (!user){
        throw new Error("Unable to login"); //if no email, block login. It's important NOT to be specific here
    }

    const isMatch = await bcrypt.compare(password, user.password); //compare supplied password against the hash
    if (!isMatch){
        throw new Error("Unable to login"); //if password is incorrect
    }

    return user; //grant access once credentials are verified
};

//hash the password
userSchema.pre("save", async function(next){ //pre keyword in userSchema middleware means: excecute before something
    const user = this;
    if(user.isModified("password")){
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

//delete user tasks when user is removed
userSchema.pre("remove", async function(next){ //pre keyword in userSchema middleware means: excecute before something
    const user = this;
    await Task.deleteMany({ owner: user._id });
    next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;