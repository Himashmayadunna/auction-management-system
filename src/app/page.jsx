import HeroSection from "./components/sections/Herosection";
import AuctionItems from './components/sections/AuctionItems';
import EndingSoon from './components/sections/EndingSoon';
import NoSSR from './components/NoSSR';

export default function Home() {
  return (
    <div suppressHydrationWarning>
      <NoSSR fallback={<div className="h-96 bg-gray-100 animate-pulse"></div>}>
        <HeroSection />
      </NoSSR>
      <NoSSR fallback={<div className="h-64 bg-gray-100 animate-pulse"></div>}>
        <AuctionItems />
      </NoSSR>
      <NoSSR fallback={<div className="h-64 bg-gray-100 animate-pulse"></div>}>
        <EndingSoon />
      </NoSSR>
    </div>
  );
}
