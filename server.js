if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcryptjs')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const axios = require('axios')


const initializePassport = require('./passport-config')
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    _id => users.find(user => user._id === _id)
)


//get users from database when server starts
axios.get('http://jordi.dsmynas.com:3000/users')
    .then(result => {
        users = result.data
    })
    .catch(error => {
        console.log(error)
    })


app.set('view-engine', 'ejs')
app.use(express.urlencoded({
    extended: false
}))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))


//route to indexpage
app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', {
        name: req.user.name
    })
})

//route to loginpage
app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {

    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

//route to registerpage
app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})


//post method to get data from registerform in database
app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        axios.post('http://jordi.dsmynas.com:3000/users', {
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })
        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
})

app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
    axios.get('http://jordi.dsmynas.com:3000/users')
        .then(result => {
            users = result.data
        })
        .catch(error => {
            console.log(error)
        })
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    axios.get('http://jordi.dsmynas.com:3000/users')
        .then(result => {
            users = result.data
        })
        .catch(error => {
            console.log(error)
        })
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }

    next()
}



app.listen(3001)