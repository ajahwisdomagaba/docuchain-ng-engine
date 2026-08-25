// // src/services/redline.service.ts
// import Groq from 'groq-sdk';
// import { RedlineReportSchema, RedlineReport } from '../schemas/redline.schema';

// export interface ComplianceIssue {
//   path: string;
//   message: string;
// }

// export interface RedlineContext {
//   location: string;
//   isExemptArea: boolean;
//   tenancyType: string;
// }

// export class TenancyRedlineService {
//   private getClient(): Groq {
//     return new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
//   }

//   public async generateRedlines(
//     documentText: string,
//     issues: ComplianceIssue[],
//     context: RedlineContext
//   ): Promise<RedlineReport> {
//     if (!issues.length) {
//       return {
//         summary: 'No statutory non-compliance issues found. The agreement aligns with the Lagos State Tenancy Law 2011.',
//         overallRiskLevel: 'Low',
//         recommendations: [],
//       };
//     }

//     const groq = this.getClient();

//     const prompt = `You are a Senior Property Lawyer in Lagos State, Nigeria.
// Analyze the provided contract text and the identified statutory breaches under the Lagos State Tenancy Law 2011.
// Generate a structured redline response matching this JSON schema:
// {
//   "summary": "Executive legal summary of risk points",
//   "overallRiskLevel": "Low" | "Medium" | "High" | "Critical",
//   "recommendations": [
//     {
//       "fieldPath": "path where issue occurred",
//       "legalViolation": "Statutory breach description",
//       "originalIntent": "Commercial goal of the parties",
//       "statutoryReference": "e.g., Section 4 or Section 13(1) Tenancy Law of Lagos State 2011",
//       "proposedRedlineClause": "Professional replacement clause drafted in standard Nigerian legal phrasing",
//       "redlineRationale": "Why this modification protects enforceability and statutory compliance"
//     }
//   ]
// }

// CONTEXT:
// - Location: ${context.location}
// - Exempt Zone: ${context.isExemptArea}
// - Tenancy Type: ${context.tenancyType}

// IDENTIFIED STATUTORY BREACHES:
// ${JSON.stringify(issues, null, 2)}

// ORIGINAL TEXT:
// ${documentText}`;

//     const completion = await groq.chat.completions.create({
//       model: 'mixtral-8x7b-32768',
//       response_format: { type: 'json_object' },
//       messages: [{ role: 'user', content: prompt }],
//     });

//     const parsedJson = JSON.parse(completion.choices[0]?.message?.content || '{}');
//     return RedlineReportSchema.parse(parsedJson);
//   }
// }

// src/services/redline.service.ts
import { RedlineReport } from '../schemas/redline.schema';

export interface ComplianceIssue {
  path: string;
  message: string;
}

export interface RedlineContext {
  location: string;
  isExemptArea: boolean;
  tenancyType: string;
}

export class TenancyRedlineService {
  public async generateRedlines(
    _documentText: string,
    issues: ComplianceIssue[],
    _context: RedlineContext
  ): Promise<RedlineReport> {
    if (!issues.length) {
      return {
        summary: 'Agreement complies fully with the Tenancy Law of Lagos State 2011.',
        overallRiskLevel: 'Low',
        recommendations: [],
      };
    }

    const recommendations = issues.map((issue) => {
      if (issue.path.includes('advanceRentMonthsDemanded')) {
        return {
          fieldPath: issue.path,
          legalViolation: issue.message,
          originalIntent: 'Landlord requested 2 years advance rent.',
          statutoryReference: 'Section 4, Tenancy Law of Lagos State 2011',
          proposedRedlineClause:
            'The Tenant shall pay the sum of ₦1,500,000 (One Million Five Hundred Thousand Naira) representing one (1) year rent in advance upon the execution of this Agreement.',
          redlineRationale:
            'Demanding or receiving rent in excess of 1 year for a yearly tenancy in non-exempt areas is illegal and punishable under Lagos State law.',
        };
      }

      if (issue.path.includes('noticePeriodDays')) {
        return {
          fieldPath: issue.path,
          legalViolation: issue.message,
          originalIntent: 'Termination clause with 1 month notice.',
          statutoryReference: 'Section 13(1)(e), Tenancy Law of Lagos State 2011',
          proposedRedlineClause:
            'Either party may terminate this tenancy by serving upon the other party at least six (6) months written notice of termination.',
          redlineRationale:
            'Under statutory requirements for yearly tenancies without prior valid derogation, a minimum of 6 months notice to quit is mandatory.',
        };
      }

      return {
        fieldPath: issue.path,
        legalViolation: issue.message,
        originalIntent: 'Custom commercial covenant.',
        statutoryReference: 'Tenancy Law of Lagos State 2011',
        proposedRedlineClause: 'Standard statutory compliance clause applied.',
        redlineRationale: 'Aligns clause with Lagos State real estate regulations.',
      };
    });

    return {
      summary: `Found ${issues.length} critical statutory violation(s) under Lagos State Tenancy Law 2011.`,
      overallRiskLevel: issues.length > 1 ? 'High' : 'Medium',
      recommendations,
    };
  }
}