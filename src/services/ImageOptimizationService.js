class ImageOptimizationService {
  constructor() {
    // Target sizes for different use cases
    this.variants = {
      thumbnail: { width: 150, height: 150, quality: 0.7, targetKB: 5 },
      medium: { width: 400, height: 400, quality: 0.8, targetKB: 30 },
      large: { width: 800, height: 800, quality: 0.85, targetKB: 100 },
    };
  }

  /**
   * Compress and resize image to target specifications
   * @param {File} file - Original image file
   * @param {Object} options - Compression options
   * @returns {Promise<Blob>} Compressed image blob
   */
  async compressImage(file, options = {}) {
    const {
      width = 800,
      height = 600,
      quality = 0.8,
      format = "webp",
      targetKB = 100,
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate optimal dimensions maintaining aspect ratio
        const { newWidth, newHeight } = this.calculateDimensions(
          img.width,
          img.height,
          width,
          height
        );

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Try different quality levels to hit target file size
        this.compressToTargetSize(canvas, format, quality, targetKB)
          .then(resolve)
          .catch(reject);
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate optimal dimensions maintaining aspect ratio
   */
  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    const aspectRatio = originalWidth / originalHeight;

    let newWidth = maxWidth;
    let newHeight = maxWidth / aspectRatio;

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = maxHeight * aspectRatio;
    }

    return {
      newWidth: Math.round(newWidth),
      newHeight: Math.round(newHeight),
    };
  }

  /**
   * Compress canvas to target file size
   */
  async compressToTargetSize(canvas, format, initialQuality, targetKB) {
    let quality = initialQuality;
    let blob;
    let attempts = 0;
    const maxAttempts = 8;

    while (attempts < maxAttempts) {
      blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, `image/${format}`, quality);
      });

      const sizeKB = blob.size / 1024;

      console.log(
        `🔄 Compression attempt ${attempts + 1}: ${sizeKB.toFixed(
          1
        )}KB (target: ${targetKB}KB) at quality ${quality.toFixed(2)}`
      );

      if (sizeKB <= targetKB || quality <= 0.1) {
        break;
      }

      // Reduce quality for next attempt
      quality *= 0.8;
      attempts++;
    }

    return blob;
  }

  /**
   * Create all image variants (thumbnail, medium, large)
   * @param {File} file - Original image file
   * @returns {Promise<Object>} Object with all variants
   */
  async createImageVariants(file) {
    try {
      console.log("🎨 Creating optimized image variants...");

      const variants = {};
      const variantPromises = [];

      // Create all variants in parallel
      for (const [name, config] of Object.entries(this.variants)) {
        const promise = this.compressImage(file, {
          width: config.width,
          height: config.height,
          quality: config.quality,
          targetKB: config.targetKB,
          format: "webp",
        }).then((blob) => {
          variants[name] = {
            blob,
            size: blob.size,
            sizeKB: (blob.size / 1024).toFixed(1),
          };
        });

        variantPromises.push(promise);
      }

      await Promise.all(variantPromises);

      console.log("✅ Image variants created:", {
        thumbnail: `${variants.thumbnail.sizeKB}KB`,
        medium: `${variants.medium.sizeKB}KB`,
        large: `${variants.large.sizeKB}KB`,
        total: `${Object.values(variants)
          .reduce((sum, v) => sum + parseFloat(v.sizeKB), 0)
          .toFixed(1)}KB`,
      });

      return variants;
    } catch (error) {
      console.error("💥 Error creating image variants:", error);
      throw error;
    }
  }

  /**
   * Validate image file before processing
   * @param {File} file - Image file to validate
   * @param {Object} limits - User-specific limits from listing limits config
   * @returns {boolean} True if valid
   */
  validateImageFile(file, limits = null) {
    // Check file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(", ")}`
      );
    }

    // Use provided limits or default to 5MB for basic users
    const maxSizeMB = limits?.MAX_IMAGE_SIZE_MB || 5;
    const maxSize = maxSizeMB * 1024 * 1024;

    if (file.size > maxSize) {
      throw new Error(
        `File too large: ${(file.size / 1024 / 1024).toFixed(
          1
        )}MB. Maximum: ${maxSizeMB}MB`
      );
    }

    return true;
  }

  /**
   * Validate multiple image files against user limits
   * @param {FileList|Array} files - Image files to validate
   * @param {Object} limits - User-specific limits
   * @returns {boolean} True if valid
   */
  validateImageFiles(files, limits = null) {
    const maxImages = limits?.MAX_IMAGES_PER_PRODUCT || 3;

    if (files.length > maxImages) {
      throw new Error(
        `Too many images. Maximum ${maxImages} images allowed per product.`
      );
    }

    // Validate each file
    Array.from(files).forEach((file, index) => {
      try {
        this.validateImageFile(file, limits);
      } catch (error) {
        throw new Error(`Image ${index + 1}: ${error.message}`);
      }
    });

    return true;
  }

  /**
   * Convert blob to file for upload
   * @param {Blob} blob - Image blob
   * @param {string} filename - Original filename
   * @param {string} variant - Variant name (thumbnail, medium, large)
   * @returns {File} File object for upload
   */
  blobToFile(blob, filename, variant) {
    const extension = "webp";
    const baseName = filename.split(".")[0];
    const newFilename = `${baseName}_${variant}.${extension}`;

    return new File([blob], newFilename, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  }
}

export const imageOptimizationService = new ImageOptimizationService();
