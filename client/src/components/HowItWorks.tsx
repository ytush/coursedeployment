import { ShoppingCart, Laptop, Share2 } from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            How CourseChain Works
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Our unique NFT-based approach to online education
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            <div className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">1. Purchase Courses as NFTs</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                Buy courses with cryptocurrency. Each purchase mints a unique NFT that represents your ownership of the course content.
              </dd>
            </div>

            <div className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                  <Laptop className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">2. Access Course Content</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                Learn at your own pace with unlimited access to all course materials, including videos, exercises, and downloads.
              </dd>
            </div>

            <div className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                  <Share2 className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">3. Share or Trade Your NFT</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                Temporarily share access with friends or colleagues. After the sharing period expires, full control returns to you.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
