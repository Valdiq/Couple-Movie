import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Minimize2, Sparkles, Send, Loader2, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/api/axios';
import ReactMarkdown from 'react-markdown';
import { Movie } from '@/entities/Movie';
import MovieDetails from '@/components/movie/MovieDetails';

/* ───── tiny inline movie card shown inside chat bubbles ───── */
function ChatMovieCard({ imdbId, title }) {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Movie.getDetails(imdbId)
      .then((m) => { if (!cancelled) setMovie(m); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [imdbId]);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 my-1 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary animate-pulse">
        <Film className="w-3 h-3" /> {title}…
      </span>
    );
  }

  const poster = movie?.poster && movie.poster !== 'N/A' ? movie.poster : null;
  const year = movie?.year || '';
  const rating = movie?.imdb_rating || movie?.imdbRating || '';

  return (
    <button
      data-imdb={imdbId}
      className="flex items-center gap-2 my-1.5 p-1.5 pr-3 rounded-xl bg-primary/5 hover:bg-primary/15 border border-primary/20 hover:border-primary/40 transition-all cursor-pointer text-left group w-full max-w-[260px]"
    >
      {poster ? (
        <img src={poster} alt={title} className="w-10 h-14 rounded-lg object-cover shrink-0 shadow-sm" />
      ) : (
        <div className="w-10 h-14 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <Film className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
          {title}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {year}{rating ? ` · ⭐ ${rating}` : ''}
        </p>
      </div>
    </button>
  );
}

/* ───── markdown renderer with movie:// link handling ───── */
function ChatMarkdown({ content, onMovieClick }) {
  return (
    <ReactMarkdown
      components={{
        a: ({ href, children }) => {
          if (href && href.startsWith('movie://')) {
            const imdbId = href.replace('movie://', '');
            const title = typeof children === 'string' ? children : 
              Array.isArray(children) ? children.join('') : String(children);
            return (
              <span onClick={(e) => { e.stopPropagation(); onMovieClick(imdbId); }}>
                <ChatMovieCard imdbId={imdbId} title={title} />
              </span>
            );
          }
          return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">{children}</a>;
        },
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        ul: ({ children }) => <ul className="space-y-1 my-2">{children}</ul>,
        ol: ({ children }) => <ol className="space-y-1 my-2 list-decimal list-inside">{children}</ol>,
        li: ({ children }) => <li className="flex gap-1.5 items-start"><span className="text-primary mt-0.5">•</span><span className="flex-1">{children}</span></li>,
        em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/* ───── main widget ───── */
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '🎬 Hey there! I\'m your **Movie Concierge**.\n\nAsk me anything — like *"I want a sad movie about space"* or *"something similar to Lord of the Rings"* and I\'ll find the best matches from our database! 🍿' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Movie details modal state
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsOpen(false);
  };

  const handleMovieClick = useCallback(async (imdbId) => {
    try {
      const movie = await Movie.getDetails(imdbId);
      setSelectedMovie(movie);
      setDetailsOpen(true);
    } catch (err) {
      console.error('Failed to load movie details', err);
    }
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await api.post('/movies/chat', { message: userMsg });
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "😕 Oops, something went wrong. The AI might be temporarily unavailable. Please try again!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat FAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
          >
            <Button
              onClick={handleToggle}
              className="h-14 w-14 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25"
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </Button>
            {isMinimized && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window — responsive sizing */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-50 flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-border bg-card
              bottom-0 right-0 w-full h-[100dvh]
              sm:bottom-4 sm:right-4 sm:w-[24rem] sm:h-[36rem] sm:rounded-2xl
              md:w-[28rem] md:h-[40rem]
              lg:w-[32rem] lg:h-[44rem]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-accent p-4 text-primary-foreground shadow-sm z-10 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Movie Concierge</h3>
                    <p className="text-xs text-primary-foreground/70">Powered by Gemini AI ✨</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={handleMinimize} className="h-8 w-8 hover:bg-white/20 text-white">
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 hover:bg-white/20 text-white">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-secondary text-secondary-foreground rounded-tl-sm border border-border'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <ChatMarkdown content={msg.content} onMovieClick={handleMovieClick} />
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 border border-border">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-xs text-muted-foreground">Searching movies…</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-card border-t border-border shrink-0">
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe what you want to watch…"
                  className="flex-1 h-10 px-4 py-2 rounded-full border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-10 w-10 rounded-full shrink-0">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Movie Details Modal — triggered from chat movie cards */}
      <MovieDetails
        movie={selectedMovie}
        isOpen={detailsOpen}
        onClose={() => { setDetailsOpen(false); setSelectedMovie(null); }}
      />
    </>
  );
}