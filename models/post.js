








const mongoose = require('mongoose');
const Comment =require('./comment');
const Schema=mongoose.Schema;

const blogSchema = new Schema({
    title: String,
    /* author:String, */
    content:String,
    image:[
        {
            url:String,
            filename:String
        }
    ],
    date:{type:Date,default:Date.now},
    author:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    comments:[
        {
            type:Schema.Types.ObjectId,
            ref:'Comment'
        }
    ]
    
    
});

blogSchema.post('findOneAndDelete', async function (doc) {
    if(doc){
        await Comment.deleteMany({
            _id:{
                $in:doc.comments
            }
        })
    }
})

module.exports = mongoose.model('Post',blogSchema);





















