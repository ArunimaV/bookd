"use client";

import { OnboardingForm } from "@/dashboard/components/OnboardingForm";
import { C, FONT_LINK } from "@/dashboard/theme";
import { globalStyles } from "@/dashboard/styles";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    const savedBusiness = localStorage.getItem("teli_business");
    if (savedBusiness) {
      router.push("/");
    }
  }, [router]);

  const handleOnboardingComplete = (business: any) => {
    localStorage.setItem("teli_business", JSON.stringify(business));
    router.push("/");
  };

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{globalStyles}</style>
      <OnboardingForm onComplete={handleOnboardingComplete} />
    </>
  );
}
