/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { constants } = require('../../config/constants');

module.exports = {
  
    // user signup 
    userSignup: async function(req, res){

        try{
        
        // getting the data from req.body
        const {email, password, name, profilePic} = req.body;
  
        console.log('user details', req.body);

        // checking email is already exists or not
        let emailExist = await User.find({email})
        if(emailExist.length > 0){
            return res.status(500).json({
                status: 500,
                message: 'Email already exists'
            })
        }

        // checking user name is already exists or not
        let nameExist = await User.find({name})
        if(nameExist.length > 0){
            return res.status(500).json({
                status: 500,
                message: 'User Name already exists'
            })
        }

        // uploading the user's profile pic to path 
        req.file('profilePic').upload({
            dirname: sails.config.appPath+ '/assets/images/profilePic/'
            
        }, function (err, filesUploaded) {
            if (err) {
                return err
            };

            console.log(filesUploaded.length + ' file(s) uploaded successfully!');
            console.log(filesUploaded);
        
        // creating user 
        User.create({
            email: req.body.email,
            password: req.body.password,
            name: req.body.name,
            profilePic: filesUploaded[0].fd
        }).fetch().then(result =>{
            console.log('result', result);
            const token = jwt.sign({
                userId: result.id
            },
            process.env.JWT_TOKEN
            );
            res.cookie("access_token", token, { // cookie used for signup and logout
                httpOnly: true,
                
            }),
            console.log('token',token);
            // not showing the user's password
            const { password, ...result1} = result;
            return res.status(200).json({
                status: 200,
                data: result1,
                message: "User Signup Successfully"
            })
        })
        });
    }catch(err){
        return res.status(400).json({
            err: err
        })
    }
    },

    // user login 
    userLogin: function(req, res){

        try{        
        // getting data from req.body
        const { email, password } = req.body;

        console.log('login data', req.body);

        // finding the user through email
        User.find({email}, function(err, user){
            console.log(user);

            // if user not exists
            if(user.length == 0){
                return res.status(403).json({
                    status: 403,
                    err: 'user not exists'
                })
            }
            // if having error 
            if(err){
                return res.status(500).json({
                    status: 500,
                    err: err
                })
            }
            // compare the encrypted password and entered password
            bcrypt.compare(password, user[0].password, async function(err, result) {
                console.log(req.body.password);
                console.log(user[0].password);
                // if result is true then user will successfully login
                if(result) {
                    console.log(result);
                    const token = jwt.sign({
                        userId: user[0].id
                    },
                    process.env.JWT_TOKEN
                    );
                    res.cookie("access_token", token, { // cookie for login and logout
                        httpOnly: true,
                        
                    })
                    let user1 = user.pop()
                    console.log('hfhfhfghg',user1);
                    // not showing the usr's password
                    const { password, ...result1} = user1;
                    return res.status(200).json({
                        status: 200,
                        data: result1,
                        message: 'User login successful'
                    })

                } else {
                    //password is not a match
                    return res.status(500).json({
                        status: 500,
                        err: 'password not match'
                    })
                    
                }
            })
        })
    }catch(err){
        return res.status(400).json({
            err: err
        })
    }
    },

    // user logout
    userLogout: function(req, res){
    
        // clear cookie for logout
         res.clearCookie('access_token');
         return res.status(200).json({
            status: 200,
            message: 'User logout successfully'
        })
        
    },

    // change password
    changePassword: async function(req, res){
        try{
        // getting user's id from middleware 
        let userId = req.userData.userId;
        console.log(userId);

        // getting updating password from req.body
        let password = req.body.password;
        console.log(password);

        // finding the user
        let user = await User.findOne({id: userId})
        console.log(user);

        // hashing the new password
        bcrypt.hash(password, 10, async function(err, hash) {

            if (err) return cb(err);
  
            console.log(hash);
            
            // updating the password
            var updateUser = await User.updateOne({ id : userId})
            .set({
                password: hash
            }).fetch();
            console.log(updateUser);
            
            // not showing the user's password
            const {password, ...result1} = updateUser;

            return res.status(200).json({
                status: 200,
                data: result1,
                message: 'Password Updated Successfully'
            });
  
        });
    }catch(err){
        return res.status(400).json({
            err:err
        })
    }

    },

    // updating user's profile
    updateProfile: async function(req, res){
        try{

        // getting user's id from middleware
        let userId = req.userData.userId;
        console.log(userId);

        // getting data from req.body
        const {email, profilePic, name} = req.body;
        console.log(req.body);

        // finding the user
        let user = await User.findOne({id: userId})
        console.log(user);

        // checking if already email exists
        let emailExist = await User.find({email})
        console.log(emailExist);
        if(emailExist.length > 1){
            return res.status(500).json({
                status: 500,
                message: 'Email already exists'
            })
        }

        // checking if already user name exists 
        let nameExist = await User.find({name})
        console.log(nameExist);
        if(nameExist.length > 1){
            return res.status(500).json({
                status: 500,
                message: 'User Name already exists'
            })
        }
        console.log(req.file('profilePic'));
        // uploading the updated one profile pic to path
        req.file('profilePic').upload({
            dirname: sails.config.appPath+ '/assets/images/profilePic/'
            
        }, async function (err, filesUploaded) {
            if (err) {
                console.log(err);
                return err
            };
            console.log(filesUploaded.length + ' file(s) uploaded successfully!');
            console.log(filesUploaded);

            // updating the user profile
            var updateUser = await User.updateOne({ id : userId})
            .set({
                email: email,
                name: name,
                profilePic: filesUploaded[0].fd
            }).fetch();
            console.log(updateUser);
            // not showing user's  password 
            const {password, ...result1} = updateUser
            return res.status(200).json({
                status: 200,
                data: result1,
                message: "Profile Updated Successfully"
            })
        })
    }catch(err){
        return res.status(400).json({
            err:err
        })
    }

    },

    // creating a post
    createPost: async function(req, res){
        try{

        // getting userId from middleware
        let userId = req.userData.userId;
        console.log(userId);

        // finding user
        let user = await User.findOne({id: userId})
        console.log(user);

        // getting posts details from req.body
        const {text, postImage, caption} = req.body;

        // uploading post image to path
        req.file('postImage').upload({
            dirname: sails.config.appPath+ '/assets/images/postImage/'
            
        }, function (err, filesUploaded) {
            if (err) {
                return err
            };
            console.log(filesUploaded.length + ' file(s) uploaded successfully!');
            console.log(filesUploaded);
    
            // creating the post
            Post.create({
                text: text,
                postImage: filesUploaded[0].fd,
                caption: caption,
                owner: userId
            }).fetch().then(async result =>{
                console.log('post created data',result);
                return res.status(200).json({
                    status: 200,
                    data: result,
                    message: 'Post created successfully'
                })
            })
        });
    }catch(err){
        return res.status(400).json({
            err:err
        })
    }

    },

    // list all the posts in paginations
    listPost: async function(req, res){
        try{

        // getting the limit & skip from query
        let skip = req.query.skip
        console.log(skip);
        let limit = req.query.limit
        console.log(limit);
        
        // getting posts of logged in users
        let userId = req.userData.userId;

        if(limit && skip){

            // list the post who currently logged in
            let posts = await User.findOne({where:{id : userId},  select: constants.GET_USER_FIELDS})
            .populate('posts', {sort: 'createdAt DESC', limit:limit, skip:limit*skip}).populate('likedPosts');
            console.log(posts.posts.length);
            // console.log(posts);
            return res.status(200).json({
                status: 200,
                data: posts,
                totalPosts : posts.posts.length,
                message: "All the Posts"
            })
        }

        if(limit == undefined || skip == undefined){
            limit = 10;
            skip = 0;
            // list the post who currently logged in
            let posts = await User.findOne({where:{id : userId},  select: constants.GET_USER_FIELDS})
            .populate('posts', {sort: 'createdAt DESC', limit:limit, skip:limit*skip}).populate('likedPosts');

            // console.log(posts);
            return res.status(200).json({
                status: 200,
                data: posts,
                totalPosts : posts.posts.length,
                message: "All the Posts"
            })
        }
    }catch(err){
        return res.status(400).json({
            err:err
        })
    }
    },

    // like posts
    likesPosts: async function(req, res){
        try{
        // current logged in user id
        let user1 = req.userData.userId; 
        console.log('user login id',user1);

        // finding the user
        let user = await User.findOne({id : user1})
        console.log(user);

        // post Id 
        let postId = req.query.id;
        console.log('post id',postId);
 
        // checking the condition if the post is already liked or not
        let getPosts = await Post.findOne({id: postId}).populate('likes', { select: ['id'] });
        let ids = getPosts.likes;
        console.log(getPosts);

        // if id is already present then post is already liked
        if(ids.length > 0){
            for(let i=0; i<ids.length; i++){
                let isLiked = ids.some((idObj) => {
                    return idObj.id === user1;
                })
                if(isLiked){
                    return res.json({
                        message: 'Already Liked the Post'
                    })
                }
            }
        }

        // else user liked the post
        // find the post details
        let post = await Post.findOne({id: postId});
        console.log(post);

        // adding the user id in post's likes
        let result = await Post.addToCollection(postId, 'likes')
        .members(user1);
        
        // populating the post's likes
        let post2 = await Post.find({id: postId}).populate('likes', { select: constants.GET_USER_FIELDS });
        console.log('hfhfghj',post2);

        return res.status(200).json({
            status: 200,
            data: post2,
            message: 'Post Liked'
        })
    }catch(err){
        return res.status(400).json({
            err:err
        })
    }
    },

    // disliked the post
    dislikesPosts: async function(req, res){
        try{
        // getting current logged in user id
        let user1 = req.userData.userId; 
        console.log('user login id',user1);

        // getting post id
        let postId = req.query.id;
        console.log('post id',postId);

        // getting the user
        let user = await User.findOne({id: user1})
        console.log(user);

        // checking if the post is already liked or not
        let getPosts = await Post.findOne({id: postId}).populate('likes', { select: ['id'] });
        let ids = getPosts.likes;
        console.log(getPosts);
        console.log(ids);

        // checking id is already present in post's likes
        if(ids.length > 0){
            let isLiked = ids.some((idObj) => {
                return idObj.id === user1;
            })

            // if is present then remove the id of user from post's likes
            if (isLiked) {
                await Post.removeFromCollection(postId, 'likes', user1)
                    let post2 = await Post.find({id: postId}).populate('likes', { select: constants.GET_USER_FIELDS });
                    console.log(post2);

                    await User.removeFromCollection(user1, 'likedPosts', postId)
                
                    return res.status(200).json({
                        status: 200,
                        data: post2,
                        message: 'Post Liked'
                    })
            } else{
                    return res.json({
                        message: 'You have not Liked the Post'
                    })
                }
        }else{
            return res.json({
                message: 'You have not Liked the Post'
            })
        }
    }catch(err){
        return res.status(400).json({
            err:err
        })
    }

    },

    // add comments to posts
    addComments: async function(req, res){
        try{

        // getting current logged in user id
        let user1 = req.userData.userId; 
        console.log('user login id',user1);

        // getting post id
        let postId = req.query.id;
        console.log('post id',postId);

        // getting user
        let user = await User.findOne({id: user1})
        console.log(user);

        // getting comment to add from user
        let comments = req.query.comments;
        console.log(comments);

        // creating the comment & connect it with post id and user id
        Comments.create({
            message: comments,
            user: user1,
            post: postId
        }).fetch().then(async (result) => {
            console.log('result',result);

            // printing the comments
            let comments = await Comments.find().populate('post').populate('user');

            // not showing the password of user
            comments.map((comment) => {
                if (Object.keys(comment.user).length) {
                    let {password, ...user} = comment.user;
                    comment.user = user;
                }
            })


            console.log(comments);

            return res.status(200).json({
                status: 200,
                data: comments,
                message: 'Comment Added'
            })
        })
    }catch(err){
        return res.status(400).json({
            err:err
        })
    }

    },

    // view other user's profile
    viewUserProfile: async function(req, res){
        try{

        // current logged in user
        let user1 = req.userData.userId;
        console.log('user1 Id',user1);

        // other user's ID whom profile to be see by user1
        let user2 = req.query.userId;
        console.log('user2', user2);

        // showing the user2 profile
        let userDetails = await User.findOne({ where: {id: user2},  select: constants.GET_USER_FIELDS }).populate('posts').populate('comments').populate('followers', { select: constants.GET_USER_FIELDS }).populate('following', { select: constants.GET_USER_FIELDS }).populate('likedPosts');

        console.log('Details',userDetails);

        return res.status(200).json({
            status: 200,
            data: userDetails,
            message: "All the Detail of user"
        })
    }catch(err){
        return res.status(400).json({
            err:err
        })
    }
    },

    // add the followers
    addFollowers: async function(req, res){
        try{

        // current logged in user
        let user1 = req.userData.userId;
        console.log('user1 Id',user1);

        // other user's ID whom profile to be follow by user1
        let user2 = req.query.userId;
        console.log('user2', user2);

        // checking the condition if already like the user or not
        let followersCheck = await User.findOne({ where: {id: user1},  select: constants.GET_USER_FIELDS }).populate('following', { select: ['id'] })
        let ids = followersCheck.following;
        console.log(followersCheck);
        console.log(ids);

        if(ids.length > 0){
            for(let i=0; i<ids.length; i++){
                if(user2 == ids[i].id){
                    return res.json({
                        message: 'Already Follow the User'
                    })
                }
            }
        }

        // if not follow the user then follow - add the user id
        await User.addToCollection(user2, 'followers', user1)

        let followers = await User.findOne({ where: {id: user1},  select: constants.GET_USER_FIELDS }).populate('following', { select: constants.GET_USER_FIELDS })

        return res.status(200).json({
            status: 200,
            data: followers,
            message: 'following of users'
        })
    }catch(err){
        return res.status(400).json({
            err:err
        })
    }
    },

    // remove from followers
    removefollowers: async function(req, res){
        try{

        // current logged in user
        let user1 = req.userData.userId;
        console.log('user1 Id',user1);

        // other user's ID whom profile to be see by user1
        let user2 = req.query.userId;
        console.log('user2', user2);

        // checking the condition that already following the user or not
        let followersCheck = await User.findOne({ where: {id: user1},  select: constants.GET_USER_FIELDS }).populate('following', { select: ['id'] })
        let ids = followersCheck.following;
        console.log(followersCheck);
        console.log(ids);
      
        // if true then remove the user id or unfollow the user
        if(ids.length > 0){
            for(let i=0; i<ids.length; i++){
                // console.log('kghjh', user2 == ids[0].id);
                if(user2 == ids[i].id){
                    await User.removeFromCollection(user2, 'followers',user1)
                    
                    let followers = await User.findOne({ where: {id: user1},  select: constants.GET_USER_FIELDS }).populate('following', { select: constants.GET_USER_FIELDS })
                    await User.removeFromCollection(user1, 'following',user2)

                    return res.status(200).json({
                        status: 200,
                        data: followers,
                        message: 'following of users'
                    })
                }else{
                    return res.json({
                        message: 'Not Following the User'
                    })
                }
            }
        }
    }catch(err){
        return res.status(400).json({
            err:err
        })
    }

    },

    // view all followers
    viewAllfollowers: async function(req, res){
        try{

        // current logged in user id
        let user1 = req.userData.userId;
        console.log('user1 Id',user1);

        let followers = await User.findOne({ where: {id: user1},  select: constants.GET_USER_FIELDS }).populate('followers', { select: constants.GET_USER_FIELDS })

        return res.status(200).json({
            status: 200,
            data: followers,
            message: 'followers of users'
        })
    }catch(err){
        return res.status(400).json({
            err:err
        })
    }
    },

    // view all following
    viewAllFollowing: async function(req, res){
        try{

        // current logged in user
        let user1 = req.userData.userId;
        console.log('user1 Id',user1);

        let follwing = await User.findOne({ where: {id: user1},  select: constants.GET_USER_FIELDS }).populate('following', { select: constants.GET_USER_FIELDS })

        return res.status(200).json({
            status: 200,
            data: follwing,
            message: 'following of users'
        })
    }catch(err){
        return res.status(400).json({
            err:err
        })
    }

    },

};

