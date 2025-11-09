# Polkadot.js Integration Guide

## Overview

This guide explains how the frontend has been integrated with your Substrate blockchain using Polkadot.js libraries to call the `request_deposit` extrinsic from the `proof-of-reserve` pallet.

---

## What Was Changed

### 1. Backend (Substrate Pallet)

**File: `/home/kelum/Projects/Multicoin-with-proof-of-reserve/pallets/proof-of-reserve/src/lib.rs`**

#### Modified `request_deposit` Extrinsic
- **Added `onchain_account` parameter** to specify the recipient of native tokens
- **Updated `DepositRequest` struct** to store both `submitter` and `recipient` accounts
- **Updated events** to include both accounts

**Before:**
```rust
pub fn request_deposit(
    origin: OriginFor<T>,
    external_tx_id: Vec<u8>,
    external_wallet: Vec<u8>,
    coin_name: Vec<u8>,
    external_amount: u128,
    ratio: u128,
) -> DispatchResult
```

**After:**
```rust
pub fn request_deposit(
    origin: OriginFor<T>,
    onchain_account: T::AccountId,  // NEW PARAMETER
    external_tx_id: Vec<u8>,
    external_wallet: Vec<u8>,
    coin_name: Vec<u8>,
    external_amount: u128,
    ratio: u128,
) -> DispatchResult
```

**Key Changes:**
- `submitter`: The account signing the transaction
- `recipient` (onchain_account): The account that will receive the native tokens when approved
- This allows someone to submit a deposit request on behalf of another account

---

### 2. Frontend (React Application)

#### Installed Packages
```json
{
  "@polkadot/api": "^16.4.3",
  "@polkadot/extension-dapp": "^0.61.5",
  "@polkadot/util": "^13.5.4",
  "@polkadot/util-crypto": "^13.5.4"
}
```

#### New Files Created

##### 1. **`src/services/substrate.ts`**
- Manages connection to the Substrate node
- Provides API instance for blockchain interactions
- Functions:
  - `connectToSubstrate(endpoint)`: Connect to Substrate node
  - `getApi()`: Get current API instance
  - `disconnectFromSubstrate()`: Disconnect from node
  - `isConnected()`: Check connection status

##### 2. **`src/contexts/SubstrateContext.tsx`**
- React context for managing Substrate API state
- Provides API instance to all components
- Auto-connects on mount
- Exports `useSubstrate()` hook

##### 3. **`src/hooks/use-wallet.tsx`**
- Custom hook for wallet integration with Polkadot.js extension
- Functions:
  - `connectWallet()`: Connect to browser extension
  - `getInjector(address)`: Get signer for transactions
  - Auto-loads accounts on mount

#### Modified Files

##### 1. **`src/App.tsx`**
- Wrapped app with `SubstrateProvider`
- Makes blockchain API available throughout the app

##### 2. **`src/pages/SubmitProof.tsx`**
- **Added connection status UI** (blockchain + wallet)
- **Added ratio field** to form
- **Integrated real blockchain calls** using Polkadot.js
- **Transaction signing** with wallet extension
- **Event handling** for transaction success/failure

---

## How to Use

### Prerequisites

1. **Substrate Node Running**
   - Your Substrate blockchain must be running on `ws://127.0.0.1:9944`
   - To change the endpoint, modify `WS_PROVIDER` in `src/services/substrate.ts`

2. **Polkadot.js Extension Installed**
   - Install from: https://polkadot.js.org/extension/
   - Create or import an account
   - Make sure the account has some balance for transaction fees

3. **Pallet Rebuilt**
   - After modifying the pallet, rebuild your Substrate node:
     ```bash
     cd /home/kelum/Projects/Multicoin-with-proof-of-reserve
     cargo build --release
     ```

---

### Running the Frontend

1. **Start the development server:**
   ```bash
   cd /home/kelum/Projects/frontend/proofdeck-exchange
   npm run dev
   ```

2. **Open browser** to `http://localhost:8080`

3. **Connect your wallet:**
   - The app will auto-detect the Polkadot.js extension
   - If prompted, authorize the app to access your accounts
   - Select an account to use for signing transactions

