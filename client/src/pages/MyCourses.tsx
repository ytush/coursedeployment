import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useWeb3 } from "@/lib/web3";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Book, Share2, Clock, PenTool } from "lucide-react";
import { formatDistance } from "date-fns";

export default function MyCourses() {
  const { isConnected, connectWallet, userId, account } = useWeb3();
  
  // Fetch owned courses
  const { data: ownerships, isLoading: isLoadingOwned } = useQuery<any[]>({
    queryKey: ['/api/nft/owned', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await apiRequest('GET', `/api/nft/owned/${userId}`);
      return response.json();
    },
    enabled: !!(isConnected && userId),
  });

  // Fetch courses created by the user
  const { data: courses, isLoading: isLoadingCreated } = useQuery<any[]>({
    queryKey: ['/api/courses', 'created', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await apiRequest('GET', `/api/courses?creatorId=${userId}`);
      return response.json();
    },
    enabled: !!(isConnected && userId),
  });
  
  // Fetch courses shared with the user
  const { data: sharedCourses, isLoading: isLoadingShared } = useQuery<any[]>({
    queryKey: ['/api/access/shared', account],
    queryFn: async () => {
      if (!account) return [];
      const response = await apiRequest('GET', `/api/access/shared/${account}`);
      return response.json();
    },
    enabled: !!(isConnected && account),
  });
  
  if (!isConnected) {
    return (
      <div className="bg-slate-100 min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              My Courses
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Connect your wallet to view your courses
            </p>
            
            <div className="mt-8">
              <Button onClick={connectWallet} size="lg">
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const isLoading = isLoadingOwned || isLoadingCreated || isLoadingShared;
  
  return (
    <div className="bg-slate-100 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            My Courses
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Access and manage your courses
          </p>
        </div>
        
        <div className="mt-12">
          <Tabs defaultValue="owned" className="w-full">
            <TabsList className="mb-8 flex justify-center">
              <TabsTrigger value="owned" className="px-4 py-2">
                Owned Courses
              </TabsTrigger>
              <TabsTrigger value="created" className="px-4 py-2">
                Created Courses
              </TabsTrigger>
              <TabsTrigger value="shared" className="px-4 py-2">
                Shared Access
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="owned">
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : ownerships && Array.isArray(ownerships) && ownerships.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {ownerships.map((ownership: any) => (
                    <Card key={ownership.id} className="overflow-hidden">
                      <div className="h-48 overflow-hidden relative">
                        <img 
                          src={ownership.course.coverImageUrl || "https://images.unsplash.com/photo-1516321497487-e288fb19713f"}
                          alt={ownership.course.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
                          NFT #{ownership.tokenId.slice(-4)}
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold line-clamp-2">
                          {ownership.course.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-2">
                          Minted {formatDistance(new Date(ownership.mintedAt), new Date(), { addSuffix: true })}
                        </p>
                        <div className="flex space-x-2 mt-4">
                          <Button 
                            variant="default" 
                            className="flex-1"
                            asChild
                          >
                            <Link to={`/course/${ownership.course.id}`}>
                              <Book className="h-4 w-4 mr-2" />
                              View Course
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            asChild
                          >
                            <Link to={`/course/${ownership.course.id}`}>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="bg-white p-8 rounded-lg shadow inline-block">
                    <Book className="h-12 w-12 text-gray-400 mx-auto" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No courses yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You haven't minted any course NFTs yet.
                    </p>
                    <div className="mt-6">
                      <Button asChild>
                        <Link to="/">Browse Courses</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="created">
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : courses && Array.isArray(courses) && courses.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {courses.map((course: any) => (
                    <Card key={course.id} className="overflow-hidden">
                      <div className="h-48 overflow-hidden relative">
                        <img 
                          src={course.coverImageUrl || "https://images.unsplash.com/photo-1516321497487-e288fb19713f"}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                          Creator
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-2">
                          Created {course.createdAt ? formatDistance(new Date(course.createdAt), new Date(), { addSuffix: true }) : 'recently'}
                        </p>
                        <div className="flex space-x-2 mt-4">
                          <Button 
                            variant="default" 
                            className="flex-1"
                            asChild
                          >
                            <Link to={`/course/${course.id}`}>
                              <Book className="h-4 w-4 mr-2" />
                              View Course
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1"
                          >
                            <PenTool className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="bg-white p-8 rounded-lg shadow inline-block">
                    <PenTool className="h-12 w-12 text-gray-400 mx-auto" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No created courses</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You haven't created any courses yet.
                    </p>
                    <div className="mt-6">
                      <Button asChild>
                        <Link to="/create">Create a Course</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="shared">
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : sharedCourses && Array.isArray(sharedCourses) && sharedCourses.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {sharedCourses.map((course: any) => (
                    <Card key={`shared-${course.id}-${course.shareId}`} className="overflow-hidden">
                      <div className="h-48 overflow-hidden relative">
                        <img 
                          src={course.coverImageUrl || "https://images.unsplash.com/photo-1516321497487-e288fb19713f"}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                          Shared Access
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-2">
                          Expires {formatDistance(new Date(course.expiresAt), new Date(), { addSuffix: true })}
                        </p>
                        <div className="flex space-x-2 mt-4">
                          <Button 
                            variant="default" 
                            className="flex-1"
                            asChild
                          >
                            <Link to={`/course/${course.id}`}>
                              <Book className="h-4 w-4 mr-2" />
                              View Course
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="bg-white p-8 rounded-lg shadow inline-block">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No shared courses</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You have no temporarily shared courses at the moment.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
