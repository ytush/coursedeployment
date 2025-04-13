import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import HeroSection from "@/components/HeroSection";
import CourseCard from "@/components/CourseCard";
import HowItWorks from "@/components/HowItWorks";
import CreatorSection from "@/components/CreatorSection";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Course } from "@shared/schema";

const categories = [
  "All",
  "Web Development",
  "Data Science",
  "Blockchain",
  "Mobile Development",
  "Design"
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: [activeCategory === "All" ? "/api/courses" : `/api/courses?category=${activeCategory}`],
  });

  return (
    <div className="bg-slate-100">
      <HeroSection />
      
      {/* Featured Courses */}
      <div className="bg-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Featured Courses
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Discover top courses from expert creators around the world
            </p>
          </div>
          
          {/* Category Tabs */}
          <div className="mt-8">
            <Tabs defaultValue="All" className="w-full">
              <TabsList className="mb-8 flex flex-wrap justify-center">
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    onClick={() => setActiveCategory(category)}
                    className="px-4 py-2 m-1"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value={activeCategory} className="mt-6">
                {isLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="mt-12 grid gap-5 max-w-lg mx-auto lg:grid-cols-3 lg:max-w-none">
                    {courses && courses.length > 0 ? (
                      courses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-20">
                        <p className="text-gray-500 text-lg">No courses found in this category.</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="mt-10 text-center">
            <a 
              href="#all-courses" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-indigo-700"
            >
              View All Courses
            </a>
          </div>
        </div>
      </div>
      
      <HowItWorks />
      <CreatorSection />
    </div>
  );
}
