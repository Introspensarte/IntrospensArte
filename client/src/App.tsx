import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navigation from "@/components/navigation";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Portal from "@/pages/portal";
import Profile from "@/pages/profile";
import UploadActivity from "@/pages/upload-activity";
import Activities from "@/pages/activities";
import Rankings from "@/pages/rankings";
import News from "@/pages/news";
import Announcements from "@/pages/announcements";
import Notifications from "@/pages/notifications";
import Admin from "@/pages/admin";
import UserProfile from "@/pages/user-profile";
import Members from "@/pages/members";
import About from "@/pages/about";
import Information from "@/pages/information";
import Systems from "@/pages/systems";
import Rules from "@/pages/rules";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import { lazy } from "react";
import Support from "@/pages/support";

function Router() {
  return (
    <div className="min-h-screen bg-dark-graphite text-white">
      <Navigation />
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/about" component={About} />
        <Route path="/informacion" component={Information} />
        <Route path="/sistemas" component={Systems} />
        <Route path="/integrantes" component={Members} />
        <Route path="/rules" component={Rules} />
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />
        <Route path="/portal" component={Portal} />
        <Route path="/profile" component={Profile} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/activities" component={Activities} />
        <Route path="/upload" component={UploadActivity} />
        <Route path="/rankings" component={Rankings} />
        <Route path="/usuario/:userId" component={UserProfile} />
        <Route path="/news" component={News} />
        <Route path="/announcements" component={Announcements} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/admin" component={Admin} />
        <Route path="/support" component={Support} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;