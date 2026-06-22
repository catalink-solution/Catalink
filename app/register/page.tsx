import { redirect } from "next/navigation";
import { isPublicSignupAllowed } from "@/lib/signup-config";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  if (!isPublicSignupAllowed()) {
    redirect("/waitlist");
  }

  return <RegisterForm />;
}
