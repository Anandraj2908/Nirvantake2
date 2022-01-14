const mongoose = require('mongoose');
const postData= require('./postData');
const Post = require('../models/post');

mongoose.connect('mongodb://localhost:27017/nirvan',{
    useNewUrlParser:true,
    useUnifiedTopology:true
});

const db = mongoose.connection;
db.on("error",console.error.bind(console,"connection error:"));
db.once("open",() => {
    console.log("Database connected");
});


const seedDB = async () => {
    await Post.deleteMany({});
    for(let i=0; i<6 ;i++)
    {
        const blog = new Post({
        title:`${postData[i].title}`,
        author:`${postData[i].author}`,
        content:`${postData[i].content}`,
        image:`${postData[i].image}`,
        //comments:`${postData[i].comments}`
        date:Date.now()
        })
        await blog.save();
    }
};

seedDB().then(() => {
    mongoose.connection.close();
})