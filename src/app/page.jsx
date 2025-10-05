import HeroSection from "./components/sections/Herosection";
import AuctionItems from './components/sections/AuctionItems';
import EndingSoon from './components/sections/EndingSoon';
import LiveAuctions from './components/sections/LiveAuctions';

export default function Home() {
  return (
    <>
      <HeroSection />
      <AuctionItems />
      <EndingSoon />
      <LiveAuctions />
    </>
  );
}
