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
        console.log('register page');
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
                    signed:undefined
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
                message: 'Login not recognised!',
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
        //console.log('log user info and req body', req.session.user, req.body);
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
        //console.log(profileInfo);
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
            res.redirect('/petition');
            }).catch(function(err){
                console.log(err);
            })
    })

//petition signing page
router.route ('/petition')

    .get((req,res) =>  {
        console.log(req.session.user);
        if (req.session.user.signed==true) {
            res.redirect('/signed');
        }
        else {
            console.log('get', req.session.user.signed);
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
            req.session.user.signed=true;
            console.log('post full req session', req.session.user);
            console.log('post', req.session.user.signed);
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
        //console.log('1', result.rows[0].signature);
        functions.displaySignature(req.session.user.id)
        .then(function(result){
            console.log('pre countSigners result', result.rows[0].signature);
            var signature=result.rows[0].signature
            functions.countSigners()
            .then(function(count){
                 console.log('this is the restul', count);
                 console.log('sig count', result.rows[0].count);
            res.render('signed', {
                layout:'main',
                heading:"You've bought us one step closer to free ice cream. Your belly thanks you.",
                aside:'(though your doctor may not.)',
                sigCount:count.rows[0].count,
                canvasSig:result.rows[0].signature,
                csrfToken:req.csrfToken()
            })
        }).catch(function(err){
             console.log('there was an err with the get', err);
         });
    })
        // .then(function(result){
        //     res.render('signed', {
        //         layout:'main',
        //         heading:"You've bought us one step closer to free ice cream. Your belly thanks you.",
        //         sigCount:req.session.user.id,
        //         canvasSig:result.rows[0].signature,
        //         csrfToken:req.csrfToken()
        //     });
        // }).catch(function(err){
        //     console.log(err);
        // });
    })


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
        console.log('selected city', req.params)
        return functions.getSignersByCity(req.params.city)
        .then(function(signatures){
            console.log('these are the sigs', signatures.rows)
            res.render('signaturesbycity', {
                layout:'main',
                sigListCity:signatures.rows,
                city:signatures.rows[0].city
            });
        })
    })

router.route ('/logout')

    .get((req, res) => {
            req.session = null;
            res.redirect('/login');
    })



module.exports = router;
