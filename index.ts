import { Redis } from  "ioredis"

type Configure = {
  tokenId?:string,
  keyPrefix?:string,
  driver?:'memory'|'redis',
  redis?:Redis,
  strict?:boolean
}


function JwtBlackList(){

  const defaultOpts = {
    tokenId:"sub",
    keyPrefix:"jwt-blacklist:",
    strict:false
  }
  let opts:Configure = {...defaultOpts}
  let store = createStore('memory',null,new Map());

  function configure(options: Configure = {}) {
     opts = {...opts,...options}
     if(opts.driver === 'redis'&&!(opts.redis instanceof Redis)){
       throw new Error("Invalid configuration reids should be ioreids instance")
     }
     store = createStore(opts.driver,opts.redis,new Map());
  }

  function isRevoked(req, user,fn) {
    try {
      let revoked = opts.strict;
      let id = user[opts.tokenId];
      if (!id) {
       return fn(new Error("JWT missing tokenId " + opts.tokenId));
      }
      let key = opts.keyPrefix + id;
       store.get(key).then((exp)=>{
        if (!exp) {
          fn(null,revoked);
        }else{
          fn(null,exp - Math.floor(Date.now() / 1000) > 0)
        }
      }).catch(fn);
      
    } catch (error) {
      fn(error);
    }
  }

   function revoke(user,fn = (params)=>{}) {
    if (!user) {
     return fn(new Error("User payload missing"));
    }
  
    let id = user[opts.tokenId];
    if (!id) {
      return fn(new Error("JWT missing tokenId " + opts.tokenId));
    }
    let key = opts.keyPrefix + id;
    let lifetime = user.exp ? user.exp - Math.floor(Date.now() / 1000) : 0;
    if (lifetime > 0) {
      store.set(key, user.exp, lifetime).then(fn).catch(fn);
    }
  }
  
  return {
    configure,
    isRevoked,
    revoke
  }
}



function createStore(driver, redis, map) {
  let db;
  if (driver === "redis") {
    db = {
      async get(key) {
        try{
          const value = await redis.get(key)
          if(value){
            return JSON.parse(value)
          }
          return
        }catch(error){
          throw error 
        }
      
      },
      async set(key, value,lifetime) {
        try{
          await redis.set(key, JSON.stringify(value));
          await redis.expire(key,lifetime)
          return value
        }catch(error){
          throw error
        }
       
      },
    };
  } else {
    db = {
      async get(key) {
        const value = map.get(key);
        return await value;
      },
      async set(key, value,lifetime) {
        map.set(key, value);
        setTimeout(expire.bind(null, key),lifetime*1000)
        return await value;
      },
    };
  }

  function expire(key){
     map.delete(key)
  }

  return db;
}

const jwtBlackList = JwtBlackList()

export default jwtBlackList