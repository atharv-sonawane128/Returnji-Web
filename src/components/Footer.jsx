export default function Footer() {
  return (
    <footer className="w-full bg-dark-green text-bright-white relative overflow-hidden">
      {/* Background abstract scribble */}
      <svg
        className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none"
        viewBox="0 0 1000 500"
        preserveAspectRatio="none"
      >
        <path d="M0,250 C200,100 300,400 500,250 C700,100 800,400 1000,250" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 20" />
        <path d="M0,150 C200,300 400,0 600,200 C800,400 900,100 1000,150" fill="none" stroke="currentColor" strokeWidth="4" />
      </svg>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-32 relative z-10 flex flex-col md:flex-row gap-12 md:gap-8 justify-between">

        {/* Left Side */}
        <div className="w-full md:w-1/2 flex flex-col text-center md:text-left items-center md:items-start">
          <p className="font-bricolage font-bold uppercase tracking-widest text-bright-white/70 mb-4">
            Got Questions?
          </p>
          <h2 className="font-ultra text-4xl sm:text-5xl md:text-7xl leading-[0.9] uppercase break-words hyphens-auto w-full">
            GET IN TOUCH<br />WITH US!
          </h2>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-1/3 flex flex-col justify-end space-y-8 text-center md:text-left">
          <a
            href="mailto:support@returnji.com"
            className="group flex flex-col pb-4 border-b border-light-beige/20 hover:border-light-beige transition-colors items-center md:items-start"
          >
            <span className="font-bricolage text-sm font-bold uppercase text-bright-white/70 mb-2 group-hover:text-bright-white transition-colors">Email Us</span>
            <span className="font-bricolage text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">support@returnji.com</span>
          </a>

          <div className="flex flex-col pb-4 border-b border-light-beige/20 items-center md:items-start">
            <span className="font-bricolage text-sm font-bold uppercase text-bright-white/70 mb-4">Follow Us</span>
            <div className="flex items-center space-x-6">
              <a href="https://www.instagram.com/returnji.app/" className="hover:-translate-y-1 transition-transform p-3 bg-bright-white/10 rounded-full hover:bg-bright-white hover:text-dark-green">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
              </a>
              <a href="#" className="hover:-translate-y-1 transition-transform p-3 bg-bright-white/10 rounded-full hover:bg-bright-white hover:text-dark-green">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
              </a>
              <a href="#" className="hover:-translate-y-1 transition-transform p-3 bg-bright-white/10 rounded-full hover:bg-bright-white hover:text-dark-green">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full text-center py-6 border-t border-light-beige/10 relative z-10">
        <p className="font-bricolage text-sm font-medium text-bright-white/50">
          © {new Date().getFullYear()} Returnji. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
