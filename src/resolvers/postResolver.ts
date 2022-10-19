import { Arg, Int, Mutation, Query, Resolver } from "type-graphql";
import { Post } from "../entities/Post";

@Resolver()
export class PostResolver {
  /* ************************** */
  /*          Queries           */
  /* ************************** */

  /* posts */
  @Query(() => [Post])
  async posts(): Promise<Post[]> {
    return Post.find();
  }

  /* post */
  @Query(() => Post, { nullable: true })
  post(
    @Arg("id", () => Int)
    id: number
  ): Promise<Post | null> {
    return Post.findOneBy({ id });
  }

  /* ************************** */
  /*          Mutations         */
  /* ************************** */

  /* createPost */
  @Mutation(() => Post)
  async createPost(
    @Arg("title", () => String)
    title: string
  ): Promise<Post> {
    return Post.create({ title }).save();
  }

  /* updatePost */
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id")
    id: number,
    @Arg("title")
    title: string
  ): Promise<Post | null> {
    const post = await Post.findOneBy({ id });
    if (!post) {
      return null;
    }
    //post.title = title;
    //post.save();
    Post.update({ id }, { title });
    return post;
  }

  /* deletePost */
  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id")
    id: number
  ): Promise<Boolean> {
    try {
      await Post.delete({ id });
    } catch {
      return false;
    }
    return true;
  }
}
