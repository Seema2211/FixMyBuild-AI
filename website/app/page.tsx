import { Navbar }         from '@/components/layout/Navbar';
import { Footer }         from '@/components/layout/Footer';
import { Hero }           from '@/components/sections/Hero';
import { Stats }          from '@/components/sections/Stats';
import { HowItWorks }     from '@/components/sections/HowItWorks';
import { Features }       from '@/components/sections/Features';
import { SelfLearning }   from '@/components/sections/SelfLearning';
import { Integrations }   from '@/components/sections/Integrations';
import { Pricing }        from '@/components/sections/Pricing';
import { FAQ }            from '@/components/sections/FAQ';
import { FinalCTA }       from '@/components/sections/FinalCTA';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Stats />
        <HowItWorks />
        <Features />
        <SelfLearning />
        <Integrations />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
