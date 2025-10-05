// Storage interface for future use
// Currently, the app uses a proxy architecture to communicate with an external API
// Local database storage can be added here if needed in the future

export interface IStorage {
  // Add CRUD methods here when local storage is needed
}

export class MemStorage implements IStorage {
  constructor() {
    // Initialize storage
  }
}

export const storage = new MemStorage();
