import { supabase } from '../lib/supabase';

export async function generateContractObligations(
  contractId: string,
  contractTitle: string,
  category: string,
  counterparty: string,
  keyDates: { effectiveDate?: string; expirationDate?: string } | undefined,
  clientId?: string | null,
  workspaceId?: string | null
) {
  try {
    const obligationsToInsert: any[] = [];
    const cat = (category || 'COMMERCIAL').toUpperCase();

    // Determine or fallback expiration date (default to 1 year from now if not detected)
    let expirationStr = keyDates?.expirationDate;
    if (!expirationStr) {
      const fallbackDate = new Date();
      fallbackDate.setFullYear(fallbackDate.getFullYear() + 1);
      expirationStr = fallbackDate.toISOString().split('T')[0];
    }

    const expiration = new Date(expirationStr);

    if (cat === 'TENANCY' || cat.includes('LEASE')) {
      // 1. Lagos State Tenancy Law 2011 Section 13(1)(e): 6-Month Notice to Quit trigger
      const sixMonthsPrior = new Date(expiration);
      sixMonthsPrior.setDate(sixMonthsPrior.getDate() - 180);

      obligationsToInsert.push({
        workspace_id: workspaceId || null,
        client_id: clientId || null,
        contract_id: contractId,
        title: `Serve Statutory 6-Month Notice to Quit - ${contractTitle}`,
        obligation_type: 'STATUTORY_NOTICE',
        statutory_basis: 'Lagos State Tenancy Law 2011, Section 13(1)(e)',
        due_date: expirationStr,
        notice_trigger_date: sixMonthsPrior.toISOString().split('T')[0],
        counterparty: counterparty || 'Tenant / Landlord',
        priority: 'HIGH',
        status: 'PENDING',
        notes: 'Mandatory statutory 6-month notice period for determination of yearly tenancy without forfeiture defect.'
      });

      // 2. 7-Day Notice of Owner\'s Intention to Apply to Court (Form TL5)
      const sevenDaysPrior = new Date(expiration);
      sevenDaysPrior.setDate(sevenDaysPrior.getDate() - 7);

      obligationsToInsert.push({
        workspace_id: workspaceId || null,
        client_id: clientId || null,
        contract_id: contractId,
        title: `Prepare 7-Day Notice of Intention to Recover Possession (Form TL5)`,
        obligation_type: 'STATUTORY_NOTICE',
        statutory_basis: 'Lagos State Tenancy Law 2011, Section 13(5) & Form TL5',
        due_date: expirationStr,
        notice_trigger_date: sevenDaysPrior.toISOString().split('T')[0],
        counterparty: counterparty || 'Tenant / Landlord',
        priority: 'HIGH',
        status: 'PENDING',
        notes: 'Statutory 7-day notice precondition before filing recovery of premises summons at magistrate court.'
      });
    } else {
      // Commercial / Vendor / General SLA: CAC Annual Returns Window
      const currentYear = new Date().getFullYear();
      const cacFilingDate = `${currentYear}-06-30`;
      const triggerDate = `${currentYear}-05-01`;

      obligationsToInsert.push({
        workspace_id: workspaceId || null,
        client_id: clientId || null,
        contract_id: contractId,
        title: `CAC Annual Returns Compliance Window - ${contractTitle}`,
        obligation_type: 'CAC_ANNUAL_RETURNS',
        statutory_basis: 'Companies and Allied Matters Act (CAMA) 2020, Section 417 & 822',
        due_date: cacFilingDate,
        notice_trigger_date: triggerDate,
        counterparty: counterparty || 'Counterparty Entity',
        priority: 'MEDIUM',
        status: 'PENDING',
        notes: 'Statutory return submission to prevent corporate penalty or strike-off under CAMA 2020 Section 425.'
      });
    }

    if (obligationsToInsert.length > 0) {
      const { error } = await supabase.from('contract_obligations').insert(obligationsToInsert);
      if (error) {
        console.warn('⚠️ Auto-obligation insertion warning:', error.message);
      } else {
        console.log(`✅ Auto-generated ${obligationsToInsert.length} statutory obligations for contract ${contractId}`);
      }
    }
  } catch (err: any) {
    console.error('❌ Failed to auto-generate obligations:', err.message || err);
  }
}