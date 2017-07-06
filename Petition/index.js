const express = require ('express');
var app = express();
var hb = require('express-handlebars');
var cookieSession = require('cookie-session')

const spicedPg=require('spiced-pg');
const db = spicedPg('postgres:postgres:postgres@localhost:5432/petition');
//const results = [];
//const data = [] ;

app.use(cookieSession({
    secret:'Oranges are orange in colour',
    maxAge:1000*60*2
}));

app.engine('handlebars', hb());
app.set('view engine', 'handlebars');
app.use(require('body-parser').urlencoded({
    extended: false
}));
app.use(require('cookie-parser')());

//connect canvas
app.get('/canvas.js', function(req,res){
    res.sendFile(__dirname + '/canvas.js')
});

//serve static files
app.use('/public', express.static(__dirname + '/public/'));


//entry page for petition & checking cookies
app.get('/petition', function(req,res){
    if (req.session.id) {
        res.redirect('/signed');
        console.log('already signed sucka');
        }
    else {
        res.render('input', {
            layout:'main',
        });
    }
});

//post signature details to database
app.post('/petition', function(req,res){
    //if (form complete) {
    res.cookie('petition', 'signed');
    db.query('INSERT INTO signatures(firstname, lastname, signature) VALUES($1, $2, $3) RETURNING id',[req.body.firstname, req.body.surname, req.body.signature]).then(function(result){
        req.session.id = result.rows[0].id;
        console.log(req.session.id);
        //console.log(result.rows);
        res.redirect('/signed');
    }).catch(function(err){
        console.log(err);
    });


    //}
    //else {
        //res.render('input', {
        //layout:'main',
        //message:'Please complete all fields'
    //});
    //}
});



//thank you/signed page
app.get('/signed', function(req,res){
    db.query('SELECT signature FROM signatures WHERE id=' + req.session.id).then(function(result){
        //console.log(req.body.signature);
        res.render('signed', {
            layout:'main',
            canvasSig:result.rows[0].signature,
        });
    }).catch(function(err){
        console.log(err);
    });
});

//view signature list
app.get('/signatures', function(req,res){
    db.query('SELECT firstname, lastname FROM signatures').then(function(result){
        res.render('signatures', {
            layout:'main',
            sigList:result.rows,
        });
        //console.log(result.rows);
    }).catch(function(err){
        console.log(err);
    });

});



app.listen(8080, () => console.log ('Listening on 8080'));
