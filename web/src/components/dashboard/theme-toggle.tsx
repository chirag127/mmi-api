"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const [theme, setTheme] = React.useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
      if (savedTheme) return savedTheme;
      
      // Check system preference
      return window.matchMedia("(prefers-color-scheme: dark)").matches 
        ? "dark" 
        : "light";
    }
    return "light";
  });

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      if (typeof window !== "undefined") {
        document.documentElement.classList.remove(
          prevTheme === "light" ? "dark" : "light"
        );
        document.documentElement.classList.add(newTheme);
      }
      return newTheme;
    });
  };

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove(
        theme === "light" ? "dark" : "light"
      );
      document.documentElement.classList.add(theme);
      
      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute(
          "content", 
          theme === "dark" ? "#0f172a" : "#ffffff"
        );
      }
    }
  }, [theme]);

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="hover:bg-accent/10"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}