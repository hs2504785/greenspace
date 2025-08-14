import { supabase } from '@/lib/supabase';

export default class ApiBaseService {
  constructor(tableName) {
    this.tableName = tableName;
  }

  checkSupabase() {
    if (!supabase) {
      throw new Error('Database not configured');
    }
  }

  async getAll(options = {}) {
    this.checkSupabase();

    const {
      page = 1,
      limit = 10,
      orderBy = 'created_at',
      orderDirection = 'desc',
      filters = {}
    } = options;

    let query = supabase
      .from(this.tableName)
      .select('*')
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range((page - 1) * limit, page * limit - 1);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { data, error, count } = await query.select('*', { count: 'exact' });

    if (error) {
      throw new Error(`Error fetching ${this.tableName}: ${error.message}`);
    }

    return {
      data,
      count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  async getById(id) {
    this.checkSupabase();

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching ${this.tableName} by id: ${error.message}`);
    }

    return data;
  }

  async create(data) {
    this.checkSupabase();

    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating ${this.tableName}: ${error.message}`);
    }

    return created;
  }

  async update(id, data) {
    this.checkSupabase();

    const { data: updated, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating ${this.tableName}: ${error.message}`);
    }

    return updated;
  }

  async delete(id) {
    this.checkSupabase();

    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting ${this.tableName}: ${error.message}`);
    }

    return true;
  }

  async search(query, fields = ['name', 'description'], options = {}) {
    this.checkSupabase();

    const {
      page = 1,
      limit = 10,
      orderBy = 'created_at',
      orderDirection = 'desc'
    } = options;

    const textSearchQuery = fields
      .map(field => `${field}.ilike.%${query}%`)
      .join(',');

    const { data, error, count } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .or(textSearchQuery)
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw new Error(`Error searching ${this.tableName}: ${error.message}`);
    }

    return {
      data,
      count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }
}