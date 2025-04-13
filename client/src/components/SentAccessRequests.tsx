import { useQuery } from "@tanstack/react-query";
import { useWeb3 } from "@/lib/web3";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

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

export default function SentAccessRequests() {
  const { account } = useWeb3();

  // Fetch access requests sent by the current user
  const { data: requests, isLoading } = useQuery<AccessRequest[]>({
    queryKey: ['/api/access-requests/requester', account],
    queryFn: async () => {
      if (!account) return [];
      const response = await apiRequest('GET', `/api/access-requests/requester/${account}`);
      return response.json();
    },
    enabled: !!account,
  });

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
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Sent Requests</h3>
        <p className="text-gray-500">You haven't sent any access requests yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Your Sent Access Requests</h3>
      
      {requests.map((request) => (
        <Card key={request.id} className="p-4">
          <div>
            <h4 className="font-medium text-gray-900">{request.course.title}</h4>
            <p className="text-sm text-gray-500 mb-2">
              To: {request.ownerAddress.substring(0, 6)}...{request.ownerAddress.substring(request.ownerAddress.length - 4)}
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
                Sent {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
              </span>
              <span className="text-xs text-gray-500">
                For {request.requestDuration} days
              </span>
            </div>
            
            {request.requestMessage && (
              <div className="bg-gray-50 p-2 rounded-md mb-2 text-sm">
                <h5 className="text-xs text-gray-500 mb-1">Your message:</h5>
                <p className="text-gray-700">{request.requestMessage}</p>
              </div>
            )}
            
            {request.status === 'approved' && (
              <div className="mt-2 bg-green-50 p-2 rounded-md text-sm text-green-700">
                Your request was approved! You now have temporary access to this course.
              </div>
            )}
            
            {request.status === 'rejected' && (
              <div className="mt-2 bg-red-50 p-2 rounded-md text-sm text-red-700">
                Your request was rejected by the course owner.
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}