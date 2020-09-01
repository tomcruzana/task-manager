const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/authentication");
const multer = require("multer");
const sharp = require("sharp");
const {sendWelcomeEmail, sendCancelationEmail} = require("../emails/account")
const router = new express.Router();

//users routes
router.post("/users", async (req, res)=>{ //create a user
    const user = new User(req.body); //capture the body of the new user via post req

    try{
        await user.save();
        sendWelcomeEmail(user.email, user.name); //send welcome email to the user
        const token = await user.generateAuthToken();
        res.status(200).send({user, token}); //200 is the default status code
    }
    catch(err){
        res.status(400).send(err); 
    }
});

router.post("/users/login", async (req, res)=>{ //user sign in
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password); //just a custom mongoose function the we create. See the user model for the details of this
        const token = await user.generateAuthToken(); //another custom mongoose function that will generate a token for a specific user
        res.status(200).send({user, token});
    }
    catch(err){
        res.status(400).send();
    }
});

router.post("/users/logout", auth, async (req, res)=>{ //logout a user
    try{
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        await req.user.save();
        res.status(200).send();
    }
    catch(err){
        res.status(500).send();
    }
});

router.post("/users/logoutAll", auth, async (req, res)=>{ //logout all sessions/users
    try{
        req.user.tokens = []; //erase the tokens
        await req.user.save();
        res.status(200).send();
    }
    catch(err){
        res.status(500).send();
    }
});

router.get("/users/me", auth, async (req, res)=>{ //find all users by running auth middleware first
    res.send(req.user);
});

router.patch("/users/me", auth, async (req, res)=>{
    const updates = Object.keys(req.body); //get the keys of the json
    const allowedUpdates = ["name", "email", "password", "age"]; //set an array of allowed keys for validation
    const isValidOperation =  updates.every(update => allowedUpdates.includes(update)); //validate by comparing if key is present in the allowed update array

    if (!isValidOperation)
        return res.status(400).send({error: "invalid updates!"});

    try{
        updates.forEach(update=> req.user[update] = req.body[update]); //saving the changes?
        await req.user.save();
        //const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true}); //see docs: https://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate
        (!req.user) ? res.status(404).send() : res.status(200).send(req.user);
    }
    catch (err){
        res.status(400).send(err);
    }
});

router.delete("/users/me", auth, async (req, res)=>{
    try{
        //const user = await User.findByIdAndDelete(req.user._id); //this params is coming from the authorization middleware
        //(!user) ? res.status(404).send() : res.status(200).send(user);

        await req.user.remove();
        sendCancelationEmail(req.user.email, req.user.name); //send cancelation email
        res.status(200).send(req.user);
    }
    catch(err){
        res.status(500).send(err);
    }
});

//multer configuration for picture file uploads
const upload = multer({
    limits: {
        fileSize: 1000000 //in bytes
    },
    fileFilter(req, file, cb){
        return (!file.originalname.match(/\.(jpg|jpeg|png)$/)) ? //mmetch file names in the regex
            cb(new Error("Please upload an image")) : cb(undefined, true);
    }
})

router.post("/users/me/avatar", auth, upload.single("avatar"), async (req, res)=>{
    //req.user.avatar = req.file.buffer; //save to mongodb avatar field
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer(); //have sharp manipulate the image file
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next)=>{ //handling express errors by not using a middleware
    res.status(400).send({ error : error.message });
});

router.delete("/user/me/avatar", auth, async (req, res)=>{
    req.user.avatar = undefined; //empty the avatar field
    await req.user.save();
    res.send();
});

router.get("/users/:id/avatar", async (req, res)=>{
    try {
        const user = await User.findById(req.params.id);
        
        if(!user || !user.avatar){
            throw new Error();
        }

        res.set("Content-type", "image/png"); //explicitly setup response headers
        res.send(user.avatar);
    }
    catch(err){
        res.status(404).send();
    }
});

module.exports = router;