4. **Submit a proof:**
   - Fill in the form:
     - **Proof String**: External transaction ID (e.g., BTC tx hash)
     - **Offchain Account**: External wallet address (e.g., Bitcoin address)
     - **Onchain Account**: Substrate address to receive tokens
     - **Offchain Name**: Coin type (e.g., "BTC", "ETH")
     - **Offchain Value**: Amount in whole units (e.g., 1.5 for 1.5 BTC)
     - **Exchange Ratio**: How many native tokens per external coin unit
   - Click **Submit Proof**
   - Sign the transaction in the Polkadot.js extension popup
   - Wait for confirmation (transaction will show "In Block" then "Finalized")

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                         │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              1. User fills form in SubmitProof.tsx              │
│                                                                 │
│   - proof: "0xabc123..." (external tx hash)                    │
│   - accountOffchain: "bc1q..." (BTC address)                   │
│   - accountOnchain: "5GrwV..." (Substrate address)             │
│   - offchainName: "BTC"                                        │
│   - valueOffchain: 1.5 (BTC)                                   │
│   - ratio: 50000                                               │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│         2. Frontend converts data to blockchain format          │
│                                                                 │
│   - externalTxId: Vec<u8> (stringToU8a)                        │
│   - externalWallet: Vec<u8> (stringToU8a)                      │
│   - coinName: Vec<u8> (stringToU8a)                            │
│   - externalAmount: 150000000 (satoshis, 8 decimals)           │
│   - ratio: 50000                                               │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│           3. Call proofOfReserve.requestDeposit()              │
│                                                                 │
│   api.tx.proofOfReserve.requestDeposit(                        │
│     "5GrwV...",           // onchain_account                   │
│     [0xab, 0xc1, ...],    // external_tx_id                    │
│     [0xbc, 0x1q, ...],    // external_wallet                   │
│     [0x42, 0x54, ...],    // coin_name ("BTC")                 │
│     150000000,            // external_amount                   │
│     50000                 // ratio                             │
│   )                                                             │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│        4. User signs transaction with Polkadot.js extension     │
│                                                                 │
│   - Extension popup appears                                     │
│   - User approves transaction                                   │
│   - Transaction signed with private key                         │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│           5. Transaction submitted to blockchain                │
│                                                                 │
│   - Transaction included in block                               │
│   - Events emitted: DepositRequested                            │
│   - Request stored with status: Pending                         │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              6. Frontend receives confirmation                  │
│                                                                 │
│   - Status: InBlock → Finalized                                │
│   - Toast notification: "Proof submitted successfully!"        │
│   - Form reset                                                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│      7. Validator approves (separate off-chain process)        │
│                                                                 │
│   - Validator verifies BTC transaction confirmed                │
│   - Calls approve_deposit(request_id)                          │
│   - Native tokens transferred to recipient account             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Form Field Mapping

| Frontend Field      | Backend Parameter  | Type    | Description                              |
|---------------------|-------------------|---------|------------------------------------------|
| `proof`             | `external_tx_id`  | Vec<u8> | External transaction hash (BTC tx)       |
| `accountOffchain`   | `external_wallet` | Vec<u8> | External wallet address (BTC address)    |
| `accountOnchain`    | `onchain_account` | AccountId | Substrate address (receives tokens)    |
| `offchainName`      | `coin_name`       | Vec<u8> | Coin symbol (e.g., "BTC", "ETH")         |
| `valueOffchain`     | `external_amount` | u128    | Amount in smallest unit (satoshis)       |
| `ratio`             | `ratio`           | u128    | Exchange rate (external:native)          |

**Note:** The frontend automatically converts `valueOffchain` to the smallest unit by multiplying by 100,000,000 (assuming 8 decimals like Bitcoin).

---

## Connection Status Indicators

The UI shows real-time connection status:

1. **Blockchain Connection** (Green = Connected, Orange = Connecting)
   - Connects to `ws://127.0.0.1:9944` automatically on page load
   - Shows error message if connection fails

2. **Wallet Connection** (Green = Connected, Orange = Not Connected)
   - Auto-detects Polkadot.js extension
   - Shows connected account address
   - Provides "Connect Wallet" button if not connected

---

## Error Handling

The integration handles multiple error scenarios:

1. **No Blockchain Connection**
   - Toast error: "Not connected to blockchain"
   - User must wait for connection to establish

2. **No Wallet Connected**
   - Toast error: "No wallet connected"
   - User must click "Connect Wallet" button

3. **Extension Not Installed**
   - Error message: "No Polkadot extension found"
   - Instructions to install extension

4. **Transaction Failures**
   - Decodes pallet errors (e.g., "InvalidAmount", "DataTooLong")
   - Shows user-friendly error messages in toast

5. **User Rejection**
   - Catches when user cancels transaction in extension
   - Shows appropriate error message

---

## Testing Checklist

Before testing, ensure:

