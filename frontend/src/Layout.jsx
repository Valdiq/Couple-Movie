
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Search, Home, Star, User, Users, Crown } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300">
      <style>{`
        :root {
          --primary: 340 82% 52%;
          --primary-foreground: 210 40% 98%;
          --secondary: 217 33% 17%;
          --secondary-foreground: 210 40% 98%;
          --accent: 217 33% 25%;
          --accent-foreground: 210 40% 98%;
          --background: 224 71% 4%;
          --foreground: 210 40% 98%;
          --card: 220 40% 10%;
          --card-foreground: 210 40% 98%;
          --border: 217 33% 20%;
          --input: 217 33% 20%;
          --ring: 340 82% 52%;
        }
      `}</style>
      
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 shadow-sm">
                <Heart className="w-5 h-5 text-rose-500 fill-current" />
              </div>
              <h1 className="text-xl font-bold text-slate-100">
                CoupleMovie
              </h1>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1 bg-slate-800/50 p-1 rounded-full border border-slate-700">
              {[
                { page: "Home", label: "Discover", icon: Home },
                { page: "Search", label: "Search", icon: Search },
                { page: "Favorites", label: "Favorites", icon: Star },
                { page: "Couple", label: "Couple", icon: Users },
              ].map(({ page, label, icon: Icon }) => (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    currentPageName === page
                      ? "bg-slate-700/60 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
               <Link
                to={createPageUrl("Pricing")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 ml-2 text-sm font-medium"
              >
                <Crown className="w-4 h-4" />
                Pro
              </Link>
            </nav>

            <Link to={createPageUrl("Profile")} className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 hover:bg-slate-700 transition-colors">
                <User className="w-5 h-5 text-slate-400" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {children}
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 z-50">
        <nav className="flex justify-around items-center py-2">
           {[
              { page: "Home", label: "Discover", icon: Home },
              { page: "Search", label: "Search", icon: Search },
              { page: "Favorites", label: "Favorites", icon: Star },
              { page: "Couple", label: "Couple", icon: Users },
              { page: "Profile", label: "Profile", icon: User }
            ].map(({ page, label, icon: Icon, pro }) => (
              <Link
                key={page}
                to={createPageUrl(page)}
                className={`flex flex-col items-center gap-1 p-2 rounded-md ${
                  currentPageName === page ? (pro ? 'text-pink-500' : 'text-indigo-400') : "text-slate-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            ))}
        </nav>
      </div>
    </div>
  );
}
