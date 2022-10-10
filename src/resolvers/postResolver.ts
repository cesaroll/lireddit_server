import { sleep } from "src/utils/sleep";
import { Arg, Ctx, Int, Mutation, Query, Resolver } from "type-graphql";
import { Post } from "../entities/Post";
import { MyContext } from "../types";

@Resolver()
export class PostResolver {
  /* ************************** */
  /*          Queries           */
  /* ************************** */

  /* posts */
  @Query(() => [Post])
  async posts(
    @Ctx()
    { em }: MyContext
  ): Promise<Post[]> {
    await sleep(3000);
    return em.find(
      Post,
      {},
      {
        orderBy: [{ id: 1 }],
      }
    );
  }

  /* post */
  @Query(() => Post, { nullable: true })
  post(
    @Arg("id", () => Int)
    id: number,
    @Ctx()
    { em }: MyContext
  ): Promise<Post | null> {
    return em.findOne(Post, { id });
  }

  /* ************************** */
  /*          Mutations         */
  /* ************************** */

  /* createPost */
  @Mutation(() => Post)
  async createPost(
    @Arg("title", () => String)
    title: string,
    @Ctx()
    { em }: MyContext
  ): Promise<Post> {
    const post = em.create(Post, { title });
    await em.persistAndFlush(post);
    return post;
  }

  /* updatePost */
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id")
    id: number,
    @Arg("title")
    title: string,
    @Ctx()
    { em }: MyContext
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { id });
    if (!post) {
      return null;
    }
    post.title = title;
    await em.persistAndFlush(post);
    return post;
  }

  /* deletePost */
  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id")
    id: number,
    @Ctx()
    { em }: MyContext
  ): Promise<Boolean> {
    try {
      await em.nativeDelete(Post, { id });
    } catch {
      return false;
    }
    return true;
  }
}
