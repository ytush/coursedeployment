import { Link } from "wouter";
import { Course } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Link as LinkIcon } from "lucide-react";

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white hover:shadow-xl transition-shadow duration-300">
      <div className="flex-shrink-0 relative">
        <img 
          className="h-48 w-full object-cover" 
          src={course.coverImageUrl || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&auto=format&fit=crop&w=2100&q=80"} 
          alt={course.title}
        />
        <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
          <LinkIcon className="h-3 w-3 inline mr-1" /> NFT
        </div>
      </div>
      <CardContent className="flex-1 p-6 flex flex-col justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-primary">
            {course.category}
          </p>
          <Link href={`/course/${course.id}`}>
            <a className="block mt-2 cursor-pointer">
              <p className="text-xl font-semibold text-gray-900 line-clamp-2">
                {course.title}
              </p>
              <p className="mt-3 text-base text-gray-500 line-clamp-3">
                {course.description}
              </p>
            </a>
          </Link>
        </div>
        <div className="mt-6 flex items-center">
          <div className="flex-shrink-0">
            <img 
              className="h-10 w-10 rounded-full" 
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
              alt="Creator profile"
            />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              Instructor
            </p>
            <div className="flex space-x-1 text-sm text-gray-500">
              <span>{course.lectureCount} lectures</span>
              <span aria-hidden="true">&middot;</span>
              <span>{course.duration}</span>
            </div>
          </div>
          <div className="ml-auto">
            <span className="text-xl font-bold text-gray-900">{course.price} ETH</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
