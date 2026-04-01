import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Film, Search, Heart, Users, User, Crown, Menu, X, HelpCircle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { FeedbackModal } from "@/components/ui/FeedbackModal";

const NAV_ITEMS = [
  { page: "Home", label: "Home", icon: Film },
  { page: "Trending", label: "Trending", icon: Flame },
  { page: "Search", label: "Search", icon: Search },
  { page: "Couple", label: "Couple Space", icon: Users },
  { page: "Favorites", label: "Favorites", icon: Heart },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          {/* Logo */}
          <Link to={createPageUrl("Home")} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg shadow-sm">
              <img src="/logo.png" alt="CoupleMovie Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Couple<span className="gradient-text">Movie</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={cn(
                    "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={() => setFeedbackOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/50"
            >
              <HelpCircle className="h-4 w-4" />
              Help & Feedback
            </button>
            <Link
              to={createPageUrl("Pricing")}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Crown className="h-3.5 w-3.5" />
              Pro
            </Link>
            <Link
              to={createPageUrl("Profile")}
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground hover:ring-2 hover:ring-primary/50"
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="glass-strong border-t border-border px-4 pb-4 md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1 pt-2">
              {NAV_ITEMS.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="my-2 h-px bg-border" />
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setFeedbackOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground text-left"
              >
                <HelpCircle className="h-4 w-4" />
                Help & Feedback
              </button>
              <Link
                to={createPageUrl("Pricing")}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Crown className="h-4 w-4" />
                Pricing
              </Link>
              <Link
                to={createPageUrl("Profile")}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                Profile
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="pt-16">
        {children}
      </main>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
