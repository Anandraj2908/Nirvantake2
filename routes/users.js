const express =require('express');
const router=express.Router();
const User=require('../models/user');
const passport=require('passport');
const {cloudinary}=require('../cloudinary');
const wrapAsync = require('../utilities/wrapAsync');
const session = require('express-session');
const multer=require('multer');
const {storage}=require('../cloudinary');
const upload=multer({storage});

router.get('/register',(req,res) =>{
    res.render('users/register');
});
router.post('/register',upload.single('thumbnail'),wrapAsync(async(req,res)=>{
    try{
    const{password}=req.body;
    const user = new User({
        username:req.body.username,
        thumbnail:req.file.path
    });
    const registeredUser=await User.register(user,password);
    req.login(registeredUser,err =>{
        if(err) return next(err);
        req.flash('success','Welcome to Nirvan');
        res.redirect('/main');
    })
    }catch(e){
        req.flash('error',e.message);
        res.redirect('register');
    }
}));


router.get('/login',(req,res)=>{
    res.render('users/login');
})

router.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', 'welcome back!');
    /* const redirectUrl = req.session.returnTo || '/main';
    delete req.session.returnTo; */
    res.redirect('/main');
})


//auth with facebook
router.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['profile']
}));

router.get('/auth/facebook/redirect', passport.authenticate('facebook',{ failureFlash: true, failureRedirect: '/login' }), (req, res) => {
     //res.send(req.user);
     req.flash('success','Welcome');
    res.redirect('/main');
});

// auth with google+
router.get('/auth/google', passport.authenticate('google', {
    scope:['profile']
}));


// callback route for google to redirect to
// hand control to passport to use code to grab profile info
router.get('/auth/google/redirect', passport.authenticate('google',{ failureFlash: true, failureRedirect: '/login' }), (req, res) => {
     //res.send(req.user);
     req.flash('success','Welcome');
    res.redirect('/main');
});

//logout
router.get('/logout',(req,res) =>{
    req.logout();
    req.flash('success',"Goodbye!");
    res.redirect('/main');
})


module.exports=router;
