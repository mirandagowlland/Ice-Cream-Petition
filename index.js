const express=require ('express');
const router=require('./routers/router');
//router= express.Router();
const app=express();
const hb=require('express-handlebars');
const cookieSession=require('cookie-session')
const spicedPg=require('spiced-pg');
const db=spicedPg(process.env.DATABASE_URL || 'postgres:postgres:postgres@localhost:5432/petition');
const bcrypt=require('bcryptjs');
const csrf=require('csurf');
const bodyParser=require('body-parser');

// const functions=require('./functions');
//console.log (functions);

app.use(cookieSession({
    secret:'Oranges are orange in colour',
    maxAge:1000*60*60
}));

app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({
    extended: false
}));

app.use(csrf());
app.use(router);

app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

//connect canvas
app.get('/canvas.js', function(req,res){
    res.sendFile(__dirname + '/canvas.js')
});

//serve static files
app.use('/public', express.static(__dirname + '/public'));

//where to send user on arrival
app.use((req,res,next) => {
    if (!req.session.user) {
        if(req.url !='/register' && req.url != '/login') {
            res.redirect('/register');
        } else {
            next();
        }
    } else {
        if (req.url == '/register' || req.url == '/login') {
            res.redirect('/petition');
        } else {
            next();
        }
    }
});

app.listen(process.env.PORT || 8080, () => console.log ('listening'));
