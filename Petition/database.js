const spicedPg=require('spiced-pg');
const db = spicedPg('postgres:postgres:postgres@localhost:5432/petition');

const results = [];
const data = [] ;

const query = ('INSERT INTO signatures(first_name, last_name, signature, timestamp) VALUES($1, $2)',[req.body.firstname, req.body.surname]);
console.log(req.body.firstname, req.body.surname);


db.query(query).then(function(result){
    console.log(result.rows);
    result.push(result);
    //res.JSON(results);
}).catch(function(err){
    console.log(err);
});

// db.query("INSERT INTO signatures (firstname, lastname) VALUES ($1,$2)",[req.body.firstname,req.body.lastname]).then(function(result){
//         console.log(result.rows);
//     }).catch(function(err){
//         console.log(err);
//     });



//query.on('end', () => {})




//sample code
// db.query('SELECT * FROM cities').then(function(results) {
//     console.log(results.rows);
// }).catch(function(err) {
//     console.log(err);
// });






//sample code from lecture
// const  query = `INSERT INTO cities (city, country, population)
//                 VALUES ('Gotham', 'USA', 400000)
//                 RETURNING id`;
//
// db.query(query).then(function(result){
//     console.log(result.rows);
// }).catch(function(err){
//     console.log(err);
// });
