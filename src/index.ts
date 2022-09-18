import { MikroORM } from "@mikro-orm/core";
import {Post} from "./entities/Post";
import mikroOrmConfig from "./mikro-orm.config";
import {__prod__} from "./utils/constants";

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();

  const em = orm.em.fork();

  // const post = em.create(Post, {
  //   title: 'My first post',
  //   createdAt: new Date(),
  //   updatedAt: new Date()
  // });
  // await em.persistAndFlush(post);

  const posts = await em.find(Post, {});
  console.log(posts);

};

main().catch((err) => {
  console.error(err);
});
