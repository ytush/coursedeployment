import { useState } from "react";
import { courseAccordionItem } from "@/lib/utils";
import { CourseSection, CourseLecture } from "@shared/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PlayCircle, Clock, File } from "lucide-react";

interface CourseContentAccordionProps {
  sections: (CourseSection & { lectures: CourseLecture[] })[];
}

export default function CourseContentAccordion({ sections }: CourseContentAccordionProps) {
  const [openSections, setOpenSections] = useState<string[]>([sections[0]?.id.toString() || ""]);
  
  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };
  
  const getTotalSectionDuration = (lectures: CourseLecture[]) => {
    return lectures.reduce((total, lecture) => {
      // Parse the duration format (e.g., "10:30" or "1:30:45")
      const parts = lecture.duration.split(':').map(part => parseInt(part));
      
      if (parts.length === 3) {
        // hours:minutes:seconds
        return total + (parts[0] * 3600 + parts[1] * 60 + parts[2]);
      } else if (parts.length === 2) {
        // minutes:seconds
        return total + (parts[0] * 60 + parts[1]);
      }
      
      return total;
    }, 0);
  };
  
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    return `${minutes}m`;
  };
  
  return (
    <Accordion type="multiple" value={openSections} className="w-full">
      {sections.map((section) => {
        const sectionDuration = getTotalSectionDuration(section.lectures);
        
        return (
          <AccordionItem
            key={section.id}
            value={section.id.toString()}
            className="border border-gray-200 rounded-md overflow-hidden mb-4"
          >
            <AccordionTrigger 
              onClick={() => toggleSection(section.id.toString())} 
              className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left flex justify-between items-center"
            >
              <span className="text-gray-800 font-medium">
                {section.title}
              </span>
              <span className="ml-6 flex items-center text-gray-500 text-sm">
                <span>{section.lectures.length} lectures</span>
                <span className="mx-2">•</span>
                <span>{formatDuration(sectionDuration)}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 bg-white">
              <ul className="space-y-2">
                {section.lectures.map((lecture) => (
                  <li key={lecture.id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <PlayCircle className="text-gray-400 mr-2 h-4 w-4" />
                      <span className="text-sm">{lecture.title}</span>
                      
                      {lecture.resources && (
                        <span className="ml-2 text-primary text-xs">
                          <File className="h-3 w-3 inline" />
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{lecture.duration}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
