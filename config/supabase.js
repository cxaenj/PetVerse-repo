// Supabase configuration for PetVerse
import { createClient } from '@supabase/supabase-js'

// Supabase project configuration
const supabaseUrl = 'https://odjigifmwsdcnfjskanm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kamlnaWZtd3NkY25manNrYW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTAwNTEsImV4cCI6MjA2NTcyNjA1MX0.VfLHy0lLH7pU6-pOvVi8-nmH1m1rLKtKL0HRfrnrboA'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database helper functions
export const db = {
  // Users
  users: {
    async create(userData) {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single()
      return { data, error }
    },
    
    async getByEmail(email) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()
      return { data, error }
    },
    
    async getById(id) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error }
    }
  },

  // Products
  products: {
    async getAll() {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          pet_categories (
            id,
            name,
            description
          )
        `)
        .eq('is_active', true)
        .order('name')
      return { data, error }
    },
    
    async getById(id) {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          pet_categories (
            id,
            name,
            description
          )
        `)
        .eq('id', id)
        .single()
      return { data, error }
    },
    
    async updateStock(id, newQuantity) {
      const { data, error } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity })
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    },
    
    async create(productData) {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()
      return { data, error }
    }
  },

  // Sales
  sales: {
    async create(saleData) {
      const { data, error } = await supabase
        .from('sales')
        .insert(saleData)
        .select()
        .single()
      return { data, error }
    },
    
    async addItems(saleId, items) {
      const saleItems = items.map(item => ({
        sale_id: saleId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price
      }))
      
      const { data, error } = await supabase
        .from('sale_items')
        .insert(saleItems)
        .select()
      return { data, error }
    },
    
    async getRecent(limit = 50) {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          users (
            id,
            full_name,
            email
          ),
          sale_items (
            *,
            products (
              id,
              name,
              price
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
      return { data, error }
    },
    
    async getStats(days = 30) {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const { data, error } = await supabase
        .from('sales')
        .select('total_amount, sale_date')
        .gte('sale_date', startDate.toISOString())
      return { data, error }
    }
  },

  // Pets
  pets: {
    async getAll() {
      const { data, error } = await supabase
        .from('pets')
        .select(`
          *,
          users (
            id,
            full_name,
            email,
            phone
          )
        `)
        .order('name')
      return { data, error }
    },
    
    async create(petData) {
      const { data, error } = await supabase
        .from('pets')
        .insert(petData)
        .select()
        .single()
      return { data, error }
    },
    
    async getHealthStats() {
      const { data, error } = await supabase
        .from('pets')
        .select('health_status')
      return { data, error }
    }
  },

  // Appointments
  appointments: {
    async getUpcoming() {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          pets (
            id,
            name,
            species,
            breed
          ),
          users (
            id,
            full_name,
            email,
            phone
          )
        `)
        .gte('appointment_date', new Date().toISOString())
        .eq('status', 'scheduled')
        .order('appointment_date')
      return { data, error }
    },
    
    async create(appointmentData) {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single()
      return { data, error }
    }
  },

  // Categories
  categories: {
    async getAll() {
      const { data, error } = await supabase
        .from('pet_categories')
        .select('*')
        .order('name')
      return { data, error }
    }
  }
}

// Authentication helpers
export const auth = {
  async signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },
  
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },
  
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },
  
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },
  
  async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }
}

// Real-time subscriptions
export const subscriptions = {
  onSalesUpdate(callback) {
    return supabase
      .channel('sales_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sales' 
      }, callback)
      .subscribe()
  },
  
  onProductUpdate(callback) {
    return supabase
      .channel('product_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'products' 
      }, callback)
      .subscribe()
  }
}

// Storage bucket configuration and helpers
export const storage = {
  // Bucket names for different file types
  buckets: {
    PET_PHOTOS: 'pet-photos',
    MEDICAL_RECORDS: 'medical-records', 
    PRODUCT_IMAGES: 'product-images',
    USER_AVATARS: 'user-avatars',
    DOCUMENTS: 'documents'
  },

  // Initialize storage buckets
  async initializeBuckets() {
    const bucketsToCreate = Object.values(this.buckets);
    const results = [];

    for (const bucketName of bucketsToCreate) {
      try {
        // Check if bucket exists
        const { data: existingBuckets } = await supabase.storage.listBuckets();
        const bucketExists = existingBuckets?.some(bucket => bucket.name === bucketName);

        if (!bucketExists) {
          // Create bucket with appropriate settings
          const { data, error } = await supabase.storage.createBucket(bucketName, {
            public: bucketName === this.buckets.PRODUCT_IMAGES, // Product images are public
            allowedMimeTypes: this.getAllowedMimeTypes(bucketName),
            fileSizeLimit: this.getFileSizeLimit(bucketName)
          });

          if (error) {
            console.error(`Failed to create bucket ${bucketName}:`, error);
            results.push({ bucket: bucketName, success: false, error });
          } else {
            console.log(`✅ Created bucket: ${bucketName}`);
            results.push({ bucket: bucketName, success: true, data });
          }
        } else {
          console.log(`✅ Bucket already exists: ${bucketName}`);
          results.push({ bucket: bucketName, success: true, existed: true });
        }
      } catch (error) {
        console.error(`Error with bucket ${bucketName}:`, error);
        results.push({ bucket: bucketName, success: false, error });
      }
    }

    return results;
  },

  // Get allowed MIME types for different buckets
  getAllowedMimeTypes(bucketName) {
    const mimeTypes = {
      [this.buckets.PET_PHOTOS]: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      [this.buckets.MEDICAL_RECORDS]: ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'],
      [this.buckets.PRODUCT_IMAGES]: ['image/jpeg', 'image/png', 'image/webp'],
      [this.buckets.USER_AVATARS]: ['image/jpeg', 'image/png', 'image/webp'],
      [this.buckets.DOCUMENTS]: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };
    return mimeTypes[bucketName] || ['*/*'];
  },

  // Get file size limits for different buckets (in bytes)
  getFileSizeLimit(bucketName) {
    const limits = {
      [this.buckets.PET_PHOTOS]: 5 * 1024 * 1024, // 5MB
      [this.buckets.MEDICAL_RECORDS]: 10 * 1024 * 1024, // 10MB
      [this.buckets.PRODUCT_IMAGES]: 3 * 1024 * 1024, // 3MB
      [this.buckets.USER_AVATARS]: 2 * 1024 * 1024, // 2MB
      [this.buckets.DOCUMENTS]: 20 * 1024 * 1024 // 20MB
    };
    return limits[bucketName] || 5 * 1024 * 1024; // Default 5MB
  },

  // Upload file to storage
  async uploadFile(bucketName, filePath, file, options = {}) {
    try {
      // Validate file
      const validation = this.validateFile(file, bucketName);
      if (!validation.valid) {
        return { data: null, error: { message: validation.message } };
      }

      // Generate unique filename if not provided
      const fileName = options.fileName || this.generateFileName(file, options.prefix);
      const fullPath = filePath ? `${filePath}/${fileName}` : fileName;

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fullPath, file, {
          cacheControl: '3600',
          upsert: options.upsert || false,
          ...options
        });

      if (error) {
        console.error(`Upload failed for ${fullPath}:`, error);
        return { data: null, error };
      }

      // Get public URL if bucket is public
      const publicUrl = bucketName === this.buckets.PRODUCT_IMAGES 
        ? this.getPublicUrl(bucketName, fullPath)
        : null;

      console.log(`✅ File uploaded: ${fullPath}`);
      return { 
        data: { 
          ...data, 
          fullPath, 
          publicUrl,
          fileSize: file.size,
          fileName: fileName
        }, 
        error: null 
      };

    } catch (error) {
      console.error('Upload error:', error);
      return { data: null, error };
    }
  },

  // Download file from storage
  async downloadFile(bucketName, filePath) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);

      if (error) {
        console.error(`Download failed for ${filePath}:`, error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Download error:', error);
      return { data: null, error };
    }
  },

  // Delete file from storage
  async deleteFile(bucketName, filePaths) {
    try {
      const pathsArray = Array.isArray(filePaths) ? filePaths : [filePaths];
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .remove(pathsArray);

      if (error) {
        console.error(`Delete failed for ${pathsArray}:`, error);
        return { data: null, error };
      }

      console.log(`✅ Files deleted: ${pathsArray.join(', ')}`);
      return { data, error: null };
    } catch (error) {
      console.error('Delete error:', error);
      return { data: null, error };
    }
  },

  // Get public URL for file
  getPublicUrl(bucketName, filePath) {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  },

  // Get signed URL for private files
  async getSignedUrl(bucketName, filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error(`Failed to create signed URL for ${filePath}:`, error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Signed URL error:', error);
      return { data: null, error };
    }
  },

  // List files in bucket
  async listFiles(bucketName, folderPath = '', options = {}) {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(folderPath, {
          limit: options.limit || 100,
          offset: options.offset || 0,
          sortBy: options.sortBy || { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error(`Failed to list files in ${bucketName}/${folderPath}:`, error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('List files error:', error);
      return { data: null, error };
    }
  },

  // Validate file before upload
  validateFile(file, bucketName) {
    // Check file size
    const maxSize = this.getFileSizeLimit(bucketName);
    if (file.size > maxSize) {
      return {
        valid: false,
        message: `File size exceeds limit of ${(maxSize / 1024 / 1024).toFixed(1)}MB`
      };
    }

    // Check MIME type
    const allowedTypes = this.getAllowedMimeTypes(bucketName);
    if (!allowedTypes.includes('*/*') && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        message: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    return { valid: true };
  },

  // Generate unique filename
  generateFileName(file, prefix = '') {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    const baseName = file.name.split('.').slice(0, -1).join('.').replace(/[^a-zA-Z0-9]/g, '_');
    
    return prefix 
      ? `${prefix}_${baseName}_${timestamp}_${randomString}.${extension}`
      : `${baseName}_${timestamp}_${randomString}.${extension}`;
  },

  // Pet-specific storage helpers
  pets: {
    async uploadPhoto(petId, file, options = {}) {
      const filePath = `pets/${petId}/photos`;
      return await storage.uploadFile(storage.buckets.PET_PHOTOS, filePath, file, {
        ...options,
        prefix: `pet_${petId}`
      });
    },

    async uploadMedicalRecord(petId, file, recordType = 'general', options = {}) {
      const filePath = `pets/${petId}/medical/${recordType}`;
      return await storage.uploadFile(storage.buckets.MEDICAL_RECORDS, filePath, file, {
        ...options,
        prefix: `medical_${petId}`
      });
    },

    async getPetPhotos(petId) {
      return await storage.listFiles(storage.buckets.PET_PHOTOS, `pets/${petId}/photos`);
    },

    async getPetMedicalRecords(petId) {
      return await storage.listFiles(storage.buckets.MEDICAL_RECORDS, `pets/${petId}/medical`);
    }
  },

  // Product-specific storage helpers
  products: {
    async uploadImage(productId, file, options = {}) {
      const filePath = `products/${productId}`;
      return await storage.uploadFile(storage.buckets.PRODUCT_IMAGES, filePath, file, {
        ...options,
        prefix: `product_${productId}`
      });
    },

    async getProductImages(productId) {
      return await storage.listFiles(storage.buckets.PRODUCT_IMAGES, `products/${productId}`);
    }
  },

  // User-specific storage helpers
  users: {
    async uploadAvatar(userId, file, options = {}) {
      const filePath = `users/${userId}`;
      return await storage.uploadFile(storage.buckets.USER_AVATARS, filePath, file, {
        ...options,
        prefix: `avatar_${userId}`,
        upsert: true // Replace existing avatar
      });
    },

    async getUserAvatar(userId) {
      const { data } = await storage.listFiles(storage.buckets.USER_AVATARS, `users/${userId}`);
      return data && data.length > 0 ? data[0] : null;
    }
  }
};

// Real-time subscriptions helper
export const realtime = {
  onAppointmentsUpdate(callback) {
    return supabase
      .channel('appointments_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'appointments' 
      }, callback)
      .subscribe()
  },
  
  onPetsUpdate(callback) {
    return supabase
      .channel('pets_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'pets' 
      }, callback)
      .subscribe()
  }
}

export default supabase
