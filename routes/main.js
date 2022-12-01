module.exports = function (app, shopData) {

    const redirectLogin = (req, res, next) => {
        if (!req.session.userId) {
            res.redirect('./login')
        } else { next(); }
    }

    const { check, validationResult } = require('express-validator')

    // Handle our routes
    app.get('/', function (req, res) {
        res.render('index.ejs', shopData)
    });

    app.get('/about', function (req, res) {
        res.render('about.ejs', shopData);
    });

    app.get('/search', redirectLogin, function (req, res) {
        res.render("search.ejs", shopData);
    });

    app.get('/search-result', [
        check("keyword")
            .notEmpty()
            .withMessage("keyword should not be empty")
    ],
        function (req, res) {
            const valErrors = validationResult(req);
            if (!valErrors.isEmpty()) {
                res.redirect('./search');
            }
            else {
                //searching in the database
                //res.send("You searched for: " + req.query.keyword);
                let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.sanitize(req.query.keyword) + "%'";
                // execute sql query
                db.query(sqlquery, (err, result) => {
                    if (err) {
                        res.redirect('./');
                    }
                    let newData = Object.assign({}, shopData, { availableBooks: result });
                    console.log(newData)
                    res.render("list.ejs", newData)
                });
            }
        });

    app.get('/list', redirectLogin, function (req, res) {
        let sqlquery = "SELECT * FROM books"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, { availableBooks: result });
            console.log(newData)
            res.render("list.ejs", newData)
        });
    });

    app.get('/addbook', redirectLogin, function (req, res) {
        res.render('addbook.ejs', shopData);
    });

    app.post('/bookadded', [
        check("name")
            .notEmpty()
            .withMessage("name should not be empty"),
        check('price')
            .isNumeric()
            .withMessage("The price should be a number")
    ],
        function (req, res) {
            // In case of validation error 
            const valErrors = validationResult(req);
            if (!valErrors.isEmpty()) {
                res.redirect('./addbook');
            }
            else {
                // saving data in database
                let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
                // execute sql query
                // Sanitized input stored in newrecord
                let newrecord = [req.sanitize(req.body.name), req.sanitize(req.body.price)];
                db.query(sqlquery, newrecord, (err, result) => {
                    if (err) {
                        return console.error(err.message);
                    }
                    else
                        res.send(' This book is added to database, name: ' + req.sanitize(req.body.name) + ' price ' + req.sanitize(req.body.price));
                });
            }

        });

    app.get('/bargainbooks', redirectLogin, function (req, res) {
        let sqlquery = "SELECT * FROM books WHERE price < 20";
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, { availableBooks: result });
            console.log(newData)
            res.render("bargains.ejs", newData)
        });
    });


    app.get('/register', function (req, res) {
        res.render('register.ejs', shopData);
    });

    //Lab 3 - Validation
    app.post('/registered', [
        check('email')
            .isEmail()
            .withMessage("The input value should be email"),
        check('password')
            .isLength({ min: 8 })
            .withMessage("Password should be 8 characters"),
        check('username')
            .notEmpty()
            .withMessage("username cannot be left empty")
            .isAlphanumeric()
            .withMessage("username should be letters or numbers"),
        check('first')
            .notEmpty()
            .withMessage("first cannot be empty")
            .isAlpha()
            .withMessage("first name should be english character"),
        check('last')
            .notEmpty()
            .withMessage("last cannot be empty")
            .isAlpha()
            .withMessage("first name should be english character")
    ],
        function (req, res) {
            // Hashing password
            const bcrypt = require('bcrypt');
            const saltRounds = 10;
            //Password Sanitization
            const plainPassword = req.sanitize(req.body.password);
            //Store errors from req validation into valErrors
            const valErrors = validationResult(req);
            console.log(valErrors)
            if (!valErrors.isEmpty()) {
                res.redirect('./register');
            }
            else {
                bcrypt.hash(plainPassword, saltRounds, function (hashErr, hashedPassword) {
                    // Store hashed password in your database.
                    let sqlquery = "INSERT INTO users (username, first_name, last_name, email, hashedPassword) VALUES (?,?,?,?,?)";
                    let newRecord = [req.sanitize(req.body.username),
                    req.sanitize(req.body.first),
                    req.sanitize(req.body.last),
                    req.sanitize(req.body.email),
                        hashedPassword];
                    console.log(newRecord);
                    db.query(sqlquery, newRecord, (queryErr, result) => {
                        if (queryErr) {
                            res.redirect('./');
                            console.error(queryErr);
                        }
                        result = 'Hello ' + req.sanitize(req.body.first) + ' ' + req.sanitize(req.body.last) + ' you are now registered! We will send an email to you at ' + req.sanitize(req.body.email);
                        result += 'Your password is: ' + plainPassword + ' and your hashed password is: ' + hashedPassword;
                        res.send(result);
                    });
                })
            }

        });

    //Lab 2 Part 1 - Task 5
    app.get('/listusers', redirectLogin, (req, res) => {
        let sqlquery = "SELECT * FROM users"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./');
            }
            let newData = Object.assign({}, shopData, { availableUsers: result });
            console.log("This is the new data", newData)
            res.render("listusers.ejs", newData)
        });
    })

    app.get('/login', function (req, res) {
        res.render('login.ejs', shopData);
    });

    app.post('/loggedin', [
        check('password')
            .isLength({ min: 8 })
            .withMessage("Password should be 8 characters"),
        check('username')
            .notEmpty()
            .withMessage("username cannot be left empty")
            .isAlphanumeric()
            .withMessage("username should be letters or numbers")],
        function (req, res) {
            const valErrors = validationResult(req);
            console.log(valErrors)
            if (!valErrors.isEmpty()) {
                res.redirect('./register');
            }
            else {
                const bcrypt = require('bcrypt');
                const plainPassword = req.sanitize(req.body.password);
                let hash = ""; //Stores the retrieved hashed password from database

                //Database query to find hash for the corresponding username
                let sqlquery = `SELECT hashedPassword FROM users WHERE username="${req.sanitize(req.body.username)}"`
                db.query(sqlquery, (queryErr, queryResult) => {
                    //If username does not exist - database returns an empty array
                    if (queryResult.length == 0) {
                        res.send("Username does not exist")
                    }
                    else {
                        //Extracting hash from sql query result data structure
                        hash = queryResult[0].hashedPassword
                        //Comparing the entered password with hashed value using bcrypt
                        bcrypt.compare(plainPassword, hash, function (bcryptErr, result) {
                            if (bcryptErr) {
                                res.redirect('./');
                                console.error(bcryptErr);
                            }
                            else if (result) { //Password matched : result == true
                                req.session.userId = req.sanitize(req.body.username);
                                res.send("You are now logged in. <a href=./>Home</a>")
                            }
                            else {
                                res.send("The password you entered is wrong");
                            }
                        });
                    }
                });
            }
        })

    app.get('/logout', redirectLogin, (req, res) => {
        req.session.destroy(err => {
            if (err) {
                return res.redirect('./')
            }
            res.send('you are now logged out. <a href=./>Home</a>');
        })
    })

    app.get("/deleteusers", redirectLogin, (req, res) => {
        res.render('deleteusers.ejs', shopData);
    })

    app.post("/deleteduser", [
        check('username')
            .notEmpty()
            .withMessage("username cannot be left empty")
            .isAlphanumeric()
            .withMessage("username should be letters or numbers"),
    ], (req, res) => {
        const valErrors = validationResult(req);
        console.log(valErrors)
        if (!valErrors.isEmpty()) {
            res.redirect('./deleteusers');
        }
        else {
            //SQL query to check if user exists
            let sqlquery = `SELECT * FROM users WHERE username="${req.sanitize(req.body.username)}"`
            db.query(sqlquery, (queryErr, queryResult) => {
                //If username does not exist - database returns an empty array
                if (queryResult.length == 0) {
                    res.send("Username does not exist")
                }
                else {
                    //SQL query to delete the corresponding user
                    sqlquery = `DELETE FROM users WHERE username="${req.sanitize(req.body.username)}"`
                    db.query(sqlquery, (queryErr, queryResult) => {
                        if (queryErr) {
                            res.redirect('./')
                        }
                        let message = `${req.sanitize(req.body.username)} has been deleted from the list`
                        res.send(message)
                    }); ``
                }
            })
        }
    })


    app.get('/api', function (req, res) {
        // Query database to get all the books
        let search_keyword = req.query.keyword;
        console.log(search_keyword);
        // If user provides a valid keyword 
        if (search_keyword !== undefined) {
            let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + search_keyword + "%'";
            // execute sql query
            db.query(sqlquery, (err, result) => {
                if (err) {
                    res.redirect('./');
                }
                let newData = Object.assign({}, shopData, { availableBooks: result });
                console.log(newData)
                res.render("list.ejs", newData)
            });
        }
        else {
            //No keyword provided - JSON result of the books
            let sqlquery = "SELECT * FROM books";
            // Execute the sql query
            db.query(sqlquery, (err, result) => {
                if (err) {
                    res.redirect('./');
                }
                // Return results as a JSON object
                res.json(result);
            });
        }
    });


    app.get("/weather", (req, res) => {
        res.render("weather.ejs", shopData)
    })

    app.get("/get-weather", (req, res) => {
        const request = require('request');
        let apiKey = '206cb769eb7b09cc0308792dddb8c809';
        let city = req.sanitize(req.query.keyword);
        let css_link = '<link rel="stylesheet"  type="text/css" href="main.css" />'
        let home_link = '<br><p><a href="./">Back to home</a></p>'
        let url =
            `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
        request(url, function (err, response, body) {
            if (err) {
                console.log('error:', error);
            } else {
                var weather = JSON.parse(body);
                console.log(weather);
                // If API provides a valid result 
                if (weather !== undefined && weather.main !== undefined) {
                    //Print out city name, weather, humidity, feels like, max temp and main temp
                    var wmsg =
                        `It is ${weather.main.temp} degrees in ${weather.name} 
                        <br>The humidity now is: ${weather.main.humidity}
                        <br>The temperature feels like ${weather.main.feels_like}
                        <br>The minimum temperature is ${weather.main.temp_min}
                        <br>The maximum temperature is ${weather.main.temp_max}`
                    res.send(css_link + wmsg + home_link)
                }
                // Error handling - bad response from API
                else {
                    res.send(css_link + "No data found" + home_link);
                }
            }
        });
    })

    app.get("/tvshow", (req, res) => {
        res.render("tvshow.ejs", shopData)
    })

    app.get("/get-tvshow", (req, res) => {
        const request = require('request');
        const keyword = req.sanitize(req.query.keyword);
        // Keyword search for similar TV shows
        let url =
            `https://api.tvmaze.com/search/shows?q=${keyword}`
        request(url, function (err, response, body) {
            if (err) {
                console.log('error:', error);
            } else {
                let shows = JSON.parse(body);

                let css_link = '<link rel="stylesheet"  type="text/css" href="main.css" />'
                let home_link = '<br><p><a href="./">Back to home</a></p>'

                // If API does provide a result
                if (shows !== undefined && shows.notEmpty) {
                    let title = '<h1>TV show results with similar name:</h1>'
                    let result = ''
                    // Loop through shows array and render HTML elements using that data
                    shows.forEach(element => {
                        console.log(element.show.image)
                        result += `
                        <h2>${element.show.name}</h2>
                        ${element.show.summary}
                        Language : ${element.show.language}
                        <br>Type : ${element.show.type}
                        <hr class="rounded">`
                    });
                    res.send(title + css_link + result + home_link)
                }
                // Error Handling - bad response from API
                else {
                    res.send(css_link + "No data found" + home_link);
                }
            }
        });
    })
}
