import { useState } from "react";
import { useLocation } from "wouter";
import { useWeb3 } from "@/lib/web3";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCourseSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";

// Extend the insert schema with additional validation
const formSchema = insertCourseSchema.extend({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Please select a category"),
  price: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Price must be a positive number",
  }),
  duration: z.string().min(1, "Duration is required"),
  coverImage: z.instanceof(FileList).optional(),
}).omit({ creatorId: true });

type FormValues = z.infer<typeof formSchema>;

const categories = [
  "Web Development",
  "Data Science",
  "Blockchain",
  "Mobile Development",
  "Design",
  "Business",
  "Marketing",
  "Photography",
  "Music",
  "Other"
];

export default function CreateCourse() {
  const { isConnected, connectWallet, userId } = useWeb3();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      price: "0.1",
      duration: "",
      lectureCount: 1,
      isPublished: false,
    },
  });
  
  const createCourseMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Log the FormData entries to debug
      console.log("FormData entries:");
      for (const pair of (data as any).entries()) {
        console.log(pair[0], pair[1]);
      }
      
      const response = await apiRequest("POST", "/api/courses", data);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to create course");
      }
      return result;
    },
    onSuccess: (data) => {
      // Invalidate the courses queries to update the Home page discover section
      // when the course gets published
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      
      // If the course has a category, invalidate that specific category query too
      const category = data.category;
      if (category) {
        queryClient.invalidateQueries({ queryKey: [`/api/courses?category=${category}`] });
      }
      
      toast({
        title: "Course Created",
        description: "Your course has been created successfully",
      });
      navigate(`/course/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = async (values: FormValues) => {
    if (!isConnected || !userId) {
      toast({
        title: "Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    
    // Convert form data to JSON string
    const courseData = {
      ...values,
      creatorId: userId, // This ensures you're set as the creator
      lectureCount: parseInt(values.lectureCount.toString()),
      isPublished: true,
    };
    
    // Display debugging info
    console.log("Current user ID:", userId);
    
    // Remove the coverImage property as it's a FileList that can't be stringified
    if ('coverImage' in courseData) {
      delete (courseData as any).coverImage;
    }
    
    // Add course data to form data
    formData.append("courseData", JSON.stringify(courseData));
    
    // Add cover image if provided
    if (values.coverImage && values.coverImage.length > 0) {
      formData.append("coverImage", values.coverImage[0]);
    }
    
    // Display form data entries for debugging
    console.log("FormData entries:");
    // Use forEach instead of for...of to avoid compatibility issues
    formData.forEach((value, key) => {
      console.log(key, value);
    });
    
    console.log("Submitting course data:", JSON.stringify(courseData));
    createCourseMutation.mutate(formData);
  };
  
  // Handle cover image change
  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Update form value
      form.setValue("coverImage", files);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Clean up URL when component unmounts
      return () => URL.revokeObjectURL(url);
    }
  };
  
  if (!isConnected) {
    return (
      <div className="bg-slate-100 min-h-screen py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Create a Course
            </h1>
            <p className="mt-3 text-xl text-gray-500">
              Connect your wallet to start creating your course
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
  
  return (
    <div className="bg-slate-100 min-h-screen py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Create a Course
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Share your knowledge and mint it as an NFT
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Advanced React Development" {...field} />
                      </FormControl>
                      <FormDescription>
                        A clear, descriptive title for your course
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what students will learn in this course" 
                          className="h-32"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        A detailed description of your course content and outcomes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (ETH)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field} />
                        </FormControl>
                        <FormDescription>
                          Set the price in ETH
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Duration</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 10.5 hours" {...field} />
                        </FormControl>
                        <FormDescription>
                          Total length of all video content
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lectureCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Lectures</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormItem>
                  <FormLabel>Cover Image</FormLabel>
                  <div className="mt-1 flex items-center">
                    <div className="flex-1">
                      <div className="mt-2 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                        {previewUrl ? (
                          <div className="space-y-4">
                            <img 
                              src={previewUrl} 
                              alt="Cover preview" 
                              className="mx-auto h-40 w-full object-cover rounded-md"
                            />
                            <div className="text-center">
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => {
                                  setPreviewUrl(null);
                                  form.setValue("coverImage", undefined);
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1 text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="cover-image-upload"
                                className="relative cursor-pointer rounded-md bg-white font-medium text-primary hover:text-indigo-500"
                              >
                                <span>Upload a file</span>
                                <input
                                  id="cover-image-upload"
                                  name="cover-image-upload"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={handleCoverImageChange}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 10MB
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </FormItem>
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={createCourseMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {createCourseMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Course"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
