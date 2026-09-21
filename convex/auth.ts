import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { PasswordResetOTP } from "./passwordReset";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      reset: PasswordResetOTP,
      profile(params) {
        return {
          email: String(params.email ?? "")
            .trim()
            .toLowerCase(),
        };
      },
    }),
  ],
});
