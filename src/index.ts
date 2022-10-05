import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import mikroOrmConfig from "./mikro-orm.config";
import {__prod__} from "./utils/constants";
import express from "express";
import {ApolloServer} from "apollo-server-express";
import {buildSchema} from "type-graphql";
import {HelloResolver} from "./resolvers/helloResolver";
import {PostResolver} from "./resolvers/postResolver";
import {UserResolver} from "./resolvers/userResolver";
import {createClient} from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import {MyContext} from "./types";
import cors from "cors";

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();
  // const em = orm.em.fork();

  const app = express();

  const RedisStore = connectRedis(session);

  // redis@v4
  // const { createClient } = require("redis");
  const redisClient: any = createClient({ legacyMode: true });
  redisClient.connect().catch(console.error);

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(
    session({
      name: "qid",
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30 * 1, // 1 month
        httpOnly: true,
        sameSite: "lax", // csrf
        secure: __prod__, // cookie only works in https
      },
      saveUninitialized: false,
      secret: "wqefergthtrgdrfgdgdfg",
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ em: orm.em.fork(), req, res }),
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.get("/", (_, res) => {
    res.send("Hello World!");
  });
  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

main().catch((err) => {
  console.error(err);
});
