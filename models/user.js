












const mongoose =require('mongoose');
const Schema=mongoose.Schema;
const passportLocalMongoose=require('passport-local-mongoose');
const Post = require('./post');

const UserSchema = new Schema({
    username: String,
    googleId: String,
    facebookId:String,
    thumbnail: String,
    posts:[
        {
            type:Schema.Types.ObjectId,
            ref:'Post'
        }
    ]
});

UserSchema.plugin(passportLocalMongoose);

module.exports =mongoose.model('User',UserSchema);
