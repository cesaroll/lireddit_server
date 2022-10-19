import {MyContext} from "../types";
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { User } from "../entities/User";
import argon2 from "argon2";
import "express-session";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../utils/constants";
import { UserInput } from "../models/UserInput";
import { validateRegister } from "../validators/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
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
    { req }: MyContext
  ) {
    console.log("Session: ", req.session);

    // You are not logged in
    if (!req.session.userId) {
      return null;
    }

    return await User.findOneBy({ id: req.session.userId });
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
    { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(options.password);
    const user = User.create({
      username: options.username,
      email: options.email,
      password: hashedPassword,
    });

    try {
      await User.save(user);
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
    @Arg("usernameOrEmail")
    usernameOrEmail: string,
    @Arg("password")
    password: string,
    @Ctx()
    { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOneBy(
      usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "Username does not exist",
          },
        ],
      };
    }

    const valid = await argon2.verify(user.password, password);
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

  /** logout */
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

  /** forgot password */
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email")
    email: string,
    @Ctx()
    { redis }: MyContext
  ): Promise<Boolean> {
    const user = await User.findOneBy({ email });
    if (!user) {
      // Email does not exist in db. Do nothing
      return true;
    }

    const token = v4();

    await redis.set(
      FORGOT_PASSWORD_PREFIX + token,
      user.id,
      "EX",
      1000 * 60 * 60
    );

    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );
    return true;
  }

  /** changePassword */
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token")
    token: string,
    @Arg("newPassword")
    newPassword: string,
    @Ctx()
    { redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 3) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "Password must be 4 chars long or more",
          },
        ],
      };
    }

    const key = FORGOT_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    }

    const userIdNum = parseInt(userId);
    const user = await User.findOneBy({ id: userIdNum });
    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists",
          },
        ],
      };
    }

    await User.update(
      { id: userIdNum },
      { password: await argon2.hash(newPassword) }
    );

    await redis.del(key);

    // login user after changing password
    req.session!.userId = user.id;

    return { user };
  }
}
