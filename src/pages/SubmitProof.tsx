import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Wallet, AlertCircle } from "lucide-react";
import { useSubstrate } from "@/contexts/SubstrateContext";
import { useWallet } from "@/hooks/use-wallet";
import { stringToU8a } from "@polkadot/util";
const substrateAddressRegex = /^(5[1-9A-HJ-NP-Za-km-z]{47}|0x[a-fA-F0-9]{64})$/;
const proofSchema = z.object({
  proof: z.string().min(1, "Proof is required"),
  accountOffchain: z.string().min(1, "Offchain account is required"),
  accountOnchain: z.string().min(1, "Onchain account is required"),
   accountOnchain: z.string().regex(substrateAddressRegex, "Invalid Substrate address format"),
  offchainName: z.string().min(1, "Offchain name is required"),
  valueOffchain: z.coerce.number().min(0, "Value must be positive"),
  ratio: z.coerce.number().min(1, "Ratio must be at least 1"),
});

type ProofFormData = z.infer<typeof proofSchema>;

const SubmitProof = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { api, isConnected: isSubstrateConnected, error: substrateError } = useSubstrate();
  const { selectedAccount, accounts, connectWallet, isConnecting, error: walletError } = useWallet();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProofFormData>({
    resolver: zodResolver(proofSchema),
    defaultValues: {
      ratio: 50000, // Default ratio: 1 external unit = 50,000 native tokens
    },
  });

  const onSubmit = async (data: ProofFormData) => {
    if (!api) {
      toast.error("Not connected to blockchain", {
        description: "Please wait for the blockchain connection to establish.",
      });
      return;
    }

    if (!selectedAccount) {
      toast.error("No wallet connected", {
        description: "Please connect your wallet to submit a proof.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Debug: Check available pallets
      console.log("Available pallets:", Object.keys(api.tx));

      // Convert string data to Vec<u8> (byte arrays)
      const externalTxId = String(data.proof);
      const externalWallet = String(data.accountOffchain);
      const coinName = String(data.offchainName);

      // Convert external amount to smallest unit (e.g., satoshis for BTC)
      // Assuming 8 decimals like BTC
      const externalAmount = Math.floor(data.valueOffchain * 100000000);

      // Get injector for signing
      const injector = await (await import('@polkadot/extension-dapp')).web3FromAddress(selectedAccount.address);

      // Find the correct pallet name (could be ProofOfReserve or proofOfReserve)
      const palletName = (api.tx as any).ProofOfReserve ? 'ProofOfReserve' : 'proofOfReserve';
      const proofOfReservePallet = (api.tx as any)[palletName];

      if (!proofOfReservePallet) {
        throw new Error(`Pallet not found. Available pallets: ${Object.keys(api.tx).join(', ')}`);
      }

      console.log(`Using pallet: ${palletName}`);

      // Call the request_deposit extrinsic
      const unsub = await proofOfReservePallet
        .requestDeposit(
          data.accountOnchain,     // onchain_account (recipient)
          externalTxId,            // external_tx_id (proof)
          externalWallet,          // external_wallet
          coinName,                // coin_name
          externalAmount,          // external_amount
          data.ratio               // ratio
        )
        .signAndSend(
          selectedAccount.address,
          { signer: injector.signer },
          ({ status, events }) => {
            if (status.isInBlock) {
              console.log(`Transaction included in block hash: ${status.asInBlock}`);

              // Check for errors in events
              events.forEach(({ event }) => {
                if (api.events.system.ExtrinsicFailed.is(event)) {
                  const [dispatchError] = event.data;
                  let errorMsg = 'Transaction failed';

                  if (dispatchError.isModule) {
                    const decoded = api.registry.findMetaError(dispatchError.asModule);
                    errorMsg = `${decoded.section}.${decoded.name}: ${decoded.docs}`;
                  }

                  toast.error("Transaction failed", {
                    description: errorMsg,
                  });
                }
              });
            } else if (status.isFinalized) {
              console.log(`Transaction finalized at block hash: ${status.asFinalized}`);
              toast.success("Proof submitted successfully!", {
                description: "Your proof of reserve has been recorded on-chain.",
              });
              reset();
              unsub();
            }
          }
        );
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error("Failed to submit proof", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
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
            Submit Proof of Reserve
          </h1>
          <p className="text-muted-foreground text-lg">
            Link your offchain assets with onchain verification
          </p>
        </div>

        {/* Connection Status */}
        <div className="mb-6 space-y-3">
          {/* Substrate Connection */}
          <div className={`glass-card p-4 rounded-lg flex items-center justify-between ${isSubstrateConnected ? 'border-green-500/50' : 'border-orange-500/50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isSubstrateConnected ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`} />
              <span className="font-medium">
                {isSubstrateConnected ? 'Connected to Blockchain' : 'Connecting to Blockchain...'}
              </span>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className={`glass-card p-4 rounded-lg flex items-center justify-between ${selectedAccount ? 'border-green-500/50' : 'border-orange-500/50'}`}>
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5" />
              {selectedAccount ? (
                <div>
                  <p className="font-medium">Wallet Connected</p>
                  <p className="text-sm text-muted-foreground">{selectedAccount.address.slice(0, 10)}...{selectedAccount.address.slice(-8)}</p>
                </div>
              ) : (
                <span className="font-medium">No Wallet Connected</span>
              )}
            </div>
            {!selectedAccount && (
              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                variant="outline"
                size="sm"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>

          {/* Error Messages */}
          {(substrateError || walletError) && (
            <div className="glass-card p-4 rounded-lg border-destructive/50 bg-destructive/10">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{substrateError || walletError}</p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-8 rounded-2xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="proof" className="text-foreground font-medium">
              Proof String
            </Label>
            <Input
              id="proof"
              {...register("proof")}
              placeholder="Enter your cryptographic proof"
              className="bg-input border-border h-12"
            />
            {errors.proof && (
              <p className="text-destructive text-sm">{errors.proof.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountOffchain" className="text-foreground font-medium">
              Offchain Account
            </Label>
            <Input
              id="accountOffchain"
              {...register("accountOffchain")}
              placeholder="0x... or account identifier"
              className="bg-input border-border h-12"
            />
            {errors.accountOffchain && (
              <p className="text-destructive text-sm">{errors.accountOffchain.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountOnchain" className="text-foreground font-medium">
              Onchain Account
            </Label>
            <Input
              id="accountOnchain"
              {...register("accountOnchain")}
              placeholder="Substrate address"
              className="bg-input border-border h-12"
            />
            {errors.accountOnchain && (
              <p className="text-destructive text-sm">{errors.accountOnchain.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="offchainName" className="text-foreground font-medium">
              Offchain Name
            </Label>
            <Input
              id="offchainName"
              {...register("offchainName")}
              placeholder="Exchange or custodian name"
              className="bg-input border-border h-12"
            />
            {errors.offchainName && (
              <p className="text-destructive text-sm">{errors.offchainName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="valueOffchain" className="text-foreground font-medium">
              Offchain Value
            </Label>
            <Input
              id="valueOffchain"
              type="number"
              step="0.01"
              {...register("valueOffchain")}
              placeholder="0.00"
              className="bg-input border-border h-12"
            />
            {errors.valueOffchain && (
              <p className="text-destructive text-sm">{errors.valueOffchain.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ratio" className="text-foreground font-medium">
              Exchange Ratio
            </Label>
            <Input
              id="ratio"
              type="number"
              {...register("ratio")}
              placeholder="50000"
              className="bg-input border-border h-12"
            />
            <p className="text-xs text-muted-foreground">
              How many native tokens per external coin unit (e.g., 50000 = 1 BTC = 50,000 tokens)
            </p>
            {errors.ratio && (
              <p className="text-destructive text-sm">{errors.ratio.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 text-lg bg-gradient-primary hover:opacity-90 glow-effect font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Submit Proof
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SubmitProof;
