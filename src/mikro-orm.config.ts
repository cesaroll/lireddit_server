import {__prod__} from "./utils/constants";
import {MikroORM} from "@mikro-orm/core";
import path from 'path';

export default {
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  dbName: "lireddit",
  type: "postgresql",
  debug: !__prod__,
  user: "postgres",
  password: "postgres",
  entities: ['./dist/entities'],
  entitiesTs: ['./src/entities'],
} as Parameters<typeof MikroORM.init>[0];
