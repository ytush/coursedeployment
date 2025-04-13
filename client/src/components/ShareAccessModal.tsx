import { useState } from "react";
import { useWeb3 } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Share2 } from "lucide-react";

interface ShareAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownershipId: number;
}

export default function ShareAccessModal({ isOpen, onClose, ownershipId }: ShareAccessModalProps) {
  const { shareTemporaryAccess } = useWeb3();
  const { toast } = useToast();
  
  const [recipientAddress, setRecipientAddress] = useState("");
  const [duration, setDuration] = useState("7");
  const [isSharing, setIsSharing] = useState(false);
  
  const durationOptions = [
    { value: "1", label: "1 day" },
    { value: "3", label: "3 days" },
    { value: "7", label: "7 days" },
    { value: "14", label: "14 days" },
    { value: "30", label: "30 days" }
  ];
  
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipientAddress(e.target.value);
  };
  
  const handleDurationChange = (value: string) => {
    setDuration(value);
  };
  
  const handleShare = async () => {
    if (!recipientAddress.startsWith("0x") || recipientAddress.length !== 42) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum wallet address",
        variant: "destructive"
      });
      return;
    }
    
    setIsSharing(true);
    
    try {
      const result = await shareTemporaryAccess(
        ownershipId,
        recipientAddress,
        parseInt(duration)
      );
      
      if (result.success) {
        toast({
          title: "Access Shared",
          description: `Temporary access has been granted to ${recipientAddress.substring(0, 6)}...${recipientAddress.substring(38)}`
        });
        onClose();
        setRecipientAddress("");
        setDuration("7");
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to share access",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Temporary Access</DialogTitle>
          <DialogDescription>
            Grant temporary access to this course. The recipient will be able to view the course content until the access period expires.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="recipient" className="text-right">
              Recipient
            </Label>
            <Input
              id="recipient"
              placeholder="0x wallet address"
              className="col-span-3"
              value={recipientAddress}
              onChange={handleAddressChange}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              Duration
            </Label>
            <Select 
              value={duration} 
              onValueChange={handleDurationChange}
            >
              <SelectTrigger className="col-span-3" id="duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleShare}
            disabled={isSharing || !recipientAddress}
          >
            {isSharing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Share Access
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
