import { LedgerInfo, TransactionTemplate, Asset, TrustLineHolder, AuditLogEntry, Order } from '../types';

// Mock Data Generators
const generateId = () => Math.random().toString(36).substr(2, 9);
const timestamp = () => new Date().toISOString().replace('T', ' ').substring(0, 19);

export class XRPLService {
  private isConnected: boolean = false;
  
  // Ledger State (Mock Database)
  private ledgerIndex: number = 85000000;
  private assets: Asset[] = [
    { 
      id: '1', 
      currency: 'USD', 
      supply: '10,000,000', 
      issuer: 'rK...ColdWallet',
      flags: { requireAuth: true, defaultRipple: true, freeze: false }
    },
    { 
      id: '2', 
      currency: 'EUR', 
      supply: '5,000,000', 
      issuer: 'rK...ColdWallet',
      flags: { requireAuth: true, defaultRipple: true, freeze: false }
    }
  ];
  
  private transactions: AuditLogEntry[] = [
     { id: '1', hash: '5F2A...9B3C', type: 'OfferCreate', status: 'validated', timestamp: '2023-10-24 10:42:01', details: 'Buy 5000 XRP @ 0.55' },
     { id: '2', hash: '8D1E...2F4A', type: 'TrustSet', status: 'validated', timestamp: '2023-10-24 09:15:33', details: 'Set Trust USD (rK...)' }
  ];

  private pools = {
      'XRP/USD': { xrp: 1000000, token: 550000, vol24h: 4200000 },
      'XRP/EUR': { xrp: 800000, token: 400000, vol24h: 1200000 }
  };

