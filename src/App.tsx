import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SubstrateProvider } from "@/contexts/SubstrateContext";
import Index from "./pages/Index";
import Assets from "./pages/Assets";
import PegStatus from "./pages/PegStatus";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SubstrateProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navbar />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/pegstatus" element={<PegStatus />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </SubstrateProvider>
  </QueryClientProvider>
);

export default App;
