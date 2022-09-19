import {Ctx, Query, Resolver} from "type-graphql";
import { Post } from '../entities/Post';
import { MyContext } from '../types';

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  posts(
    @Ctx()
    ctx: MyContext
  ): Promise<Post[]> {
    return ctx.em.find(Post, {});
  }
}
