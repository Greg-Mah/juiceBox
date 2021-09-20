const express = require('express');
const tagsRouter = express.Router();
const { getAllTags,getPostByTagName} = require('../db');

tagsRouter.use((req, res, next) => 
{
    console.log("A request is being made to /tags");

    next();
});

tagsRouter.get('/:tagName/posts',async (req,res,next)=>
{
    //const searchTag=req.params.tagName;
    try
    {
        const posts= await getPostByTagName(req.params.tagName);
        // use our method to get posts by tag name from the db
        // send out an object to the client { posts: // the posts }
        res.send({posts:posts});
    }
    catch({name,message})
    {
        next({name,message});
    }
  });

tagsRouter.get('/', async (req, res) => 
{
    const tags = await getAllTags();

    res.send(
    {
        tags
    });
});

module.exports = tagsRouter;