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
        const{rows:posts}=await client.query(
            `SELECT
                id,
                "authorId",
                title,
                content,
                active
            FROM posts;`
            );
        
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
        const{rows:posts}=await client.query(
            `SELECT
                id,
                "authorId",
                title,
                content,
                active
            FROM posts WHERE "authorId"=$1;`,
            [userId]
            );
        
            return posts;
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
        const { rows } = await client.query(
        `INSERT INTO users(username,password,name,location) 
        VALUES($1,$2,$3,$4) 
        ON CONFLICT (username) DO NOTHING 
        RETURNING *;`,
        [username,password,name,location]);
  
        return rows;
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
        content
    })=> 
{
    try 
    {
        const { rows } = await client.query(
        `INSERT INTO posts("authorId",title,content) 
        VALUES($1,$2,$3) 
        RETURNING *;`,
        [authorId,title,content]);
  
        return rows;
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
        active
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
        return `"${key}"=$${idx+1}`
    })
    .join(',');

    if(setString==='')
    {
        return;
    }

    try
    {
        const {rows:[post]}= await client.query(
        `UPDATE posts
        SET ${setString}
        WHERE id=${id}
        RETURNING *;`,
        Object.values(fields)
        );

        return post;
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
    getUserById,
    getAllPostsByUser,
    createPost,
    updatePost,
    createUser,
    updateUser,
}