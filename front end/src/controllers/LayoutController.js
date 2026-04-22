class LayoutController {
  constructor() {
    this.widgets = [];
    this.listeners = [];
  }

  addWidget(widget) {
    this.widgets.push(widget);
    this.notifyListeners();
  }

  removeWidget(id) {
    this.widgets = this.widgets.filter(w => w.id !== id);
    this.notifyListeners();
  }

  updateWidget(id, updates) {
    this.widgets = this.widgets.map(w => 
      w.id === id ? { ...w, ...updates } : w
    );
    this.notifyListeners();
  }

  reorderWidgets(newOrder) {
    this.widgets = newOrder;
    this.notifyListeners();
  }

  getWidgets() {
    return this.widgets;
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.widgets));
  }
}

export default new LayoutController();
