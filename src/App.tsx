import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { WalletProvider } from "./context/WalletContext";
import { AnimatedRoutes } from "./components/AnimatedRoutes";
import { ApolloProvider } from "@apollo/client/react";
import { client } from "./lib/apollo";

const App = () => (
  <ApolloProvider client={client}>
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
  </ApolloProvider>
);

export default App;