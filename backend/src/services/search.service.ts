import { supabase } from '../config/supabase';

export class SemanticSearchService {
  public async searchClausesByText(clauseType?: string, compliantOnly?: boolean) {
    let query = supabase.from('contract_clauses').select(`
      id,
      clause_type,
      clause_text,
      is_compliant,
      contracts (
        document_title,
        property_location_state,
        is_exempt_area,
        tenancy_type
      )
    `);

    if (clauseType) {
      query = query.eq('clause_type', clauseType);
    }
    if (typeof compliantOnly === 'boolean') {
      query = query.eq('is_compliant', compliantOnly);
    }

    const { data, error } = await query.limit(20);
    if (error) throw error;
    return data;
  }
}