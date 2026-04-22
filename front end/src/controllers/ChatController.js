class ChatController {
  constructor() {
    this.messages = [];
    this.listeners = [];
    this.uiInfluenceCallbacks = [];
  }

  addMessage(message) {
    this.messages.push({
      id: Date.now(),
      timestamp: new Date(),
      ...message
    });
    this.notifyListeners();
    
    if (message.uiAction) {
      this.executeUIAction(message.uiAction);
    }
  }

  executeUIAction(action) {
    this.uiInfluenceCallbacks.forEach(callback => callback(action));
  }

  subscribeToUIInfluence(callback) {
    this.uiInfluenceCallbacks.push(callback);
    return () => {
      this.uiInfluenceCallbacks = this.uiInfluenceCallbacks.filter(cb => cb !== callback);
    };
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.messages));
  }

  getMessages() {
    return this.messages;
  }

  clearMessages() {
    this.messages = [];
    this.notifyListeners();
  }
}

export default new ChatController();
