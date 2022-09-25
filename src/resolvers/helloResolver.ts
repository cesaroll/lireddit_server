import {Query, Resolver} from "type-graphql";

@Resolver()
export class HelloResolver {

  /* ************************** */
  /*          Queries           */
  /* ************************** */
  
  /* hello */
  @Query(() => String)
  hello() {
    return "Hello World!"
  }
}
