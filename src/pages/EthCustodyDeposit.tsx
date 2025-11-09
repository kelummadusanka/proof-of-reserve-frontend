// components/EthCustodyDeposit.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Wallet, AlertCircle, Send, Coins } from "lucide-react";
import { ethers } from "ethers";
import { CheckCircle2 } from "lucide-react";

// ABI of your contract
const ABI = [
  "function custodyWallet() view returns (address)",
  "function depositERC20(address token, address recipient, uint256 amount)",
  "event DepositReceived(address indexed sender, address indexed recipient, uint256 amount)",
  "receive() external payable"
];

const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE"; // Replace with your deployed Sepolia address

const depositSchema = z.object({
  depositType: z.enum(["eth", "erc20"]),
  ethAmount: z.string().refine((v) => parseFloat(v) > 0, "Amount must be greater than 0").optional(),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid token address").optional(),
  erc20Amount: z.string().refine((v) => parseFloat(v) > 0, "Amount must be greater than 0").optional(),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address").optional(),
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [custodyWallet, setCustodyWallet] = useState<string>("");
  const [depositType, setDepositType] = useState<"eth" | "erc20">("eth");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      depositType: "eth",
      recipient: "",
    },
  });

  const watchedDepositType = watch("depositType") || "eth";

  useEffect(() => {
    setDepositType(watchedDepositType as "eth" | "erc20");
    if (watchedDepositType === "eth") {
      setValue("tokenAddress", "");
      setValue("erc20Amount", "");
    } else {
      setValue("ethAmount", "");
    }
  }, [watchedDepositType, setValue]);

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast.error("MetaMask not detected", {
        description: "Please install MetaMask to use this feature.",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
      toast.success("Wallet connected!", {
        description: `Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
      await loadCustodyWallet(accounts[0]);
    } catch (err: any) {
      toast.error("Failed to connect wallet", { description: err.message });
    } finally {
      setIsConnecting(false);
    }
  };

  const loadCustodyWallet = async (userAddress: string) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const wallet = await contract.custodyWallet();
      setCustodyWallet(wallet);
    } catch (err) {
      console.error("Failed to load custody wallet", err);
    }
  };

  const onSubmit = async (data: DepositFormData) => {
    if (!account) {
      toast.error("Wallet not connected");
      return;
    }

    setIsSubmitting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      let tx;
      if (data.depositType === "eth") {
        const amount = ethers.parseEther(data.ethAmount || "0");
        tx = await contract.getFunction("receive").send({ value: amount });
        toast.success("ETH deposit sent!", { description: `Hash: ${tx.hash.slice(0, 10)}...` });
      } else {
        const tokenContract = new ethers.Contract(data.tokenAddress!, [
          "function approve(address spender, uint256 amount) returns (bool)",
          "function allowance(address owner, address spender) view returns (uint256)",
          "function decimals() view returns (uint8)",
          "function symbol() view returns (string)",
        ], signer);

        const decimals = await tokenContract.decimals();
        const amount = ethers.parseUnits(data.erc20Amount || "0", decimals);
        const allowance = await tokenContract.allowance(account, CONTRACT_ADDRESS);

        if (allowance < amount) {
          const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amount);
          await approveTx.wait();
          toast.success("Approved token spending");
        }

        tx = await contract.depositERC20(
          data.tokenAddress,
          data.recipient || account,
          amount
        );
        toast.success("ERC20 deposit successful!", { description: `Hash: ${tx.hash.slice(0, 10)}...` });
      }

      await tx.wait();
      toast.success("Deposit confirmed!", {
        description: "Your funds are now in custody.",
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
      reset();
    } catch (err: any) {
      console.error(err);
      toast.error("Transaction failed", {
        description: err.reason || err.message || "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-6">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 gradient-text">
            Deposit to EthCustody
          </h1>
          <p className="text-muted-foreground text-lg">
            Securely deposit ETH or ERC20 tokens into custody
          </p>
        </div>

        {/* Connection Status */}
        <div className="mb-6 space-y-3">
          <div className={`glass-card p-4 rounded-lg flex items-center justify-between ${account ? 'border-green-500/50' : 'border-orange-500/50'}`}>
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5" />
              {account ? (
                <div>
                  <p className="font-medium">Wallet Connected</p>
                  <p className="text-sm text-muted-foreground">
                    {account.slice(0, 8)}...{account.slice(-6)}
                  </p>
                </div>
              ) : (
                <span className="font-medium">No Wallet Connected</span>
              )}
            </div>
            {!account && (
              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                variant="outline"
                size="sm"
              >
                {isConnecting ? "Connecting..." : "Connect MetaMask"}
              </Button>
            )}
          </div>

          {custodyWallet && (
            <div className="glass-card p-4 rounded-lg border-blue-500/50">
              <p className="text-sm font-medium">Custody Wallet</p>
              <p className="text-xs text-muted-foreground break-all">
                {custodyWallet}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-8 rounded-2xl space-y-6">
          {/* Deposit Type Toggle */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant={depositType === "eth" ? "default" : "outline"}
              onClick={() => setValue("depositType", "eth")}
              className="flex-1 h-12"
            >
              <Send className="w-4 h-4 mr-2" />
              Deposit ETH
            </Button>
            <Button
              type="button"
              variant={depositType === "erc20" ? "default" : "outline"}
              onClick={() => setValue("depositType", "erc20")}
              className="flex-1 h-12"
            >
              <Coins className="w-4 h-4 mr-2" />
              Deposit ERC20
            </Button>
          </div>

          <input type="hidden" {...register("depositType")} />

          {depositType === "eth" ? (
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
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="tokenAddress">Token Contract Address</Label>
                <Input
                  id="tokenAddress"
                  placeholder="0x..."
                  {...register("tokenAddress")}
                  className="bg-input border-border h-12"
                />
                {errors.tokenAddress && (
                  <p className="text-destructive text-sm">{errors.tokenAddress.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="erc20Amount">Token Amount</Label>
                <Input
                  id="erc20Amount"
                  type="number"
                  step="any"
                  placeholder="100.0"
                  {...register("erc20Amount")}
                  className="bg-input border-border h-12"
                />
                {errors.erc20Amount && (
                  <p className="text-destructive text-sm">{errors.erc20Amount.message}</p>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="recipient">
              Recipient (optional - defaults to your address)
            </Label>
            <Input
              id="recipient"
              placeholder={account || "0x..."}
              {...register("recipient")}
              className="bg-input border-border h-12"
            />
            {errors.recipient && (
              <p className="text-destructive text-sm">{errors.recipient.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !account}
            className="w-full h-14 text-lg bg-gradient-primary hover:opacity-90 glow-effect font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending Deposit...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Deposit to Custody
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