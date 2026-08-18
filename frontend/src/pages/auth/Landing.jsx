import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, CheckCircle2, UserPlusIcon } from "lucide-react";

const FEATURES = [
  "Patient management with full treatment history",
  "Smart appointment scheduling & calendar",
  "Payment tracking with credit support",
  "Inventory & expense management",
];

// Drop your own photos in resources/js/assets/landing/ (or public/images/landing/
// if you're not running them through the bundler) using these exact file
// names, and the carousel below will pick them up automatically. Suggested
// shots: your clinic's waiting room, a treatment in progress, the front
// desk, a happy patient — 1600×1000px or similar wide crop works best.
//   hero-1.jpg  hero-2.jpg  hero-3.jpg  hero-4.jpg
const HERO_IMAGES = [
  { src: "/images/landing/hero-1.jpg", alt: "Dr. Rediet Dental Clinic — patient care" },
  { src: "/images/landing/hero-2.jpg", alt: "Modern dental treatment room" },
  { src: "/images/landing/hero-3.jpg", alt: "Clinic reception in Addis Ababa" },
  { src: "/images/landing/hero-4.jpg", alt: "Dental team at work" },
];

const SLIDE_INTERVAL_MS = 5000;

function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const anyImageLoaded = HERO_IMAGES.some((_, i) => !failed[i]);

  return (
    <div className="absolute inset-0">
      {anyImageLoaded ? (
        HERO_IMAGES.map((img, i) =>
          failed[i] ? null : (
            <img
              key={img.src}
              src={img.src}
              alt={img.alt}
              onError={() => setFailed((f) => ({ ...f, [i]: true }))}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
            />
          )
        )
      ) : (
        // Fallback while you haven't added photos yet — keeps the page
        // looking finished instead of showing broken image icons.
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B7A7A] to-[#0EA5A5]" />
      )}

      {/* Darken for text legibility over any photo */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30" />

      {/* Slide indicator dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Show slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left — brand panel with rotating photo carousel */}
      <div className="hidden md:flex flex-col items-center justify-center text-white p-10 relative overflow-hidden">
        <HeroCarousel />

        <div className="relative z-10 text-center max-w-sm">
          <h2 className="text-3xl font-bold mb-3">Modern Dental Clinic Management</h2>
          <p className="text-white/90">
            Trusted by dental clinics across Ethiopia for streamlined operations.
          </p>
          <div className="flex justify-center gap-8 mt-8">
            <div>
              <p className="text-2xl font-bold font-nums">500+</p>
              <p className="text-xs text-white/80">Patients</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-nums">99.9%</p>
              <p className="text-xs text-white/80">Uptime</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-nums">4.9★</p>
              <p className="text-xs text-white/80">Rated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — welcome content */}
      <div className="flex flex-col justify-center px-8 md:px-16 py-12 max-w-xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-[#0EA5A5] flex items-center justify-center">
            <Heart size={20} className="text-white" />
          </div>
          <div>
            <p className="font-heading font-bold text-lg leading-tight text-[#2B2B2B]">DentiTrack</p>
            <p className="text-xs text-[#5B6B72] leading-tight">Track. Manage. Treat.</p>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-[#2B2B2B] mb-3">
          Welcome to the future of dental clinic management
        </h1>
        <p className="text-[#5B6B72] mb-6">
          DentiTrack helps dental clinics manage patients, appointments, treatments,
          payments, inventory and business operations — all in one place.
        </p>

        <ul className="space-y-2 mb-8">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-[#2B2B2B]">
              <CheckCircle2 size={16} className="text-[#0EA5A5] shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-[#0EA5A5] hover:bg-[#0B7A7A] transition-colors text-white font-semibold py-3.5 rounded-xl shadow-card"
          >
            Log In to DentiTrack
          </button>

          <Link
            to="/register-clinic"
            className="w-full border-2 border-[#0EA5A5] text-[#0EA5A5] hover:bg-[#0EA5A5] hover:text-white transition-colors font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2"
          >
            <UserPlusIcon size={18} />
            Register Clinic
          </Link>
        </div>

        <p className="text-center text-xs text-[#5B6B72] mt-3">
          Access is provided by your clinic administrator
        </p>
      </div>
    </div>
  );
};

export default Landing;
