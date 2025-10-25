import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

const proofSchema = z.object({
  proof: z.string().min(1, "Proof is required"),
  accountOffchain: z.string().min(1, "Offchain account is required"),
  accountOnchain: z.string().min(1, "Onchain account is required"),
  offchainName: z.string().min(1, "Offchain name is required"),
  valueOffchain: z.coerce.number().min(0, "Value must be positive"),
});

type ProofFormData = z.infer<typeof proofSchema>;

const SubmitProof = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProofFormData>({
    resolver: zodResolver(proofSchema),
  });

  const onSubmit = async (data: ProofFormData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    console.log("Proof submitted:", data);
    toast.success("Proof submitted successfully!", {
      description: "Your proof of reserve has been recorded on-chain.",
    });
    
    setIsSubmitting(false);
    reset();
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
