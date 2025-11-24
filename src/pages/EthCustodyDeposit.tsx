"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CheckCircle2, Loader2, Wallet, XCircle,
  ExternalLink, Trash2, ArrowDownUp, ArrowDownToLine, ArrowUpFromLine,
  RefreshCw
} from "lucide-react";
import { ethers } from "ethers";
import { Keyring } from "@polkadot/keyring";
import { web3Accounts, web3Enable, web3FromAddress } from "@polkadot/extension-dapp";

// === UPDATE THESE TO YOUR LATEST CONTRACT ===
const CONTRACT_ADDRESS = "0xd75FF434fC1A97d41E6C6123222fa96982717B3a";
const BRIDGE_ABI = [
  "function custodyWallet() view returns (address)",
  "function depositETH(string polkadotRecipient, string extraData) payable",
  "function getContractBalance() view returns (uint256)",
  "function requestWithdrawal(address ethRecipient, uint256 amount, string polkadotSender, string polkadotTxHash)",
  "function completeWithdrawal(uint256 withdrawalId)",
  "function withdrawalNonce() view returns (uint256)",
  "event DepositReceived(address indexed ethSender, string polkadotRecipient, address indexed token, uint256 amount, uint256 nonce, uint256 timestamp, string extraData)",
  "event WithdrawalCompleted(uint256 indexed withdrawalId, address indexed ethRecipient, uint256 amount, uint256 timestamp)"
];

const COIN_ID = 0;
const ALICE_SUBSTRATE_ADDRESS = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

// Import your real Substrate connection
import { connectToSubstrate, getApi } from "@/services/substrate";

const depositSchema = z.object({
  ethAmount: z.string().refine((v) => parseFloat(v) > 0, "Amount must be greater than 0"),
  polkadotRecipient: z.string().min(1, "Polkadot recipient is required"),
  extraData: z.string().optional()
});

const withdrawalSchema = z.object({
  ethAmount: z.string().refine((v) => parseFloat(v) > 0, "Amount must be greater than 0"),
  ethRecipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
});

type DepositFormData = z.infer<typeof depositSchema>;
type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

const DEPOSIT_STEPS = [
  { id: 1, label: "Transferring ETH to Custody" },
  { id: 2, label: "Validating Transaction" },
  { id: 3, label: "Minting KETH Coins" },
  { id: 4, label: "Transferring to Recipient" }
];

const WITHDRAWAL_STEPS = [
  { id: 1, label: "Transfer KETH to Alice" },
  { id: 2, label: "Burning KETH (Alice)" },
  { id: 3, label: "Requesting Withdrawal" },
  { id: 4, label: "Releasing ETH" }
];

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  timestamp: number;
  currentStep: number;
  completedSteps: number[];
  failedStep?: number;
  ethAmount: string;
  recipient: string;
  txHash?: string;
  substrateTxHash?: string;
  isActive: boolean;
  error?: string;
}

interface PolkadotAccount {
  address: string;
  meta: {
    name?: string;
    source: string;
  };
}

