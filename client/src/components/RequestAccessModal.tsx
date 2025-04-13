import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/lib/web3";
import { apiRequest } from "@/lib/queryClient";

interface RequestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  courseTitle: string;
  ownerAddress: string;
}

export default function RequestAccessModal({ 
  isOpen, 
  onClose, 
  courseId, 
  courseTitle,
  ownerAddress 
}: RequestAccessModalProps) {
  const [requestDuration, setRequestDuration] = useState("7");
  const [requestMessage, setRequestMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { account } = useWeb3();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to request access",
        variant: "destructive"
      });
      return;
    }
    
    const duration = parseInt(requestDuration);
    if (isNaN(duration) || duration < 1 || duration > 90) {
      toast({
        title: "Invalid duration",
        description: "Please enter a duration between 1 and 90 days",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", "/api/access-requests", {
        courseId,
        requesterAddress: account,
        ownerAddress,
        requestMessage,
        requestDuration: duration
      });
      
      if (response.ok) {
        toast({
          title: "Request Sent",
          description: "Your access request has been sent to the course owner."
        });
        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to send request");
      }
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message || "There was an error sending your request",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Temporary Access</DialogTitle>
          <DialogDescription>
            Send a request to the course owner for temporary access to "{courseTitle}".
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duration (days)
              </Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="90"
                value={requestDuration}
                onChange={(e) => setRequestDuration(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="message" className="text-right">
                Message
              </Label>
              <Textarea
                id="message"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Explain why you're requesting access to this course..."
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Sending...
                </>
              ) : (
                "Send Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}