"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import Link from "next/link";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-[95%] mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 text-white p-1 rounded">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-play"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <Link href="/" className="text-xl font-bold">
            YouTubeTranscriptTool
          </Link>
        </div>

        <nav
          className={`${
            isMenuOpen
              ? "absolute top-16 left-0 right-0 bg-background border-b"
              : "hidden"
          } md:block`}
        >
          <ul
            className={`${
              isMenuOpen ? "flex flex-col p-4" : "flex items-center space-x-4"
            }`}
          >
            <li>
              <a
                href="#features"
                className="text-foreground hover:text-red-600 transition-colors"
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#how-to"
                className="text-foreground hover:text-red-600 transition-colors"
              >
                How To
              </a>
            </li>
            <li>
              <a
                href="#faq"
                className="text-foreground hover:text-red-600 transition-colors"
              >
                FAQ
              </a>
            </li>
          </ul>
        </nav>

        <Button
          variant="ghost"
         
          aria-label="Toggle theme"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
              <Button
                 
          className="md:hidden"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>
    </header>
  );
}
