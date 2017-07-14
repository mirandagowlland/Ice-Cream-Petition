const spicedPg=require('spiced-pg');
const bcrypt = require('bcryptjs');
const db = spicedPg('postgres:postgres:postgres@localhost:5432/petition');


//hash user password
function hashPassword (password) {
    return new Promise (function(resolve,reject){
        bcrypt.hash(password, 10, function(err, hash) {
            if (err) {
                console.log(err);
                reject();
            } else {
                resolve(hash);
                console.log(hash);
            };
        });
    }).catch(function(err){
        console.log(err);
    });
}

//add user to database
function addUser(info, hash) {
        return db.query('INSERT INTO users(firstname, lastname, email, password) VALUES($1, $2, $3, $4) RETURNING id',[info.firstname, info.surname, info.email, hash])
}

//check user
function checkUser(email, enteredPassword) {
    console.log('checkUser email and entered password', email, enteredPassword);
    return db.query("SELECT id, firstname, lastname, email, password FROM users WHERE email=$1",[email])
    .then(function(userInfo){
        userInfo=userInfo.rows[0];
        return new Promise (function(resolve,reject){
            bcrypt.compare(enteredPassword, userInfo.password, function(err,doesMatch) {
                console.log('entered password', enteredPassword);
                console.log('userInfo password', userInfo.password);
                console.log('password doesMatch', doesMatch);
                //resolve(userInfo);
                if (doesMatch==false) {
                    reject(console.log('reject error'));
                } else {
                    resolve(userInfo);
                }
                // if (err) {
                //     console.log('some err');
                //     if(!doesMatch) {
                //         console.log('no MATCH')
                //     reject();
                // }
                // }
            })
        })
    // }).catch(function(err){
    //     console.log('some err');
    //     console.log('there was an error checking password', err);
        //reject();
    });
};

//get user info to prepopulate profile edit page
function getUserInfo(userId){
    return db.query('SELECT age, city, homepage FROM profiles where user_id=$1', [userId])
    .then(function(profileInfo){
        profileInfo=profileInfo.rows[0];
        return(profileInfo);
    })
}

//add signer. also adds session id
function addSignature(info, userId){
    return db.query('INSERT INTO signatures(signature, user_id) VALUES($1, $2) RETURNING id',[info.signature, userId])
    .catch(function(err){
        throw err;
    })
}

//select signature
function displaySignature(sessionId) {
    return db.query('SELECT signature FROM signatures WHERE user_id=' + sessionId)
    }

//show signatures
function showSigners() {
    //return db.query('SELECT users.firstname, users.lastname, profiles.city, profiles.age, profiles.homepage FROM users LEFT OUTER JOIN profiles ON users.id=profiles.user_id')
//return db.query('SELECT users.firstname, users.lastname, profiles.city, profiles.age, profiles.homepage FROM users LEFT OUTER JOIN profiles ON users.id=profiles.user_id LEFT OUTER JOIN signatures ON profiles.user_id=signatures.user_id')
    return db.query('SELECT signatures.user_id, users.firstname, users.lastname, profiles.age, profiles.city, profiles.homepage FROM signatures INNER JOIN users ON users.id=signatures.user_id LEFT OUTER JOIN profiles ON profiles.user_id=signatures.user_id')
}

//delete signature
function deleteSignature(userId) {
    console.log('something');
    return db.query('DELETE FROM signatures WHERE user_id=' + userId)

}



module.exports.hashPassword = hashPassword;
module.exports.addUser = addUser;
module.exports.addSignature = addSignature;
module.exports.checkUser = checkUser;
module.exports.displaySignature = displaySignature;
module.exports.showSigners = showSigners;
module.exports.deleteSignature = deleteSignature;
module.exports.getUserInfo = getUserInfo;
