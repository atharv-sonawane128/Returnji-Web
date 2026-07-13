import Hero from "@/components/Hero";
import WhatIsReturnji from "@/components/WhatIsReturnji";
import KeyBenefits from "@/components/KeyBenefits";
import FAQ from "@/components/FAQ";
import Reviews from "@/components/Reviews";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-bright-white selection:bg-dark-green selection:text-light-beige">
      <Hero />
      <WhatIsReturnji />
      <KeyBenefits />
      <FAQ />
      <Reviews />
    </main>
  );
}
