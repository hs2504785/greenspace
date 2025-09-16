import VegetableService from "./VegetableService";

class ClientVegetableService {
  constructor() {
    this.internalService = VegetableService;
    this.externalProductsCache = null;
    this.cacheTimestamp = null;
    this.userSheetProductsCache = null;
    this.userSheetCacheTimestamp = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get all vegetables (internal + external)
   * @param {Object} options - Options for fetching data
   * @param {boolean} options.includeExternal - Whether to include external products
   * @param {boolean} options.refreshExternal - Force refresh external data
   * @returns {Promise<Array>} Combined array of internal and external products
   */
  async getAllVegetables(options = {}) {
    const {
      includeExternal = true,
      refreshExternal = false,
      externalOnly = false,
    } = options;

    try {
      // Get internal products (unless externalOnly is true)
      let internalProducts = [];
      if (!externalOnly) {
        internalProducts = await this.internalService.getAllVegetables();
        console.log(`📦 Fetched ${internalProducts.length} internal products`);
      }

      // Get external products if requested
      let externalProducts = [];
      if (includeExternal) {
        externalProducts = await this.getExternalProducts(refreshExternal);
        console.log(`🌐 Fetched ${externalProducts.length} external products`);
      }

      // Get user connected sheet products
      let userSheetProducts = [];
      if (includeExternal) {
        userSheetProducts = await this.getUserSheetProducts(refreshExternal);
        console.log(
          `📋 Fetched ${userSheetProducts.length} user sheet products`
        );
      }

      // Combine and return
      const allProducts = [
        ...internalProducts,
        ...externalProducts,
        ...userSheetProducts,
      ];
      console.log(
        `✅ Total products: ${allProducts.length} (${internalProducts.length} internal + ${externalProducts.length} external + ${userSheetProducts.length} user sheets)`
      );

      return allProducts;
    } catch (error) {
      console.error("❌ Error in getAllVegetables:", error);

      // Fallback to internal products only if external fetch fails
      if (!externalOnly) {
        console.log("⚠️ Falling back to internal products only");
        return await this.internalService.getAllVegetables();
      }

      throw error;
    }
  }

  /**
   * Get external products with caching via API
   * @param {boolean} forceRefresh - Force refresh from source
   * @returns {Promise<Array>} Array of external products
   */
  async getExternalProducts(forceRefresh = false) {
    try {
      const now = Date.now();
      const isCacheValid =
        this.externalProductsCache &&
        this.cacheTimestamp &&
        now - this.cacheTimestamp < this.cacheDuration;

      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && isCacheValid) {
        console.log("📋 Using cached external products");
        return this.externalProductsCache;
      }

      // Fetch fresh data from API
      console.log("🔄 Fetching fresh external products");
      const url = forceRefresh
        ? "/api/external-products?refresh=true"
        : "/api/external-products";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`External products API returned ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch external products");
      }

      // Update cache
      this.externalProductsCache = data.products || [];
      this.cacheTimestamp = now;

      return this.externalProductsCache;
    } catch (error) {
      console.error("❌ Error fetching external products:", error);

      // Return cached data if available, even if stale
      if (this.externalProductsCache) {
        console.log("⚠️ Using stale cached external products due to error");
        return this.externalProductsCache;
      }

      // Return empty array if no cache available
      console.log("⚠️ No external products available");
      return [];
    }
  }

  /**
   * Get products from user connected sheets with caching
   * @param {boolean} forceRefresh - Force refresh from source
   * @returns {Promise<Array>} Array of user sheet products
   */
  async getUserSheetProducts(forceRefresh = false) {
    try {
      const now = Date.now();
      const isCacheValid =
        this.userSheetProductsCache &&
        this.userSheetCacheTimestamp &&
        now - this.userSheetCacheTimestamp < this.cacheDuration;

      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && isCacheValid) {
        console.log("📋 Using cached user sheet products");
        return this.userSheetProductsCache;
      }

      // Fetch fresh data from API
      console.log("🔄 Fetching fresh user sheet products");
      const response = await fetch("/api/user-sheet-products");

      if (!response.ok) {
        if (response.status === 401) {
          // User not logged in - return empty array
          return [];
        }
        throw new Error(`User sheet products API returned ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch user sheet products");
      }

      // Update cache
      this.userSheetProductsCache = data.products || [];
      this.userSheetCacheTimestamp = now;

      return this.userSheetProductsCache;
    } catch (error) {
      console.error("❌ Error fetching user sheet products:", error);

      // Return cached data if available, even if stale
      if (this.userSheetProductsCache) {
        console.log("⚠️ Using stale cached user sheet products due to error");
        return this.userSheetProductsCache;
      }

      // Return empty array if no cache available
      console.log("⚠️ No user sheet products available");
      return [];
    }
  }

  /**
   * Get a single vegetable by ID (checks both internal and external)
   * @param {string} id - Product ID
   * @returns {Promise<Object|null>} Product data or null
   */
  async getVegetableById(id) {
    try {
      // Check if it's an external product (external IDs start with 'sheets_')
      if (id.startsWith("sheets_")) {
        const externalProducts = await this.getExternalProducts();
        return externalProducts.find((product) => product.id === id) || null;
      }

      // Otherwise, get from internal service
      return await this.internalService.getVegetableById(id);
    } catch (error) {
      console.error("❌ Error getting vegetable by ID:", error);
      return null;
    }
  }

  /**
   * Search vegetables across internal and external sources
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} Filtered products
   */
  async searchVegetables(filters = {}) {
    try {
      const {
        query,
        category,
        location,
        minPrice,
        maxPrice,
        showFreeOnly,
        includeExternal = true,
        sourceType, // 'internal', 'external', or 'all'
      } = filters;

      // Get products based on source type
      let products = [];
      if (sourceType === "external") {
        products = await this.getAllVegetables({ externalOnly: true });
      } else if (sourceType === "internal") {
        products = await this.getAllVegetables({ includeExternal: false });
      } else {
        products = await this.getAllVegetables({ includeExternal });
      }

      // Apply filters
      let filteredProducts = products;

      // IMPORTANT: Exclude prebooking products by default (like original useVegetables)
      // Only show regular products unless specifically filtering for prebooking
      filteredProducts = filteredProducts.filter((product) => {
        const productType = product.product_type || "regular";
        return productType === "regular";
      });

      // Text search
      if (query) {
        const searchQuery = query.toLowerCase();
        filteredProducts = filteredProducts.filter(
          (product) =>
            product.name.toLowerCase().includes(searchQuery) ||
            product.description?.toLowerCase().includes(searchQuery) ||
            product.category.toLowerCase().includes(searchQuery) ||
            product.location?.toLowerCase().includes(searchQuery)
        );
      }

      // Category filter
      if (category && category !== "All") {
        filteredProducts = filteredProducts.filter(
          (product) => product.category.toLowerCase() === category.toLowerCase()
        );
      }

      // Location filter
      if (location) {
        filteredProducts = filteredProducts.filter((product) =>
          product.location?.toLowerCase().includes(location.toLowerCase())
        );
      }

      // Price filters
      if (minPrice !== undefined && minPrice !== null) {
        filteredProducts = filteredProducts.filter(
          (product) => product.price >= parseFloat(minPrice)
        );
      }

      if (maxPrice !== undefined && maxPrice !== null) {
        filteredProducts = filteredProducts.filter(
          (product) => product.price <= parseFloat(maxPrice)
        );
      }

      // Free items filter
      if (showFreeOnly) {
        filteredProducts = filteredProducts.filter(
          (product) => product.price === 0
        );
      }

      return filteredProducts;
    } catch (error) {
      console.error("❌ Error searching vegetables:", error);
      return [];
    }
  }

  /**
   * Get unique categories from all sources
   * @returns {Promise<Array>} Array of unique categories
   */
  async getCategories() {
    try {
      const [internalCategories, externalProducts] = await Promise.all([
        this.internalService.getCategories(),
        this.getExternalProducts(),
      ]);

      const externalCategories = [
        ...new Set(
          externalProducts.map((product) => product.category).filter(Boolean)
        ),
      ];

      const allCategories = [
        ...new Set([...internalCategories, ...externalCategories]),
      ];
      return allCategories.sort();
    } catch (error) {
      console.error("❌ Error getting categories:", error);
      return await this.internalService.getCategories(); // Fallback to internal only
    }
  }

  /**
   * Get unique locations from all sources
   * @returns {Promise<Array>} Array of unique locations
   */
  async getLocations() {
    try {
      const [internalLocations, externalProducts] = await Promise.all([
        this.internalService.getLocations(),
        this.getExternalProducts(),
      ]);

      const externalLocations = [
        ...new Set(
          externalProducts.map((product) => product.location).filter(Boolean)
        ),
      ];

      const allLocations = [
        ...new Set([...internalLocations, ...externalLocations]),
      ];
      return allLocations.sort();
    } catch (error) {
      console.error("❌ Error getting locations:", error);
      return await this.internalService.getLocations(); // Fallback to internal only
    }
  }

  /**
   * Get statistics about products
   * @returns {Promise<Object>} Statistics object
   */
  async getProductStats() {
    try {
      const [internalProducts, externalProducts] = await Promise.all([
        this.internalService.getAllVegetables(),
        this.getExternalProducts(),
      ]);

      return {
        total: internalProducts.length + externalProducts.length,
        internal: internalProducts.length,
        external: externalProducts.length,
        internalAvailable: internalProducts.filter((p) => p.quantity > 0)
          .length,
        externalAvailable: externalProducts.filter((p) => p.quantity > 0)
          .length,
        totalFree: [...internalProducts, ...externalProducts].filter(
          (p) => p.price === 0
        ).length,
        categories: await this.getCategories(),
        locations: await this.getLocations(),
        lastExternalUpdate: this.cacheTimestamp
          ? new Date(this.cacheTimestamp).toISOString()
          : null,
      };
    } catch (error) {
      console.error("❌ Error getting product stats:", error);
      return {
        total: 0,
        internal: 0,
        external: 0,
        error: error.message,
      };
    }
  }

  /**
   * Clear external products cache
   */
  clearExternalCache() {
    this.externalProductsCache = null;
    this.cacheTimestamp = null;
    console.log("🗑️ External products cache cleared");
  }

  /**
   * Refresh external products cache
   */
  async refreshExternalCache() {
    console.log("🔄 Refreshing external products cache");
    return await this.getExternalProducts(true);
  }

  // Delegate other methods to internal service
  async createVegetable(vegetableData) {
    return await this.internalService.createVegetable(vegetableData);
  }

  async updateVegetable(id, vegetableData) {
    return await this.internalService.updateVegetable(id, vegetableData);
  }

  async deleteVegetable(id) {
    return await this.internalService.deleteVegetable(id);
  }

  async getVegetablesByOwner(ownerId) {
    return await this.internalService.getVegetablesByOwner(ownerId);
  }

  async uploadImage(file, userId) {
    return await this.internalService.uploadImage(file, userId);
  }

  async getFreeVegetables() {
    // Get free vegetables from both sources
    const allProducts = await this.getAllVegetables();
    return allProducts.filter((product) => product.price === 0);
  }

  async updateQuantitiesAfterOrder(orderItems) {
    return await this.internalService.updateQuantitiesAfterOrder(orderItems);
  }

  async restoreQuantitiesAfterCancellation(orderId, orderType) {
    return await this.internalService.restoreQuantitiesAfterCancellation(
      orderId,
      orderType
    );
  }
}

export default new ClientVegetableService();
