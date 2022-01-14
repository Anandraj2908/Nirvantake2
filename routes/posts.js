const express = require('express');
const {cloudinary}=require('../cloudinary');
const wrapAsync = require('../utilities/wrapAsync');
const ExpressError = require('../utilities/ExpressErrors');
const Post = require('../models/post');
const router = express.Router();
const {isLoggedIn,isAuthor,validateBlog}=require('../middleware');
const multer=require('multer');
const {storage}=require('../cloudinary');
const upload=multer({storage});


//Main menu
router.get('/',wrapAsync( async (req,res) => {
    const posts =await Post.find({}).populate('author');
    res.render('Blogs/index', {posts}) ;
}));

//Create
router.get('/new',isLoggedIn,(req,res) => {
    res.render('Blogs/new');
}) 
router.post('/',/* isLoggedIn, */upload.array('image'),validateBlog ,wrapAsync( async (req,res) =>{
    if(!req.body.posts){
         throw new ExpressError('Bad Request',400);
    };
    const posts = await Post(req.body.posts);
    console.log(req.body);
    posts.image=req.files.map(f =>({url:f.path,filename:f.filename}));
    posts.author=req.user._id;
    await posts.save();
    console.log(posts)
    req.flash('success', 'Uploaded Successfully!');
    res.redirect(`/main/${posts._id}`)
}))


//Show page
router.get('/:id',wrapAsync( async (req,res) => {
    const posts =await Post.find({});
    const post = await Post.findById(req.params.id).populate({
        path:'comments',
        populate:{
            path:'author'
    }}
    ).populate('author');
    if(!post){
        req.flash('error','Cannot find that Post, that might be deleted by the Author');
        return res.redirect('/main');
    }
    Array.prototype.next = function() {
        return this[++this.current];
    };
    Array.prototype.prev = function() {
        return this[--this.current];
    };
    Array.prototype.current = 0;
    let count=1;
    for(let i=0;i<posts.length-2;i++)
    { 
        if(posts[i]._id.equals( post._id)){
            break;
        }
        else{
            posts.next();
            count++;
        }  
    }
    
    var nextid=posts.next()._id;
    
    if(posts[0]._id.equals(post._id)){
        var previd=post._id;
    }
    else if(posts[posts.length-1]._id.equals(post._id)){
        previd=posts.prev()._id;
    }
    else{
        posts.prev();
        previd=posts.prev()._id;
    }
    
    
    res.render('Blogs/show',{nextid,previd,posts,post});
}));

//Edit
router.get('/:id/edit',isLoggedIn,isAuthor,wrapAsync( async (req,res) => {
    const { id } = req.params;
    const posts = await Post.findById(id);
    if(!posts){
        req.flash('error','Cannot find that campground!');
        return res.redirect('/main');
    }
    
    res.render('Blogs/edit',{posts});
}))
router.put('/:id',isLoggedIn,isAuthor,upload.array('image'),validateBlog ,wrapAsync( async (req,res) => {
    const {id} = req.params;
    console.log(req.body)
    const posts = await Post.findByIdAndUpdate(id,{...req.body.posts});
    const img=req.files.map(f =>({url:f.path,filename:f.filename}));
    posts.image.push(...img);
    await posts.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await posts.updateOne({ $pull: { image: { filename: { $in: req.body.deleteImages } } } })
    };
    
    req.flash('success', 'Updated Post!')
    res.redirect(`/main/${posts._id}`);
}))


//Delete
router.delete('/:id',isLoggedIn,isAuthor,wrapAsync( async (req,res) => {
    const {id} = req.params;
    await Post.findByIdAndDelete(id);
    req.flash('success', 'Deleted Post')
    res.redirect('/main');
}))



module.exports =router;
