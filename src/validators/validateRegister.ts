import { UserInput } from "../models/UserInput";

export const validateRegister = (options: UserInput) => {
  if (options.username.length <= 2) {
    return [
      {
        field: "username",
        message: "User name must be 3 chars long or more",
      },
    ];
  }

  if (options.username.includes("@")) {
    return [
      {
        field: "username",
        message: "Cannot include @",
      },
    ];
  }

  if (options.password.length <= 3) {
    return [
      {
        field: "password",
        message: "Password must be 4 chars long or more",
      },
    ];
  }

  if (!options.email.includes("@")) {
    return [
      {
        field: "email",
        message: "Invalid email",
      },
    ];
  }

  return null;
};
