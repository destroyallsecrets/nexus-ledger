export interface LedgerInfo {
  ledgerIndex: number;
  closeTime: string;
  txCount: number;
  totalCoins: string;
}

export interface AccountInfo {
  address: string;
  balance: string;
  sequence: number;
  flags: number;
}

export interface TrustLine {
  currency: string;
  issuer: string;
  limit: string;
  balance: string;
}

export enum AppPhase {
  DASHBOARD = 'DASHBOARD',
  ASSET_LAYER = 'ASSET_LAYER',
  EXCHANGE_LAYER = 'EXCHANGE_LAYER',
  REFINEMENT = 'REFINEMENT',
}

export type NetworkStatus = 'connected' | 'connecting' | 'disconnected';

// XRPL Transaction Types (Simplified for UI construction)
export interface TransactionTemplate {
  TransactionType: string;
  Account: string;
  [key: string]: any;
}

// Enterprise Features
export interface Asset {
  id: string;
  currency: string;
  supply: string;
  issuer: string;
  flags: {
    requireAuth: boolean;
    defaultRipple: boolean;
    freeze: boolean;
  };
}

export interface Order {
  price: number;
  amount: number;
  total: number;
  type: 'bid' | 'ask';
}

export interface AuditLogEntry {
  id: string;
  hash: string;
  type: string;
  status: 'validated' | 'pending' | 'failed';
  timestamp: string;
  details: string;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}