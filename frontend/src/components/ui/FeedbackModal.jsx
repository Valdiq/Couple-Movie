import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { submitFeedback } from "@/services/supportService";

export function FeedbackModal({ isOpen, onClose }) {
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic || !message) return;
    
    setLoading(true);
    setError(null);
    try {
      await submitFeedback({ topic, message });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTopic("");
        setMessage("");
        onClose();
      }, 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to send feedback. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state when strictly closed
    setSuccess(false);
    setTopic("");
    setMessage("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-lg border-border">
        <DialogHeader>
          <DialogTitle>Help & Feedback</DialogTitle>
          <DialogDescription>
            Found a bug? Have a suggestion? We'd love to hear from you!
          </DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="mb-4 text-5xl">✉️</div>
            <h3 className="mb-2 text-xl font-bold text-foreground">Message Sent!</h3>
            <p className="text-sm text-muted-foreground">Thank you for helping make CoupleMovie even better.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Topic</label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="What is this regarding?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bug Report">🐛 Bug Report</SelectItem>
                  <SelectItem value="Feature Suggestion">💡 Feature Suggestion</SelectItem>
                  <SelectItem value="Movie Missing">🎬 Missing Movie/Series</SelectItem>
                  <SelectItem value="Need Help">❓ Need Help</SelectItem>
                  <SelectItem value="General Feedback">💭 General Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Message</label>
              <Textarea
                placeholder="Tell us what's on your mind..."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="resize-none focus-visible:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!topic || !message || loading} className="min-w-[120px]">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? "Sending..." : "Send Feedback"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
