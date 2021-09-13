const 
{
    client,
    getAllUsers,
    getAllPosts,
    getUserById,
    createPost,
    updatePost,
    createUser,
    updateUser,
    getPostByTagName,
}=require('./index.js');


const testDB= async()=> 
{
    try
    {
        console.log('db start');

        console.log("getUsers:");
        const users= await getAllUsers()
        console.log(users);

        console.log("updateUser users[0]")
        const updateUserResult= await updateUser(users[0].id,
        {
            name:"updated Name",
            location:"updated location"
        });
        console.log(updateUserResult);

        console.log("getAllPosts:");
        const posts= await getAllPosts();
        console.log(posts);

        console.log("updatePost posts[0]")
        const updatePostResult= await updatePost(posts[0].id,
        {
            title:"updated title",
            content:"updated content"
        });
        console.log(updatePostResult);

        console.log("getUserById(1)");
        const user1= await getUserById(1);
        console.log(user1);

        console.log("Calling updatePost on posts[1], only updating tags");
        const updatePostTagsResult = await updatePost(posts[1].id, {
          tags: ["#youcandoanything", "#redfish", "#bluefish"]
        });
        console.log("Result:", updatePostTagsResult);

        console.log("Calling getPostsByTagName with #1st_tag");
        const postsWithHappy = await getPostByTagName("#1st_tag");
        console.log("Result:", postsWithHappy);

        console.log('db end');
    }
    catch(error)
    {
        console.error('db error');
        throw error;
    }

}

const createUsers= async()=>
{
    try 
    {
        console.log("user start");
    
        await createUser(
        {
            username: 'user1',
            password: 'pass1',
            name:'name1',
            location:'location1' 
        });
        await createUser(
        {
            username: 'user2',
            password: 'pass2',
            name:'name2',
            location:'location2' 
        });
        await createUser(
        {
            username: 'user3',
            password: 'pass3',
            name:'name3',
            location:'location3' 
        });
    
        console.log("user end");
    }
    catch(error)
    {
        console.error("user error");
        throw error;
    }
}

const createInitalPosts= async()=>
{
    try 
    {
        console.log("post start");
        const [user1,user2,user3] = await getAllUsers();

        await createPost(
        {
            authorId:user1.id,
            title:"First Post",
            content:"This is a first post.",
            tags:["#1st_tag","#2nd_tag"]
        });
        await createPost(
        {
                authorId:user2.id,
                title:"First Post?",
                content:"This is another first post.",
                tags:["#1st_tag","#3rd_tag"]
        });
        await createPost(
        {
            authorId:user3.id,
            title:"First Post!",
            content:"This is yet another first post.",
            tags:["#1st_tag","#2nd_tag","#4th_tag"]
        });
        console.log("post end")
    } catch (error) 
    {
        console.log("post error")
        throw error;
    }
}


const dropTables= async()=>
{
    try
    {
        console.log('drop start');

        client.query(`DROP TABLE IF EXISTS posts_tags;`);
        client.query(`DROP TABLE IF EXISTS posts;`);
        client.query(`DROP TABLE IF EXISTS users;`);
        client.query(`DROP TABLE IF EXISTS tags;`)

        console.log('drop end');
    }
    catch(error)
    {
        console.error('drop error');
        throw error;
    }
}
const createTables= async()=>
{
    try
    {
        console.log('create start');

        await client.query(
        `CREATE TABLE IF NOT EXISTS users 
        (
            id SERIAL PRIMARY KEY,
            username varchar(255) UNIQUE NOT NULL,
            password varchar(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            location VARCHAR(255) NOT NULL,
            active BOOLEAN DEFAULT true
        );

        CREATE TABLE IF NOT EXISTS posts 
        (
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id) NOT NULL,
            title varchar(255) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
        );
    


        CREATE TABLE IF NOT EXISTS tags 
        (
            id SERIAL PRIMARY KEY,
            name varchar(255) UNIQUE NOT NULL
        );



        CREATE TABLE IF NOT EXISTS posts_tags 
        (
            "postId" INTEGER REFERENCES posts(id),
            "tagId" INTEGER REFERENCES tags(id),
            UNIQUE ("postId","tagId")
        );`
        );

        console.log('create end');
    }
    catch(error)
    {
        console.error('create error');
        throw error;
    }
}

const rebuildDB= async()=>
{
    try
    {
        client.connect();

        await dropTables();
        await createTables();
        await createUsers();
        await createInitalPosts();


    }
    catch(error)
    {
        throw error;
    }
}




rebuildDB()
.then(testDB)
.catch(console.error)
.finally(()=>
{
    client.end();
});

