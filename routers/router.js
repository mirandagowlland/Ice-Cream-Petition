const express=require ('express');
router= express.Router();
const functions=require('../functions');
//const csrf=require('csurf');
//const app=express();

//app.use(csrf());


//registration page
router.route ('/register')

    .get((req,res) => {
        res.render('register', {
            layout:'main',
            heading:'Some text about the petition and its name to go here',
            legend: 'Register your interest here',
            csrfToken:req.csrfToken()
        });
        console.log('csrf token', req.csrfToken());
    })


    .post((req,res) => {
        functions.hashPassword(req.body.password)
        .then(function(hash){
            return functions.addUser(req.body, hash)
            .then(function(result) {
                console.log('logging result', result.rows);
                req.session.user = {
                    id:result.rows[0].id,
                    firstname:req.body.firstname,
                    lastname:req.body.surname,
                    email:req.body.email
                }
                console.log('session user', req.session.user);
            })
        })
        .then(function(){
            res.redirect('/profile');
        }).catch(function(err){
            if (err.code==23505) {
                res.render('register', {
                    layout:'main',
                    message: 'That email is already registered. Please log in.',
                    csrfToken:req.csrfToken()
                });
            } else {
                console.log(err);
                res.render('register', {
                    layout:'main',
                    message: 'Oops! Something went wrong. Please try again.',
                    csrfToken:req.csrfToken()
                });
            }
        })
    })

//login page
router.route ('/login')

    .get((req,res) => {
        res.render('login', {
            layout:'main',
            heading:'Some text about the petition and its name to go here',
            legend: 'Log in here',
            csrfToken:req.csrfToken()
        });
    })

    .post((req,res) =>  {
        functions.checkUser(req.body.email, req.body.password)
        .then(function(userInfo){
            //console.log('app.post userInfo', userInfo);
            if(!userInfo) {
                console.log('no match');
                res.redirect('/register');
            } else {
                req.session.user = {
                    id: userInfo.id,
                    firstname: userInfo.firstname,
                    lastname: userInfo.lastname,
                    email: userInfo.email
                }
            }
        })
        .then(function(){
            res.redirect('/petition');
        }).catch(function(err){
            // if(!userInfo) {
            console.log('no match');
            res.render('login', {
                layout:'main',
                message: 'PASSWORD INCORRECT',
                csrfToken:req.csrfToken()
            });
            // }
            console.log(err);
        })
    });

//direct to profile page after registration
router.route ('/profile')

    .get ((req,res) =>  {
        res.render('profile', {
            layout:'main',
            csrfToken:req.csrfToken()
        });
    })

    .post ((req,res) =>  {
        //console.log(req.session.user);
        if (!req.body.age && !req.body.city && !req.body.homepage) {
            res.redirect('/petition');
        }
        else {
            var query = 'INSERT INTO profiles(age, city, homepage, user_id) VALUES($1, $2, $3, $4) RETURNING id';
            var params = [req.body.age, req.body.city, req.body.homepage, req.session.user.id];
            db.query(query, params)
            .then(function(){
                //req.session.user.age=req.body.age;
                //req.session.user.city=req.body.city;
                //req.session.user.homepage=req.body.homepage;
                res.redirect('/petition');
            }).catch(function(err){
                console.log(err);
            })
        }
    })

router.route ('/profile/edit')

    .get ((req,res) =>  {
        console.log('log user info and req body', req.session.user, req.body);
        // console.log('here is the session user info', req.session.user);
        // console.log('here is the req body info', req.body);

        functions.getUserInfo(req.session.user.id)
        .then (function(profileInfo) {
            res.render('editprofile', {
                layout:'main',
                csrfToken:req.csrfToken(),
                firstname:req.session.user.firstname,
                lastname:req.session.user.lastname,
                email:req.session.user.email,
                age:profileInfo.age,
                city:profileInfo.city,
                homepage:profileInfo.homepage
            });
        }).catch(function(err) {
            console.log('err from profile get', err);
        })
    })

    .post((req,res) =>  {
        console.log('log req body before update', req.body);
        if (!req.body.age.length) {
            req.body.age=null;
        };
        var queryProfile = 'UPDATE profiles SET age=$1, city=$2, homepage=$3 WHERE user_id=$4';
        var paramsProfile = [req.body.age, req.body.city,req.body.homepage,req.session.user.id];
        var queryUser = 'UPDATE users SET firstname=$1, lastname=$2, email=$3 WHERE id=$4';
        var paramsUser = [req.body.firstname, req.body.surname, req.body.email,req.session.user.id];

        db.query(queryProfile, paramsProfile)
        .then(function(){
            db.query(queryUser, paramsUser)})
            .then(function (){
                if (res.cookie) {
                    res.redirect('/signed')
                } else {
                res.redirect('/petition')
                }
            }).catch(function(err){
                console.log(err)
            })
    })

//delete signature
router.route ('/delete')

    .get((req,res) =>  {
        functions.deleteSignature(req.session.user.id)
        .then (function(){
            res.redirect('/petition');
            }).catch(function(err){
                console.log(err);
            })
    })

//petition signing page
router.route ('/petition')

    .get((req,res) =>  {
        if (req.session.id) {
            res.redirect('/signed');
        }
        else {
            res.render('input', {
                layout:'main',
                csrfToken:req.csrfToken()
            });
        }
    })

//post signature details to database
    .post((req,res) =>  {
        console.log(req.body.signature);
        if (req.body.signature) {
            res.cookie('petition', 'signed');
            functions.addSignature(req.body, req.session.user.id)
            .then(function(result){
                res.redirect('/signed');
            }).catch(function(err){
                if (!req.body.signature) {
                    res.render('input', {
                        layout:'main',
                        message:'Please add your signature!',
                        csrfToken:req.csrfToken()
                    })
                } else {
                    console.log(err);
                }
            })
        }
    })

//thank you/signed page
router.route ('/signed')

    .get((req,res) =>  {
        functions.displaySignature(req.session.user.id)
        .then(function(result){
            res.render('signed', {
                layout:'main',
                sigCount:req.session.user.id,
                canvasSig:result.rows[0].signature,
                csrfToken:req.csrfToken()
            });
        }).catch(function(err){
            console.log(err);
        });
    });

//view signature list
router.route ('/signatures')

    .get((req,res) =>  {
        return functions.showSigners()
        .then(function(signatures){
            res.render('signatures', {
                layout:'main',
                sigList:signatures.rows,
                csrfToken:req.csrfToken()
            });
        }).catch(function(err){
            console.log(err);
        });
    });


module.exports = router;
