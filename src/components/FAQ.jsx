"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

const faqs = [
  {
    q: "How does the finder contact me?",
    a: "When a finder scans the QR code, they are taken to a secure webpage where they can send you a message or share their location without seeing your personal information."
  },
  {
    q: "Do I have to pay a monthly subscription?",
    a: "No! The basic Returnji service is completely free for life with the purchase of any tag."
  },
  {
    q: "Is it waterproof?",
    a: "Yes, our epoxy and metal tags are 100% waterproof and designed to withstand the elements."
  },
  {
    q: "Can I use it on my pet?",
    a: "Absolutely! Our tags are perfect for pet collars and offer a modern alternative to traditional engraved tags."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="w-full bg-dark-green text-bright-white px-6 py-20 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 md:gap-8">
        
        {/* Left Side */}
        <div className="w-full md:w-[45%] flex flex-col relative items-center md:items-start text-center md:text-left">
          <h2 className="font-ultra text-6xl sm:text-7xl md:text-[8rem] leading-none uppercase mb-4 md:mb-8 z-10">
            FAQS
          </h2>
          
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-96 md:h-96 mt-4 md:mt-12 -rotate-6 hover:rotate-0 transition-transform duration-500 z-0">
            <img 
              src="/landing-06.png" 
              alt="Floating sticker" 
              className="object-contain w-full h-full drop-shadow-2xl opacity-90"
            />
          </div>
        </div>

        {/* Right Side - Accordion */}
        <div className="w-full md:w-[55%] flex flex-col justify-center space-y-4">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className="border-b-2 border-light-beige/20 pb-4 overflow-hidden"
            >
              <button 
                onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                className="w-full flex items-center justify-between py-4 text-left group"
              >
                <h3 className="font-bricolage font-bold text-lg sm:text-xl md:text-2xl pr-8 group-hover:opacity-80 transition-opacity">
                  {faq.q}
                </h3>
                <div className="shrink-0 bg-bright-white text-dark-green p-2 rounded-full">
                  {openIndex === i ? (
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
              </button>
              
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  openIndex === i ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="font-bricolage text-bright-white/80 text-base sm:text-lg py-4">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
