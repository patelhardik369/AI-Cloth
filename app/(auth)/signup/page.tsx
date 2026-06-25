import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create your studio",
  description:
    "Create your Sari AI studio and turn any sari into an advertisement-ready 4K fashion shoot. 10 free generations every day.",
};

export default function SignupPage() {
  return <SignupForm />;
}
