import React from "react";
import { motion } from "framer-motion";
import { Crown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function Pricing() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-lg mx-auto">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 relative">
          <Crown className="h-12 w-12 text-primary" />
          <Sparkles className="h-6 w-6 text-accent absolute -top-2 -right-2 right-0 animate-pulse" />
        </div>
        
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl gradient-text">
          Premium Features<br />Coming Soon
        </h1>
        
        <p className="mb-8 text-lg text-muted-foreground">
          We're working hard on bringing you incredible new features including unlimited favorites, advanced couple matchmaking, and AI-powered relationship recommendations. 
        </p>
        
        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
          <h3 className="font-semibold text-foreground text-lg mb-2 relative">The Wait is Almost Over!</h3>
          <p className="text-sm text-muted-foreground relative">
            While we're putting the finishing touches on our pricing plans, enjoy all current features completely free!
          </p>
        </div>

        <Link 
          to={createPageUrl("Home")}
          className="inline-flex items-center justify-center bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 px-8 py-6 text-lg rounded-xl font-medium transition-colors"
        >
          Return Home
        </Link>
      </motion.div>
    </div>
  );
}
