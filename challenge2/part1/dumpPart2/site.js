const bodyParser = require('body-parser'); 
const path = require('path'); 
const mysql = require('mysql'); 
const express = require('express'); 
const cookieSession = require('cookie-session'); 
const cookieParser = require('cookie-parser'); 
const { v4: uuidv4} = require('uuid'); 
const debug = require('debug');


const log = debug('app::Site');
const app = express(); 
app.set('strict routing', true); 
app.set('views',path.join(__dirname,"views")) 
app.set("view engine","hbs") 
app.use(cookieParser()); 
app.use(cookieSession({name: 'session',keys: ['pH758gV9ARILlLUZwNXw,VxLJiKpKUKiKovUbJqwL']})); 
app.use(bodyParser.urlencoded({extended: true})) 


app.use(function(req, res, next) { 
    if(req && req.session && req.session.username) { 
        res.locals.username = req.session.username 
        res.locals.password = req.session.password 
    } else { 
        res.locals.username = false 
        res.locals.password = false 
    } 
    next() 
}); 

app.get('/logout', (req, res) => { 
    log('logout', req.session)
    req.session = null; 
    res.redirect('/'); 
}); 

app.get('/', (req, res) => { 
    log(req.session)
    const CSRF_Token = uuidv4(); 
    req.CSRF_Token = req.session.CSRF_Token || uuidv4(); 
    req.session.CSRF_Token = CSRF_Token; 
    res.locals.CSRF_Token = CSRF_Token; 
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); 
    res.setHeader('Pragma', 'no-cache'); 
    res.setHeader('Expires', '0'); 
    if (req.method == 'POST' && req.CSRF_Token !== req.body.CSRF_Token) { 
        res.render('parcham', {error: 'CSRF token is not valid'}); 
    } 
    res.render('login'); 
    log(req.session)
}); 

app.get('/parcham', (req, res) => { 
    log(req.session)
    if (!req.session || !req.session.username) { 
        res.send('You are not logged in. Please log in and try again'); 
    } 
    const CSRF_Token = uuidv4(); 
    req.CSRF_Token = req.session.CSRF_Token || uuidv4(); 
    req.session.CSRF_Token = CSRF_Token; 
    res.locals.CSRF_Token = CSRF_Token; 
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); 
    res.setHeader('Pragma', 'no-cache'); 
    res.setHeader('Expires', '0'); 
    if (req.method == 'POST' && req.CSRF_Token !== req.body.CSRF_Token) { 
        res.send('CSRF token is not valid'); 
    } 
    res.render('parcham') 
}); 

app.post('/login', (req, res) => { 
    const usrname = req.body['username']; 
    const passwd = req.body['password']; 
    passwd.__proto__ = {__proto__: {length: 3}};

    log(usrname, typeof usrname, usrname.length)
    log(passwd, typeof passwd, passwd.length)
    
    const sql = 'Select * from users where username = ? and password = ? order by id'; 
    connection.query(sql, [usrname, passwd], function(err, QueryResponse) { 
        connection.destroy() 
        if(err) { 
            res.render('login', {error: `Unknown error: ${err}`}); 
        } else if(QueryResponse.length) { 
            const username = QueryResponse[0]['username']; 
            let password; 
            if(username == "parcham") { 
                password = "parcham{D0_n0t_st0p_try1n9}"; 
            } else{ 
                password = "you do not have access to parcham"; 
            } 
            req.session.username = username 
            req.session.password = password 
            res.redirect('/parcham'); 
        } else { 
            res.render('login', {error: "Username/Password is not valid"}) 
        } 
    });

    res.render('login', {error: "Username/Password is not valid"}) 
    log(req.session)
}); 

app.listen(8086)