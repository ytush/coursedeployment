import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useWeb3 } from "@/lib/web3";

export default function ConnectWalletButton() {
  const { isConnected, account, connectWallet, disconnectWallet } = useWeb3();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (isConnected) {
      disconnectWallet();
      return;
    }

    setIsConnecting(true);
    try {
      await connectWallet();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Get shortened wallet address for display
  const shortenedAddress = isConnected && account
    ? `${account.substring(0, 4)}...${account.substring(account.length - 4)}`
    : "";

  return (
    <Button
      onClick={handleConnect}
      className={`relative inline-flex items-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-semibold shadow-sm ${
        isConnected ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-indigo-600"
      }`}
      disabled={isConnecting}
    >
      {isConnecting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4" />
          {isConnected ? shortenedAddress : "Connect Wallet"}
        </>
      )}
    </Button>
  );
}
