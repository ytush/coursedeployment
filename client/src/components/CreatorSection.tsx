import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { DollarSign, Users } from "lucide-react";

export default function CreatorSection() {
  return (
    <div className="bg-indigo-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Become a Creator
            </h2>
            <p className="mt-3 max-w-3xl text-lg text-gray-500">
              Share your knowledge and earn cryptocurrency. Create courses once and earn forever through NFT sales.
            </p>
            <div className="mt-8">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Earn Through NFT Royalties
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    Earn every time your course NFT is resold on the secondary market.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center">
                <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Users className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Build Your Community
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    Connect directly with your students and grow your reputation as an expert educator.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <Button asChild size="lg">
                  <Link href="/create">
                    Start Creating
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-10 lg:mt-0">
            <div className="pl-4 -mr-48 sm:pl-6 md:-mr-16 lg:px-0 lg:mx-0 lg:relative lg:h-full">
              <img 
                className="w-full rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 lg:absolute lg:left-0 lg:h-full lg:w-auto lg:max-w-none" 
                src="https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
                alt="Creator working on course"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
