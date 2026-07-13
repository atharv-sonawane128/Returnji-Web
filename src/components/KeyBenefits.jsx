import { ShieldCheck, Smartphone, Globe } from "lucide-react";

export default function KeyBenefits() {
  const benefits = [
    {
      title: "100% SECURE",
      desc: "Your personal details remain completely hidden. Finders contact you through our proxy system.",
      icon: <ShieldCheck className="w-16 h-16 text-dark-green" />
    },
    {
      title: "NO APP NEEDED",
      desc: "Finders don't need to download anything. Any smartphone camera can scan and report.",
      icon: <Smartphone className="w-16 h-16 text-dark-green" />
    },
    {
      title: "WORKS GLOBALLY",
      desc: "Travel with confidence. Returnji works anywhere in the world with an internet connection.",
      icon: <Globe className="w-16 h-16 text-dark-green" />
    }
  ];

  return (
    <section className="w-full bg-bright-white text-dark-green px-4 sm:px-6 py-16 md:py-28">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-ultra text-3xl sm:text-4xl md:text-5xl text-center uppercase mb-12 md:mb-16">
          What Are The<br />Key Benefits?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {benefits.map((benefit, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl sm:rounded-[2rem] border-4 border-dark-green bg-light-beige flex items-center justify-center mb-6 shadow-[6px_6px_0px_0px_rgba(59,80,52,1)] sm:shadow-[8px_8px_0px_0px_rgba(59,80,52,1)] hover:-translate-y-2 transition-transform duration-300">
                {benefit.icon}
              </div>
              <h3 className="font-bricolage font-extrabold text-xl sm:text-2xl uppercase mb-3">
                {benefit.title}
              </h3>
              <p className="font-bricolage text-dark-green/80 font-medium leading-relaxed max-w-sm">
                {benefit.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
