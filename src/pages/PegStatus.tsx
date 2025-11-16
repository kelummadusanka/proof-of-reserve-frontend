import { Coins, RefreshCw, Clock } from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { ethers } from "ethers";

// ✅ ADD THIS
import { connectToSubstrate } from "@/services/substrate"; // adjust path if needed

const CONTRACT_ADDRESS = "0x964A2ce75AB6A70E95C7D47FBe2cc954B04C0E69";

const PegStatus = () => {
  const [totalReserve, setTotalReserve] = useState<number>(0);

  // ❗ REPLACE your hardcoded 1250 with this — UI unchanged
  const [circulation, setCirculation] = useState<number>(1250);

  // -------------------------
  // Load ETH custody balance
  // -------------------------
  useEffect(() => {
    const loadBalance = async () => {
      if (!window.ethereum) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          ["function custodyWallet() view returns (address)"],
          provider
        );
        const custodyWallet: string = await contract.custodyWallet();
        const balance = await provider.getBalance(custodyWallet);
        setTotalReserve(parseFloat(ethers.formatEther(balance)));
      } catch (err) {
        console.error("Failed to load custody ETH balance", err);
      }
    };

    loadBalance();
  }, []);

  // ----------------------------------------
  // ✅ Load Substrate multiCoin.totalSupply(0)
  // ----------------------------------------
  useEffect(() => {
    const loadCirculation = async () => {
      try {
        const api = await connectToSubstrate();
        if (!api) return;

        // multiCoin.totalSupply(CoinId=0)
        const supply = await api.query.multiCoin.totalSupply(0);

        const supplyNumber = Number(supply.toString());
        setCirculation(supplyNumber/1000000000000000000);
      } catch (err) {
        console.error("Failed to load total supply", err);
      }
    };

    loadCirculation();
  }, []);

  // peg ratio computation (unchanged)
  const pegRatio = useMemo(() => {
    const ratio = (totalReserve / circulation) * 100;
    return ratio.toFixed(2);
  }, [totalReserve, circulation]);

  const pegStatus =
    pegRatio >= 99
      ? { color: "green", label: "Fully backed — Peg is stable" }
      : pegRatio >= 95
      ? { color: "yellow", label: "Slight deviation — Monitor reserves" }
      : { color: "red", label: "Unpegged — Action required" };

  return (
    // 🔥 Your UI below stays 100% identical
    // -----------------------------------------------------
    <div className="min-h-[calc(100vh-80px)] py-12 px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-5 gradient-text">Peg Status</h1>
          <p className="text-muted-foreground text-lg">
            Monitor the health of your asset peg in real time
          </p>
        </div>

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
              <span className="font-medium">{pegStatus.label}</span>
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

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Total Reserve ETH */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Coins className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reserves</p>
                <p className="text-3xl font-bold text-accent">
                  {totalReserve.toFixed(4)} ETH
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Total ETH in custody wallet backing circulation.
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

          {/* Circulation Supply — UI unchanged */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Circulation Supply</p>
                {/* ❗ This stays EXACTLY as you had it */}
                <p className="text-3xl font-bold text-accent">
                  ${circulation.toLocaleString()}
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
