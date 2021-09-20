const express = require('express');
const postsRouter = express.Router();
const { getAllPosts,createPost,getPostById,updatePost} = require('../db');
const {requireUser}=require('./utils');

postsRouter.use((req, res, next) => 
{
    console.log("A request is being made to /posts");

    next();
});

postsRouter.post('/',requireUser,async (req,res,next)=>
{
    const {title,content,tags = "" } = req.body;

    const tagArr=tags.trim().split(/\s+/)
    const postData={};
  
    // only send the tags if there are some to send
    if (tagArr.length) 
    {
        postData.tags = tagArr;
    }
  
    try 
    {
        // add authorId, title, content to postData object
        // const post = await createPost(postData);
        // this will create the post and the tags for us
        // if the post comes back, res.send({ post });
        // otherwise, next an appropriate error object 
        postData.authorId=req.user.id;
        postData.title=title;
        postData.content=content;
        const post = await createPost(postData);
        if(post)
        {
            res.send({post});
        }
        else
        {
            next({name:'post error', message:'an error occoured during post creation.'});
        }
    } catch ({ name, message }) 
    {
        next({ name, message });
    }
});

postsRouter.patch('/:postId',requireUser,async (req,res,next)=>
{
    const {postId} = req.params;
    const {title,content,tags} = req.body;

    const updateFields={};

    // only send the field if there is one to send
    if(tags&&tags.length>0)
    {
        updateFields.tags=tags.trim().split(/\s+/);
    }

    if(title) 
    {
        updateFields.title = title;
    }
    
    if(content)
    {
        updateFields.content=content;
    }
  
    try 
    {
        const originalPost=await getPostById(postId);

        if(originalPost.author.id===req.user.id)
        {
            const updatedPost =await updatePost(postId,updateFields);
            res.send({ post: updatedPost });
        }
        else
        {
            next({name:'UnauthorizedUserError', message:'You cannot update a post that is not yours'});
        }
    } catch ({ name, message }) 
    {
        next({ name, message });
    }
});

postsRouter.delete('/:postId',requireUser,async (req,res,next)=>
{  
    try 
    {
        const post=await getPostById(req.params.postId);

        if(post&&post.author.id===req.user.id)
        {
            const updatedPost =await updatePost(req.params.postId,{active:false});
            res.send({ post: updatedPost });
        }
        else
        {
            next(post ? 
                {
                    name:'UnauthorizedUserError',
                    message:'You cannot delete a post that is not yours'
                }:
                {
                    name: "PostNotFoundError",
                    message: "That post does not exist"
                });
        }
    } catch ({ name, message }) 
    {
        next({ name, message });
    }
});

postsRouter.get('/', async (req, res) => 
{
    const posts = (await getAllPosts()).filter((post)=>
    {
        return post.active||(req.user&&req.user.id===post.author.id);
    });


    res.send(
    {
        posts
    });
});

module.exports = postsRouter;