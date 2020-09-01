const express = require("express");
const Tasks = require("../models/tasks");
const auth = require("../middleware/authentication");
const router = new express.Router();

//tasks routes
router.post("/tasks", auth, async (req, res)=>{ //create a new task
    const task = new Tasks({
        ...req.body,
        owner: req.user._id
    });

    try{
        await task.save();
        res.status(201).send(task)
    }
    catch(err){
        res.status(400).send(err);
    }
});

//implement pagination to limit and skip data
router.get("/tasks", auth, async (req, res)=>{ //find all tasks
    const match = {};
    const sort = {}

    if(req.query.completed){
        match.completed = req.query.completed === "true"
    }

    if(req.query.sortBy){ //sorting algorithm
        //console.log(req.query.sortBy);
        const parts = req.query.sortBy.split(":"); //split the query string
        //console.log(parts);
        sort[parts[0]] = (parts[1] === "desc") ?  -1 : 1;
    }

    try{
        await req.user.populate({ 
            path: "tasks",
            match,
            options: { //pagination
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            },
        }).execPopulate();
        res.status(200).send(req.user.tasks);
    }
    catch(err){
        res.status(500).send(err);
    }
});

router.get("/tasks/:id", auth, async (req, res)=>{ //find an individual task
    const _id = req.params.id;

    try{
        //const task = await Tasks.findById(_id);
        const task = await Tasks.findOne({ _id, owner: req.user._id });
        (!task) ? res.status(404).send("<h1>Nothing found!</h1>") : res.status(200).send(task);
    }
    catch(err){
        res.status(500).send(err);
    }
});

router.patch("/tasks/:id", auth, async (req, res)=>{
    const updates = Object.keys(req.body);
    const allowedUpdates = ["description", "completed"];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update)); 

    if (!isValidOperation){
        return res.status(400).send({error: "invalid updates!"});
    }
    
    try{
        const task = await Tasks.findOne({ _id : req.params.id, owner: req.user._id });
        
        if (!task){ 
            return res.status(404).send() 
        };

        updates.forEach(update=>task[update] = req.body[update]); //saving the changes?
        await task.save();
        res.send(task);
    }
    catch(err){
        res.status(400).send(err);
    }
});

router.delete("/tasks/:id", auth, async (req, res)=>{
   
    try{
        const task = await Tasks.findOneAndDelete({ _id : req.params.id, owner: req.user._id });
        (!task) ? res.status(404).send() : res.status(200).send(task);
    }
    catch(err){
        res.status(500).send(err);
    }
});

module.exports = router;