"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Wallet, XCircle, ArrowRight, ExternalLink, Trash2 } from "lucide-react";
import { ethers } from "ethers";
import { Keyring } from "@polkadot/keyring";

// IMPORTANT: adjust this import to the actual path you have for your Substrate helper.
import { connectToSubstrate, getApi } from "@/services/substrate";

// ETH-only ABI
const ABI = [
  "function custodyWallet() view returns (address)",
  "function depositETH(string polkadotRecipient, string extraData) payable",
  "event DepositReceived(address indexed ethSender, string polkadotRecipient, address indexed token, uint256 amount, uint256 nonce, uint256 timestamp, string extraData)"
];

const CONTRACT_ADDRESS = "0x964A2ce75AB6A70E95C7D47FBe2cc954B04C0E69";


// Validation
const depositSchema = z.object({
  ethAmount: z.string()
    .refine((v) => parseFloat(v) > 0, "Amount must be greater than 0"),
  polkadotRecipient: z.string().min(1, "Polkadot recipient is required"),
  extraData: z.string().optional()
});

type DepositFormData = z.infer<typeof depositSchema>;

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Progress Steps
const STEPS = [
  { id: 1, label: "Transferring ETH to Custody", duration: 3000 },
  { id: 2, label: "Validating Transaction", duration: 2000 },
  { id: 3, label: "Minting KETH Coins", duration: 2500 },
  { id: 4, label: "Transferring Coins", duration: 2000 }
];

interface Transaction {
  id: string;
  timestamp: number;
  currentStep: number;
  completedSteps: number[];
  failedStep?: number;
  ethAmount: string;
  recipient: string;
  txHash?: string;
  isActive: boolean;
  error?: string;
}

