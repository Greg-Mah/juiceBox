const {Client}=require('pg');

const client=new Client('postgres://localhost:5432/juicebox-dev');

const getAllUsers=async()=>
{
    try 
    {
        const{rows:users}=await client.query(
        `SELECT
            id,
            username,
            name,
            location,
            active
        FROM users;`
        );

        return users;
    }
    catch (error)
    {
        console.error(error);
    }

}

const getUserById=async(userId)=>
{
    try 
    {
        const{rows:[user]}=await client.query(
            `SELECT
                id,
                username,
                name,
                location
            FROM users WHERE id=$1;`,
            [userId]
            );
            user.posts= await getAllPostsByUser(userId);
        
            return user;
    }
    catch (error)
    {
        console.error(error);
    }

}

const getAllPosts=async()=>
{
    try
    {
        const{rows:postsIds}=await client.query(
            `SELECT id
            FROM posts;`
            );

            const posts=await Promise.all(postsIds.map((post) => 
            {
                return getPostById( post.id );
            }));;


            return posts;
    }
    catch (error)
    {
        console.error(error);
    }
}

const getAllPostsByUser=async(userId)=>
{
    try
    {
        const{rows:postsIds}=await client.query(
            `SELECT
                id
            FROM posts WHERE "authorId"=$1;`,
            [userId]
            );
        
            const posts=await Promise.all(postsIds.map((post) => 
            {
                return getPostById( post.id );
            }));;

            return posts;
    }
    catch (error)
    {
        console.error(error);
    }

}

const getPostById= async(postId)=> 
{
    try 
    {
        const {rows:[post]}=await client.query(
        `SELECT *
        FROM posts
        WHERE id=$1;`,
        [postId]
        );
  
        const {rows:tags}=await client.query(
        `SELECT tags.*
        FROM tags
        JOIN posts_tags ON tags.id=posts_tags."tagId"
        WHERE posts_tags."postId"=$1;`,
        [postId]
        );
  
        const{rows:[author]}=await client.query(
        `SELECT id, username, name, location
        FROM users
        WHERE id=$1;`, [post.authorId]
        );
        post.tags = tags;
        post.author = author;
  
        delete post.authorId;
  
        return post;
    } 
    catch (error) 
    {
      throw error;
    }
}

const getPostByTagName= async(tagName)=> 
{
    try 
    {
        const { rows: postIds } = await client.query(
        `SELECT posts.id
        FROM posts
        JOIN posts_tags ON posts.id=posts_tags."postId"
        JOIN tags ON tags.id=posts_tags."tagId"
        WHERE tags.name=$1;`,
        [tagName]);

        return await Promise.all(postIds.map(
        post => getPostById(post.id)
    ));
    } 
    catch (error) 
    {
      throw error;
    }
}

const getAllTags=async()=>
{
    try
    {
        const{rows:tags}=await client.query(
            `SELECT *
            FROM tags;`
        );

        return tags;
    }
    catch (error)
    {
        console.error(error);
    }
}

const createUser= async(
    {
        username,
        password,
        name,
        location
    })=> 
{
    try 
    {
        const { rows:[user] } = await client.query(
        `INSERT INTO users(username,password,name,location) 
        VALUES($1,$2,$3,$4) 
        ON CONFLICT (username) DO NOTHING 
        RETURNING *;`,
        [username,password,name,location]);
  
        return user;
    } 
    catch (error) 
    {
      throw error;
    }
}

const createPost= async(
    {
        authorId,
        title,
        content,
        tags=[]
    })=> 
{
    try 
    {
        const { rows:[post] } = await client.query(
        `INSERT INTO posts("authorId",title,content) 
        VALUES($1,$2,$3) 
        RETURNING *;`,
        [authorId,title,content]);
  
        const tagList=await createTags(tags);
        return await addTagsToPost(post.id,tagList);
    } 
    catch (error) 
    {
      throw error;
    }
}

const createTags= async(tagList)=> 
{
    if(tagList.length===0)
    {
        return;
    }
    const sourceArray=tagList.map((_,idx)=>
    {
        return "$"+(idx+1);
    });
    const insertString=sourceArray.join("),(");
    const selectString=sourceArray.join(",");
    try 
    {
        await client.query(
        `INSERT INTO tags(name) 
        VALUES(${insertString}) 
        ON CONFLICT (name) DO NOTHING;`,
        tagList
        );

        const { rows:tags } = await client.query(
        `SELECT * FROM tags
        WHERE name
        IN (${selectString});`,
        tagList
        );
  
        return tags;
    } 
    catch (error) 
    {
      throw error;
    }
}

const createPostsTag= async(postId, tagId)=> 
{
    try 
    {
        await client.query(
        `INSERT INTO posts_tags("postId", "tagId")
        VALUES ($1, $2)
        ON CONFLICT ("postId", "tagId") DO NOTHING;`,
        [postId, tagId]);
    } 
    catch (error) 
    {
      throw error;
    }
}

const addTagsToPost= async(postId, tagList)=> 
{
    try 
    {
        const createPostTagPromises = tagList.map((tag)=>
        {
            createPostsTag(postId, tag.id);
        });
        await Promise.all(createPostTagPromises);
        return await getPostById(postId);
    } 
    catch (error) 
    {
      throw error;
    }
}

const updateUser=async(id,fields={})=>
{
    const setString=Object.keys(fields).map((key,idx)=>
    {
        return `"${key}"=$${idx+1}`
    })
    .join(',');

    if(setString==='')
    {
        return;
    }

    try
    {
        const {rows:[user]}= await client.query(
        `UPDATE users
        SET ${setString}
        WHERE id=${id}
        RETURNING *;`,
        Object.values(fields)
        );

        return user;
    }
    catch(error)
    {
        throw error
    }
}

const updatePost= async(id,
    {
        title,
        content,
        active,
        tags
    })=>
{
    const fields={};
    if(title !== undefined )
    {
        fields.title=title;
    }
    if(content !== undefined )
    {
        fields.content=content;
    }
    if(active !== undefined )
    {
        fields.active=active;
    }
    const setString=Object.keys(fields).map((key,idx)=>
    {
        return `"${key}"=$${idx+1}`;
    })
    .join(',');

    try
    {
        if(setString.length>0)
        {
            await client.query(
            `UPDATE posts
             SET ${setString}
            WHERE id=${id}
            RETURNING *;`,
            Object.values(fields)
            );
        }

        if(tags===undefined)
        {
            return await getPostById(id);
        }
   
        const tagList= await createTags(tags);
        const tagListIdString=tagList.map((tag)=>
        {
            return `${tag.id}`;
        }).join(',');

        await client.query(
        `DELETE FROM posts_tags
        WHERE "tagId"
        NOT IN (${tagListIdString})
        AND "postId"=$1;`,
        [id]
        );
        await addTagsToPost(id, tagList);

        return await getPostById(id);
    }
    catch(error)
    {
        throw error
    }
}


module.exports={
    client,
    getAllUsers,
    getAllPosts,
    getAllTags,
    getUserById,
    createPost,
    updatePost,
    createUser,
    updateUser,
    createTags,
    addTagsToPost,
    getPostByTagName,
}