import { MikroORM } from "@mikro-orm/core";
// import {Post} from "./entities/Post";
import mikroOrmConfig from "./mikro-orm.config";
import {__prod__} from "./utils/constants";
import express from "express";

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();

  // const em = orm.em.fork();

  const app = express();
  app.get('/', (_, res) => {
    res.send("Hello World!");
  });
  app.listen(4000, () => {
    console.log('server started on localhost:4000');
  });
};

main().catch((err) => {
  console.error(err);
});
