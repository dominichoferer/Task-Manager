import type { SupabaseClient } from '@supabase/supabase-js';
import type { Company, CreateCompanyInput } from './types';

export class CompanyService {
  constructor(private supabase: SupabaseClient) {}

  async getCompanies(): Promise<Company[]> {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async createCompany(input: CreateCompanyInput): Promise<Company> {
    const { data, error } = await this.supabase
      .from('companies')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCompany(id: string, input: Partial<CreateCompanyInput>): Promise<Company> {
    const { data, error } = await this.supabase
      .from('companies')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCompany(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
