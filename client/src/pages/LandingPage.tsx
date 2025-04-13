import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/lib/web3";
import { motion } from "framer-motion";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { isConnected, connectWallet } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to home if already connected
  useEffect(() => {
    if (isConnected) {
      setLocation("/");
    }
  }, [isConnected, setLocation]);

  const handleConnectClick = async () => {
    setIsLoading(true);
    try {
      await connectWallet();
      // Redirect will happen automatically due to the useEffect
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 text-white overflow-hidden">
      {/* Animated particles/orbs background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[150px] h-[150px] rounded-full bg-white opacity-[0.03]"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
              ],
            }}
            transition={{
              duration: 20 + Math.random() * 30,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl w-full text-center">
        {/* Logo */}
        <motion.div 
          className="mb-8 flex justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center relative">
            <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-10 h-10 md:w-16 md:h-16 text-white"
              >
                <path 
                  d="M12 2L2 7L12 12L22 7L12 2Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M2 17L12 22L22 17" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M2 12L12 17L22 12" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="absolute -right-1 -bottom-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-white"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1 
          className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-200">
            Course<span className="text-white">Chain</span>
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p 
          className="text-xl md:text-2xl text-purple-200 mb-12 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Decentralized education on the blockchain. Learn, share, own.
        </motion.p>

        {/* Connect Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <Button 
            size="lg" 
            onClick={handleConnectClick} 
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-lg px-8 py-6 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Connecting...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 mr-2"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M6 8h.01" />
                  <path d="M12 8h.01" />
                  <path d="M18 8h.01" />
                  <path d="M12 12h.01" />
                  <path d="M18 12h.01" />
                  <path d="M6 16h.01" />
                  <path d="M12 16h.01" />
                  <path d="M18 16h.01" />
                </svg>
                Connect Wallet
              </>
            )}
          </Button>
        </motion.div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            className="bg-white bg-opacity-5 backdrop-blur-sm p-6 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <div className="bg-purple-500 rounded-full w-12 h-12 flex items-center justify-center mb-4 mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">NFT Ownership</h3>
            <p className="text-purple-200">Own your educational content as unique digital assets on the blockchain.</p>
          </motion.div>

          <motion.div 
            className="bg-white bg-opacity-5 backdrop-blur-sm p-6 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            <div className="bg-indigo-500 rounded-full w-12 h-12 flex items-center justify-center mb-4 mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Shared Access</h3>
            <p className="text-purple-200">Share access to your courses with friends without giving up ownership.</p>
          </motion.div>

          <motion.div 
            className="bg-white bg-opacity-5 backdrop-blur-sm p-6 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3 }}
          >
            <div className="bg-pink-500 rounded-full w-12 h-12 flex items-center justify-center mb-4 mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Create Courses</h3>
            <p className="text-purple-200">Build and publish your own educational content and earn from your expertise.</p>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-24 text-sm text-purple-300 opacity-70">
        © 2025 CourseChain - Decentralized Education Platform
      </div>
    </div>
  );
}