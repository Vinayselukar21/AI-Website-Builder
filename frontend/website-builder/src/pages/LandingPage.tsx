import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function LandingPage() {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate('/builder', { state: { prompt } });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4">
        <header className="py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bot className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">AI Website Builder</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>
        </header>

        <main className="mt-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Create Your Website with AI
            </h1>
            <p className="text-lg text-muted-foreground mb-12">
              Describe your website idea, and let AI build it for you.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your website (e.g., 'Create a modern portfolio website with a dark theme')"
                className="min-h-[150px] text-base"
              />
              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto"
              >
                Generate Website
              </Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}