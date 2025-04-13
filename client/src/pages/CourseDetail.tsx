import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useWeb3 } from "@/lib/web3";
import { parseHumanDuration } from "@/lib/videoUtils";
import { apiRequest } from "@/lib/queryClient";
import { CourseWithContent } from "@shared/schema";
import VideoPlayer from "@/components/VideoPlayer";
import CourseContentAccordion from "@/components/CourseContentAccordion";
import ShareAccessModal from "@/components/ShareAccessModal";
import RequestAccessModal from "@/components/RequestAccessModal";
import CourseRatings from "@/components/CourseRatings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
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
import { Check, Clock, PlayCircle, ShoppingCart, Share2, Link, Star, Key } from "lucide-react";

export default function CourseDetail() {
  const { id } = useParams();
  const courseId = id ? parseInt(id) : 0;
  const { toast } = useToast();
  const { isConnected, account, userId, mintNFT, connectWallet } = useWeb3();
  const [, setLocation] = useLocation();
  
  const [isMinting, setIsMinting] = useState(false);
  const [isMinted, setIsMinted] = useState(false);
  const [ownershipId, setOwnershipId] = useState<number | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRequestAccessModalOpen, setIsRequestAccessModalOpen] = useState(false);
  const [isConfirmPurchaseOpen, setIsConfirmPurchaseOpen] = useState(false);
  
  // Fetch course details
  const { data: course, isLoading } = useQuery<CourseWithContent>({
    queryKey: ['/api/courses', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      const response = await apiRequest('GET', `/api/courses/${courseId}`);
      return response.json();
    },
  });
  
  // Fetch ownership status if user is connected
  const { data: ownerships, isLoading: isLoadingOwnerships, refetch: refetchOwnerships } = useQuery<any[]>({
    queryKey: ['/api/nft/owned', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await apiRequest('GET', `/api/nft/owned/${userId}`);
      return response.json();
    },
    enabled: !!(isConnected && userId),
  });
  
  // Check if user already owns this course
  const hasOwnership = ownerships?.some((ownership: any) => ownership.courseId === courseId);
  
  // Check for temporary access if user doesn't own the course
  const [hasTemporaryAccess, setHasTemporaryAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  
  // Set ownership if it exists
  useEffect(() => {
    if (hasOwnership && ownerships) {
      const ownership = ownerships.find((o: any) => o.courseId === courseId);
      if (ownership) {
        setIsMinted(true);
        setOwnershipId(ownership.id);
      }
    } else {
      // Reset ownership state if user doesn't own the course
      setIsMinted(false);
      setOwnershipId(null);
    }
  }, [hasOwnership, ownerships, courseId]);
  
  // Check for temporary access if user is connected but doesn't own the course
  useEffect(() => {
    const checkTemporaryAccess = async () => {
      if (isConnected && account && !hasOwnership && courseId) {
        setIsCheckingAccess(true);
        
        try {
          const response = await fetch('/api/access/check', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              courseId: courseId,
              walletAddress: account
            }),
          });
          
          const data = await response.json();
          
          if (data.hasAccess && data.accessType === 'temporary') {
            setHasTemporaryAccess(true);
          }
        } catch (error) {
          console.error('Error checking temporary access:', error);
        } finally {
          setIsCheckingAccess(false);
        }
      }
    };
    
    checkTemporaryAccess();
  }, [isConnected, account, hasOwnership, courseId]);
  
  // Handle mint button click
  const handleMintClick = () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }
    
    setIsConfirmPurchaseOpen(true);
  };
  
  // Handle minting confirmation
  const handleConfirmMint = async () => {
    if (!course) return;
    
    setIsConfirmPurchaseOpen(false);
    setIsMinting(true);
    
    try {
      const result = await mintNFT(courseId, course.price);
      
      if (result.success) {
        setIsMinted(true);
        if (result.ownershipId) {
          setOwnershipId(result.ownershipId);
        }
        
        // Refetch ownerships to update the UI
        await refetchOwnerships();
        
        toast({
          title: "Purchase Successful",
          description: "You now own this course NFT and have full access to all content."
        });
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
      toast({
        title: "Minting failed",
        description: "There was an error minting the course NFT",
        variant: "destructive"
      });
    } finally {
      setIsMinting(false);
    }
  };
  
  // Handle share button click
  const handleShareClick = () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }
    
    if (!isMinted) {
      toast({
        title: "Not owned",
        description: "You need to mint this course NFT before sharing access",
        variant: "destructive"
      });
      return;
    }
    
    setIsShareModalOpen(true);
  };
  
  // Handle request access button click
  const handleRequestAccess = () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }
    
    if (course?.creator.walletAddress?.toLowerCase() === account?.toLowerCase()) {
      toast({
        title: "Cannot request access",
        description: "You cannot request access to your own course",
        variant: "destructive"
      });
      return;
    }
    
    setIsRequestAccessModalOpen(true);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Course not found</h2>
          <p className="mt-2 text-gray-600">The course you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }
  
  const { hours } = parseHumanDuration(course.duration);
  
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          {/* Main content */}
          <div className="lg:col-span-8">
            <div className="aspect-w-16 aspect-h-9 mb-6">
              <div className="rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center h-[450px]">
                <VideoPlayer 
                  videoUrl={course.previewVideoUrl || undefined} 
                  coverImageUrl={course.coverImageUrl || undefined}
                  isPreview={true}
                />
              </div>
            </div>

            <h1 className="text-3xl font-extrabold text-gray-900">{course.title}</h1>
            
            <div className="mt-4 flex items-center">
              <div className="flex items-center">
                <img 
                  className="h-10 w-10 rounded-full" 
                  src={course.creator.avatarUrl || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d"} 
                  alt={`${course.creator.username}'s profile`} 
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {course.creator.username}
                  </p>
                  <p className="text-sm text-gray-500">
                    {course.category} Instructor
                  </p>
                </div>
              </div>
              <div className="ml-auto flex space-x-2">
                <div className="text-sm text-gray-500 flex items-center">
                  <PlayCircle className="h-4 w-4 mr-1" />
                  <span>{course.lectureCount} lectures</span>
                </div>
                <div className="text-sm text-gray-500 flex items-center">
                  <span>{course.duration}</span>
                </div>
                {userId && course.creator.id === userId && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setLocation(`/edit-course/${courseId}`)}
                    className="ml-2"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 mr-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                      />
                    </svg>
                    Edit Course
                  </Button>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 mt-6 pt-6">
              <h3 className="text-lg font-medium text-gray-900">About this course</h3>
              <div className="mt-2 text-gray-600">
                <p className="whitespace-pre-line">{course.description}</p>
              </div>
            </div>

            {course.sections && course.sections.length > 0 && (
              <div className="border-t border-gray-200 mt-6 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Course content</h3>
                <div className="mt-4 space-y-4">
                  <CourseContentAccordion sections={course.sections} />
                </div>
              </div>
            )}
            
            {/* Course Ratings */}
            <div className="border-t border-gray-200 mt-6 pt-6">
              <CourseRatings courseId={courseId} currentUserId={userId} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="mt-10 lg:mt-0 lg:col-span-4">
            <div className="sticky top-6">
              <Card className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold text-gray-900">{course.price} ETH</span>
                  <div className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">
                    <Link className="h-3 w-3 inline mr-1" /> NFT
                  </div>
                </div>
                
                {/* Rating summary in sidebar */}
                <div className="flex items-center mb-6">
                  <Star className="h-5 w-5 text-yellow-500 mr-1" fill="currentColor" />
                  <span className="font-bold mr-1">
                    {course.averageRating?.toFixed(1) || "New"}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({course.totalRatings || 0} {course.totalRatings === 1 ? 'rating' : 'ratings'})
                  </span>
                </div>
                
                {isMinted ? (
                  <Button 
                    disabled 
                    className="w-full bg-green-600 mb-4"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Course NFT Owned
                  </Button>
                ) : hasTemporaryAccess ? (
                  <Button 
                    disabled 
                    className="w-full bg-blue-600 mb-4"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Temporary Access
                  </Button>
                ) : (
                  <Button 
                    onClick={handleMintClick}
                    disabled={isMinting || isCheckingAccess}
                    className="w-full mb-4"
                  >
                    {isMinting || isCheckingAccess ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        {isMinting ? "Minting..." : "Checking Access..."}
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Mint Course NFT
                      </>
                    )}
                  </Button>
                )}
                
                <Button 
                  variant="outline"
                  onClick={handleShareClick}
                  disabled={!isMinted}
                  className="w-full mb-4"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Temporary Access
                </Button>
                
                {!isMinted && !hasTemporaryAccess && account && course.creator.walletAddress?.toLowerCase() !== account.toLowerCase() && (
                  <Button 
                    variant="outline"
                    onClick={handleRequestAccess}
                    className="w-full mb-6"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Request Temporary Access
                  </Button>
                )}
                
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">This course includes:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <PlayCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                      <span className="ml-3 text-gray-600">
                        {course.duration} on-demand video
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="ml-3 text-gray-600">
                        Downloadable resources
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="ml-3 text-gray-600">
                        Coding exercises
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="ml-3 text-gray-600">
                        Full lifetime access
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="ml-3 text-gray-600">
                        Certificate of completion
                      </span>
                    </li>
                  </ul>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">NFT Details</h4>
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">Token Standard:</span>
                      <span className="text-gray-900 font-medium">ERC-721</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">Chain:</span>
                      <span className="text-gray-900 font-medium">Ethereum</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transferable:</span>
                      <span className="text-gray-900 font-medium">Yes (temporary access)</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Purchase Confirmation Dialog */}
      <AlertDialog open={isConfirmPurchaseOpen} onOpenChange={setIsConfirmPurchaseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to mint "{course.title}" as an NFT for {course.price} ETH.
              This will give you permanent ownership of the course content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMint}>Confirm Purchase</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Share Access Modal */}
      {ownershipId && (
        <ShareAccessModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)}
          ownershipId={ownershipId}
        />
      )}
      
      {/* Request Access Modal */}
      {course && (
        <RequestAccessModal 
          isOpen={isRequestAccessModalOpen}
          onClose={() => setIsRequestAccessModalOpen(false)}
          courseId={courseId}
          courseTitle={course.title}
          ownerAddress={course.creator.walletAddress || ''}
        />
      )}
    </div>
  );
}
