import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/lib/web3";
import { apiRequest } from "@/lib/queryClient";
import AccessRequestsManager from "@/components/AccessRequestsManager";
import SentAccessRequests from "@/components/SentAccessRequests";

// Define form schema
const profileFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
  bio: z.string().optional(),
  isCreator: z.boolean().optional()
});

export default function UserProfile() {
  const { toast } = useToast();
  const { userId, account } = useWeb3();
  const [, setLocation] = useLocation();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>({});

  // Initialize form
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      bio: "",
      isCreator: false
    }
  });

  // Fetch user data on mount
  useEffect(() => {
    async function fetchUserData() {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        
        if (response.ok) {
          const userData = await response.json();
          console.log("Fetched user data:", userData);
          
          setUserData(userData);
          form.reset({
            username: userData.username || "",
            bio: userData.bio || "",
            isCreator: userData.isCreator || false
          });
          
          if (userData.avatarUrl) {
            setAvatarPreview(userData.avatarUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserData();
  }, [userId, form, toast]);

  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Preview
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Save for upload
    setAvatarFile(file);
  };

  // Handle avatar upload
  const handleAvatarUpload = async () => {
    if (!avatarFile || !userId) return;
    
    try {
      console.log("Uploading avatar file:", avatarFile.name);
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      
      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload avatar");
      }
      
      const data = await response.json();
      console.log("Avatar upload response:", data);
      
      if (data.avatarUrl) {
        setAvatarPreview(data.avatarUrl);
        toast({
          title: "Success",
          description: "Profile picture updated successfully"
        });
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive"
      });
    }
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    if (!userId) return;
    
    try {
      console.log("Updating profile with:", values);
      
      // Convert to JSON string before sending
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });
      
      if (response.ok) {
        const updatedData = await response.json();
        toast({
          title: "Success",
          description: "Profile updated successfully"
        });
        
        // Updated user data is in the response
        setUserData(updatedData);
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  if (!userId) {
    return (
      <div className="container mx-auto max-w-4xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Please Connect Your Wallet</CardTitle>
            <CardDescription>
              You need to connect your wallet to access your profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <h1 className="text-3xl font-bold mb-8">User Profile</h1>
      
      <Tabs defaultValue="profile">
        <TabsList className="mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="access-requests">Access Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Avatar className="w-32 h-32 mb-4">
                    <AvatarImage src={avatarPreview || ""} />
                    <AvatarFallback>{userData.username?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-2 w-full">
                    <Label htmlFor="avatar">Upload New Picture</Label>
                    <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
                    <Button 
                      onClick={handleAvatarUpload} 
                      disabled={!avatarFile}
                      className="w-full mt-2"
                    >
                      Upload
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Wallet</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium mb-1">Connected Address:</div>
                  <div className="text-sm border p-2 rounded-md bg-muted overflow-hidden text-ellipsis">
                    {account || 'Not connected'}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your profile information.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              This is your public display name.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us about yourself"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Introduce yourself to the community.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="isCreator"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Creator Account</FormLabel>
                              <FormDescription>
                                Enable to create and publish courses on CourseChain.
                              </FormDescription>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Loading..." : "Save Changes"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="access-requests">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Received Access Requests</CardTitle>
                <CardDescription>
                  Manage temporary access requests to your courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AccessRequestsManager />
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Your Access Requests</CardTitle>
                <CardDescription>
                  Track your requests for temporary access to courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SentAccessRequests />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}