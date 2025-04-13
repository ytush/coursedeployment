import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWeb3 } from "@/lib/web3";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, XCircle } from "lucide-react";

interface AccessRequest {
  id: number;
  courseId: number;
  requesterAddress: string;
  ownerAddress: string;
  requestMessage: string | null;
  requestDuration: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  course: {
    id: number;
    title: string;
    price: string;
  };
}

export default function AccessRequestsManager() {
  const { account } = useWeb3();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [requestToAction, setRequestToAction] = useState<AccessRequest | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Fetch access requests where the current user is the owner
  const { data: requests, isLoading } = useQuery<AccessRequest[]>({
    queryKey: ['/api/access-requests/owner', account],
    queryFn: async () => {
      if (!account) return [];
      const response = await apiRequest('GET', `/api/access-requests/owner/${account}`);
      return response.json();
    },
    enabled: !!account,
  });

  // Mutation to update request status
  const updateRequestStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/access-requests/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the requests query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/access-requests/owner', account] });
    },
  });

  // Handle approve request
  const handleApprove = async () => {
    if (!requestToAction) return;
    
    try {
      await updateRequestStatus.mutateAsync({ id: requestToAction.id, status: 'approved' });
      
      toast({
        title: "Request Approved",
        description: `Temporary access granted for ${requestToAction.requestDuration} days.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive"
      });
    } finally {
      setIsApproveDialogOpen(false);
      setRequestToAction(null);
    }
  };

  // Handle reject request
  const handleReject = async () => {
    if (!requestToAction) return;
    
    try {
      await updateRequestStatus.mutateAsync({ id: requestToAction.id, status: 'rejected' });
      
      toast({
        title: "Request Rejected",
        description: "The access request has been rejected."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive"
      });
    } finally {
      setIsRejectDialogOpen(false);
      setRequestToAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Access Requests</h3>
        <p className="text-gray-500">You don't have any pending access requests to manage.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Access Requests to Manage</h3>
      
      {requests.map((request) => (
        <Card key={request.id} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{request.course.title}</h4>
              <p className="text-sm text-gray-500 mb-2">
                From: {request.requesterAddress.substring(0, 6)}...{request.requesterAddress.substring(request.requesterAddress.length - 4)}
              </p>
              
              <div className="flex items-center space-x-2 mb-2">
                <Badge 
                  className={
                    request.status === 'pending' ? 'bg-yellow-500' : 
                    request.status === 'approved' ? 'bg-green-500' : 
                    'bg-red-500'
                  }
                >
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
                <span className="text-xs text-gray-500">
                  Requested {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                </span>
                <span className="text-xs text-gray-500">
                  For {request.requestDuration} days
                </span>
              </div>
              
              {request.requestMessage && (
                <div className="bg-gray-50 p-2 rounded-md mb-3 text-sm">
                  <p className="text-gray-700">{request.requestMessage}</p>
                </div>
              )}
            </div>
            
            {request.status === 'pending' && (
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-green-500 text-green-500 hover:bg-green-50"
                  onClick={() => {
                    setRequestToAction(request);
                    setIsApproveDialogOpen(true);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50"
                  onClick={() => {
                    setRequestToAction(request);
                    setIsRejectDialogOpen(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
      
      {/* Approve Dialog */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Access Request</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to grant temporary access to your course
              {requestToAction && (
                <strong className="block mt-1">"{requestToAction.course.title}"</strong>
              )}
              for {requestToAction?.requestDuration} days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateRequestStatus.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                "Approve"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Reject Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Access Request</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to reject the access request to your course 
              {requestToAction && (
                <strong className="block mt-1">"{requestToAction.course.title}"</strong>
              )}.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
            >
              {updateRequestStatus.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                "Reject"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}