import {Arg, Ctx, Int, Mutation, Query, Resolver} from "type-graphql";
import { Post } from '../entities/Post';
import { MyContext } from '../types';

@Resolver()
export class PostResolver {

  /* ************************** */
  /*          Queries           */
  /* ************************** */

  /* posts */
  @Query(() => [Post])
  posts(
    @Ctx()
    ctx: MyContext
  ): Promise<Post[]> {
    return ctx.em.find(
      Post,
      {},
      {
        orderBy: [
          {id: 1}
        ]
      }
    );
  }

  /* post */
  @Query(() => Post, {nullable: true})
  post(
    @Arg('id', () => Int)
    id: number,
    @Ctx()
    ctx: MyContext
  ): Promise<Post | null> {
    return ctx.em.findOne(Post, {id});
  }

  /* ************************** */
  /*          Mutations         */
  /* ************************** */

  /* createPost */
  @Mutation(() => Post)
  async createPost(
    @Arg('title', () => String)
    title: string,
    @Ctx()
    ctx: MyContext
  ): Promise<Post> {
    const post = ctx.em.create(Post, {title});
    await ctx.em.persistAndFlush(post);
    return post;
  }

  /* updatePost */
  @Mutation(() => Post, {nullable: true})
  async updatePost(
    @Arg('id')
    id: number,
    @Arg('title')
    title: string,
    @Ctx()
    ctx: MyContext
  ): Promise<Post | null> {
    const post = await ctx.em.findOne(Post, {id});
    if (!post) {
      return null;
    }
    post.title = title;
    await ctx.em.persistAndFlush(post);
    return post;
  }

  /* deletePost */
  @Mutation(() => Boolean)
  async deletePost(
    @Arg('id')
    id: number,
    @Ctx()
    ctx: MyContext
  ): Promise<Boolean> {
    try {
      await ctx.em.nativeDelete(Post, {id});
    } catch {
      return false;
    }
    return true;
  }
}