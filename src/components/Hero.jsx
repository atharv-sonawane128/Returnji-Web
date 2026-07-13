import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="w-full px-4 sm:px-6 py-12 md:py-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
      <div className="w-full md:w-[55%] flex flex-col items-start text-left">
        <h1 className="font-ultra text-4xl sm:text-5xl md:text-6xl lg:text-[5.5rem] leading-[1.2] md:leading-[0.95] tracking-wide md:tracking-normal text-dark-green uppercase mb-5 md:mb-8 w-full">
          LOST<br /><span className="whitespace-nowrap">SOMETHING?</span>
        </h1>
        <p className="font-bricolage text-[10px] sm:text-sm md:text-base font-bold uppercase text-dark-green/80 tracking-widest leading-relaxed mb-8 sm:mb-12 max-w-md">
          GET YOUR LOST ITEM BACK AT YOUR DOORSTEP
        </p>

        <div className="flex flex-row flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Link
            href="/shop"
            className="flex-1 sm:flex-none text-center bg-dark-green text-light-beige px-5 py-3.5 sm:px-8 sm:py-4 rounded-full font-bricolage font-bold text-xs sm:text-sm md:text-base hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            SHOP NOW
          </Link>
          <Link
            href="#app"
            className="flex-1 sm:flex-none text-center bg-light-beige text-dark-green px-5 py-3.5 sm:px-8 sm:py-4 rounded-full font-bricolage font-bold text-xs sm:text-sm md:text-base hover:bg-[#e0d9cc] transition-colors whitespace-nowrap"
          >
            DOWNLOAD APP
          </Link>
        </div>
      </div>

      <div className="w-full md:w-[45%] flex justify-center items-center mt-6 sm:mt-12 md:mt-0 relative px-4 sm:px-0">
        {/* Abstract decorative blob behind image */}
        <div className="absolute inset-0 bg-bright-white rounded-full blur-3xl opacity-50 transform scale-90"></div>

        <div className="relative w-full max-w-md aspect-[4/5] rounded-[2rem] sm:rounded-[3rem] overflow-hidden drop-shadow-2xl">
          <img
            src="/landing-01.png"
            alt="Returnji smart keychain tag"
            className="object-cover w-full h-full"
          />
        </div>
      </div>
    </section>
  );
}
