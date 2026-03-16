import React from 'react';

export const HeroSection: React.FC = () => {
  return (
    <div className="text-center mb-16">
      <h2 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mb-6">
        Trade Digital Assets P2P
      </h2>
      <p className="text-xl text-gray-400 max-w-3xl mx-auto">
        Decentralized barter marketplace on Substrate
      </p>
    </div>
  );
};

export default HeroSection;
