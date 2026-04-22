import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
      <div className={`theme-toggle__track ${theme === 'dark' ? 'theme-toggle__track--dark' : ''}`}>
        <div className="theme-toggle__thumb">
          {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
