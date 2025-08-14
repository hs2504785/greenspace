import ApiBaseService from './ApiBaseService';
import { supabase } from '@/lib/supabase';
import { mockVegetables } from '@/data/mockVegetables';

class VegetableService extends ApiBaseService {
  constructor() {
    super('vegetables');
  }

  async getAllVegetables() {
    try {
      if (!supabase) throw new Error('Supabase not initialized');
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          owner:users!owner_id(
            id, name, email, phone, whatsapp_number, location, avatar_url
          )
        `);

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(error.message || 'Failed to fetch vegetables');
      }

      if (!data) {
        console.warn('No data returned from Supabase');
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error fetching vegetables:', error);
      // Only return mock data in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock data as fallback in development');
        return mockVegetables;
      }
      throw error;
    }
  }

  async getVegetableById(id) {
    try {
      if (!id) {
        throw new Error('Vegetable ID is required');
      }

      if (!supabase) throw new Error('Supabase not initialized');
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*, owner:users(id, name, email, phone, whatsapp, location, avatar_url)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching vegetable:', error);
      return null;
    }
  }

  async getVegetablesByOwner(ownerId) {
    try {
      console.log('🔍 Fetching vegetables for ownerId:', ownerId);
      
      if (!ownerId) {
        console.warn('No ownerId provided');
        return [];
      }

      if (!supabase) throw new Error('Supabase not initialized');
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*, owner:users(id, name, email, phone, whatsapp_number, location, avatar_url)')
        .eq('owner_id', ownerId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Found vegetables:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error fetching vegetables:', error);
      return [];
    }
  }

  async createVegetable(vegetableData) {
    try {
      if (!supabase) throw new Error('Supabase not initialized');
      
      // Validate required fields
      const requiredFields = ['name', 'price', 'quantity', 'category', 'location', 'source_type', 'owner_id'];
      const missingFields = requiredFields.filter(field => !vegetableData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Log the request
      console.log('Creating vegetable with data:', {
        ...vegetableData,
        owner_id: vegetableData.owner_id
      });

      const { data, error } = await supabase
        .from(this.tableName)
        .insert([{
          ...vegetableData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select('*, owner:users(*)');

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          requestData: vegetableData
        });
        
        if (error.code === '42501') {
          throw new Error('Permission denied. Please check if you are properly logged in.');
        }
        
        throw new Error(error.message || 'Failed to create vegetable');
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned after creating vegetable');
      }

      console.log('Successfully created vegetable:', data[0]);
      return data[0];
    } catch (error) {
      console.error('Error creating vegetable:', {
        error,
        vegetableData,
        stack: error.stack
      });
      throw error;
    }
  }

  async updateVegetable(id, vegetableData) {
    try {
      if (!id) {
        throw new Error('Vegetable ID is required');
      }

      if (!supabase) throw new Error('Supabase not initialized');
      const { data, error } = await supabase
        .from(this.tableName)
        .update(vegetableData)
        .eq('id', id)
        .select('*, owner:users(*)');

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error updating vegetable:', error);
      throw error;
    }
  }

  async deleteVegetable(id) {
    try {
      if (!id) {
        throw new Error('Vegetable ID is required');
      }

      if (!supabase) throw new Error('Supabase not initialized');
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting vegetable:', error);
      throw error;
    }
  }

  async uploadImage(file) {
    try {
      if (!file) {
        throw new Error('File is required');
      }

      if (!supabase) throw new Error('Supabase not initialized');
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `vegetables/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
}

export default new VegetableService();