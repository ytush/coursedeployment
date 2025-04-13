import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useWeb3 } from "@/lib/web3";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CourseWithContent } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { 
  Plus, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Edit, 
  Trash, 
  Upload, 
  Video,
  Image,
  Save,
  RefreshCcw,
  Loader2,
  FilePlus,
  FileText,
  Eye
} from "lucide-react";

// Course form schema
const courseFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Category is required"),
  price: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    { message: "Price must be a valid number" }
  ),
  duration: z.string().min(1, "Duration is required"),
  isPublished: z.boolean().optional(),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

// Section form schema
const sectionFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  order: z.number(),
});

type SectionFormValues = z.infer<typeof sectionFormSchema>;

// Lecture form schema
const lectureFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  duration: z.string().min(1, "Duration is required"),
  order: z.number(),
  videoUrl: z.string().optional(),
  resources: z.any().optional(),
});

type LectureFormValues = z.infer<typeof lectureFormSchema>;

export default function EditCourse() {
  const { id } = useParams();
  const courseId = parseInt(id);
  const [, setLocation] = useLocation();
  const { isConnected, userId } = useWeb3();
  const { toast } = useToast();
  
  // State for file uploads
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<File | null>(null);
  const [previewVideoName, setPreviewVideoName] = useState<string | null>(null);
  const [lectureVideo, setLectureVideo] = useState<File | null>(null);
  const [lectureVideoName, setLectureVideoName] = useState<string | null>(null);
  
  // State for editing sections and lectures
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingLectureId, setEditingLectureId] = useState<number | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [isAddingSectionOpen, setIsAddingSectionOpen] = useState(false);
  const [isAddingLectureOpen, setIsAddingLectureOpen] = useState(false);
  const [isDeleteSectionOpen, setIsDeleteSectionOpen] = useState(false);
  const [isDeleteLectureOpen, setIsDeleteLectureOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<number | null>(null);
  const [lectureToDelete, setLectureToDelete] = useState<number | null>(null);
  
  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [isSavingLecture, setIsSavingLecture] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Forms
  const courseForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      price: "0.1",
      duration: "1 hour",
      isPublished: false,
    },
  });

  const sectionForm = useForm<SectionFormValues>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: {
      title: "",
      order: 1,
    },
  });

  const lectureForm = useForm<LectureFormValues>({
    resolver: zodResolver(lectureFormSchema),
    defaultValues: {
      title: "",
      duration: "5 min",
      order: 1,
      videoUrl: "",
      resources: {},
    },
  });

  // Fetch course data
  const { data: course, isLoading } = useQuery<CourseWithContent>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Redirect if not connected or not the course creator
  useEffect(() => {
    if (!isLoading && course && course.creatorId !== userId) {
      toast({
        title: "Access denied",
        description: "You can only edit courses you've created.",
        variant: "destructive",
      });
      setLocation("/my-courses");
    }
  }, [course, userId, isLoading, setLocation, toast]);

  // Set form values when course data is loaded
  useEffect(() => {
    if (course) {
      courseForm.reset({
        title: course.title,
        description: course.description,
        category: course.category,
        price: course.price,
        duration: course.duration,
        isPublished: course.isPublished === true,
      });
      
      // Set preview images if available
      if (course.coverImageUrl) {
        setCoverImagePreview(course.coverImageUrl);
      }
    }
  }, [course, courseForm]);

  // Handle cover image upload
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle preview video upload
  const handlePreviewVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewVideo(file);
      setPreviewVideoName(file.name);
    }
  };

  // Handle lecture video upload
  const handleLectureVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLectureVideo(file);
      setLectureVideoName(file.name);
    }
  };

  // Save course information
  const onSaveCourse = async (values: CourseFormValues) => {
    if (!courseId) return;
    
    try {
      setIsSaving(true);
      
      const formData = new FormData();
      
      // Add form fields to FormData
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value === null ? "" : value.toString());
      });
      
      // Add files if selected
      if (coverImage) {
        formData.append("coverImage", coverImage);
      }
      
      if (previewVideo) {
        formData.append("previewVideo", previewVideo);
      }
      
      // Update course
      await apiRequest(`/api/courses/${courseId}`, {
        method: "PATCH",
        body: formData,
        headers: {}, // Let the browser set the content-type for FormData
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      
      toast({
        title: "Course updated",
        description: "Your course has been successfully updated.",
      });
      
    } catch (error) {
      console.error("Error updating course:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add or update a section
  const handleSaveSection = async (values: SectionFormValues) => {
    if (!courseId) return;
    
    try {
      setIsSavingSection(true);
      
      if (editingSectionId) {
        // Update existing section
        await apiRequest(`/api/sections/${editingSectionId}`, {
          method: "PATCH",
          body: JSON.stringify({ ...values, courseId }),
        });
      } else {
        // Create new section
        await apiRequest("/api/sections", {
          method: "POST",
          body: JSON.stringify({ ...values, courseId }),
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      
      // Reset form and state
      sectionForm.reset({
        title: "",
        order: (course?.sections?.length || 0) + 1,
      });
      setEditingSectionId(null);
      setIsAddingSectionOpen(false);
      
      toast({
        title: editingSectionId ? "Section updated" : "Section added",
        description: editingSectionId 
          ? "Your section has been updated." 
          : "Your new section has been added to the course.",
      });
      
    } catch (error) {
      console.error("Error saving section:", error);
      toast({
        title: "Error",
        description: "There was an error saving the section. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSection(false);
    }
  };

  // Add or update a lecture
  const handleSaveLecture = async (values: LectureFormValues) => {
    if (!courseId || !activeSectionId) return;
    
    try {
      setIsSavingLecture(true);
      
      const formData = new FormData();
      
      // Add form fields to FormData
      Object.entries(values).forEach(([key, value]) => {
        if (key === "resources" && typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value === null ? "" : value.toString());
        }
      });
      
      // Add sectionId
      formData.append("sectionId", activeSectionId.toString());
      
      // Add video file if selected
      if (lectureVideo) {
        formData.append("video", lectureVideo);
      }
      
      if (editingLectureId) {
        // Update existing lecture
        await apiRequest(`/api/lectures/${editingLectureId}`, {
          method: "PATCH",
          body: formData,
          headers: {}, // Let the browser set the content-type for FormData
        });
      } else {
        // Create new lecture
        await apiRequest("/api/lectures", {
          method: "POST",
          body: formData,
          headers: {}, // Let the browser set the content-type for FormData
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      
      // Reset form and state
      lectureForm.reset({
        title: "",
        duration: "5 min",
        order: (course?.sections?.find(s => s.id === activeSectionId)?.lectures?.length || 0) + 1,
        videoUrl: "",
        resources: {},
      });
      setEditingLectureId(null);
      setLectureVideo(null);
      setLectureVideoName(null);
      setIsAddingLectureOpen(false);
      
      toast({
        title: editingLectureId ? "Lecture updated" : "Lecture added",
        description: editingLectureId 
          ? "Your lecture has been updated." 
          : "Your new lecture has been added to the section.",
      });
      
    } catch (error) {
      console.error("Error saving lecture:", error);
      toast({
        title: "Error",
        description: "There was an error saving the lecture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingLecture(false);
    }
  };

  // Edit section - populate form with section data
  const handleEditSection = (sectionId: number) => {
    const section = course?.sections?.find(s => s.id === sectionId);
    
    if (section) {
      sectionForm.reset({
        title: section.title,
        order: section.order,
      });
      
      setEditingSectionId(sectionId);
      setIsAddingSectionOpen(true);
    }
  };

  // Edit lecture - populate form with lecture data
  const handleEditLecture = (lectureId: number, sectionId: number) => {
    const section = course?.sections?.find(s => s.id === sectionId);
    const lecture = section?.lectures?.find(l => l.id === lectureId);
    
    if (lecture) {
      lectureForm.reset({
        title: lecture.title,
        duration: lecture.duration,
        order: lecture.order,
        videoUrl: lecture.videoUrl || "",
        resources: lecture.resources || {},
      });
      
      setEditingLectureId(lectureId);
      setActiveSectionId(sectionId);
      setIsAddingLectureOpen(true);
    }
  };

  // Prepare to delete a section
  const prepareDeleteSection = (sectionId: number) => {
    setSectionToDelete(sectionId);
    setIsDeleteSectionOpen(true);
  };

  // Delete a section
  const confirmDeleteSection = async () => {
    if (!sectionToDelete) return;
    
    try {
      await apiRequest(`/api/sections/${sectionToDelete}`, {
        method: "DELETE",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      
      toast({
        title: "Section deleted",
        description: "The section has been removed from your course.",
      });
      
    } catch (error) {
      console.error("Error deleting section:", error);
      toast({
        title: "Error",
        description: "There was an error deleting the section. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteSectionOpen(false);
      setSectionToDelete(null);
    }
  };

  // Prepare to delete a lecture
  const prepareDeleteLecture = (lectureId: number) => {
    setLectureToDelete(lectureId);
    setIsDeleteLectureOpen(true);
  };

  // Delete a lecture
  const confirmDeleteLecture = async () => {
    if (!lectureToDelete) return;
    
    try {
      await apiRequest(`/api/lectures/${lectureToDelete}`, {
        method: "DELETE",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      
      toast({
        title: "Lecture deleted",
        description: "The lecture has been removed from your course.",
      });
      
    } catch (error) {
      console.error("Error deleting lecture:", error);
      toast({
        title: "Error",
        description: "There was an error deleting the lecture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteLectureOpen(false);
      setLectureToDelete(null);
    }
  };

  // Add a new section
  const startAddSection = () => {
    sectionForm.reset({
      title: "",
      order: (course?.sections?.length || 0) + 1,
    });
    setEditingSectionId(null);
    setIsAddingSectionOpen(true);
  };

  // Add a new lecture to a section
  const startAddLecture = (sectionId: number) => {
    lectureForm.reset({
      title: "",
      duration: "5 min",
      order: (course?.sections?.find(s => s.id === sectionId)?.lectures?.length || 0) + 1,
      videoUrl: "",
      resources: {},
    });
    setEditingLectureId(null);
    setActiveSectionId(sectionId);
    setIsAddingLectureOpen(true);
  };

  // Handle publish status toggle
  const togglePublishStatus = async () => {
    if (!courseId) return;
    
    try {
      setIsPublishing(true);
      
      await apiRequest(`/api/courses/${courseId}/publish`, {
        method: "POST",
        body: JSON.stringify({ isPublished: !course?.isPublished }),
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      
      // Also invalidate the main courses list to update the Discover page
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      
      // Invalidate any category-specific queries if they exist
      if (course?.category) {
        queryClient.invalidateQueries({ queryKey: [`/api/courses?category=${course.category}`] });
      }
      
      toast({
        title: course?.isPublished ? "Course unpublished" : "Course published",
        description: course?.isPublished 
          ? "Your course is now hidden from the marketplace." 
          : "Your course is now visible in the marketplace.",
      });
      
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast({
        title: "Error",
        description: "There was an error changing the publish status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // If not the course creator, will redirect via useEffect
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-4">Course not found</h1>
        <p>The course you are trying to edit does not exist or has been removed.</p>
        <Button onClick={() => setLocation("/my-courses")} className="mt-4">
          Back to My Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Edit Course</h1>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setLocation(`/course/${courseId}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            variant={course.isPublished ? "destructive" : "default"}
            onClick={togglePublishStatus}
            disabled={isPublishing}
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              course.isPublished ? (
                <>Unpublish</>
              ) : (
                <>Publish</>
              )
            )}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>
                Edit your course details visible to students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...courseForm}>
                <form onSubmit={courseForm.handleSubmit(onSaveCourse)} className="space-y-6">
                  <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
                    <div className="w-full md:w-1/2">
                      <FormField
                        control={courseForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter course title" {...field} />
                            </FormControl>
                            <FormDescription>
                              A descriptive title that explains what your course is about
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={courseForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem className="mt-6">
                            <FormLabel>Category</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Web Development">Web Development</SelectItem>
                                <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                                <SelectItem value="Blockchain">Blockchain</SelectItem>
                                <SelectItem value="Data Science">Data Science</SelectItem>
                                <SelectItem value="Machine Learning">Machine Learning</SelectItem>
                                <SelectItem value="DevOps">DevOps</SelectItem>
                                <SelectItem value="Game Development">Game Development</SelectItem>
                                <SelectItem value="Cybersecurity">Cybersecurity</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Category helps students find your course
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <FormField
                          control={courseForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price (ETH)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="0.1" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Course price in ETH
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={courseForm.control}
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. 2 hours" {...field} />
                              </FormControl>
                              <FormDescription>
                                Total course length
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="w-full md:w-1/2">
                      <FormField
                        control={courseForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your course in detail..."
                                className="min-h-[150px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Explain what students will learn in this course
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="mt-6">
                        <FormLabel>Cover Image</FormLabel>
                        <div className="mt-2">
                          {coverImagePreview ? (
                            <div className="relative mb-4">
                              <img 
                                src={coverImagePreview} 
                                alt="Course cover preview" 
                                className="rounded-md w-full h-[200px] object-cover" 
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                  setCoverImage(null);
                                  setCoverImagePreview(null);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center mb-4">
                              <Image className="mx-auto h-8 w-8 text-gray-400" />
                              <p className="mt-1 text-sm text-gray-500">
                                No cover image selected
                              </p>
                            </div>
                          )}
                          
                          <div className="relative">
                            <Input
                              id="coverImage"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleCoverImageChange}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById("coverImage")?.click()}
                              className="w-full"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {coverImagePreview ? "Change Cover Image" : "Upload Cover Image"}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <FormLabel>Preview Video</FormLabel>
                        <div className="mt-2">
                          {previewVideoName ? (
                            <div className="flex items-center space-x-2 p-3 bg-muted rounded-md mb-4">
                              <Video className="h-5 w-5 text-muted-foreground" />
                              <span className="text-sm truncate flex-1">{previewVideoName}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPreviewVideo(null);
                                  setPreviewVideoName(null);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : course?.previewVideoUrl ? (
                            <div className="flex items-center space-x-2 p-3 bg-muted rounded-md mb-4">
                              <Video className="h-5 w-5 text-muted-foreground" />
                              <span className="text-sm truncate flex-1">Current preview video</span>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center mb-4">
                              <Video className="mx-auto h-8 w-8 text-gray-400" />
                              <p className="mt-1 text-sm text-gray-500">
                                No preview video selected
                              </p>
                            </div>
                          )}
                          
                          <div className="relative">
                            <Input
                              id="previewVideo"
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={handlePreviewVideoChange}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById("previewVideo")?.click()}
                              className="w-full"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {previewVideoName || course?.previewVideoUrl 
                                ? "Change Preview Video" 
                                : "Upload Preview Video"
                              }
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSaving || !courseForm.formState.isDirty && !coverImage && !previewVideo}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="curriculum">
          <Card>
            <CardHeader>
              <CardTitle>Course Curriculum</CardTitle>
              <CardDescription>
                Organize your course content into sections and lectures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {course.sections && course.sections.length > 0 ? (
                  course.sections.map((section) => (
                    <div key={section.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {section.order}. {section.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {section.lectures?.length || 0} lectures
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => startAddLecture(section.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Lecture
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditSection(section.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => prepareDeleteSection(section.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Lectures */}
                      <div className="space-y-2 pl-4">
                        {section.lectures && section.lectures.length > 0 ? (
                          section.lectures.map((lecture) => (
                            <div 
                              key={lecture.id} 
                              className="flex justify-between items-center p-3 bg-muted rounded-md"
                            >
                              <div className="flex items-center space-x-3">
                                <Video className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">
                                    {lecture.order}. {lecture.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {lecture.duration}
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditLecture(lecture.id, section.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => prepareDeleteLecture(lecture.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            No lectures yet. Add your first lecture to this section.
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No Sections Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start building your course by adding sections and lectures
                    </p>
                  </div>
                )}
                
                <div className="flex justify-center">
                  <Button onClick={startAddSection}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add/Edit Section Dialog */}
      <AlertDialog open={isAddingSectionOpen} onOpenChange={setIsAddingSectionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingSectionId ? "Edit Section" : "Add New Section"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {editingSectionId 
                ? "Update the information for this section." 
                : "Create a new section for your course."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <Form {...sectionForm}>
            <form onSubmit={sectionForm.handleSubmit(handleSaveSection)} className="space-y-6 py-4">
              <FormField
                control={sectionForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter section title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={sectionForm.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order (Position in Course)</FormLabel>
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
              
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button type="submit" disabled={isSavingSection}>
                    {isSavingSection ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Section"
                    )}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Add/Edit Lecture Dialog */}
      <AlertDialog open={isAddingLectureOpen} onOpenChange={setIsAddingLectureOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingLectureId ? "Edit Lecture" : "Add New Lecture"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {editingLectureId 
                ? "Update the information and content for this lecture." 
                : "Create a new lecture for your section."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <Form {...lectureForm}>
            <form onSubmit={lectureForm.handleSubmit(handleSaveLecture)} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={lectureForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lecture Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter lecture title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={lectureForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 10 min" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={lectureForm.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order</FormLabel>
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
              </div>
              
              <div>
                <FormLabel>Lecture Video</FormLabel>
                <div className="mt-2">
                  {lectureVideoName ? (
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-md mb-4">
                      <Video className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm truncate flex-1">{lectureVideoName}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setLectureVideo(null);
                          setLectureVideoName(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : editingLectureId && lectureForm.watch("videoUrl") ? (
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-md mb-4">
                      <Video className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm truncate flex-1">Current lecture video</span>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center mb-4">
                      <Video className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-1 text-sm text-gray-500">
                        No lecture video selected
                      </p>
                    </div>
                  )}
                  
                  <div className="relative">
                    <Input
                      id="lectureVideo"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleLectureVideoChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("lectureVideo")?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {lectureVideoName || (editingLectureId && lectureForm.watch("videoUrl"))
                        ? "Change Lecture Video" 
                        : "Upload Lecture Video"
                      }
                    </Button>
                  </div>
                </div>
              </div>
              
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button type="submit" disabled={isSavingLecture}>
                    {isSavingLecture ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Lecture"
                    )}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Section Confirmation */}
      <AlertDialog open={isDeleteSectionOpen} onOpenChange={setIsDeleteSectionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this section? This will also remove all lectures
              within this section. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteSection}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Lecture Confirmation */}
      <AlertDialog open={isDeleteLectureOpen} onOpenChange={setIsDeleteLectureOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lecture</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lecture? This will remove the lecture
              content and any associated videos. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteLecture}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}