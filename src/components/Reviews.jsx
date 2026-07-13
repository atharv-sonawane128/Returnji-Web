import { Star } from "lucide-react";

const reviews = [
  {
    name: "Subham Yadav",
    quote: "I lost my keys at a coffee shop and had them back within an hour thanks to the Returnji tag. Absolutely brilliant and looks stylish too!",
    rating: 5
  },
  {
    name: "Aditya Gore",
    quote: "The peace of mind is worth every penny. I put these on my luggage, my dog, and my backpack. The setup took less than a minute.",
    rating: 5
  },
  {
    name: "Kiran Jhala",
    quote: "I love that I don't have to recharge it like other trackers. Plus, the matte black finish looks so premium on my keychain.",
    rating: 5
  }
];

export default function Reviews() {
  return (
    <section className="w-full bg-bright-white text-dark-green px-4 sm:px-6 py-16 md:py-32">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-ultra text-3xl sm:text-4xl md:text-5xl text-center uppercase mb-12 md:mb-16">
          Early Reviews
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {reviews.map((review, i) => (
            <div
              key={i}
              className="bg-light-beige p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-sm flex flex-col justify-between hover:shadow-lg transition-shadow duration-300"
            >
              <div>
                <div className="flex gap-1 mb-6">
                  {[...Array(review.rating)].map((_, idx) => (
                    <Star key={idx} className="w-5 h-5 fill-dark-green text-dark-green" />
                  ))}
                </div>
                <p className="font-bricolage text-lg md:text-xl font-medium leading-relaxed mb-8">
                  "{review.quote}"
                </p>
              </div>
              <p className="font-bricolage font-extrabold uppercase tracking-wide">
                — {review.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
