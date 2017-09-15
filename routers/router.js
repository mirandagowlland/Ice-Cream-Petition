const express=require ('express');
router= express.Router();
const functions=require('../functions');
const spicedPg=require('spiced-pg');
const db=spicedPg(process.env.DATABASE_URL || 'postgres:postgres:postgres@localhost:5432/petition');
//const csrf=require('csurf');
//const app=express();

//app.use(csrf());

//registration page
router.route ('/register')

    .get((req,res) => {
        res.render('register', {
            layout:'main',
            heading:'We care about access to ice cream in all its forms. So should you. Join our campaign to make ice cream free for all.',
            legend: 'Register your passion for ice cream here',
            csrfToken:req.csrfToken()
        });
        // console.log('csrf token', req.csrfToken());
    })


    .post((req,res) => {
        functions.hashPassword(req.body.password)
        .then(function(hash){
            return functions.addUser(req.body, hash)
            .then(function(result) {
                req.session.user = {
                    id:result.rows[0].id,
                    firstname:req.body.firstname,
                    lastname:req.body.surname,
                    email:req.body.email,
                }
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
            heading:'We care about access to ice cream in all its forms. So should you. Join our campaign to make ice cream free for all.',
            csrfToken:req.csrfToken()
        });
    })

    .post((req,res) =>  {
        functions.checkUser(req.body.email, req.body.password)
        .then(function(userInfo){
            if(!userInfo) {
                console.log('no match');
                res.redirect('/register');
            } else {
                req.session.user = {
                    id: userInfo.id,
                    firstname: userInfo.firstname,
                    lastname: userInfo.lastname,
                    email: userInfo.email,
                };
                if (userInfo.signature) {
                    req.session.user.signature = userInfo.id;
                }
            }
        })
        .then(function(){
            res.redirect('/petition');
        }).catch(function(err){
            res.render('login', {
                layout:'main',
                message: 'Login not recognised!',
                csrfToken:req.csrfToken()
            });
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
        if (!req.body.age && !req.body.city && !req.body.homepage) {
            res.redirect('/petition');
        }
        else {
            functions.setProfile(req.body, req.session.user.id)
            .then(function(){
                res.redirect('/petition');
            }).catch(function(err){
                console.log('err with post', err);
            })
        }
    })


router.route ('/profile/edit')

    .get ((req,res) =>  {
        functions.getUserInfo(req.session.user.id)
        .then (function(profileInfo) {
            res.render('editprofile', {
                layout:'main',
                csrfToken:req.csrfToken(),
                firstname:req.session.user.firstname,
                lastname:req.session.user.lastname,
                email:req.session.user.email,
                city:profileInfo.city,
                age:profileInfo.age,
                homepage:profileInfo.homepage,
                profileInfo:profileInfo
            });
        }).catch(function(err) {
            console.log('err from profile get', err);
        })
    })

    .post((req,res) =>  {
        if (!req.body.age.length) {
            req.body.age=null;
        };
        functions.updateProfile(req.body, req.session.user.id)
        if (res.cookie) {
            res.redirect('/signed')
        } else {
            res.redirect('/petition')
        }
    })

//delete signature
router.route ('/delete')

    .get((req,res) =>  {
        functions.deleteSignature(req.session.user.id)
        .then (function(){
            req.session.user.signature=null;
            res.cookie=null;
            res.redirect('/petition');
            }).catch(function(err){
                console.log('delete sig err', err);
            })
    })

//petition signing page
router.route ('/petition')

    .get((req,res) =>  {
        if (req.session.user.signature) {
            res.redirect('/signed');
        }
        else {
            console.log('get /petition log', req.session.user.signature);
            res.render('input', {
                layout:'main',
                heading:'A world with free ice cream is within our grasp. Give us your support today to make it a reality.',
                firstname:req.session.user.firstname,
                lastname:req.session.user.lastname,
                csrfToken:req.csrfToken()
            });
        }
    })

//post signature details to database
    .post((req,res) =>  {
        //console.log(req.body.signature);
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
                    console.log('err in posting petition sig', err);
                }
            })
        }
    })

//thank you/signed page
router.route ('/signed')

    .get((req,res) =>  {
        if (!res.cookie) {
            res.redirect('/petition');
        }
        functions.displaySignature(req.session.user.id)
        .then(function(result){
            console.log('pre countSigners result', req.session.user.signature);
            var signature=result.rows[0].signature
            functions.countSigners()
            .then(function(count){
            res.render('signed', {
                layout:'main',
                heading:"You've bought us one step closer to free ice cream. Your belly thanks you.",
                aside:'(though your doctor may not.)',
                sigCount:count.rows[0].count,
                canvasSig:result.rows[0].signature,
                csrfToken:req.csrfToken()
            });
            }).catch(function(err){
                console.log('there was an err with the get', err);
            });
        }).catch(function(err){
            console.log('err in getting signed', err);
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
    })

router.route ('/signatures/:city')

    .get((req,res) => {
        return functions.getSignersByCity(req.params.city)
        .then(function(signatures){
            res.render('signaturesbycity', {
                layout:'main',
                sigListCity:signatures.rows,
                city:signatures.rows[0].city
            });
        }).catch(function(err){
            console.log('err in city sigs', err);
        });
    });

router.route ('/logout')

    .get((req, res) => {
            req.session = null;
            res.redirect('/login');
    })



module.exports = router;
