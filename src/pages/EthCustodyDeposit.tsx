"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Wallet, AlertCircle } from "lucide-react";
import { ethers } from "ethers";
import { Keyring } from "@polkadot/keyring";

// IMPORTANT: adjust this import to the actual path you have for your Substrate helper.
// You previously showed a helper named `connectToSubstrate` / `getApi` — update path if needed.
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

const EthCustodyDeposit = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [custodyWallet, setCustodyWallet] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [substrateReady, setSubstrateReady] = useState(false);

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
          // decode module error if available
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

  // Mint and transfer on Substrate using Alice dev key
  const mintAndTransferOnSubstrate = async (recipient: string, amountWei: bigint) => {
    try {
      const api = getApi();
      if (!api) throw new Error("Substrate API not available");

      const COIN_ID = 0; // KETH coin id
      // Alice dev key (ONLY for dev/test)
      const keyring = new Keyring({ type: "sr25519" });
      const alice = keyring.addFromUri("//Alice");

      // Convert amount (bigint) to string for u128 encoding
      const amountStr = amountWei.toString();

      // Build extrinsics: mint(coinId, to, amount, txFeeCoin) and transfer(coinId, to, amount, txFeeCoin)
      const mintExtrinsic = api.tx.multiCoin.mint(COIN_ID, alice.address, amountStr, null);
      await sendAndFinalize(mintExtrinsic, alice);
      toast.success("Minted KETH to Alice (internal)");

      // Transfer from Alice to recipient
      const transferExtrinsic = api.tx.multiCoin.transfer(COIN_ID, recipient, amountStr, null);
      await sendAndFinalize(transferExtrinsic, alice);
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

    // Ensure Substrate API ready
    const api = getApi();
    if (!api) {
      toast.error("Substrate API not connected. Try refreshing the page.");
      return;
    }

    setIsSubmitting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const value = ethers.parseEther(data.ethAmount); // bigint (wei)

      const tx = await contract.depositETH(
        data.polkadotRecipient,
        data.extraData || "",
        { value }
      );

      toast.info("Transaction sent… waiting for confirmation");

      await tx.wait();

      const shortHash = tx.hash.slice(0, 10) + "…";
      toast.success(`Deposit confirmed! Hash: ${shortHash}`, {
        action: {
          label: "View",
          onClick: () => window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, "_blank")
        }
      });

      // 1:1 mapping: mint same amount in wei as kETH (u128)
      const kethAmount: bigint = value as bigint;

      // Perform mint + transfer on Substrate
      try {
        await mintAndTransferOnSubstrate(data.polkadotRecipient, kethAmount);
      } catch (err: any) {
        toast.error("Substrate mint/transfer failed", { description: err.message || String(err) });
      }

      reset();
    } catch (err: any) {
      console.error("Deposit error:", err);
      toast.error(err?.reason || err?.message || "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-6">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 gradient-text">Deposit ETH</h1>
          <p className="text-muted-foreground text-lg">
            Securely deposit native ETH into custody
          </p>
        </div>

        {/* Wallet Status */}
        <div className="mb-6 space-y-3">
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
        <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-8 rounded-2xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="ethAmount">ETH Amount</Label>
            <Input
              id="ethAmount"
              type="number"
              step="0.000000000000000001"
              placeholder="0.05"
              {...register("ethAmount")}
              className="bg-input border-border h-12"
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
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !account}
            className="w-full h-14 text-lg bg-gradient-primary hover:opacity-90 glow-effect font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending Deposit…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Deposit ETH
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          All deposits emit DepositReceived event • Funds sent to custody wallet
        </p>
      </div>
    </div>
  );
};

export default EthCustodyDeposit;
