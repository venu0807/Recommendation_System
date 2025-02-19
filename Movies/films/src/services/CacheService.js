class CacheService {
  static CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  static async set(key, data) {
    try {
      const item = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  static async get(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const { data, timestamp } = JSON.parse(item);
      const age = Date.now() - timestamp;

      if (age > this.CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error retrieving cached data:', error);
      return null;
    }
  }

  static clear() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

export default CacheService;