const EthCustodyDeposit = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [custodyWallet, setCustodyWallet] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [substrateReady, setSubstrateReady] = useState(false);
  
  // Transaction history
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      ethAmount: "",
      polkadotRecipient: "",
      extraData: ""
    }
  });

  // Connect MetaMask (Ethereum)
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      toast.success(`Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
      await loadCustodyWallet();
    } catch (err: any) {
      toast.error(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  // Load custody wallet from contract (display only)
  const loadCustodyWallet = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const cw = await contract.custodyWallet();
      setCustodyWallet(cw);
    } catch (err) {
      console.warn("Failed to load custody wallet", err);
    }
  };

  // Connect to Substrate node on mount
  useEffect(() => {
    (async () => {
      try {
        await connectToSubstrate();
        const api = getApi();
        if (api) {
          console.log("Substrate API ready");
          setSubstrateReady(true);
        } else {
          console.warn("Substrate API not available after connect");
        }
      } catch (err) {
        console.error("Failed to connect to Substrate:", err);
        toast.error("Failed to connect to Substrate node");
      }
    })();
  }, []);

  // Helper to wait for extrinsic finalization
  const sendAndFinalize = (extrinsic: any, signerPair: any) => {
    return new Promise<void>((resolve, reject) => {
      extrinsic.signAndSend(signerPair, ({ status, dispatchError }) => {
        if (dispatchError) {
          if (dispatchError.isModule) {
            try {
              const api = getApi();
              const decoded = api?.registry.findMetaError(dispatchError.asModule);
              const errMsg = decoded ? `${decoded.section}.${decoded.name}` : dispatchError.toString();
              reject(new Error(errMsg));
            } catch (e) {
              reject(new Error(dispatchError.toString()));
            }
          } else {
            reject(new Error(dispatchError.toString()));
          }
        } else if (status.isInBlock) {
          console.log("Included in block:", status.asInBlock.toHex());
        } else if (status.isFinalized) {
          console.log("Finalized at:", status.asFinalized.toHex());
          resolve();
        }
      }).catch((e: any) => reject(e));
    });
  };

  // Update transaction progress
  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(tx => 
      tx.id === id ? { ...tx, ...updates } : tx
    ));
  };

  // Mint and transfer on Substrate using Alice dev key
  const mintAndTransferOnSubstrate = async (recipient: string, amountWei: bigint, txId: string) => {
    try {
      const api = getApi();
      if (!api) throw new Error("Substrate API not available");

      const COIN_ID = 0; // KETH coin id
      const keyring = new Keyring({ type: "sr25519" });
      const alice = keyring.addFromUri("//Alice");

      const amountStr = amountWei.toString();

      // Step 3: Minting
      updateTransaction(txId, { currentStep: 3 });
      const mintExtrinsic = api.tx.multiCoin.mint(COIN_ID, alice.address, amountStr, null);
      await sendAndFinalize(mintExtrinsic, alice);
      updateTransaction(txId, { completedSteps: [...(transactions.find(t => t.id === txId)?.completedSteps || []), 3] });
      toast.success("Minted KETH to Alice (internal)");

      // Step 4: Transferring
      updateTransaction(txId, { currentStep: 4 });
      const transferExtrinsic = api.tx.multiCoin.transfer(COIN_ID, recipient, amountStr, null);
      await sendAndFinalize(transferExtrinsic, alice);
      updateTransaction(txId, { 
        completedSteps: [...(transactions.find(t => t.id === txId)?.completedSteps || []), 4],
        isActive: false
      });
      toast.success("Transferred KETH to recipient");
    } catch (err: any) {
      console.error("mintAndTransferOnSubstrate error:", err);
      throw err;
    }
  };

  // Handle ETH deposit submit
  const onSubmit = async (data: DepositFormData) => {
    if (!account) {
      toast.error("Wallet not connected");
      return;
    }

    const api = getApi();
    if (!api) {
      toast.error("Substrate API not connected. Try refreshing the page.");
      return;
    }

    setIsSubmitting(true);
    setShowHistory(true);

    // Create new transaction
    const txId = `tx-${Date.now()}`;
    const newTx: Transaction = {
      id: txId,
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
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const value = ethers.parseEther(data.ethAmount);

      // Step 1: Transferring ETH
      const tx = await contract.depositETH(
        data.polkadotRecipient,
        data.extraData || "",
        { value }
      );

      toast.info("Transaction sent… waiting for confirmation");

      await tx.wait();
      
      // Update with tx hash
      updateTransaction(txId, { 
        completedSteps: [1],
        txHash: tx.hash
      });

      // Step 2: Validating (simulated delay for UX)
      updateTransaction(txId, { currentStep: 2 });
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateTransaction(txId, { 
        completedSteps: [1, 2]
      });

      const shortHash = tx.hash.slice(0, 10) + "…";
      toast.success(`Deposit confirmed! Hash: ${shortHash}`, {
        action: {
          label: "View",
          onClick: () => window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, "_blank")
        }
      });

      const kethAmount: bigint = value as bigint;

      // Steps 3 & 4: Mint + Transfer
      try {
        await mintAndTransferOnSubstrate(data.polkadotRecipient, kethAmount, txId);
      } catch (err: any) {
        const currentStep = transactions.find(t => t.id === txId)?.currentStep || 3;
        updateTransaction(txId, { 
          isActive: false, 
          failedStep: currentStep,
          error: err.message || String(err)
        });
        toast.error("Substrate operation failed", { description: err.message || String(err) });
      }

      reset();
      setActiveTxId(null);
    } catch (err: any) {
      console.error("Deposit error:", err);
      const currentStep = transactions.find(t => t.id === txId)?.currentStep || 1;
      updateTransaction(txId, { 
        isActive: false, 
        failedStep: currentStep,
        error: err?.reason || err?.message || "Transaction failed"
      });
      toast.error(err?.reason || err?.message || "Transaction failed");
      setActiveTxId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear transaction history
  const clearHistory = () => {
    setTransactions([]);
    setShowHistory(false);
    toast.success("Transaction history cleared");
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 gradient-text">Deposit ETH</h1>
          <p className="text-muted-foreground text-lg">
            Securely deposit native ETH into custody
          </p>
        </div>

        <div className={`grid grid-cols-1 gap-6 transition-all duration-500 ${showHistory && transactions.length > 0 ? 'lg:grid-cols-3' : ''}`}>
          {/* Main Form Section */}
          <div className={`space-y-6 transition-all duration-500 ${showHistory && transactions.length > 0 ? 'lg:col-span-2' : 'max-w-2xl mx-auto w-full'}`}>
            {/* Wallet Status */}
            <div className="space-y-3">
              <div className={`glass-card p-4 rounded-lg flex items-center justify-between ${account ? 'border-green-500/50' : 'border-orange-500/50'}`}>
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5" />
                  {account ? (
                    <div>
                      <p className="font-medium">Wallet Connected</p>
                      <p className="text-sm text-muted-foreground">{account.slice(0,8)}...{account.slice(-6)}</p>
                    </div>
                  ) : (
                    <span className="font-medium">No Wallet Connected</span>
                  )}
                </div>

                {!account && (
                  <Button onClick={connectWallet} disabled={isConnecting} variant="outline" size="sm">
                    {isConnecting ? "Connecting..." : "Connect MetaMask"}
                  </Button>
                )}
              </div>

              {custodyWallet && (
                <div className="glass-card p-4 rounded-lg border-blue-500/50">
                  <p className="text-sm font-medium">Custody Wallet</p>
                  <p className="text-xs text-muted-foreground break-all">{custodyWallet}</p>
                </div>
              )}

              <div className={`glass-card p-3 rounded-lg ${substrateReady ? 'border-green-500/50' : 'border-orange-500/50'}`}>
                <p className="text-sm font-medium">
                  {substrateReady ? "Connected to Substrate node" : "Connecting to Substrate..."}
                </p>
              </div>
            </div>

            {/* Deposit Form */}
            <div className="glass-card p-8 rounded-2xl space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ethAmount">ETH Amount</Label>
                <Input
                  id="ethAmount"
                  type="number"
                  step="0.000000000000000001"
                  placeholder="0.05"
                  {...register("ethAmount")}
                  className="bg-input border-border h-12"
                  disabled={isSubmitting}
                />
                {errors.ethAmount && (
                  <p className="text-destructive text-sm">{errors.ethAmount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="polkadotRecipient">Polkadot Recipient</Label>
                <Input
                  id="polkadotRecipient"
                  placeholder="14xyz..."
                  {...register("polkadotRecipient")}
                  className="bg-input border-border h-12"
                  disabled={isSubmitting}
                />
                {errors.polkadotRecipient && (
                  <p className="text-destructive text-sm">{errors.polkadotRecipient.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="extraData">Extra Data (optional)</Label>
                <Input
                  id="extraData"
                  placeholder="Any note"
                  {...register("extraData")}
                  className="bg-input border-border h-12"
                  disabled={isSubmitting}
                />
              </div>

              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || !account}
                className="w-full h-14 text-lg bg-gradient-primary hover:opacity-90 glow-effect font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing Transaction…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Deposit ETH
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              All deposits emit DepositReceived event • Funds sent to custody wallet
            </p>
          </div>

          {/* Transaction History Sidebar */}
          {showHistory && transactions.length > 0 && (
            <div className="lg:col-span-1 animate-in slide-in-from-right duration-500">
              <div className="glass-card p-6 rounded-2xl sticky top-6 border-2 border-blue-500/20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Transaction Progress</h3>
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
                  {transactions.map((tx) => (
                    <div 
                      key={tx.id} 
                      className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                        tx.isActive 
                          ? 'border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 shadow-lg shadow-blue-500/20' 
                          : tx.failedStep
                          ? 'border-red-500/50 bg-red-500/5'
                          : 'border-green-500/30 bg-green-500/5'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex-1">
                          <p className="text-lg font-semibold text-white">{tx.ethAmount} ETH</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(tx.timestamp).toLocaleTimeString()}
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
                        {STEPS.map((step, index) => {
                          const isActive = tx.isActive && tx.currentStep === step.id;
                          const isCompleted = tx.completedSteps.includes(step.id);
                          const isFailed = tx.failedStep === step.id;
                          const isPending = !isCompleted && !isActive && !isFailed;

                          return (
                            <div key={step.id}>
                              <div className="flex items-start gap-4">
                                <div className="relative flex-shrink-0">
                                  <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center
                                    transition-all duration-500 border-2
                                    ${isCompleted ? 'bg-green-500 border-green-400 shadow-lg shadow-green-500/50' : ''}
                                    ${isActive ? 'bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50 animate-pulse' : ''}
                                    ${isFailed ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/50' : ''}
                                    ${isPending ? 'bg-gray-800 border-gray-700' : ''}
                                  `}>
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-5 h-5 text-white" />
                                    ) : isActive ? (
                                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                                    ) : isFailed ? (
                                      <XCircle className="w-5 h-5 text-white" />
                                    ) : (
                                      <span className="text-sm font-bold text-gray-500">{step.id}</span>
                                    )}
                                  </div>
                                  
                                  {/* Connecting line */}
                                  {index < STEPS.length - 1 && (
                                    <div 
                                      className={`
                                        absolute left-1/2 top-10 w-0.5 h-7 -translate-x-1/2 transition-all duration-500
                                        ${isCompleted ? 'bg-green-500' : 'bg-gray-700'}
                                      `}
                                    />
                                  )}
                                </div>

                                <div className="flex-1 pt-1.5">
                                  {step.id === 1 && tx.txHash && isCompleted ? (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.open(`https://sepolia.etherscan.io/tx/${tx.txHash}`, "_blank", "noopener,noreferrer");
                                      }}
                                      className="flex items-center gap-2 hover:text-blue-400 transition-colors group text-left w-full"
                                    >
                                      <span className="text-sm font-medium text-green-400 group-hover:text-blue-400 transition-colors">
                                        {step.label}
                                      </span>
                                      <ExternalLink className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity text-blue-400" />
                                    </button>
                                  ) : (
                                    <p className={`
                                      text-sm font-medium transition-all duration-300
                                      ${isCompleted ? 'text-green-400' : ''}
                                      ${isActive ? 'text-blue-400' : ''}
                                      ${isFailed ? 'text-red-400' : ''}
                                      ${isPending ? 'text-gray-500' : ''}
                                    `}>
                                      {step.label}
                                    </p>
                                  )}
                                  
                                  {/* Progress bar for active step */}
                                  {isActive && (
                                    <div className="mt-2.5 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-full progress-animation"
                                      />
                                    </div>
                                  )}
                                  
                                  {/* Error message */}
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
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes progress-slide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
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

export default EthCustodyDeposit;