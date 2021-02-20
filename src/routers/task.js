const express = require('express');
const router = new express.Router();
const Task = require('../models/task');
const auth = require('../middleware/auth');

//Creating a new task
router.post('/tasks', auth, async (req, res) => {
    //Using es6 spread to take all the properties of the req.body and adding them to the task object.
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try{
        await task.save();
        res.status(201).send(task);
  
    }
    catch(err){
        res.status(400).send(err);
    }
})

//Getting all tasks
router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {};
    const user = req.user;
    //URL Queries
    const completionQuery = req.query.completed;
    const sortByQuery = req.query.sortBy;
    const limit = parseInt(req.query.limit);
    const skip = parseInt(req.query.skip);

    if(completionQuery) match.completed = completionQuery;
    
    if(sortByQuery) {
        const parts = sortByQuery.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } 

    try{
        await user.populate({
            path: 'tasks',
            match,
            options: {
                limit,
                skip,
                sort
            }
        })
        .execPopulate();

        res.status(200).send(user.tasks)
    }
    catch(err){
        res.status(500).send(err)
    }
})

//Getting a task
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try{
        const task = await Task.findOne({_id, owner: req.user._id})
        if(!task){
            return res.status(404).send('Task Not found!');
        }
        res.status(200).send(task);
    }
    catch(err){
        res.status(500).send(err);
    }
})

//Updating a task
router.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    const owner = req.user._id;
    const updates = Object.keys(req.body);
    const allowedUpdates = ["title", "description", "completed"];
    const isValidOperation = updates.every( (update) => allowedUpdates.includes(update) )

    if(!isValidOperation) return res.status(400).send('Invalid updates!');
    
    try{
        const task = await Task.findOne({_id, owner})

        if(!task) return res.status(404).send('No task found!')

        updates.forEach( (update) => task[update] = req.body[update] )
        await task.save();
        res.send(task);
    }
    catch(err){
        res.status(400).send('Task not found!');
    }
})

//Deleting a task
router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    const owner = req.user._id;

    try{
        const task = await Task.findOneAndDelete({_id, owner});
        
        if(!task) return res.status(404).send('Task not Found!')
        
        res.send(task);
    }
    catch(err){
        res.status(404).send(err)
    }
})

module.exports = router;