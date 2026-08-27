export type PlanTier = 'FREE' | 'STARTER' | 'BUSINESS' | 'LEGAL_TEAM' | 'LAW_FIRM_RESELLER' | 'ONE_TIME_REVIEW';

export interface PlanLimits {
  maxContracts: number;
  hasSmartExtraction: boolean;
  hasVault: boolean;
  hasNoticeAlerts: boolean;
  hasRiskScoring: boolean;
  hasCrossVaultRag: boolean;
  hasObligationTracker: boolean;
  hasTemplateLibrary: boolean;
  hasMultiUser: boolean;
  hasClientPortal: boolean;
  hasWhiteLabel: boolean;
  hasClientVaultManager: boolean;
  hasPrioritySupport: boolean;
}

export const PLAN_PERMISSIONS: Record<PlanTier, PlanLimits> = {
  FREE: {
    maxContracts: 3,
    hasSmartExtraction: true,
    hasVault: true,
    hasNoticeAlerts: false,
    hasRiskScoring: false,
    hasCrossVaultRag: false,
    hasObligationTracker: false,
    hasTemplateLibrary: false,
    hasMultiUser: false,
    hasClientPortal: false,
    hasWhiteLabel: false,
    hasClientVaultManager: false,
    hasPrioritySupport: false,
  },
  STARTER: {
    maxContracts: 50,
    hasSmartExtraction: true,
    hasVault: true,
    hasNoticeAlerts: true,
    hasRiskScoring: false,
    hasCrossVaultRag: false,
    hasObligationTracker: false,
    hasTemplateLibrary: false,
    hasMultiUser: false,
    hasClientPortal: false,
    hasWhiteLabel: false,
    hasClientVaultManager: false,
    hasPrioritySupport: false,
  },
  BUSINESS: {
    maxContracts: 500,
    hasSmartExtraction: true,
    hasVault: true,
    hasNoticeAlerts: true,
    hasRiskScoring: true,
    hasCrossVaultRag: true,
    hasObligationTracker: true,
    hasTemplateLibrary: false,
    hasMultiUser: false,
    hasClientPortal: false,
    hasWhiteLabel: false,
    hasClientVaultManager: false,
    hasPrioritySupport: false,
  },
  LEGAL_TEAM: {
    maxContracts: Infinity,
    hasSmartExtraction: true,
    hasVault: true,
    hasNoticeAlerts: true,
    hasRiskScoring: true,
    hasCrossVaultRag: true,
    hasObligationTracker: true,
    hasTemplateLibrary: true,
    hasMultiUser: true,
    hasClientPortal: true,
    hasWhiteLabel: false,
    hasClientVaultManager: false,
    hasPrioritySupport: false,
  },
  LAW_FIRM_RESELLER: {
    maxContracts: Infinity,
    hasSmartExtraction: true,
    hasVault: true,
    hasNoticeAlerts: true,
    hasRiskScoring: true,
    hasCrossVaultRag: true,
    hasObligationTracker: true,
    hasTemplateLibrary: true,
    hasMultiUser: true,
    hasClientPortal: true,
    hasWhiteLabel: true,
    hasClientVaultManager: true,
    hasPrioritySupport: true,
  },
  ONE_TIME_REVIEW: {
    maxContracts: 1,
    hasSmartExtraction: true,
    hasVault: false,
    hasNoticeAlerts: false,
    hasRiskScoring: true,
    hasCrossVaultRag: false,
    hasObligationTracker: false,
    hasTemplateLibrary: false,
    hasMultiUser: false,
    hasClientPortal: false,
    hasWhiteLabel: false,
    hasClientVaultManager: false,
    hasPrioritySupport: false,
  },
};