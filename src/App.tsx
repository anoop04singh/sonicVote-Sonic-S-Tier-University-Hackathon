import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { WalletProvider } from "./context/WalletContext";
import { AnimatedRoutes } from "./components/AnimatedRoutes";
import { ApolloProvider } from "@apollo/client";
import { client } from "./lib/apollo";

const queryClient = new QueryClient();

const App = () => (
  <ApolloProvider client={client}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WalletProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <AnimatedRoutes />
            </Layout>
          </BrowserRouter>
        </WalletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ApolloProvider>
);

export default App;