import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Sparkles, Zap } from "lucide-react";
import { CreateListingInput, Resource } from "@/types/listing";
import { toast } from "@/hooks/use-toast";

interface CreateListingFormProps {
  onSubmit: (listing: CreateListingInput) => void;
}

const emptyResource: Resource = {
  name: "",
  quantity: "",
  unit: "",
  metadata: "",
};

export function CreateListingForm({ onSubmit }: CreateListingFormProps) {
  const [offeredResource, setOfferedResource] = useState<Resource>({ ...emptyResource });
  const [desiredResources, setDesiredResources] = useState<Resource[]>([]);
  const [deposit, setDeposit] = useState("");

  const addDesiredResource = () => {
    setDesiredResources([...desiredResources, { ...emptyResource }]);
  };

  const removeDesiredResource = (index: number) => {
    setDesiredResources(desiredResources.filter((_, i) => i !== index));
  };

  const updateDesiredResource = (index: number, field: keyof Resource, value: string) => {
    const updated = [...desiredResources];
    updated[index] = { ...updated[index], [field]: value };
    setDesiredResources(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!offeredResource.name || !offeredResource.quantity) {
      toast({
        title: "Validation Error",
        description: "Offered resource name and quantity are required",
        variant: "destructive",
      });
      return;
    }

    onSubmit({
      offered_resource: offeredResource,
      desired_resources: desiredResources.filter(r => r.name && r.quantity),
      deposit,
    });

    // Reset form
    setOfferedResource({ ...emptyResource });
    setDesiredResources([]);
    setDeposit("");
    
    toast({
      title: "Listing Created",
      description: "Your barter listing has been submitted to the chain",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Create New Listing</h2>
        <p className="text-muted-foreground mt-2">
          Define your barter offer with Rust-compatible types
        </p>
      </div>

      {/* Offered Resource */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <Label className="text-base font-semibold">What You're Offering</Label>
            <p className="text-xs text-muted-foreground font-mono">Resource&lt;BoundedString&gt;</p>
          </div>
        </div>

        <div className="glass rounded-xl p-6 space-y-4 border border-border">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="offer-name" className="text-xs text-muted-foreground">
                name
              </Label>
              <Input
                id="offer-name"
                value={offeredResource.name}
                onChange={(e) => setOfferedResource({ ...offeredResource, name: e.target.value })}
                placeholder="e.g., DOT Token"
                className="bg-secondary/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offer-qty" className="text-xs text-muted-foreground">
                quantity (u128)
              </Label>
              <Input
                id="offer-qty"
                value={offeredResource.quantity}
                onChange={(e) => setOfferedResource({ ...offeredResource, quantity: e.target.value })}
                placeholder="e.g., 1000000000000"
                className="bg-secondary/50 border-border font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="offer-unit" className="text-xs text-muted-foreground">
                unit
              </Label>
              <Input
                id="offer-unit"
                value={offeredResource.unit}
                onChange={(e) => setOfferedResource({ ...offeredResource, unit: e.target.value })}
                placeholder="e.g., planck"
                className="bg-secondary/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offer-meta" className="text-xs text-muted-foreground">
                metadata (optional)
              </Label>
              <Input
                id="offer-meta"
                value={offeredResource.metadata}
                onChange={(e) => setOfferedResource({ ...offeredResource, metadata: e.target.value })}
                placeholder="Optional metadata"
                className="bg-secondary/50 border-border"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desired Resources */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div>
              <Label className="text-base font-semibold">What You Want</Label>
              <p className="text-xs text-muted-foreground font-mono">BoundedVec&lt;Resource&gt;</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDesiredResource}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Resource
          </Button>
        </div>

        {desiredResources.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-center">
            <Sparkles className="w-8 h-8 text-primary/50 mx-auto mb-3" />
            <p className="text-sm font-medium">No specific requirements</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your listing will be open to any offers
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {desiredResources.map((resource, index) => (
              <div
                key={index}
                className="glass rounded-xl p-4 border border-border relative group"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDesiredResource(index)}
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className="grid grid-cols-2 gap-3 pr-10">
                  <Input
                    value={resource.name}
                    onChange={(e) => updateDesiredResource(index, "name", e.target.value)}
                    placeholder="Resource name"
                    className="bg-secondary/50 border-border"
                  />
                  <Input
                    value={resource.quantity}
                    onChange={(e) => updateDesiredResource(index, "quantity", e.target.value)}
                    placeholder="Quantity"
                    className="bg-secondary/50 border-border font-mono"
                  />
                  <Input
                    value={resource.unit}
                    onChange={(e) => updateDesiredResource(index, "unit", e.target.value)}
                    placeholder="Unit"
                    className="bg-secondary/50 border-border"
                  />
                  <Input
                    value={resource.metadata || ""}
                    onChange={(e) => updateDesiredResource(index, "metadata", e.target.value)}
                    placeholder="Metadata (optional)"
                    className="bg-secondary/50 border-border"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deposit */}
      <div className="space-y-4">
        <Label htmlFor="deposit" className="text-base font-semibold">
          Deposit Amount
          <span className="ml-2 text-xs text-muted-foreground font-mono">Balance</span>
        </Label>
        <Input
          id="deposit"
          value={deposit}
          onChange={(e) => setDeposit(e.target.value)}
          placeholder="e.g., 10000000000"
          className="bg-secondary/50 border-border font-mono text-lg"
        />
        <p className="text-xs text-muted-foreground">
          Required deposit to create the listing (returned on completion)
        </p>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity glow-purple"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Create Listing
      </Button>
    </form>
  );
}
