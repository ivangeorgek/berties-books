module.exports = function(app, shopData) {

    // Handle our routes
    app.get('/',function(req,res){
        res.render('index.ejs', shopData)
    });
    app.get('/about',function(req,res){
        res.render('about.ejs', shopData);
    });
    app.get('/search',function(req,res){
        res.render("search.ejs", shopData);
    });
    app.get('/search-result', function (req, res) {
        //searching in the database
        //res.send("You searched for: " + req.query.keyword);

        let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableBooks:result});
            console.log(newData)
            res.render("list.ejs", newData)
         });        
    });

    app.get('/list', function(req, res) {
        let sqlquery = "SELECT * FROM books"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableBooks:result});
            console.log(newData)
            res.render("list.ejs", newData)
         });
    });

    app.get('/addbook', function (req, res) {
        res.render('addbook.ejs', shopData);
     });
 
    app.post('/bookadded', function (req,res) {
           // saving data in database
           let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
           // execute sql query
           let newrecord = [req.body.name, req.body.price];
           db.query(sqlquery, newrecord, (err, result) => {
             if (err) {
               return console.error(err.message);
             }
             else
             res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.price);
             });
       });    

    app.get('/bargainbooks', function(req, res) {
        let sqlquery = "SELECT * FROM books WHERE price < 20";
        db.query(sqlquery, (err, result) => {
          if (err) {
             res.redirect('./');
          }
          let newData = Object.assign({}, shopData, {availableBooks:result});
          console.log(newData)
          res.render("bargains.ejs", newData)
        });
    });


    app.get('/register', function (req,res) {
        res.render('register.ejs', shopData);                                                                     
    }); 

    //Lab 2 Part 1 - Task 2
    app.post('/registered', function (req,res) {
        // Hashing password
        const bcrypt = require('bcrypt'); 
        const saltRounds = 10;
        const plainPassword = req.body.password;
        bcrypt.hash(plainPassword, saltRounds, function(hashErr, hashedPassword) {
            // Store hashed password in your database.
            let sqlquery = "INSERT INTO users (username, first_name, last_name, email, hashedPassword) VALUES (?,?,?,?,?)";
            let newRecord = [req.body.username, req.body.first, req.body.last, req.body.email, hashedPassword];
            console.log(newRecord);
            db.query (sqlquery, newRecord, (queryErr, result) => {
                if (queryErr) {
                    res.redirect('./');
                    console.error(queryErr);
                }
                result = 'Hello '+ req.body.first + ' '+ req.body.last +' you are now registered! We will send an email to you at ' + req.body.email;
                result += 'Your password is: '+ plainPassword +' and your hashed password is: '+ hashedPassword;
                res.send(result);                                                                              
            });  
        })
    }); 
    
    //Lab 2 Part 1 - Task 5
    app.get('/listusers', (req, res) => {
        let sqlquery = "SELECT * FROM users"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableUsers: result});
            console.log("This is the new data", newData)
            res.render("listusers.ejs", newData)
         });
    })

    app.get('/login', function (req,res) {
        res.render('login.ejs', shopData);                                                                     
    }); 

    app.post('/loggedin', function (req,res) {
        const bcrypt = require('bcrypt'); 
        const plainPassword = req.body.password; 
        let hash = ""; //Stores the retrieved hashed password from database

        //Database query to find hash for the corresponding username
        let sqlquery = `SELECT hashedPassword FROM users WHERE username="${req.body.username}"`
        db.query (sqlquery, (queryErr, queryResult) => { 
            //If username does not exist - database returns an empty array
            if (queryResult.length == 0) {
                res.send("Username does not exist")
            }
            else {
                //Extracting hash from sql query result data structure
                hash = queryResult[0].hashedPassword 
                //Comparing the entered password with hashed value using bcrypt
                bcrypt.compare(plainPassword, hash, function(bcryptErr, result) {
                    if (bcryptErr) {
                        res.redirect('./');
                        console.error(bcryptErr);
                    }
                    else if (result) { //Password matched : result == true
                        res.send("You are now logged in")
                    }
                    else {
                        res.send("The password you entered is wrong");
                    }
                });  
            }                                                    
        }); 
    })

    app.get("/deleteusers", (req, res) => {
        res.render('deleteusers.ejs', shopData);
    })

    app.post("/deleteduser", (req, res) => {
        //SQL query to check if user exists
        let sqlquery = `SELECT * FROM users WHERE username="${req.body.username}"`
        db.query (sqlquery, (queryErr, queryResult) => { 
            //If username does not exist - database returns an empty array
            if (queryResult.length == 0) {
                res.send("Username does not exist")
            }
            else {
                //SQL query to delete the corresponding user
                sqlquery = `DELETE FROM users WHERE username="${req.body.username}"`
                db.query (sqlquery, (queryErr, queryResult) => { 
                    if (queryErr) {
                        res.redirect('./')
                    }
                    let message = `${req.body.username} has been deleted from the list` 
                    res.send(message)                                                 
                });
            }
        })

    })
}
