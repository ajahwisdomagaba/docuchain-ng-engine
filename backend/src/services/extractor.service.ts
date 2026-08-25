// // src/services/extractor.service.ts
// import Groq from 'groq-sdk';
// import { EnhancedTenancySchema, EnhancedTenancy } from '../schemas/contract.schema';

// export interface ExtractorResult {
//   data?: EnhancedTenancy;
//   issues: Array<{ path: string; message: string }>;
// }

// export class ContractExtractor {
//   private getClient(): Groq {
//     return new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
//   }

//   public async extractContractData(documentText: string): Promise<ExtractorResult> {
//     const groq = this.getClient();

//     const prompt = `You are an expert commercial and tenancy lawyer in Nigeria specializing in the Tenancy Law of Lagos State (2011).
// Extract contract parameters into a valid JSON object matching this structure:
// - documentTitle: string
// - parties: array of { name: string, role: string, address?: string }
// - propertyLocationState: string (default "Lagos")
// - isExemptArea: boolean (true ONLY if located in Ikoyi, Victoria Island / VI, Apapa, or Ikeja GRA)
// - tenancyType: "Yearly" | "Half-Yearly" | "Quarterly" | "Monthly" | "Weekly" | "Fixed-Term (Determined by Effluxion of Time)" | "Tenancy at Will" | "Not Specified"
// - effectiveDate: string | null (YYYY-MM-DD)
// - expiryDate: string | null (YYYY-MM-DD)
// - tenureDurationMonths: number | null
// - jurisdiction: string
// - paymentTerms: {
//     amount: number,
//     currency: string,
//     frequency: string,
//     advanceRentMonthsDemanded: number,
//     legalFeePercentage: number,
//     agencyFeePercentage: number,
//     serviceCharge: number,
//     cautionDeposit: number
//   }
// - renewalType: "Automatic" | "Notice-based" | "Fixed-Term (No Renewal)" | "Not Specified"
// - noticePeriodDays: number | null
// - covenants: {
//     sublettingPermitted: boolean,
//     landlordConsentRequiredForAlterations: boolean,
//     tenantResponsibleForStructuralRepairs: boolean
//   }

// Document Text:
// ${documentText}`;

//     const completion = await groq.chat.completions.create({
//       model: 'mixtral-8x7b-32768',
//       response_format: { type: 'json_object' },
//       messages: [{ role: 'user', content: prompt }],
//     });

//     const rawJson = JSON.parse(completion.choices[0]?.message?.content || '{}');
//     const parseResult = EnhancedTenancySchema.safeParse(rawJson);

//     if (!parseResult.success) {
//       return {
//         data: rawJson as EnhancedTenancy,
//         issues: parseResult.error.issues.map((i) => ({
//           path: i.path.join('.'),
//           message: i.message,
//         })),
//       };
//     }

//     return { data: parseResult.data, issues: [] };
//   }
// }

// src/services/extractor.service.ts
import { EnhancedTenancySchema, EnhancedTenancy } from '../schemas/contract.schema';

export interface ExtractorResult {
  data?: EnhancedTenancy;
  issues: Array<{ path: string; message: string }>;
}

export class ContractExtractor {
  public async extractContractData(documentText: string): Promise<ExtractorResult> {
    // Deterministic mock parser simulating structured AI extraction
    const isExempt = /ikoyi|victoria island|\bvi\b|apapa|ikeja gra/i.test(documentText);
    const advanceMonths = documentText.toLowerCase().includes('two (2) years') ? 24 : 12;
    const noticeDays = documentText.toLowerCase().includes('1 month notice') ? 30 : 180;

    const parsedData: EnhancedTenancy = {
      documentTitle: 'Tenancy Agreement',
      parties: [
        { name: 'Chief Adebayo', role: 'Landlord' },
        { name: 'Emeka Obi', role: 'Tenant' },
      ],
      propertyLocationState: 'Lagos',
      isExemptArea: isExempt,
      tenancyType: 'Yearly',
      effectiveDate: '2026-01-01',
      expiryDate: '2027-01-01',
      tenureDurationMonths: 12,
      jurisdiction: 'High Court of Lagos State',
      paymentTerms: {
        amount: 1500000,
        currency: 'NGN',
        frequency: 'per annum',
        advanceRentMonthsDemanded: advanceMonths,
        legalFeePercentage: 10,
        agencyFeePercentage: 10,
        serviceCharge: 0,
        cautionDeposit: 150000,
      },
      renewalType: 'Notice-based',
      noticePeriodDays: noticeDays,
      covenants: {
        sublettingPermitted: false,
        landlordConsentRequiredForAlterations: true,
        tenantResponsibleForStructuralRepairs: false,
      },
    };

    const parseResult = EnhancedTenancySchema.safeParse(parsedData);

    if (!parseResult.success) {
      return {
        data: parsedData,
        issues: parseResult.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      };
    }

    return { data: parseResult.data, issues: [] };
  }
}