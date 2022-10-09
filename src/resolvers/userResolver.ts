import {MyContext} from "../types";
import {Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver} from "type-graphql";
import { User } from '../entities/User';
import argon2 from "argon2";
import "express-session";
import { COOKIE_NAME } from "src/utils/constants";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

@InputType()
class UserInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  /* ************************** */
  /*          Queries           */
  /* ************************** */

  /* me */
  @Query(() => User, { nullable: true })
  async me(
    @Ctx()
    { req, em }: MyContext
  ) {
    console.log("Session: ", req.session);

    // You are not logged in
    if (!req.session.userId) {
      return null;
    }

    const user = await em.findOne(User, { id: req.session.userId });
    return user;
  }

  /* ************************** */
  /*          Mutations         */
  /* ************************** */

  /* register */
  @Mutation(() => UserResponse)
  async register(
    @Arg("options")
    options: UserInput,
    @Ctx()
    { em, req }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        errors: [
          {
            field: "username",
            message: "User name must be 3 chars long or more",
          },
        ],
      };
    }

    if (options.password.length <= 3) {
      return {
        errors: [
          {
            field: "password",
            message: "Password must be 4 chars long or more",
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });

    try {
      await em.persistAndFlush(user);
    } catch (err) {
      console.log(err);

      if (err.code === "23505" || err.detail.includes("already exists")) {
        return {
          errors: [
            {
              field: "username",
              message: "username is already taken",
            },
          ],
        };
      }

      return {
        errors: [
          {
            field: "username",
            message: err.detail,
          },
        ],
      };
    }

    // Set user id session
    // this will set a cookie on the user
    // keep them logged in
    req.session!.userId = user.id;

    return {
      user: user,
    };
  }

  /* login */
  @Mutation(() => UserResponse)
  async login(
    @Arg("options")
    options: UserInput,
    @Ctx()
    { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "Username does not exist",
          },
        ],
      };
    }

    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "Incorrect password",
          },
        ],
      };
    }

    req.session!.userId = user.id;

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  async logout(
    @Ctx()
    { req, res }: MyContext
  ): Promise<Boolean> {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }
}
