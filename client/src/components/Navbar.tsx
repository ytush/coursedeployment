import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { useWeb3 } from "@/lib/web3";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Link as LinkIcon, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const [location] = useLocation();
  const { isConnected, account, disconnectWallet, userId } = useWeb3();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  
  // Check scroll position to add shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Fetch user data including avatar
  useEffect(() => {
    async function fetchUserData() {
      if (!userId) return;
      
      try {
        const response = await fetch(`/api/users/${userId}`);
        
        if (response.ok) {
          const userData = await response.json();
          console.log("Navbar fetched user data:", userData);
          
          if (userData.avatarUrl) {
            setUserAvatar(userData.avatarUrl);
          }
          
          if (userData.username) {
            setUsername(userData.username);
          }
        }
      } catch (error) {
        console.error("Error fetching user data for navbar:", error);
      }
    }
    
    if (isConnected && userId) {
      fetchUserData();
    }
  }, [isConnected, userId, location]);
  
  // Get shortened wallet address
  const shortenedAddress = account 
    ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
    : "";
  
  return (
    <nav className={`bg-white ${isScrolled ? 'shadow-md' : ''} sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <LinkIcon className="text-primary text-2xl mr-2" />
              <Link href="/" className="font-bold text-xl text-primary">CourseChain</Link>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link 
                href="/" 
                className={`${
                  location === "/" 
                    ? "border-b-2 border-primary text-gray-900" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } inline-flex items-center px-1 pt-1 text-sm font-medium`}
              >
                Discover
              </Link>
              <Link 
                href="/my-courses" 
                className={`${
                  location === "/my-courses" 
                    ? "border-b-2 border-primary text-gray-900" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } inline-flex items-center px-1 pt-1 text-sm font-medium`}
              >
                My Courses
              </Link>
              <Link 
                href="/create" 
                className={`${
                  location === "/create" 
                    ? "border-b-2 border-primary text-gray-900" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } inline-flex items-center px-1 pt-1 text-sm font-medium`}
              >
                Create
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ConnectWalletButton />
            </div>
            {isConnected && (
              <div className="hidden md:ml-4 md:flex md:items-center">
                <div className="relative ml-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="relative flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      >
                        <span className="sr-only">Open user menu</span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={userAvatar || ""} alt="User profile" />
                          <AvatarFallback>{username?.charAt(0)?.toUpperCase() || account?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        <div className="font-normal text-xs text-gray-500">Connected as</div>
                        <div className="font-semibold text-sm">{shortenedAddress}</div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <User className="w-4 h-4 mr-2" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/my-courses">My Courses</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/create">Create Course</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={disconnectWallet}>
                        Disconnect Wallet
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
            <div className="-mr-2 flex items-center md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                  >
                    <span className="sr-only">Open main menu</span>
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="pt-4 pb-3 border-t border-gray-200">
                    {isConnected ? (
                      <>
                        <div className="flex items-center px-4">
                          <div className="flex-shrink-0">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={userAvatar || ""} alt="User profile" />
                              <AvatarFallback>{username?.charAt(0)?.toUpperCase() || account?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="ml-3">
                            <div className="text-base font-medium text-gray-800">{username || 'Connected'}</div>
                            <div className="text-sm font-medium text-gray-500">{shortenedAddress}</div>
                          </div>
                        </div>
                        <div className="mt-3 space-y-1">
                          <Button 
                            variant="ghost" 
                            className="block w-full text-left px-4 py-2 text-base font-medium"
                            asChild
                          >
                            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                              Discover
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="block w-full text-left px-4 py-2 text-base font-medium"
                            asChild
                          >
                            <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                              <User className="w-4 h-4 mr-2 inline" />
                              Profile
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="block w-full text-left px-4 py-2 text-base font-medium"
                            asChild
                          >
                            <Link href="/my-courses" onClick={() => setIsMobileMenuOpen(false)}>
                              My Courses
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="block w-full text-left px-4 py-2 text-base font-medium"
                            asChild
                          >
                            <Link href="/create" onClick={() => setIsMobileMenuOpen(false)}>
                              Create Course
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="block w-full text-left px-4 py-2 text-base font-medium text-red-500"
                            onClick={() => {
                              disconnectWallet();
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            Disconnect Wallet
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col px-4 space-y-4">
                        <Button 
                          variant="ghost" 
                          className="block w-full text-left px-4 py-2 text-base font-medium"
                          asChild
                        >
                          <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                            Discover
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="block w-full text-left px-4 py-2 text-base font-medium"
                          asChild
                        >
                          <Link href="/my-courses" onClick={() => setIsMobileMenuOpen(false)}>
                            My Courses
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="block w-full text-left px-4 py-2 text-base font-medium"
                          asChild
                        >
                          <Link href="/create" onClick={() => setIsMobileMenuOpen(false)}>
                            Create Course
                          </Link>
                        </Button>
                        <ConnectWalletButton />
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
