# express-jsonwebtoken-blacklist

## Install

```
npm install express-jsonwebtoken-blacklist
```

## Example

### default configure With a Memory driver

```
import { configure } from 'express-jsonwebtoken-blacklist';

configure({
  tokenId:'sub',
  keyPrefix:'jwt-blacklist:'
  driver:'memory',
})
```

### configure With a Redis driver

```
import { configure } from 'express-jsonwebtoken-blacklist';
import { Redis } from "ioredis";

configure({
  tokenId:'sub',
  keyPrefix:'jwt-blacklist:'
  driver:'redis',
  redis:new Redis()
})
```

```
var Koa = require('express');
var jwt = require('express-jwt');

import { revoke,isRevoked } from 'express-jsonwebtoken-blacklist';

var app = new Koa();

app.use(jwt({ secret:'shared-secret',isRevoked:isRevoked }).unless({
    path: [/^\/public/]
  }))


//Logout
app.get('/logout', function (req, res) {
   revoke(req.user)
   res.sendStatus(200);
});

//Login

import jsonwebtoken from 'jsonwebtoken'
import { v4 as uuid } from "uuid"
app.get('/login', function (req, res) {
      const user = {userId:'userId'}
      const tokenId = uuid()
      const token = jsonwebtoken.sign({
      data: user,
      sub: tokenId,  //tokenId
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 60 seconds * 60 minutes = 1 hour
    }, 'shared-secret')
   res.sendStatus(200);
});


```

Please introduce me to a job
