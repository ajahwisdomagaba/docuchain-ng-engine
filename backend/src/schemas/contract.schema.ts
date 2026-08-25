import { z } from 'zod';

export const PartySchema = z.object({
  name: z.string(),
  role: z.string(),
  address: z.string().optional(),
});

export const PaymentTermsSchema = z.object({
  amount: z.number().default(0),
  currency: z.string().default('NGN'),
  frequency: z.string().default('Annually'),
  advanceRentMonthsDemanded: z.number().default(12),
  legalFeePercentage: z.number().default(10),
  agencyFeePercentage: z.number().default(10),
  serviceCharge: z.number().default(0),
  cautionDeposit: z.number().default(0),
});

export const CovenantsSchema = z.object({
  sublettingPermitted: z.boolean().default(false),
  landlordConsentRequiredForAlterations: z.boolean().default(true),
  tenantResponsibleForStructuralRepairs: z.boolean().default(false),
});

export const EnhancedTenancySchema = z
  .object({
    documentTitle: z.string().default('Tenancy Agreement'),
    parties: z.array(PartySchema).default([]),
    propertyLocationState: z.string().default('Lagos'),
    isExemptArea: z.boolean().default(false),
    tenancyType: z
      .enum([
        'Yearly',
        'Half-Yearly',
        'Quarterly',
        'Monthly',
        'Weekly',
        'Fixed-Term (Determined by Effluxion of Time)',
        'Tenancy at Will',
        'Not Specified',
      ])
      .default('Yearly'),
    effectiveDate: z.string().nullable().default(null),
    expiryDate: z.string().nullable().default(null),
    tenureDurationMonths: z.number().nullable().default(12),
    jurisdiction: z.string().default('Lagos State, Nigeria'),
    paymentTerms: PaymentTermsSchema.default({}),
    renewalType: z
      .enum(['Automatic', 'Notice-based', 'Fixed-Term (No Renewal)', 'Not Specified'])
      .default('Notice-based'),
    noticePeriodDays: z.number().nullable().default(180),
    covenants: CovenantsSchema.default({}),
  })
  .superRefine((data, ctx) => {
    // Lagos Tenancy Law 2011 - Statutory Checks

    // 1. Section 4: Advance Rent Cap (Max 12 months for new yearly tenants in non-exempt areas)
    if (!data.isExemptArea && data.paymentTerms.advanceRentMonthsDemanded > 12) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentTerms', 'advanceRentMonthsDemanded'],
        message: `Section 4 Violation: Demanding ${data.paymentTerms.advanceRentMonthsDemanded} months advance rent is unlawful in non-exempt areas (max 12 months for new tenants, 6 months for monthly).`,
      });
    }

    // 2. Section 13: Notice Period Violations
    if (data.tenancyType === 'Yearly' && data.noticePeriodDays !== null && data.noticePeriodDays < 180) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['noticePeriodDays'],
        message: `Section 13(1)(a) Violation: Yearly tenancy requires minimum 6 months (180 days) notice to quit, found ${data.noticePeriodDays} days.`,
      });
    }

    if (data.tenancyType === 'Half-Yearly' && data.noticePeriodDays !== null && data.noticePeriodDays < 90) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['noticePeriodDays'],
        message: `Section 13(1)(b) Violation: Half-yearly tenancy requires minimum 3 months (90 days) notice to quit.`,
      });
    }

    if (data.tenancyType === 'Monthly' && data.noticePeriodDays !== null && data.noticePeriodDays < 30) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['noticePeriodDays'],
        message: `Section 13(1)(c) Violation: Monthly tenancy requires minimum 1 month (30 days) notice to quit.`,
      });
    }

    // 3. Structural Repairs
    if (data.covenants.tenantResponsibleForStructuralRepairs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['covenants', 'tenantResponsibleForStructuralRepairs'],
        message: `Section 7 Violation: Landlord is statutorily responsible for main roof, external walls, and structural repairs.`,
      });
    }
  });

export type EnhancedTenancy = z.infer<typeof EnhancedTenancySchema>;