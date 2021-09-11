const 
{
    client,
    getAllUsers,
    createUser,
    updateUser,
    createPost,
    getAllPosts,
    updatePost,
    getUserById,
}=require('./index.js');


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
            content:"This is a first post."
        });
        await createPost(
        {
                authorId:user2.id,
                title:"First Post?",
                content:"This is another first post."
        });
        await createPost(
        {
            authorId:user3.id,
            title:"First Post!",
            content:"This is yet another first post."
        });
        console.log("post end")
    } catch (error) 
    {
        throw error;
    }
}

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

const dropTables= async()=>
{
    try
    {
        console.log('drop start');

        client.query(`DROP TABLE IF EXISTS posts;`);
        client.query(`DROP TABLE IF EXISTS users;`);

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

        client.query(
        `CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username varchar(255) UNIQUE NOT NULL,
            password varchar(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            location VARCHAR(255) NOT NULL,
            active BOOLEAN DEFAULT true
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

const createPostTable= async()=>
{
    try
    {
        client.query(
        `CREATE TABLE IF NOT EXISTS posts 
        (
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id) NOT NULL,
            title varchar(255) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
        );`
        );
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
        await createPostTable();
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

