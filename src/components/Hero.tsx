import { Button } from "@/components/ui/button";
import { Code, Download } from "lucide-react";

const Hero = () => {
  return (
    <section className="section-hero section-shaped my-0">
      <div className="shape shape-style-1 shape-primary shape-skew">
        <span className="span-150" style={{ left: '-4%', bottom: 'auto' }}></span>
        <span className="span-50" style={{ top: '10%', right: '4%' }}></span>
        <span className="span-50" style={{ top: '280px', right: '5.66666%' }}></span>
        <span className="span-75" style={{ top: '320px', right: '7%' }}></span>
        <span className="span-100" style={{ top: '38%', left: '1%', right: 'auto' }}></span>
        <span className="span-75" style={{ top: '44%', left: '10%', right: 'auto' }}></span>
        <span className="span-50" style={{ bottom: '50%', right: '36%' }}></span>
        <span className="span-100" style={{ bottom: '70px', right: '2%' }}></span>
        <span className="span-50" style={{ bottom: '1%', right: '2%' }}></span>
        <span className="span-100" style={{ bottom: '1%', left: '1%', right: 'auto' }}></span>
      </div>
      <div className="container shape-container flex items-center py-32">
        <div className="col px-0">
          <div className="row justify-center items-center">
            <div className="col-lg-7 text-center pt-lg">
              <h1 className="text-4xl md:text-6xl font-bold text-white">SonicVote</h1>
              <p className="lead text-white mt-4 mb-5">
                A decentralized, transparent, and secure voting platform built on the Sonic Testnet.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" variant="secondary">
                  <Code className="mr-2 h-5 w-5" />
                  <span>View Active Elections</span>
                </Button>
                <Button size="lg">
                  <Download className="mr-2 h-5 w-5" />
                  <span>Create New Election</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;