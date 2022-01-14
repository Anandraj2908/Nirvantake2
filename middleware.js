const {blogSchema,commentSchema} = require('./schemas');
const ExpressError = require('./utilities/ExpressErrors');
const Post = require('./models/post');

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

//validating blog through Joi
module.exports.validateBlog = (req,res,next) => {
    const {error} = blogSchema.validate(req.body);
    if(error){
        const msg =error.details.map(el => el.message).join(',')
        throw new ExpressError(msg,400)
    }
    else{
        next();
    }
}


//checking if the the request is made by the author of that post
module.exports.isAuthor=async(req,res,next)=>{
    const { id } = req.params;
    const posts = await Post.findById(id);
    if(!posts.author.equals(req.user._id)){
        req.flash('error','You do not have permission to do that!');
        return res.redirect(`/main/${posts._id}`);
    };
    next();
}

//validating comment through Joi
module.exports.validateComment = (req, res, next) => {
    const { error } = commentSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}
