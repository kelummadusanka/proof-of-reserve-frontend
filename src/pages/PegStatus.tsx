import { Coins, RefreshCw, Clock } from "lucide-react";
import { useMemo } from "react";
import { Progress } from "@/components/ui/progress"; // from shadcn/ui

// Mock data
const mockBalance = {
  total: 1250, // total reserves
  circulation: 1250, // total circulating tokens
};

const PegStatus = () => {
  // Compute peg ratio
  const pegRatio = useMemo(() => {
    const ratio = (mockBalance.total / mockBalance.circulation) * 100;
    return Math.min(ratio, 100).toFixed(2);
  }, []);

  // Determine color and text for peg health
  const pegStatus =
    pegRatio >= 99
      ? {
          color: "green",
          label: "Fully backed — Peg is stable",
        }
      : pegRatio >= 95
      ? {
          color: "yellow",
          label: "Slight deviation — Monitor reserves",
        }
      : {
          color: "red",
          label: "Unpegged — Action required",
        };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-6">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-5 gradient-text">Peg Status</h1>
          <p className="text-muted-foreground text-lg">
            Monitor the health of your asset peg in real time
          </p>
        </div>

        {/* Peg Health Card */}
        <div className="mb-8 space-y-3">
          <div
            className={`glass-card p-4 rounded-lg flex items-center justify-between border ${
              pegStatus.color === "green"
                ? "border-green-500/50"
                : pegStatus.color === "yellow"
                ? "border-yellow-500/50"
                : "border-red-500/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full animate-pulse ${
                  pegStatus.color === "green"
                    ? "bg-green-500"
                    : pegStatus.color === "yellow"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              />
              <span className="font-medium">
                {pegStatus.label}
              </span>
            </div>
            <span
              className={`text-sm font-semibold ${
                pegStatus.color === "green"
                  ? "text-green-500"
                  : pegStatus.color === "yellow"
                  ? "text-yellow-500"
                  : "text-red-500"
              }`}
            >
              {pegRatio}%
            </span>
          </div>
        </div>

        {/* Peg Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Total Reserves */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Coins className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reserves</p>
                <p className="text-3xl font-bold text-accent">
                  ${mockBalance.total.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Total verified on-chain reserves backing circulation.
            </p>
          </div>

          {/* Peg Ratio */}
          <div className="glass-card p-6 rounded-2xl text-center flex flex-col justify-center">
            <div className="flex justify-center mb-3">
              <RefreshCw
                className={`w-7 h-7 ${
                  pegStatus.color === "green"
                    ? "text-green-500"
                    : pegStatus.color === "yellow"
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}
              />
            </div>
            <h3 className="text-xl font-semibold mb-2">Peg Ratio</h3>
            <p
              className={`text-3xl font-bold ${
                pegStatus.color === "green"
                  ? "text-green-500"
                  : pegStatus.color === "yellow"
                  ? "text-yellow-500"
                  : "text-red-500"
              }`}
            >
              {pegRatio}%
            </p>
            <div className="mt-4">
              <Progress value={pegRatio} className="h-2" />
            </div>
          </div>

          {/* Circulation Supply */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Circulation Supply</p>
                <p className="text-3xl font-bold text-accent">
                  ${mockBalance.circulation.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Total tokens currently circulating on-chain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PegStatus;
