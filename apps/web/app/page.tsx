import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustedLogos } from "@/components/landing/TrustedLogos";
import { Features } from "@/components/landing/Features";
import { Proof } from "@/components/landing/Proof";
import { Marquee } from "@/components/landing/Marquee";
import { Vision } from "@/components/landing/Vision";
import { Showcase } from "@/components/landing/Showcase";
import { Roadmap } from "@/components/landing/Roadmap";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <TrustedLogos />
      <Features />
      <Proof />
      <Marquee />
      <Vision />
      <Showcase />
      <Roadmap />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}
