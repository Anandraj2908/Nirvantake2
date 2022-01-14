if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}
const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utilities/ExpressErrors');
const methodOverride = require('method-override');
const postsRoutes=require('./routes/posts');
const commentsRoutes=require('./routes/comments');
const usersRoutes=require('./routes/users');
const session = require('express-session');
const flash=require('connect-flash');
const passport=require('passport');
const LocalStrategy =require('passport-local');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy=require('passport-facebook').Strategy;
const User=require('./models/user');
const Post = require('./models/post');
const wrapAsync = require('./utilities/wrapAsync');
const mongoSanatize=require('express-mongo-sanitize');
const dbUrl= 'mongodb://localhost:27017/take3';


mongoose.connect(dbUrl,{
    useNewUrlParser:true,
    useUnifiedTopology:true
});

const db = mongoose.connection;
db.on("error",console.error.bind(console,"connection error:"));
db.once("open", () => {
    console.log("Database connected");
});


app.engine('ejs',ejsMate);
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))
app.use(mongoSanatize());

const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}


app.use(session(sessionConfig));
app.use(flash());




passport.use(
    new FacebookStrategy({
        clientID:process.env.fclientID,
        clientSecret:process.env.fclientSecret,
        callbackURL:'/auth/facebook/redirect',
        profileFields:['id','displayName','picture.type(large)']
    },
    function(accessToken,refreshToken,profile,done) {
        console.log(accessToken,refreshToken,profile);
        User.findOne({googleId: profile.id}).then((currentUser) => {
            if(currentUser){
                // already have this user
                console.log('user is: ', currentUser);
                done(null, currentUser);
            } else {
                // if not, create user in our db
                new User({
                    facebookId: profile.id,
                    username: profile.displayName,
                    thumbnail: profile.photos[0].value
                }).save().then((newUser) => {
                    console.log('created new user: ', newUser);
                    done(null, newUser);
                });
            }
        });
    }));

passport.use(
    new GoogleStrategy({
        // options for google strategy
        clientID:process.env.gclientID,
        clientSecret:process.env.gclientSecret,
        callbackURL: '/auth/google/redirect'
    }, (accessToken, refreshToken, profile, done) => {
        // check if user already exists in our own db
        User.findOne({googleId: profile.id}).then((currentUser) => {
            if(currentUser){
                // already have this user
                console.log('user is: ', currentUser);
                done(null, currentUser);
            } else {
                // if not, create user in our db
                new User({
                    googleId: profile.id,
                    username: profile.displayName,
                    thumbnail: profile._json.picture
                }).save().then((newUser) => {
                    console.log('created new user: ', newUser);
                    done(null, newUser);
                });
            }
        });
    })
);

// initialize passport
app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
        done(null, user);
    });

});
passport.use(new LocalStrategy(User.authenticate()));

app.use((req, res, next) => {
    res.locals.currentUser=req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

//routes for users
app.use('/',usersRoutes);

//routes for /main/
app.use('/main',postsRoutes);

//routes for comments
app.use('/main/:id/comments',commentsRoutes);

//profile page
app.get('/profile/:id',wrapAsync(async(req,res) =>{
    const user = await User.findById(req.params.id);
    const posts= await Post.find({author:user._id});
    //const posts = await Post.find({author._id:'user._id'});
    console.log(posts)
    res.render('users/profile',{user,posts});
}));

//Curiosity
app.get('/curiosity',(req,res) =>{
    res.render('curiosity');
})


//home page
app.get('/',(req,res) => {
    res.render('home')
});


//if the request dosen't match the above routes
app.all('*',(req,res,next) =>{
   next(new ExpressError('Page Not Found', 404))
})


app.use((err,req,res,next) => {
    const {statusCode =500}=err;
    if(!err.message) err.message='Internal Server Error'
    res.status(statusCode).render('errors',{err});
    
})

//connected to localhost
app.listen(6478,()=> {
    console.log("Connected on PORT 6478")
})