  async connect(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 800));
    this.isConnected = true;
    return true;
  }

  async getLedgerInfo(): Promise<LedgerInfo> {
    this.ledgerIndex++;
    return {
      ledgerIndex: this.ledgerIndex,
      closeTime: new Date().toISOString(),
      txCount: Math.floor(Math.random() * 20) + 5,
      totalCoins: "99,989,500,000"
    };
  }

  async getAssets(): Promise<Asset[]> {
      return [...this.assets];
  }

  async getTransactions(): Promise<AuditLogEntry[]> {
      return [...this.transactions];
  }

  async getDashboardStats() {
      const totalLiquidity = Object.values(this.pools).reduce((acc, pool) => acc + (pool.token * 2), 0); // Roughly 2x token side value
      const totalVolume = Object.values(this.pools).reduce((acc, pool) => acc + pool.vol24h, 0);
      return {
          liquidity: totalLiquidity,
          volume: totalVolume,
          assets: this.assets.length,
          pools: Object.keys(this.pools).length
      };
  }

  // --- Transaction Submission Simulation ---

  async submitTransaction(tx: TransactionTemplate): Promise<{ hash: string, result: string }> {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const hash = Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
      const shortHash = `${hash.substring(0,4)}...${hash.substring(60)}`;
      
      let details = "";
      if (tx.TransactionType === 'Payment') details = `Sent ${tx.Amount.value || parseFloat(tx.Amount)/1000000 + ' XRP'}`;
      else if (tx.TransactionType === 'TrustSet') details = `TrustSet ${tx.LimitAmount.currency}`;
      else if (tx.TransactionType === 'AccountSet') details = `AccountConfig Update`;
      else if (tx.TransactionType === 'OfferCreate') details = `${tx.Flags === 524288 ? 'Sell' : 'Buy'} Limit Order`;
      else if (tx.TransactionType === 'AMMDeposit') details = `Liquidity Add ${tx.Asset2.currency}`;
      else if (tx.TransactionType === 'AMMWithdraw') details = `Liquidity Remove ${tx.Asset2.currency}`;
      else details = tx.TransactionType;

      // Persist to Mock History
      const entry: AuditLogEntry = {
          id: generateId(),
          hash: shortHash,
          type: tx.TransactionType,
          status: 'validated',
          timestamp: timestamp(),
          details: details
      };
      
      this.transactions.unshift(entry);

      // State Side Effects
      if (tx.TransactionType === 'Payment' && tx.Amount.currency && tx.Amount.issuer === 'self') {
           // Simulate Issuance
           this.assets.push({
               id: generateId(),
               currency: tx.Amount.currency,
               supply: tx.Amount.value,
               issuer: tx.Account,
               flags: { requireAuth: false, defaultRipple: true, freeze: false }
           });
      }

      return { hash: shortHash, result: 'tesSUCCESS' };
  }

  // --- Transaction Builders ---

  generateAccountSet(address: string, requireAuth: boolean, defaultRipple: boolean): TransactionTemplate {
    const tx: TransactionTemplate = {
      TransactionType: "AccountSet",
      Account: address || "RF_COLD_WALLET_ADDRESS",
      Fee: "12",
      TickSize: 5,
      TransferRate: 0,
    };

    if (defaultRipple) tx.SetFlag = 8; // asfDefaultRipple
    if (requireAuth) {
      if (tx.SetFlag) {
        tx.SetFlag_RequireAuth = 7; 
      } else {
        tx.SetFlag = 7;
      }
    }
    
    return tx;
  }

  generateTrustSet(account: string, issuer: string, currency: string, limit: string, isAuth: boolean = false, isFreeze: boolean = false): TransactionTemplate {
    const tx: TransactionTemplate = {
      TransactionType: "TrustSet",
      Account: account || "USER_HOT_WALLET_ADDRESS",
      LimitAmount: {
        currency: currency || "USD",
        issuer: issuer || "RF_COLD_WALLET_ADDRESS",
        value: isAuth ? "0" : limit
      },
      Fee: "12"
    };

    if (isAuth) {
      tx.Flags = 65536; // tfSetAuth
    } else if (isFreeze) {
      tx.Flags = 1048576; // tfSetFreeze
    } else {
      tx.Flags = 131072; // tfSetNoRipple
    }

    return tx;
  }

  generateClawback(issuer: string, targetAccount: string, currency: string, amount: string): TransactionTemplate {
    return {
        TransactionType: "Clawback",
        Account: issuer || "RF_COLD_WALLET_ADDRESS",
        Amount: {
            currency: currency,
            issuer: issuer,
            value: amount
        },
        Destination: targetAccount,
        Fee: "12"
    };
  }

  generatePayment(
      account: string, 
      destination: string, 
      currency: string, 
      issuer: string, 
      amount: string, 
      sendMax?: string,
      deliverMin?: string
  ): TransactionTemplate {
      const tx: TransactionTemplate = {
          TransactionType: "Payment",
          Account: account || "RF_COLD_WALLET_ADDRESS",
          Destination: destination || "USER_HOT_WALLET_ADDRESS",
          Amount: {
              currency: currency,
              issuer: issuer,
              value: amount
          },
          Fee: "12"
      };

      if (sendMax) {
          tx.SendMax = (parseFloat(sendMax) * 1000000).toString(); 
      }
      
      if (deliverMin) {
          tx.DeliverMin = {
              currency: currency,
              issuer: issuer,
              value: deliverMin
          }
      }

      return tx;
  }

  generateAMMCreate(account: string, issuer: string, currency: string, xrpAmount: string, tokenAmount: string, fee: number): TransactionTemplate {
    return {
      TransactionType: "AMMCreate",
      Account: account || "OPERATIONAL_HOT_WALLET",
      Amount: (parseFloat(xrpAmount) * 1000000).toString(), // Drops
      Amount2: {
        currency: currency || "USD",
        issuer: issuer || "RF_COLD_WALLET_ADDRESS",
        value: tokenAmount
      },
      TradingFee: fee,
      Fee: "200000"
    };
  }

  generateAMMDeposit(
      account: string, 
      issuer: string, 
      currency: string, 
      xrpAmount: string, 
      tokenAmount: string,
      strategy: 'balanced' | 'single' = 'balanced'
    ): TransactionTemplate {
    
    // Base object
    const tx: TransactionTemplate = {
      TransactionType: "AMMDeposit",
      Account: account || "USER_WALLET",
      Asset: { currency: "XRP" },
      Asset2: {
        currency: currency || "USD",
        issuer: issuer || "RF_COLD_WALLET_ADDRESS"
      },
      Fee: "12"
    };

    if (strategy === 'balanced') {
        tx.Flags = 1048576; // tfTwoAsset
        tx.Amount = (parseFloat(xrpAmount) * 1000000).toString();
        tx.Amount2 = {
            currency: currency,
            issuer: issuer,
            value: tokenAmount
        };
    } else {
        tx.Flags = 2097152; // tfOneAssetLPToken
        
        if (xrpAmount && parseFloat(xrpAmount) > 0) {
            tx.Amount = (parseFloat(xrpAmount) * 1000000).toString();
        } else {
             tx.Amount2 = {
                currency: currency,
                issuer: issuer,
                value: tokenAmount
            };
        }
    }

    return tx;
  }

  generateAMMWithdraw(
      account: string,
      issuer: string,
      currency: string,
      lpTokenAmount: string,
      isWithdrawAll: boolean = false
  ): TransactionTemplate {
      const tx: TransactionTemplate = {
          TransactionType: "AMMWithdraw",
          Account: account || "USER_WALLET",
          Asset: { currency: "XRP" },
          Asset2: {
              currency: currency || "USD",
              issuer: issuer || "RF_COLD_WALLET_ADDRESS"
          },
          Fee: "12"
      };

      if (isWithdrawAll) {
          tx.Flags = 131072; // tfWithdrawAll
      } else {
          tx.Flags = 65536; // tfLPToken
          tx.LPTokenIn = {
              currency: "03000000...", 
              issuer: issuer,
              value: lpTokenAmount
          };
      }

      return tx;
  }

  generateOfferCreate(account: string, type: 'Buy' | 'Sell', baseCurrency: string, quoteCurrency: string, amount: string, price: string): TransactionTemplate {
    const xrpAmountDrops = (parseFloat(amount) * 1000000).toString();
    const quoteAmount = (parseFloat(amount) * parseFloat(price)).toFixed(4);
    const quoteAsset = {
        currency: quoteCurrency,
        issuer: "RF_COLD_WALLET_ADDRESS",
        value: quoteAmount
    };

    let takerPays, takerGets;

    if (type === 'Buy') {
        takerPays = xrpAmountDrops;
        takerGets = quoteAsset;
    } else {
        takerPays = quoteAsset;
        takerGets = xrpAmountDrops;
    }

    return {
        TransactionType: "OfferCreate",
        Account: account || "USER_HOT_WALLET",
        TakerPays: takerPays,
        TakerGets: takerGets,
        Fee: "12",
        Flags: type === 'Sell' ? 524288 : 0 // tfSell
    };
  }
}

export const xrplService = new XRPLService();