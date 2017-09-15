const spicedPg=require('spiced-pg');
const bcrypt = require('bcryptjs');
const db=spicedPg(process.env.DATABASE_URL || 'postgres:postgres:postgres@localhost:5432/petition');;


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
    return db.query("SELECT users.id, users.firstname, users.lastname, users.email, users.password, signatures.signature, signatures.user_id FROM users FULL JOIN signatures ON users.id=signatures.user_id WHERE users.email=$1",[email])
    .then(function(userInfo){
        userInfo=userInfo.rows[0];
        return new Promise (function(resolve,reject){
            bcrypt.compare(enteredPassword, userInfo.password, function(err,doesMatch) {
                if (doesMatch==false) {
                    reject(console.log('reject error'));
                } else {
                    resolve(userInfo);
                }
            })
        })
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
    return db.query('SELECT signatures.user_id, users.firstname, users.lastname, profiles.age, profiles.city, profiles.homepage FROM signatures INNER JOIN users ON users.id=signatures.user_id LEFT OUTER JOIN profiles ON profiles.user_id=signatures.user_id')
}

//count signatures to display on /signed
function countSigners() {
    return db.query('SELECT COUNT(*) FROM signatures')
}

function getSignersByCity(city) {
    var query = `SELECT signatures.user_id, users.firstname, users.lastname, profiles.age, profiles.city, profiles.homepage
    FROM signatures INNER JOIN users ON users.id=signatures.user_id
    LEFT OUTER JOIN profiles ON profiles.user_id=signatures.user_id WHERE profiles.city=initcap('${city}')`
    return db.query(query)
    .catch(function(err){
        console.log('err in getsignersby city function', err);
    })
}

//delete signature
function deleteSignature(userId) {
    return db.query('DELETE FROM signatures WHERE user_id=' + userId)
}

//set profile info
function setProfile(info, userId){
    var query = 'INSERT INTO profiles(age, city, homepage, user_id) VALUES($1, $2, $3, $4) RETURNING id';
    var params = [info.age, info.city, info.homepage, userId];
    return db.query(query, params)
    .catch(function(err){
        console.log(err);
    })
}

function updateProfile(info, userId){
    var queryProfile = 'UPDATE profiles SET age=$1, city=$2, homepage=$3 WHERE user_id=$4';
    var paramsProfile = [info.age, info.city,info.homepage,userId];
    var queryUser = 'UPDATE users SET firstname=$1, lastname=$2, email=$3 WHERE id=$4';
    var paramsUser = [info.firstname, info.surname, info.email,userId];
    db.query(queryUser, paramsUser)
    .then(function(profileUpdate){
        db.query(queryProfile, paramsProfile)
        return(profileUpdate);
    })
}

module.exports.hashPassword = hashPassword;
module.exports.addUser = addUser;
module.exports.addSignature = addSignature;
module.exports.checkUser = checkUser;
module.exports.displaySignature = displaySignature;
module.exports.countSigners = countSigners;
module.exports.showSigners = showSigners;
module.exports.getSignersByCity = getSignersByCity;
module.exports.deleteSignature = deleteSignature;
module.exports.getUserInfo = getUserInfo;
module.exports.setProfile = setProfile;
module.exports.updateProfile = updateProfile;
