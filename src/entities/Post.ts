import {Entity, PrimaryKey, Property} from "@mikro-orm/core";

@Entity()
export class Post {

  @PrimaryKey()
  id!: Number;

  @Property({ type: "date"})
  createdAt: Date = new Date();

  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ type: "text"})
  title!: String;
}
