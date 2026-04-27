import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
    </button>
  );
};

export default ThemeToggle;
