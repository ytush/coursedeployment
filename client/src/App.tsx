import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CourseDetail from "@/pages/CourseDetail";
import MyCourses from "@/pages/MyCourses";
import CreateCourse from "@/pages/CreateCourse";
import UserProfile from "@/pages/UserProfile";
import LandingPage from "@/pages/LandingPage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { Web3Provider, useWeb3 } from "./lib/web3";

function AppContent() {
  const [location] = useLocation();
  const { isConnected } = useWeb3();
  
  // Determine if we should show the landing page
  const isLandingPage = !isConnected && location === "/";

  return (
    <div className={`flex flex-col ${isLandingPage ? "" : "min-h-screen"}`}>
      {!isLandingPage && <Navbar />}
      <main className={`${isLandingPage ? "" : "flex-grow"}`}>
        {/* Show landing page if not connected and on root path */}
        {isLandingPage ? (
          <LandingPage />
        ) : (
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/course/:id" component={CourseDetail} />
            <Route path="/my-courses" component={MyCourses} />
            <Route path="/create" component={CreateCourse} />
            <Route path="/profile" component={UserProfile} />
            <Route component={NotFound} />
          </Switch>
        )}
      </main>
      {!isLandingPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <AppContent />
        <Toaster />
      </Web3Provider>
    </QueryClientProvider>
  );
}

export default App;
