export default function WhatIsReturnji() {
  return (
    <section className="w-full bg-dark-green rounded-t-[2rem] sm:rounded-t-[3rem] px-6 py-16 md:py-24 text-bright-white overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-20">
        
        <div className="w-full md:w-1/2 flex flex-col items-start text-left">
          <h2 className="font-ultra text-4xl sm:text-5xl md:text-[5rem] leading-[0.9] uppercase mb-6 sm:mb-8">
            WHAT IS RETURNJI?
          </h2>
          <p className="font-bricolage text-base sm:text-lg md:text-xl leading-relaxed text-bright-white/90">
            Returnji is the smartest way to protect your everyday essentials. 
            Attach our beautifully designed QR tags to your keys, bags, or pets. 
            If someone finds your lost item, they simply scan the code to contact you anonymously and securely. 
            No batteries. No tracking. Just peace of mind.
          </p>
        </div>

        <div className="w-full md:w-1/2 flex justify-center">
          <div className="w-full max-w-sm md:max-w-md aspect-[3/4] relative rounded-[2rem] sm:rounded-[3rem] overflow-hidden drop-shadow-2xl border-4 border-light-beige/10">
             <img 
              src="/landing-02.png" 
              alt="Person holding keys with Returnji tag" 
              className="object-cover w-full h-full"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
