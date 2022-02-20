/* include a number of modules: request, path, fs, mysql, express, cookie-session,
 cookie-parser, body-parser, uuid*/

const app = express();

app.set('strict routing', true);
app.set('views',path.join(__dirname,"views"))
app.set("view engine","hbs")

app.use(cookieParser());
app.use(cookieSession({name: 'session',keys: [/*...key1...*/,/*...key2...*/]}));
app.use(bodyParser.urlencoded({extended: true}))

/*****************************/

app.get('/logout', (req, res) => {
 /* set session to null and redirect to /    */
});


app.get('/', (req, res) => {

   /* do something and then render login page */
});

app.get('/parcham', (req, res) => {

   /* do something and then render parcham page */
 
});

app.post('/login', (req, res) => {
    const usrname = req.body['username'];
    const passwd = req.body['password'];
  
    var connection = '';/*... connecting to Database ...*/

    const sql = 'Select * from users where username = ? and password = ? order by id';
    connection.query(sql, [usrname, passwd], function(err, QueryResponse) {
  if(err) {
    /*** show error ***/
  } 
  else if(QueryResponse.length) {
   const username = QueryResponse[0]['username'];
   if(username == "parcham") {
    /********* redirect to /parcham and show parcham ****/
   }
   else
   {
    /********* redirect to /parcham and show this message: "you do not have access to parcham"  ***********/
   }
   /***********************/
  }
  else {
    /*** render login page and show this error: "Username/Password is not valid" ***/
  }
  });
});

app.listen(8085)