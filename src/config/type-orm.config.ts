import { Post } from "../entities/Post";
import { User } from "../entities/User";
import { DataSourceOptions } from "typeorm";

export default {
  type: "postgres",
  database: "lireddit2",
  username: "postgres",
  password: "postgres",
  logging: true,
  synchronize: true,
  entities: [Post, User],
} as DataSourceOptions;
