import { supabase } from '../config/supabase';
import { EnhancedTenancy } from '../schemas/contract.schema';
import { RedlineReport } from '../schemas/redline.schema';

export class ContractStorageService {
  public async saveAnalyzedContract(
    documentText: string,
    extractedData: EnhancedTenancy,
    issues: Array<{ path: string; message: string }>,
    redlines: RedlineReport
  ) {
    const { data: contract, error: contractErr } = await supabase
      .from('contracts')
      .insert({
        document_title: extractedData.documentTitle,
        parties: extractedData.parties,
        property_location_state: extractedData.propertyLocationState,
        is_exempt_area: extractedData.isExemptArea,
        tenancy_type: extractedData.tenancyType,
        effective_date: extractedData.effectiveDate,
        expiry_date: extractedData.expiryDate,
        tenure_duration_months: extractedData.tenureDurationMonths,
        jurisdiction: extractedData.jurisdiction,
        payment_terms: extractedData.paymentTerms,
        renewal_type: extractedData.renewalType,
        notice_period_days: extractedData.noticePeriodDays,
        covenants: extractedData.covenants,
        compliance_issues: issues,
        redline_report: redlines,
        raw_document_text: documentText,
      })
      .select('id')
      .single();

    if (contractErr) throw contractErr;

    const clausesToInsert = [
      {
        contract_id: contract.id,
        clause_type: 'payment_terms',
        clause_text: `Rent: ₦${extractedData.paymentTerms.amount} ${extractedData.paymentTerms.frequency}, Advance: ${extractedData.paymentTerms.advanceRentMonthsDemanded} months demanded`,
        is_compliant: !issues.some((i) => i.path.includes('advanceRentMonthsDemanded')),
      },
      {
        contract_id: contract.id,
        clause_type: 'notice_period',
        clause_text: `Notice period: ${extractedData.noticePeriodDays} days`,
        is_compliant: !issues.some((i) => i.path.includes('noticePeriodDays')),
      },
    ];

    const { error: clauseErr } = await supabase
      .from('contract_clauses')
      .insert(clausesToInsert);

    if (clauseErr) throw clauseErr;

    return contract;
  }
}