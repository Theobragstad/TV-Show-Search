const express = require('express');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const axios = require('axios');


const dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
};
  
const db = pgp(dbConfig);
  
db.connect()
    .then(obj => {
        console.log('Database connection successful'); 
        obj.done(); 
    })
    .catch(error => {
        console.log('ERROR:', error.message || error);
    });

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('resources'));


// Begin routing

app.get('/', (req, res) => {
    return res.render('pages/main', {item: []});
})

app.get('/reviews', (req, res) => {
    db.any(`SELECT * FROM reviews ORDER BY reviewDate DESC, reviewID DESC;`)
        .then((reviews) => { 
            if(reviews.length == 0) {
                return res.render('pages/reviews', {reviews: [], error: false, message: 'No reviews yet.'});
            }
            else if(req.query.add == 'success') {
                return res.render('pages/reviews', {reviews, error: false, message: 'Successfully added review.'});
            }
            else if(req.query.add == 'failure') {
                return res.render('pages/reviews', {reviews, error: true, message: 'Unable to add review.'});
            }
            else if(req.query.add == 'empty') {
                return res.render('pages/reviews', {reviews, error: true, message: 'Reviews cannot be empty.'});
            }
            else {
                return res.render('pages/reviews', {reviews, error: false});
            }
        })
        .catch((error) => { 
            console.log(error);
            return res.render('pages/reviews', {error: true, message: 'An error occurred while loading the reviews.'});
        })
})

app.post('/search', (req, res) => {
    axios({ 
      url: `https://api.tvmaze.com/search/shows?q=${req.body.q}`, 
      method: 'GET', 
      dataType:'json',
      headers: {'Accept-Encoding':'text/html;charset=UTF-8'}
    }) 
      .then((items) => { 
        if(items.data.length > 0) {
            res.render('pages/main', {item: items.data, error: false,  message: `Top result for '` + req.body.q + `':`});
        } 
        else {
            res.render('pages/main', {item: [], error: true, message: `No results for '` + req.body.q + `'`});
        }
      }) 
      .catch((error) => { 
        console.log(error); 
        res.render('pages/main', {item: [], error: true, message: 'There was an error in the search.'});
      }) 
});
  

app.post('/addReview', (req, res) => {   
    if(req.body.review === null || req.body.review.match(/^ *$/) !== null) {
        return res.redirect('/reviews?'+'add=empty');
    } 
    else {
        var currentDate = new Date();
        var day = currentDate.getDate();
        var month = currentDate.getMonth() + 1;
        var year = currentDate.getFullYear();
        var currentDateFormatted = month + '-' + day + '-' + year;

        db.any(`INSERT INTO reviews (showName, review, reviewDate) VALUES ('${req.body.showName}', '${req.body.review}', '${currentDateFormatted}');`)
            .then(() => { 
                return res.redirect('/reviews?'+'add=success');
            })
            .catch((error) => { 
                console.log(error);
                return res.redirect('/reviews?'+'add=failure');
            })
    }
});

// End routing

app.use((req, res, next) => {
    res.status(404).send('404');
})
  
app.listen(3000);
console.log('Server is listening on port 3000');