import { Coins, TrendingUp, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data
const mockBalance = {
  total: "1,234.56",
  verified: "1,200.00",
  pending: "34.56",
};

const mockAssets = [
  { name: "Bitcoin", symbol: "BTC", balance: "0.5234", value: "$23,456.78" },
  { name: "Ethereum", symbol: "ETH", balance: "12.3456", value: "$21,234.56" },
  { name: "Polkadot", symbol: "DOT", balance: "1250.00", value: "$8,750.00" },
  { name: "USDT", symbol: "USDT", balance: "5000.00", value: "$5,000.00" },
];

const mockTransactions = [
  {
    id: "1",
    type: "Proof Submitted",
    asset: "BTC",
    amount: "0.1234",
    status: "Verified",
    timestamp: "2025-10-25 14:30:22",
  },
  {
    id: "2",
    type: "Reserve Updated",
    asset: "ETH",
    amount: "5.6789",
    status: "Verified",
    timestamp: "2025-10-25 12:15:08",
  },
  {
    id: "3",
    type: "Proof Submitted",
    asset: "DOT",
    amount: "500.00",
    status: "Pending",
    timestamp: "2025-10-25 10:45:33",
  },
  {
    id: "4",
    type: "Reserve Updated",
    asset: "USDT",
    amount: "1000.00",
    status: "Verified",
    timestamp: "2025-10-24 18:20:15",
  },
];

const Assets = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-2 gradient-text">Asset Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Monitor your reserves and transaction history
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-3xl font-bold gradient-text">${mockBalance.total}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-3xl font-bold text-accent">${mockBalance.verified}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-muted/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-foreground">${mockBalance.pending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assets Table */}
        <div className="glass-card p-8 rounded-2xl mb-12">
          <h2 className="text-2xl font-bold mb-6">Your Assets</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Asset</TableHead>
                  <TableHead className="text-muted-foreground">Symbol</TableHead>
                  <TableHead className="text-muted-foreground">Balance</TableHead>
                  <TableHead className="text-right text-muted-foreground">Value (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAssets.map((asset) => (
                  <TableRow key={asset.symbol} className="border-border hover:bg-muted/20">
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>
                      <span className="px-3 py-1 rounded-full bg-primary/20 text-primary font-medium">
                        {asset.symbol}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono">{asset.balance}</TableCell>
                    <TableCell className="text-right font-semibold">{asset.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="glass-card p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-6">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Asset</TableHead>
                  <TableHead className="text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-muted-foreground">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTransactions.map((tx) => (
                  <TableRow key={tx.id} className="border-border hover:bg-muted/20">
                    <TableCell className="font-medium">{tx.type}</TableCell>
                    <TableCell>
                      <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                        {tx.asset}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono">{tx.amount}</TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full font-medium ${
                          tx.status === "Verified"
                            ? "bg-accent/20 text-accent"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground font-mono">
                      {tx.timestamp}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assets;
