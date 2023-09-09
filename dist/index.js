"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = require("ioredis");
function JwtBlackList() {
    const defaultOpts = {
        tokenId: "sub",
        keyPrefix: "jwt-blacklist:",
        strict: false
    };
    let opts = Object.assign({}, defaultOpts);
    let store = createStore('memory', null, new Map());
    function configure(options = {}) {
        opts = Object.assign(Object.assign({}, opts), options);
        if (opts.driver === 'redis' && !(opts.redis instanceof ioredis_1.Redis)) {
            throw new Error("Invalid configuration reids should be ioreids instance");
        }
        store = createStore(opts.driver, opts.redis, new Map());
    }
    async function isRevoked(ctx, user) {
        try {
            let revoked = opts.strict;
            let id = user[opts.tokenId];
            if (!id) {
                throw new Error("JWT missing tokenId " + opts.tokenId);
            }
            let key = opts.keyPrefix + id;
            const exp = await store.get(key);
            if (!exp) {
                return revoked;
            }
            return exp - Math.floor(Date.now() / 1000) > 0;
        }
        catch (error) {
            throw error;
        }
    }
    async function revoke(user) {
        if (!user) {
            throw new Error("User payload missing");
        }
        let id = user[opts.tokenId];
        if (!id) {
            throw new Error("JWT missing tokenId " + opts.tokenId);
        }
        let key = opts.keyPrefix + id;
        let lifetime = user.exp ? user.exp - Math.floor(Date.now() / 1000) : 0;
        if (lifetime > 0) {
            await store.set(key, user.exp, lifetime);
        }
    }
    return {
        configure,
        isRevoked,
        revoke
    };
}
function createStore(driver, redis, map) {
    let db;
    if (driver === "redis") {
        db = {
            async get(key) {
                const value = await redis.get(key);
                if (value) {
                    return JSON.parse(value);
                }
                else {
                    return undefined;
                }
            },
            async set(key, value, lifetime) {
                await redis.set(key, JSON.stringify(value));
                await redis.expire(key, lifetime);
                return value;
            },
        };
    }
    else {
        db = {
            async get(key) {
                const value = map.get(key);
                return await value;
            },
            async set(key, value, lifetime) {
                map.set(key, value);
                setTimeout(expire.bind(null, key), lifetime * 1000);
                return await value;
            },
        };
    }
    function expire(key) {
        map.delete(key);
    }
    return db;
}
const jwtBlackList = JwtBlackList();
exports.default = jwtBlackList;
