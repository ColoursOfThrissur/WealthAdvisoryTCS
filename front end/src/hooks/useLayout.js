import { useState, useEffect } from 'react';
import LayoutController from '../controllers/LayoutController';

export const useLayout = () => {
  const [widgets, setWidgets] = useState(LayoutController.getWidgets());

  useEffect(() => {
    const unsubscribe = LayoutController.subscribe(setWidgets);
    return unsubscribe;
  }, []);

  return {
    widgets,
    addWidget: (widget) => LayoutController.addWidget(widget),
    removeWidget: (id) => LayoutController.removeWidget(id),
    updateWidget: (id, updates) => LayoutController.updateWidget(id, updates),
    reorderWidgets: (newOrder) => LayoutController.reorderWidgets(newOrder)
  };
};