- [ ] Substrate node is running with updated pallet
- [ ] Polkadot.js extension is installed and has accounts
- [ ] Account has sufficient balance for transaction fees
- [ ] Frontend dev server is running

**Test Steps:**

1. Open `http://localhost:8080`
2. Verify blockchain connection indicator is green
3. Verify wallet connection indicator is green (or connect wallet)
4. Fill in all form fields with valid data
5. Click "Submit Proof"
6. Approve transaction in extension popup
7. Wait for "Proof submitted successfully!" toast
8. Check browser console for transaction details
9. Query blockchain to verify request was stored

---

## Troubleshooting

### "Failed to connect to Substrate node"
- Ensure your Substrate node is running: `./target/release/node-template --dev`
- Check the WebSocket endpoint is `ws://127.0.0.1:9944`
- Verify firewall/network settings

### "No Polkadot extension found"
- Install from: https://polkadot.js.org/extension/
- Refresh the page after installation
- Check browser extension is enabled

### "Insufficient balance"
- Your account needs native tokens for transaction fees
- Transfer some tokens to your account first
- Check balance in Polkadot.js extension

### "Transaction failed: DataTooLong"
- One of your inputs exceeds the maximum length:
  - Max tx ID: 128 bytes
  - Max wallet: 128 bytes
  - Max coin name: 12 bytes (configured in runtime)

### "Cannot approve own request"
- The submitter and validator must be different accounts
- Use a different account to call `approve_deposit`

---

## Next Steps

1. **Implement deposit status tracking**
   - Query `DepositRequests` storage to show request status
   - Update Assets page to show real data from blockchain

2. **Add withdrawal functionality**
   - Create form to call `request_withdrawal` extrinsic
   - Show withdrawal history

3. **Event subscription**
   - Subscribe to `DepositRequested` events
   - Show real-time notifications when deposits are approved

4. **Balance queries**
   - Query user's native token balance
   - Show in navigation bar

5. **Multi-account selector**
   - Allow user to switch between accounts
   - Show balances for each account

6. **Custom metadata**
   - Add custom chain metadata if using custom types
   - Improves type safety and autocompletion

---

## API Reference

### `useSubstrate()`
```typescript
const { api, isConnected, isConnecting, error, connect, disconnect } = useSubstrate();

// api: ApiPromise | null - Polkadot.js API instance
// isConnected: boolean - Connection status
// isConnecting: boolean - Loading state
// error: string | null - Error message
// connect: (endpoint?) => Promise<void> - Connect to node
// disconnect: () => Promise<void> - Disconnect
```

### `useWallet()`
```typescript
const {
  accounts,
  selectedAccount,
  isExtensionAvailable,
  isConnecting,
  error,
  connectWallet,
  setSelectedAccount,
  getInjector
} = useWallet();

// accounts: InjectedAccountWithMeta[] - All available accounts
// selectedAccount: InjectedAccountWithMeta | null - Currently selected
// isExtensionAvailable: boolean - Extension detected
// isConnecting: boolean - Loading state
// error: string | null - Error message
// connectWallet: () => Promise<void> - Connect to extension
// setSelectedAccount: (account) => void - Switch account
// getInjector: (address) => Promise<Injector> - Get signer
```

---

## Security Considerations

1. **Transaction Signing**
   - Private keys never leave the browser extension
   - All transactions require explicit user approval
   - Extension provides secure signing

2. **Input Validation**
   - Frontend validates data with Zod schema
   - Backend validates with Substrate runtime checks
   - Double validation prevents invalid data

3. **Network Security**
   - Use WSS (secure WebSocket) for production
   - Current setup uses WS (unencrypted) for local development
   - Consider using HTTPS and WSS for mainnet

4. **Account Security**
   - Never store private keys in frontend code
   - Always use extension for signing
   - Warn users about phishing attacks

---

## Production Deployment

For production, update the following:

1. **Change WebSocket endpoint** in `src/services/substrate.ts`:
   ```typescript
   const WS_PROVIDER = 'wss://your-substrate-node.com:9944';
   ```

2. **Add error boundary** for React errors

3. **Enable strict TypeScript**:
   ```json
   {
     "compilerOptions": {
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```

4. **Add loading states** for better UX

5. **Implement retry logic** for failed connections

6. **Add analytics** to track errors and usage

---

## Support

- **Polkadot.js Docs**: https://polkadot.js.org/docs/
- **Substrate Docs**: https://docs.substrate.io/
- **React Query Docs**: https://tanstack.com/query/latest

For issues specific to this integration, check:
- Browser console for errors
- Substrate node logs
- Transaction events in Polkadot.js Apps UI