const EthBridge = () => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdrawal'>('deposit');
  const [isConnecting, setIsConnecting] = useState(false);
 
  const [ethAccount, setEthAccount] = useState<string | null>(null);
  const [ethAccounts, setEthAccounts] = useState<string[]>([]);
  const [showEthAccountSelector, setShowEthAccountSelector] = useState(false);
 
  const [polkadotAccount, setPolkadotAccount] = useState<string | null>(null);
  const [polkadotAccounts, setPolkadotAccounts] = useState<PolkadotAccount[]>([]);
  const [showPolkadotAccountSelector, setShowPolkadotAccountSelector] = useState(false);
 
  const [custodyWallet, setCustodyWallet] = useState<string>("");
  const [contractBalance, setContractBalance] = useState<string>("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [substrateReady, setSubstrateReady] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const depositForm = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: { ethAmount: "", polkadotRecipient: "", extraData: "" }
  });

  const withdrawalForm = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: { ethAmount: "", ethRecipient: "" }
  });

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected. Please install MetaMask extension.");
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setEthAccounts(accounts);
      setEthAccount(accounts[0]);
      toast.success(`MetaMask Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
      await loadContractInfo();
    } catch (err: any) {
      toast.error(err.message || "Failed to connect MetaMask");
    } finally {
      setIsConnecting(false);
    }
  };

  const switchEthAccount = async (account: string) => {
    setEthAccount(account);
    setShowEthAccountSelector(false);
    toast.success(`Switched to ${account.slice(0, 6)}...${account.slice(-4)}`);
    await loadContractInfo();
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setEthAccounts(accounts);
          setEthAccount(accounts[0]);
          toast.info(`Account changed to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
          loadContractInfo();
        } else {
          setEthAccount(null);
          setEthAccounts([]);
        }
      });
    }
  }, []);

  const connectPolkadot = async () => {
    setIsConnecting(true);
    try {
      const extensions = await web3Enable("ETH Bridge");
     
      if (extensions.length === 0) {
        toast.error("No Polkadot wallet extension found. Please install Polkadot.js or Talisman.");
        window.open("https://polkadot.js.org/extension/", "_blank");
        setIsConnecting(false);
        return;
      }

      const allAccounts = await web3Accounts();
     
      if (allAccounts.length === 0) {
        toast.error("No accounts found in your Polkadot wallet");
        setIsConnecting(false);
        return;
      }

      setPolkadotAccounts(allAccounts);
      setPolkadotAccount(allAccounts[0].address);
     
      toast.success(`Polkadot Connected: ${allAccounts[0].meta.name || allAccounts[0].address.slice(0, 8)}...`);
    } catch (err: any) {
      toast.error(err.message || "Failed to connect Polkadot wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const switchPolkadotAccount = (account: PolkadotAccount) => {
    setPolkadotAccount(account.address);
    setShowPolkadotAccountSelector(false);
    toast.success(`Switched to ${account.meta.name || account.address.slice(0, 8)}...`);
  };

  const loadContractInfo = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, BRIDGE_ABI, provider);
      const cw = await contract.custodyWallet();
      const balance = await contract.getContractBalance();
      setCustodyWallet(cw);
      setContractBalance(ethers.formatEther(balance));
    } catch (err) {
      console.warn("Failed to load contract info", err);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await connectToSubstrate();
        const api = getApi();
        if (api) {
          setSubstrateReady(true);
        }
      } catch (err) {
        console.error("Failed to connect to Substrate:", err);
        toast.error("Failed to connect to Substrate node");
      }
    })();
  }, []);

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx));
  };

  // Fixed sendAndFinalize function
  const sendAndFinalize = (extrinsic: any, signerOrAddress: any, isUserSigned: boolean = false) => {
    return new Promise<string>((resolve, reject) => {
      if (isUserSigned) {
        // User signing with injector
        extrinsic.signAndSend(
          signerOrAddress.address,
          { signer: signerOrAddress.signer },
          ({ status, dispatchError, txHash }: any) => {
            if (dispatchError) {
              if (dispatchError.isModule) {
                try {
                  const api = getApi();
                  const decoded = api?.registry.findMetaError(dispatchError.asModule);
                  const errMsg = decoded ? `${decoded.section}.${decoded.name}: ${decoded.docs}` : dispatchError.toString();
                  reject(new Error(errMsg));
                } catch (e) {
                  reject(new Error(dispatchError.toString()));
                }
              } else {
                reject(new Error(dispatchError.toString()));
              }
            } else if (status.isFinalized) {
              resolve(txHash?.toHex() || status.asFinalized.toHex());
            }
          }
        ).catch((e: any) => reject(e));
      } else {
        // Alice signing with keyring
        extrinsic.signAndSend(
          signerOrAddress,
          ({ status, dispatchError, txHash }: any) => {
            if (dispatchError) {
              if (dispatchError.isModule) {
                try {
                  const api = getApi();
                  const decoded = api?.registry.findMetaError(dispatchError.asModule);
                  const errMsg = decoded ? `${decoded.section}.${decoded.name}: ${decoded.docs}` : dispatchError.toString();
                  reject(new Error(errMsg));
                } catch (e) {
                  reject(new Error(dispatchError.toString()));
                }
              } else {
                reject(new Error(dispatchError.toString()));
              }
            } else if (status.isFinalized) {
              resolve(txHash?.toHex() || status.asFinalized.toHex());
            }
          }
        ).catch((e: any) => reject(e));
      }
    });
  };

  // DEPOSIT
  const onDeposit = async (data: DepositFormData) => {
    if (!ethAccount) {
      toast.error("Please connect MetaMask wallet first");
      return;
    }

    setIsSubmitting(true);
    setShowHistory(true);

    const txId = `tx-${Date.now()}`;
    const newTx: Transaction = {
      id: txId,
      type: 'deposit',
      timestamp: Date.now(),
      currentStep: 1,
      completedSteps: [],
      ethAmount: data.ethAmount,
      recipient: data.polkadotRecipient,
      isActive: true
    };

    setTransactions(prev => [newTx, ...prev]);
    setActiveTxId(txId);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, BRIDGE_ABI, signer);
      const value = ethers.parseEther(data.ethAmount);

      const tx = await contract.depositETH(data.polkadotRecipient, data.extraData || "", { value });
      toast.info("Transaction sent… waiting for confirmation");
      await tx.wait();
     
      updateTransaction(txId, { completedSteps: [1], txHash: tx.hash });
      updateTransaction(txId, { currentStep: 2 });
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateTransaction(txId, { completedSteps: [1, 2] });

      toast.success(`Deposit confirmed! Hash: ${tx.hash.slice(0, 10)}…`, {
        action: {
          label: "View",
          onClick: () => window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, "_blank")
        }
      });

      const api = getApi();
      const keyring = new Keyring({ type: "sr25519" });
      const alice = keyring.addFromUri("//Alice");
      const amountSubstrate = value.toString();

      updateTransaction(txId, { currentStep: 3 });
      const mintExtrinsic = api.tx.multiCoin.mint(COIN_ID, alice.address, amountSubstrate, null);
      await sendAndFinalize(mintExtrinsic, alice, false);
      updateTransaction(txId, { completedSteps: [1, 2, 3] });

      updateTransaction(txId, { currentStep: 4 });
      const transferExtrinsic = api.tx.multiCoin.transfer(COIN_ID, data.polkadotRecipient, amountSubstrate, null);
      await sendAndFinalize(transferExtrinsic, alice, false);
      updateTransaction(txId, { completedSteps: [1, 2, 3, 4], isActive: false });

      toast.success("Deposit complete! KETH transferred to recipient.");
      depositForm.reset();
      setActiveTxId(null);
      await loadContractInfo();
    } catch (err: any) {
      const currentStep = transactions.find(t => t.id === txId)?.currentStep || 1;
      updateTransaction(txId, { isActive: false, failedStep: currentStep, error: err.message });
      toast.error(err.message || "Transaction failed");
      setActiveTxId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // WITHDRAWAL - FIXED
  const onWithdraw = async (data: WithdrawalFormData) => {
    if (!polkadotAccount) {
      toast.error("Please connect Polkadot wallet first");
      return;
    }
    if (!ethAccount) {
      toast.error("Please also connect MetaMask for withdrawal processing");
      return;
    }

    setIsSubmitting(true);
    setShowHistory(true);

    const txId = `tx-${Date.now()}`;
    const newTx: Transaction = {
      id: txId,
      type: 'withdrawal',
      timestamp: Date.now(),
      currentStep: 1,
      completedSteps: [],
      ethAmount: data.ethAmount,
      recipient: data.ethRecipient,
      isActive: true
    };

    setTransactions(prev => [newTx, ...prev]);
    setActiveTxId(txId);

    try {
      const api = getApi();
      const amountWei = ethers.parseEther(data.ethAmount);
      const amountSubstrate = amountWei.toString();

      // Step 1: User transfers KETH to Alice
      updateTransaction(txId, { currentStep: 1 });
     
      const injector = await web3FromAddress(polkadotAccount);
      const transferToAliceExtrinsic = api.tx.multiCoin.transfer(
        COIN_ID,
        ALICE_SUBSTRATE_ADDRESS,
        amountSubstrate,
        null
      );
     
      // FIXED: Pass injector and address correctly
      const transferTxHash = await sendAndFinalize(
        transferToAliceExtrinsic,
        { address: polkadotAccount, signer: injector.signer },
        true // Indicate this is user-signed
      );
     
      updateTransaction(txId, {
        completedSteps: [1],
        substrateTxHash: transferTxHash
      });
      toast.success("KETH transferred to Alice");

      // Step 2: Alice burns the KETH
      updateTransaction(txId, { currentStep: 2 });
     
      const keyring = new Keyring({ type: "sr25519" });
      const alice = keyring.addFromUri("//Alice");
     
      const burnExtrinsic = api.tx.multiCoin.burn(COIN_ID, amountSubstrate, null);
      const burnTxHash = await sendAndFinalize(burnExtrinsic, alice, false);
     
      updateTransaction(txId, { completedSteps: [1, 2] });
      toast.success("KETH burned by Alice");

      // Step 3: Process withdrawal request on Ethereum
      updateTransaction(txId, { currentStep: 3 });
     
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, BRIDGE_ABI, signer);
     
      const tx1 = await contract.requestWithdrawal(
        data.ethRecipient,
        amountWei,
        polkadotAccount,
        burnTxHash
      );
      await tx1.wait();
     
      updateTransaction(txId, { completedSteps: [1, 2, 3] });
      toast.success("Withdrawal request created");

      // Step 4: Complete withdrawal
      updateTransaction(txId, { currentStep: 4 });
     
      const withdrawalNonce = await contract.withdrawalNonce();
      const withdrawalId = withdrawalNonce - 1n;
     
      const tx2 = await contract.completeWithdrawal(withdrawalId);
      await tx2.wait();
     
      updateTransaction(txId, {
        completedSteps: [1, 2, 3, 4],
        isActive: false,
        txHash: tx2.hash
      });

      toast.success(`Withdrawal complete! ETH sent to ${data.ethRecipient.slice(0, 6)}...`, {
        duration: 5000,
        action: {
          label: "View",
          onClick: () => window.open(`https://sepolia.etherscan.io/tx/${tx2.hash}`, "_blank")
        }
      });
     
      withdrawalForm.reset();
      setActiveTxId(null);
      await loadContractInfo();
    } catch (err: any) {
      const currentStep = transactions.find(t => t.id === txId)?.currentStep || 1;
      updateTransaction(txId, { isActive: false, failedStep: currentStep, error: err.message });
      toast.error(err.message || "Withdrawal failed");
      setActiveTxId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearHistory = () => {
    setTransactions([]);
    setShowHistory(false);
    toast.success("Transaction history cleared");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 py-12 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <ArrowDownUp className="w-8 h-8 text-blue-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ETH Bridge
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Bridge ETH between Ethereum Sepolia and Polkadot Substrate
          </p>
        </div>

        <div className={`grid grid-cols-1 gap-6 transition-all duration-500 ${showHistory && transactions.length > 0 ? 'lg:grid-cols-3' : ''}`}>
          <div className={`space-y-6 transition-all duration-500 ${showHistory && transactions.length > 0 ? 'lg:col-span-2' : 'max-w-2xl mx-auto w-full'}`}>
            <div className="space-y-3">
              {activeTab === 'deposit' && (
                <div className={`bg-slate-900/50 backdrop-blur border-2 p-4 rounded-lg transition-all ${ethAccount ? 'border-green-500/50' : 'border-orange-500/50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-blue-400" />
                      {ethAccount ? (
                        <div>
                          <p className="font-medium text-white">MetaMask Connected</p>
                          <p className="text-sm text-slate-400">{ethAccount.slice(0,8)}...{ethAccount.slice(-6)}</p>
                        </div>
                      ) : (
                        <span className="font-medium text-white">MetaMask Not Connected</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {ethAccount && ethAccounts.length > 1 && (
                        <Button
                          onClick={() => setShowEthAccountSelector(!showEthAccountSelector)}
                          variant="outline"
                          size="sm"
                          className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Switch
                        </Button>
                      )}
                      {!ethAccount && (
                        <Button onClick={connectMetaMask} disabled={isConnecting} variant="outline" size="sm" className="border-blue-500 text-blue-400 hover:bg-blue-500/10">
                          {isConnecting ? "Connecting..." : "Connect"}
                        </Button>
                      )}
                    </div>
                  </div>
                 
                  {showEthAccountSelector && ethAccounts.length > 1 && (
                    <div className="mt-3 p-3 bg-slate-800/50 rounded-lg space-y-2">
                      <p className="text-xs text-slate-400 mb-2">Select Account:</p>
                      {ethAccounts.map((acc) => (
                        <button
                          key={acc}
                          onClick={() => switchEthAccount(acc)}
                          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                            acc === ethAccount
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {acc.slice(0, 10)}...{acc.slice(-8)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'withdrawal' && (
                <>
                  <div className={`bg-slate-900/50 backdrop-blur border-2 p-4 rounded-lg transition-all ${polkadotAccount ? 'border-green-500/50' : 'border-purple-500/50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-purple-400" />
                        {polkadotAccount ? (
                          <div>
                            <p className="font-medium text-white">Polkadot Connected</p>
                            <p className="text-sm text-slate-400">
                              {polkadotAccounts.find(a => a.address === polkadotAccount)?.meta.name || polkadotAccount.slice(0,8)}...
                            </p>
                          </div>
                        ) : (
                          <span className="font-medium text-white">Polkadot Not Connected</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {polkadotAccount && polkadotAccounts.length > 1 && (
                          <Button
                            onClick={() => setShowPolkadotAccountSelector(!showPolkadotAccountSelector)}
                            variant="outline"
                            size="sm"
                            className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Switch
                          </Button>
                        )}
                        {!polkadotAccount && (
                          <Button onClick={connectPolkadot} disabled={isConnecting} variant="outline" size="sm" className="border-purple-500 text-purple-400 hover:bg-purple-500/10">
                            {isConnecting ? "Connecting..." : "Connect"}
                          </Button>
                        )}
                      </div>
                    </div>
                   
                    {showPolkadotAccountSelector && polkadotAccounts.length > 1 && (
                      <div className="mt-3 p-3 bg-slate-800/50 rounded-lg space-y-2">
                        <p className="text-xs text-slate-400 mb-2">Select Account:</p>
                        {polkadotAccounts.map((acc) => (
                          <button
                            key={acc.address}
                            onClick={() => switchPolkadotAccount(acc)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                              acc.address === polkadotAccount
                                ? 'bg-purple-500 text-white'
                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            <div className="font-medium">{acc.meta.name || 'Unnamed'}</div>
                            <div className="text-xs opacity-75">{acc.address.slice(0, 10)}...{acc.address.slice(-8)}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={`bg-slate-900/50 backdrop-blur border-2 p-4 rounded-lg transition-all ${ethAccount ? 'border-green-500/50' : 'border-orange-500/50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-blue-400" />
                        {ethAccount ? (
                          <div>
                            <p className="font-medium text-white">MetaMask (Owner)</p>
                            <p className="text-sm text-slate-400">{ethAccount.slice(0,8)}...{ethAccount.slice(-6)}</p>
                          </div>
                        ) : (
                          <span className="font-medium text-white">MetaMask Not Connected</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {ethAccount && ethAccounts.length > 1 && (
                          <Button
                            onClick={() => setShowEthAccountSelector(!showEthAccountSelector)}
                            variant="outline"
                            size="sm"
                            className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Switch
                          </Button>
                        )}
                        {!ethAccount && (
                          <Button onClick={connectMetaMask} disabled={isConnecting} variant="outline" size="sm" className="border-blue-500 text-blue-400 hover:bg-blue-500/10">
                            {isConnecting ? "Connecting..." : "Connect"}
                          </Button>
                        )}
                      </div>
                    </div>
                   
                    {showEthAccountSelector && ethAccounts.length > 1 && (
                      <div className="mt-3 p-3 bg-slate-800/50 rounded-lg space-y-2">
                        <p className="text-xs text-slate-400 mb-2">Select Account:</p>
                        {ethAccounts.map((acc) => (
                          <button
                            key={acc}
                            onClick={() => switchEthAccount(acc)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                              acc === ethAccount
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {acc.slice(0, 10)}...{acc.slice(-8)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {custodyWallet && (
                <div className="bg-slate-900/50 backdrop-blur border-2 border-blue-500/50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-white">Custody Wallet</p>
                  <p className="text-xs text-slate-400 break-all">{custodyWallet}</p>
                  <p className="text-xs text-blue-400 mt-2">Balance: {contractBalance} ETH</p>
                </div>
              )}

              <div className={`bg-slate-900/50 backdrop-blur border-2 p-3 rounded-lg ${substrateReady ? 'border-green-500/50' : 'border-orange-500/50'}`}>
                <p className="text-sm font-medium text-white">
                  {substrateReady ? "✓ Connected to Substrate" : "⏳ Connecting..."}
                </p>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur border-2 border-slate-700/50 rounded-2xl p-2 flex gap-2">
              <button
                onClick={() => setActiveTab('deposit')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'deposit'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <ArrowDownToLine className="w-5 h-5" />
                Deposit ETH
              </button>
              <button
                onClick={() => setActiveTab('withdrawal')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'withdrawal'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <ArrowUpFromLine className="w-5 h-5" />
                Withdraw ETH
              </button>
            </div>

            {activeTab === 'deposit' ? (
              <div className="bg-slate-900/50 backdrop-blur border-2 border-slate-700/50 p-8 rounded-2xl space-y-6">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-300">
                    💡 <strong>Deposit Flow:</strong> Connect MetaMask → Send ETH → Locked in custody → KETH minted → Transferred to recipient
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ethAmount" className="text-white">ETH Amount</Label>
                  <Input
                    id="ethAmount"
                    type="number"
                    step="0.000000000000000001"
                    placeholder="0.05"
                    {...depositForm.register("ethAmount")}
                    className="bg-slate-800 border-slate-600 h-12 text-white"
                    disabled={isSubmitting}
                  />
                  {depositForm.formState.errors.ethAmount && (
                    <p className="text-red-400 text-sm">{depositForm.formState.errors.ethAmount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="polkadotRecipient" className="text-white">Polkadot Recipient Address</Label>
                  <Input
                    id="polkadotRecipient"
                    placeholder="5Gxx... (Substrate address)"
                    {...depositForm.register("polkadotRecipient")}
                    className="bg-slate-800 border-slate-600 h-12 text-white"
                    disabled={isSubmitting}
                  />
                  {depositForm.formState.errors.polkadotRecipient && (
                    <p className="text-red-400 text-sm">{depositForm.formState.errors.polkadotRecipient.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extraData" className="text-white">Extra Data (optional)</Label>
                  <Input
                    id="extraData"
                    placeholder="Any note or metadata"
                    {...depositForm.register("extraData")}
                    className="bg-slate-800 border-slate-600 h-12 text-white"
                    disabled={isSubmitting}
                  />
                </div>

                <Button
                  onClick={depositForm.handleSubmit(onDeposit)}
                  disabled={isSubmitting || !ethAccount}
                  className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Deposit ETH
                    </>
                  )}
                </Button>
               
                {!ethAccount && (
                  <p className="text-center text-sm text-orange-400">
                    ⚠️ Please connect MetaMask to deposit
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/50 backdrop-blur border-2 border-slate-700/50 p-8 rounded-2xl space-y-6">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-purple-300">
                    💡 <strong>Withdrawal Flow:</strong> Connect Polkadot → Transfer KETH to Alice → Alice burns → Automatic ETH transfer
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdrawEthAmount" className="text-white">ETH Amount</Label>
                  <Input
                    id="withdrawEthAmount"
                    type="number"
                    step="0.000000000000000001"
                    placeholder="0.05"
                    {...withdrawalForm.register("ethAmount")}
                    className="bg-slate-800 border-slate-600 h-12 text-white"
                    disabled={isSubmitting}
                  />
                  {withdrawalForm.formState.errors.ethAmount && (
                    <p className="text-red-400 text-sm">{withdrawalForm.formState.errors.ethAmount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ethRecipient" className="text-white">ETH Recipient Address</Label>
                  <Input
                    id="ethRecipient"
                    placeholder="0x... (Ethereum address)"
                    {...withdrawalForm.register("ethRecipient")}
                    className="bg-slate-800 border-slate-600 h-12 text-white"
                    disabled={isSubmitting}
                  />
                  {withdrawalForm.formState.errors.ethRecipient && (
                    <p className="text-red-400 text-sm">{withdrawalForm.formState.errors.ethRecipient.message}</p>
                  )}
                </div>

                {polkadotAccount && (
                  <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                    <p className="text-sm text-slate-300 mb-1">Polkadot Sender:</p>
                    <p className="text-sm font-mono text-green-400 break-all">{polkadotAccount}</p>
                  </div>
                )}

                <Button
                  onClick={withdrawalForm.handleSubmit(onWithdraw)}
                  disabled={isSubmitting || !polkadotAccount || !ethAccount}
                  className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Withdraw ETH
                    </>
                  )}
                </Button>

                {(!polkadotAccount || !ethAccount) && (
                  <p className="text-center text-sm text-orange-400">
                    ⚠️ Connect both wallets to withdraw
                  </p>
                )}
              </div>
            )}
          </div>

          {showHistory && transactions.length > 0 && (
            <div className="lg:col-span-1 animate-in slide-in-from-right duration-500">
              <div className="bg-slate-900/50 backdrop-blur border-2 border-blue-500/20 p-6 rounded-2xl sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Progress</h3>
                  <Button
                    onClick={clearHistory}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-6 max-h-[calc(100vh-240px)] overflow-y-auto pr-2 custom-scrollbar">
                  {transactions.map((tx) => {
                    const steps = tx.type === 'deposit' ? DEPOSIT_STEPS : WITHDRAWAL_STEPS;
                    return (
                      <div
                        key={tx.id}
                        className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                          tx.isActive
                            ? tx.type === 'deposit'
                              ? 'border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 shadow-lg'
                              : 'border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/5 shadow-lg'
                            : tx.failedStep
                            ? 'border-red-500/50 bg-red-500/5'
                            : 'border-green-500/30 bg-green-500/5'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {tx.type === 'deposit' ? (
                                <ArrowDownToLine className="w-4 h-4 text-blue-400" />
                              ) : (
                                <ArrowUpFromLine className="w-4 h-4 text-purple-400" />
                              )}
                              <p className="text-lg font-semibold text-white">{tx.ethAmount} ETH</p>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              {tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'} • {new Date(tx.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          {tx.failedStep && (
                            <div className="bg-red-500/20 px-2 py-1 rounded text-xs text-red-400 font-medium">
                              Failed
                            </div>
                          )}
                          {!tx.isActive && !tx.failedStep && (
                            <div className="bg-green-500/20 px-2 py-1 rounded text-xs text-green-400 font-medium">
                              Complete
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          {steps.map((step, index) => {
                            const isActive = tx.isActive && tx.currentStep === step.id;
                            const isCompleted = tx.completedSteps.includes(step.id);
                            const isFailed = tx.failedStep === step.id;
                            const isPending = !isCompleted && !isActive && !isFailed;

                            return (
                              <div key={step.id}>
                                <div className="flex items-start gap-4">
                                  <div className="relative flex-shrink-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                                      isCompleted ? 'bg-green-500 border-green-400 shadow-lg' :
                                      isActive ? 'bg-blue-500 border-blue-400 shadow-lg animate-pulse' :
                                      isFailed ? 'bg-red-500 border-red-400 shadow-lg' :
                                      'bg-slate-800 border-slate-700'
                                    }`}>
                                      {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                      ) : isActive ? (
                                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                                      ) : isFailed ? (
                                        <XCircle className="w-5 h-5 text-white" />
                                      ) : (
                                        <span className="text-sm font-bold text-slate-500">{step.id}</span>
                                      )}
                                    </div>
                                   
                                    {index < steps.length - 1 && (
                                      <div className={`absolute left-1/2 top-10 w-0.5 h-7 -translate-x-1/2 transition-all ${
                                        isCompleted ? 'bg-green-500' : 'bg-slate-700'
                                      }`} />
                                    )}
                                  </div>

                                  <div className="flex-1 pt-1.5">
                                    {((step.id === 1 && tx.txHash && isCompleted && tx.type === 'deposit') ||
                                      (step.id === 4 && tx.txHash && isCompleted && tx.type === 'withdrawal')) ? (
                                      <button
                                        onClick={() => window.open(`https://sepolia.etherscan.io/tx/${tx.txHash}`, "_blank")}
                                        className="flex items-center gap-2 hover:text-blue-400 transition-colors group text-left w-full"
                                      >
                                        <span className="text-sm font-medium text-green-400 group-hover:text-blue-400">
                                          {step.label}
                                        </span>
                                        <ExternalLink className="w-4 h-4 opacity-60 group-hover:opacity-100 text-blue-400" />
                                      </button>
                                    ) : (step.id === 1 && tx.substrateTxHash && isCompleted && tx.type === 'withdrawal') ? (
                                      <div className="flex flex-col gap-1">
                                        <p className="text-sm font-medium text-green-400">{step.label}</p>
                                        <p className="text-xs text-slate-400 font-mono">
                                          {tx.substrateTxHash.slice(0, 10)}...{tx.substrateTxHash.slice(-8)}
                                        </p>
                                      </div>
                                    ) : (
                                      <p className={`text-sm font-medium transition-all ${
                                        isCompleted ? 'text-green-400' :
                                        isActive ? 'text-blue-400' :
                                        isFailed ? 'text-red-400' :
                                        'text-slate-500'
                                      }`}>
                                        {step.label}
                                      </p>
                                    )}
                                   
                                    {isActive && (
                                      <div className="mt-2.5 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-full progress-animation" />
                                      </div>
                                    )}
                                   
                                    {isFailed && tx.error && (
                                      <p className="text-xs text-red-400/80 mt-1.5">{tx.error}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes progress-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .progress-animation {
          animation: progress-slide 2s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>
    </div>
  );
};

export default EthBridge;