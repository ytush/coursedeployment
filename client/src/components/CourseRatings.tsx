import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { type CourseRating, type User } from '@shared/schema';
import RatingStars from './RatingStars';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface CourseRatingsProps {
  courseId: number;
  currentUserId?: number | null;
}

interface RatingsData {
  ratings: (CourseRating & { user: User })[];
  averageRating: number;
  totalRatings: number;
}

export default function CourseRatings({ courseId, currentUserId }: CourseRatingsProps) {
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all ratings for this course
  const { data: ratingsData, isLoading: isLoadingRatings } = useQuery<RatingsData>({
    queryKey: ['/api/courses', courseId, 'ratings'],
    queryFn: ({ queryKey }) => apiRequest(`/api/courses/${courseId}/ratings`),
    enabled: !!courseId,
  });
  
  // Fetch the current user's rating for this course (if they're logged in)
  const { data: userRatingData } = useQuery<CourseRating>({
    queryKey: ['/api/courses', courseId, 'ratings', 'user', currentUserId],
    queryFn: ({ queryKey }) => apiRequest(`/api/courses/${courseId}/ratings/user/${currentUserId}`),
    enabled: !!courseId && !!currentUserId,
    // If the API returns 404 (no rating), we don't want to show an error
    retry: (failureCount, error: any) => {
      return failureCount < 3 && error.status !== 404;
    },
  });
  
  // Submit or update a rating
  const submitRatingMutation = useMutation({
    mutationFn: async (data: { rating: number; review?: string }) => {
      return fetch(`/api/courses/${courseId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          ...data
        }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to submit rating');
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: 'Rating submitted',
        description: 'Thank you for your feedback!',
      });
      
      setIsEditing(false);
      
      // Invalidate and refetch ratings data
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'ratings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'ratings', 'user', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error submitting rating',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });
  
  // Delete a rating
  const deleteRatingMutation = useMutation({
    mutationFn: async (ratingId: number) => {
      return fetch(`/api/ratings/${ratingId}`, {
        method: 'DELETE',
      }).then(res => {
        if (!res.ok) throw new Error('Failed to delete rating');
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: 'Rating deleted',
        description: 'Your rating has been removed',
      });
      
      setUserRating(0);
      setUserReview('');
      
      // Invalidate and refetch ratings data
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'ratings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'ratings', 'user', currentUserId] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting rating',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });
  
  // Initialize user rating and review from their existing rating (if any)
  useEffect(() => {
    if (userRatingData) {
      setUserRating(userRatingData.rating);
      setUserReview(userRatingData.review || '');
    }
  }, [userRatingData]);
  
  // Handle rating submission
  const handleSubmitRating = () => {
    if (!currentUserId) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to submit a rating',
        variant: 'destructive',
      });
      return;
    }
    
    if (userRating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a rating (1-5 stars)',
        variant: 'destructive',
      });
      return;
    }
    
    submitRatingMutation.mutate({
      rating: userRating,
      review: userReview.trim() || undefined,
    });
  };
  
  // Handle rating deletion
  const handleDeleteRating = () => {
    if (!userRatingData) return;
    
    deleteRatingMutation.mutate(userRatingData.id);
  };
  
  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Get user's initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  if (isLoadingRatings) {
    return <div className="text-center py-8">Loading ratings...</div>;
  }
  
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-2">Student Feedback</h2>
      
      {/* Summary */}
      <div className="flex items-center gap-8 mb-8">
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold">{ratingsData?.averageRating.toFixed(1) || 0}</span>
          <RatingStars 
            rating={ratingsData?.averageRating || 0} 
            size={20} 
            className="mt-2" 
          />
          <span className="text-sm text-gray-500 mt-1">
            {ratingsData?.totalRatings || 0} rating{(ratingsData?.totalRatings || 0) !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      {/* Current user rating form */}
      {currentUserId && (
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-8">
          <h3 className="font-semibold mb-2">
            {userRatingData ? 'Your review' : 'Rate this course'}
          </h3>
          
          <div className={isEditing ? 'mb-4' : ''}>
            <RatingStars
              rating={userRating}
              interactive={isEditing}
              onChange={setUserRating}
              size={28}
              className="mb-2"
            />
            
            {isEditing ? (
              <>
                <Textarea
                  placeholder="Write a review (optional)"
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  className="min-h-[100px] mb-4"
                />
                
                <div className="flex items-center gap-2">
                  <Button onClick={handleSubmitRating} disabled={submitRatingMutation.isPending}>
                    {submitRatingMutation.isPending ? 'Submitting...' : (userRatingData ? 'Update Review' : 'Submit Review')}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (userRatingData) {
                        setUserRating(userRatingData.rating);
                        setUserReview(userRatingData.review || '');
                      } else {
                        setUserRating(0);
                        setUserReview('');
                      }
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                {!isEditing && userRatingData && userRatingData.review && (
                  <div className="border rounded-lg p-4 mb-4 w-full">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {userRatingData.review}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Posted on {formatDate(userRatingData.createdAt)}
                      {userRatingData.updatedAt !== userRatingData.createdAt && 
                        ` (updated on ${formatDate(userRatingData.updatedAt)})`}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    {userRatingData ? 'Edit Your Review' : 'Write a Review'}
                  </Button>
                  
                  {userRatingData && (
                    <Button 
                      variant="outline" 
                      className="text-red-500 hover:text-red-700" 
                      onClick={handleDeleteRating}
                      disabled={deleteRatingMutation.isPending}
                    >
                      {deleteRatingMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* List of reviews */}
      <h3 className="font-semibold mb-4">Reviews</h3>
      
      {ratingsData?.ratings.length === 0 ? (
        <p className="text-gray-500">No reviews yet. Be the first to review this course!</p>
      ) : (
        <div className="space-y-6">
          {ratingsData?.ratings.map((rating) => (
            <Card key={rating.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage 
                      src={rating.user.avatarUrl || undefined} 
                      alt={rating.user.username} 
                    />
                    <AvatarFallback>
                      {getUserInitials(rating.user.username)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{rating.user.username}</h4>
                        <div className="flex items-center gap-2">
                          <RatingStars rating={rating.rating} size={16} />
                          <span className="text-xs text-gray-500">
                            {formatDate(rating.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {rating.review && (
                      <p className="mt-2 text-gray-700 dark:text-gray-300">{rating.review}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}