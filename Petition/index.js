const express = require ('express');
var app = express();
var hb = require('express-handlebars');
//const canvas = require('./canvas.js');
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');
app.use(require('body-parser').urlencoded({
    extended: false
}));
app.use(require('cookie-parser')());

app.get('/canvas.js', function(req,res){
    res.sendFile(__dirname + '/canvas.js')
});


app.use('/public', express.static(__dirname + '/public/'));

app.get('/petition', function(req,res){
    // if (req.cookies.petition) {
    //res.redirect('/signed');
    // }
    // else {
    res.render('input', {
        layout:'main',
    });
    // }
});

app.post('/petition', function(req,res){
    //if (form complete) {
    res.cookie('petition', 'signed');
    res.redirect('/signed');

    console.log(req.body.firstname, req.body.surname);


    //}
    //else {
        //res.render('input', {
        //layout:'main',
        //message:'Please complete all fields'
    //});
    //}
});




app.get('/signed', function(req,res){
    res.render('signed', {
        layout:'main',
    });
    console.log('log something');
    //console.log(res);
});

app.get('/signatures', function(req,res){
    res.render('signatures', {
        layout:'main',
    });
});



app.listen(8080, () => console.log ('Listening on 8080'));
