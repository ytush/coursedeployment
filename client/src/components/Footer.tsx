import { Link } from "wouter";
import { Link as LinkIcon } from "lucide-react";
import { FaTwitter, FaDiscord, FaGithub, FaTelegram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gray-800">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Platform
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="/">
                  <a className="text-base text-gray-300 hover:text-white">
                    Browse Courses
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/create">
                  <a className="text-base text-gray-300 hover:text-white">
                    Become a Creator
                  </a>
                </Link>
              </li>
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Resources
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  Guides
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  API Status
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  Blog
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Company
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  Press
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  Partners
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Legal
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  NFT License
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <LinkIcon className="text-primary text-2xl mr-2" />
              <span className="font-bold text-xl text-white">CourseChain</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <FaTwitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <FaDiscord className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <FaGithub className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <FaTelegram className="h-5 w-5" />
              </a>
            </div>
          </div>
          <p className="mt-8 text-base text-gray-400 text-center">
            &copy; 2023 CourseChain. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
