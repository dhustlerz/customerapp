var express  = require('express');
var bodyParser  = require('body-parser');
var path = require('path');
var expressValidator = require('express-validator');
var mongojs = require('mongojs');
var db = mongojs('customerapp', ['users']);
var objectId = mongojs.ObjectID;
var app = express();

// middle ware
var logger = function(req, res, next) {
    console.log('logger...');
    next();
};

//view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// -> set static path app
app.use(express.static(path.join(__dirname, 'public')));

// Global vars
app.use(function(req, res, next){
    res.locals.errors = null;
    next();
});

//-> Express validator Middleware
app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
            , root    = namespace.shift()
            , formParam = root;

        while(namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param : formParam,
            msg   : msg,
            value : value
        };
    }
}));


// Routes handling a get request
app.get('/', function(req, res){
    // find everything
    db.users.find(function (err, docs) {
        res.render('index', {
            title: 'customers',
            customerUsers: docs
        });
    })

});
// Post customer data
app.post('/users/add', function(req, res){

    req.checkBody('first_name', 'first name is required').notEmpty();
    req.checkBody('last_name', 'last name is required').notEmpty();
    req.checkBody('email', 'email is required').notEmpty();

    var errors = req.validationErrors();
    if(errors) {
        // find everything
        db.users.find(function (err, docs) {
            res.render('index', {
                title: 'customers',
                customerUsers: docs,
                errors: errors
            });
        })
    } else {
        var newUser = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email

        };
        db.users.insert(newUser, function(err, result){
            if(err) {
                console.log(err);
            } else {
                res.redirect('/');
            }
        });
    }

});

//-> delete user
app.delete('/users/delete/:id', function(req, res) {
    db.users.remove({_id: objectId(req.params.id)}, function(err, result){
        if(err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});

app.listen(process.env.PORT || 3000, function(){
    console.log('listening on', app.get('port'));
});
