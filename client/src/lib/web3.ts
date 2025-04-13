import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import { apiRequest, queryClient } from "./queryClient";
import { useToast } from "@/hooks/use-toast";

interface Web3ContextType {
  isConnected: boolean;
  account: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  userId: number | null;
  mintNFT: (courseId: number, price: string) => Promise<{
    success: boolean;
    message: string;
    ownershipId?: number;
    transactionHash?: string;
  }>;
  shareTemporaryAccess: (
    ownershipId: number,
    recipientAddress: string,
    durationDays: number
  ) => Promise<{
    success: boolean;
    message: string;
  }>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const { toast } = useToast();

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          
          if (accounts.length > 0) {
            const address = accounts[0].address;
            setProvider(provider);
            setAccount(address);
            setIsConnected(true);
            
            // Register or get the user from our backend
            try {
              const response = await apiRequest('POST', '/api/users/connect-wallet', { walletAddress: address });
              const userData = await response.json();
              setUserId(userData.id);
            } catch (error) {
              console.error("Error connecting wallet to backend:", error);
            }
          }
        } catch (error) {
          console.error("Failed to check wallet connection:", error);
        }
      }
    };
    
    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnectWallet();
        } else {
          // User switched accounts
          setAccount(accounts[0]);
          // Update our backend
          apiRequest('POST', '/api/users/connect-wallet', { walletAddress: accounts[0] })
            .then(res => res.json())
            .then(userData => setUserId(userData.id))
            .catch(error => console.error("Error updating wallet connection:", error));
        }
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to connect your wallet",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        setProvider(provider);
        setAccount(accounts[0]);
        setIsConnected(true);
        
        // Register or get the user from our backend
        try {
          const response = await apiRequest('POST', '/api/users/connect-wallet', { walletAddress: accounts[0] });
          const userData = await response.json();
          setUserId(userData.id);
          
          toast({
            title: "Wallet Connected",
            description: "Your wallet has been successfully connected"
          });
        } catch (error) {
          console.error("Error connecting wallet to backend:", error);
          toast({
            title: "Connection Error",
            description: "Failed to connect wallet to the platform",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to your wallet",
        variant: "destructive"
      });
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAccount(null);
    setProvider(null);
    setUserId(null);
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected"
    });
  };

  // Function to mint an NFT for a course
  const mintNFT = async (courseId: number, price: string) => {
    if (!isConnected || !account || !provider || !userId) {
      return {
        success: false,
        message: "Wallet not connected"
      };
    }
    
    try {
      // Mock transaction for demo purposes
      // In a real app, this would interact with a smart contract
      const signer = await provider.getSigner();
      
      // Simulate a transaction
      toast({
        title: "Processing Transaction",
        description: "Please confirm the transaction in your wallet"
      });
      
      // Simulate a delay for the transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a mock transaction hash
      const transactionHash = `0x${Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      // Generate a mock token ID
      const tokenId = `${Date.now()}`;
      
      // Register the NFT ownership in our backend
      const response = await apiRequest('POST', '/api/nft/mint', {
        courseId,
        ownerId: userId,
        tokenId,
        transactionHash
      });
      
      const ownership = await response.json();
      
      // Invalidate relevant queries after minting
      queryClient.invalidateQueries({ queryKey: ['/api/nft/owned', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId] });
      
      toast({
        title: "Success!",
        description: "Course NFT has been minted successfully"
      });
      
      return {
        success: true,
        message: "NFT minted successfully",
        ownershipId: ownership.id,
        transactionHash
      };
    } catch (error: any) {
      console.error("Failed to mint NFT:", error);
      
      toast({
        title: "Minting Failed",
        description: error.message || "Failed to mint the course NFT",
        variant: "destructive"
      });
      
      return {
        success: false,
        message: error.message || "Failed to mint NFT"
      };
    }
  };

  // Function to share temporary access
  const shareTemporaryAccess = async (
    ownershipId: number,
    recipientAddress: string,
    durationDays: number
  ) => {
    if (!isConnected || !userId) {
      return {
        success: false,
        message: "Wallet not connected"
      };
    }
    
    try {
      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);
      
      // Register temporary access in our backend
      const response = await apiRequest('POST', '/api/access/share', {
        ownershipId,
        recipientAddress,
        expiresAt: expiresAt.toISOString()
      });
      
      await response.json();
      
      toast({
        title: "Access Shared",
        description: `Temporary access has been granted to ${recipientAddress}`
      });
      
      return {
        success: true,
        message: "Temporary access shared successfully"
      };
    } catch (error: any) {
      console.error("Failed to share access:", error);
      
      toast({
        title: "Sharing Failed",
        description: error.message || "Failed to share temporary access",
        variant: "destructive"
      });
      
      return {
        success: false,
        message: error.message || "Failed to share access"
      };
    }
  };

  return React.createElement(
    Web3Context.Provider,
    { 
      value: {
        isConnected,
        account,
        connectWallet,
        disconnectWallet,
        userId,
        mintNFT,
        shareTemporaryAccess
      } 
    },
    children
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}

// Type extension for window to include ethereum property
declare global {
  interface Window {
    ethereum?: any;
  }
}
