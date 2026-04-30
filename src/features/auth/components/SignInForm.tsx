"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  getProfilesFromAuthResponse,
  isOnboardingRedirectPath,
  resolveAuthRedirect,
} from "@/lib/auth/redirect";
import { createSignInSchema, type SignInFormData } from "../lib/sign-in.schemas";
import { useSignIn } from "../hooks/useSignIn";
import { getSafeRedirectPath } from "../lib/redirect";
import { setPendingProfileSelection } from "../lib/profile-selection-session";
import {
  extractSignupToken,
  setPendingSignupEmail,
  setPendingSignupToken,
} from "../lib/registration-session";
import { isInvalidSignInError } from "../lib/sign-in-errors";

export function SignInForm() {
  const t = useTranslations("auth.signIn");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutateAsync, isError, error } = useSignIn();
  const redirectTo = getSafeRedirectPath(searchParams.get("redirectTo"));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(createSignInSchema(t)),
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      const res = await mutateAsync(data);
      const nextPath = resolveAuthRedirect(res, data.email);

      if (isOnboardingRedirectPath(nextPath)) {
        const signupToken = extractSignupToken(res);

        setPendingSignupEmail(data.email);
        if (signupToken) setPendingSignupToken(signupToken);
        router.replace(nextPath);
        return;
      }

      if (nextPath === "/select-profile") {
        setPendingProfileSelection({
          profiles: getProfilesFromAuthResponse(res),
        });
        router.replace(
          `/select-profile?redirectTo=${encodeURIComponent(redirectTo)}`,
        );
      }
    } catch {
      // error state handled via mutation.isError
    }
  };

  const apiErrorMessage =
    isError && isInvalidSignInError(error)
      ? t("errors.invalidCredentials")
      : isError
        ? t("errors.serverError")
        : null;

  const inputClass = cn(
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black",
    "placeholder:text-gray-400 outline-none transition-colors",
    "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full flex flex-col gap-5"
    >
      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm text-brand-black">
          {t("emailLabel")}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className={cn(inputClass, errors.email && "border-red-400")}
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm text-brand-black">
            {t("passwordLabel")}
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? (
              <Eye className="size-4" />
            ) : (
              <EyeOff className="size-4" />
            )}
            {showPassword ? t("hidePassword") : t("showPassword")}
          </button>
        </div>
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          {...register("password")}
          className={cn(inputClass, errors.password && "border-red-400")}
        />
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      {/* API error */}
      {apiErrorMessage && (
        <p className="text-sm text-red-500 text-center">{apiErrorMessage}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 w-full rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white hover:bg-brand-primary/90 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
      >
        {t("submitButton")}
      </button>

      {/* Forgot password */}
      <Link
        href="/forgot-password"
        className="text-right text-sm text-brand-secondary underline underline-offset-2 hover:opacity-80 transition-opacity"
      >
        {t("forgotPassword")}
      </Link>
    </form>
  );
}
