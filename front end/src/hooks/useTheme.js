import { useState, useEffect } from 'react';
import ThemeController from '../controllers/ThemeController';

export const useTheme = () => {
  const [theme, setTheme] = useState(ThemeController.getTheme());

  useEffect(() => {
    const unsubscribe = ThemeController.subscribe(setTheme);
    return unsubscribe;
  }, []);

  const toggleTheme = () => {
    ThemeController.toggle();
  };

  return { theme, toggleTheme };
};
