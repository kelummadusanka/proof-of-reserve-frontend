import { Listing } from "@/types/listing";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AnimatedResource, getResourceType } from "@/components/AnimatedResource";
import { ArrowRightLeft, Clock, Wallet, Sparkles } from "lucide-react";

interface NFTListingCardProps {
  listing: Listing;
}

export function NFTListingCard({ listing }: NFTListingCardProps) {
  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const resourceType = getResourceType(listing.offered_resource.name);

  return (
    <div className="group relative rounded-2xl overflow-hidden hover-lift gradient-border">
      {/* Card Content */}
      <div className="relative bg-card rounded-2xl overflow-hidden">
        {/* Animated Resource Section */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-background via-card to-background">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <AnimatedResource type={resourceType} />
          </div>
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-90" />
          
          {/* Status Badge */}
          <div className="absolute top-4 left-4 z-10">
            <StatusBadge status={listing.status} />
          </div>
          
          {/* ID Badge */}
          <div className="absolute top-4 right-4 z-10">
            <span className="px-3 py-1.5 rounded-full glass text-xs font-mono text-muted-foreground border border-border">
              #{listing.id.slice(2, 8)}
            </span>
          </div>
          
          {/* Floating Offer Preview */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="glass rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Offering
                </span>
              </div>
              <p className="text-lg font-bold truncate">{listing.offered_resource.name}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-gradient">
                  {listing.offered_resource.quantity}
                </span>
                <span className="text-sm text-muted-foreground">
                  {listing.offered_resource.unit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-5 space-y-4">
          {/* Trade Arrow */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="p-2 rounded-full bg-primary/10 animate-pulse">
              <ArrowRightLeft className="w-4 h-4 text-primary" />
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* Desired Resources */}
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
              Looking For
            </span>
            {listing.desired_resources.length > 0 ? (
              <div className="space-y-2">
                {listing.desired_resources.slice(0, 2).map((resource, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <span className="font-medium text-sm">{resource.name}</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-primary">{resource.quantity}</span>
                      <span className="text-xs text-muted-foreground">{resource.unit}</span>
                    </div>
                  </div>
                ))}
                {listing.desired_resources.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{listing.desired_resources.length - 2} more options
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 text-center">
                <p className="text-sm text-primary font-medium">Open to Offers</p>
                <p className="text-xs text-muted-foreground mt-1">Make your best offer</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="w-3.5 h-3.5" />
              <code className="font-mono">{truncateAddress(listing.owner)}</code>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono">#{listing.created_at.toLocaleString()}</span>
            </div>
          </div>

          {/* Deposit Indicator */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10">
            <span className="text-xs text-muted-foreground">Deposit Locked</span>
            <span className="font-bold font-mono text-sm">{listing.deposit}</span>
          </div>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-2xl" />
      </div>
    </div>
  );
}
