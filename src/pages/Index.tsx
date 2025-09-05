import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, ArrowRight, Users, Clock, Vote, Activity, Archive } from "lucide-react";
import { CreateElectionModal } from "@/components/modals/CreateElectionModal";
import { useWallet } from "@/context/WalletContext";
import { ethers } from "ethers";
import { ELECTION_FACTORY_ADDRESS, ELECTION_FACTORY_ABI, ELECTION_ABI } from "@/contracts";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { fetchFromIPFS } from "@/lib/ipfs";
import { motion } from "framer-motion";
import { AnimatedCounter } from "@/components/AnimatedCounter";

const ElectionCard = ({ election, index }: { election: any, index: number }) => {
  const getStatusChip = (status: number) => {
    switch (status) {
      case 1: // Active
        return 'bg-green-900/50 text-green-300 border border-green-700/60';
      case 2: // Ended
        return 'bg-gray-700/50 text-gray-300 border border-gray-600/60';
      case 0: // Upcoming
        return 'bg-blue-900/50 text-blue-300 border border-blue-700/60';
      default:
        return '';
    }
  };

  const getElectionTypeLabel = (type: number) => {
    const types = ["Simple Majority", "Quadratic", "Ranked-Choice", "Cumulative"];
    return types[type] || "Unknown";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="flex flex-col h-full bg-card/50 backdrop-blur-sm border-0 transition-all duration-300 hover:bg-card/75 hover:scale-105 hover:shadow-lg hover:shadow-primary/10">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>{election.title || "Loading..."}</CardTitle>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusChip(election.status)}`}>
              {["Upcoming", "Active", "Ended"][election.status]}
            </span>
          </div>
          <CardDescription>{election.description || "Fetching details from IPFS."}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Vote className="h-4 w-4" />
              <span>{getElectionTypeLabel(election.electionType)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{election.totalVoters.toString()} Voters</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Ends: {new Date(Number(election.endDate) * 1000).toLocaleDateString()}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild variant="secondary" className="w-full group">
            <Link to={`/election/${election.address}`}>
              View Details <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const Index = () => {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const { isConnected, provider } = useWallet();
  const [elections, setElections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchElections = async () => {
      if (!provider) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const factoryContract = new ethers.Contract(ELECTION_FACTORY_ADDRESS, ELECTION_FACTORY_ABI, provider);
        const electionAddresses = await factoryContract.getDeployedElections();

        const electionsDataPromises = electionAddresses.map(async (address: string) => {
          try {
            const electionContract = new ethers.Contract(address, ELECTION_ABI, provider);
            const details = await electionContract.getElectionDetails();
            
            const onChainData = {
              address,
              creator: details[0],
              status: Number(details[1]),
              electionType: Number(details[2]),
              endDate: details[3],
              metadataURI: details[4],
              totalVoters: details[5],
            };

            const ipfsHash = onChainData.metadataURI.replace('ipfs://', '');
            const metadata = await fetchFromIPFS(ipfsHash);

            return { ...onChainData, ...metadata };
          } catch (e) {
            console.error(`Failed to load election ${address}:`, e);
            return null;
          }
        });

        const electionsData = (await Promise.all(electionsDataPromises)).filter(e => e !== null);
        setElections(electionsData.reverse());
      } catch (error) {
        console.error("Failed to fetch elections:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchElections();
  }, [provider]);

  const filteredElections = (status: number) => elections.filter(e => e.status === status);

  const renderSkeletons = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="flex flex-col bg-card/50 backdrop-blur-sm border-0">
          <CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full mt-2" /></CardHeader>
          <CardContent className="space-y-4"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/3" /></CardContent>
          <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
        </Card>
      ))}
    </div>
  );

  const totalElections = elections.length;
  const activeElections = elections.filter(e => e.status === 1).length;
  const totalVotes = elections.reduce((sum, election) => sum + Number(election.totalVoters), 0);

  return (
    <>
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="text-center pt-16 pb-16 md:pt-24 md:pb-20">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-br from-primary to-red-500 bg-clip-text text-transparent animate-gradient-x"
          >
            SonicVote
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground"
          >
            A decentralized, transparent, and secure voting platform built on the Sonic blockchain. Create, manage, and participate in elections with confidence.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            <div className="mt-8 flex justify-center gap-4">
              {isConnected && (
                <button className="animated-hero-button" onClick={() => setCreateModalOpen(true)}>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create Election
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Platform Metrics */}
        {!isLoading && elections.length > 0 && (
          <motion.div 
            className="w-full max-w-4xl mx-auto grid gap-8 md:grid-cols-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Archive className="h-4 w-4" />
                <span>Total Elections</span>
              </div>
              <p className="text-4xl font-bold mt-1">
                <AnimatedCounter to={totalElections} />
              </p>
              <p className="text-xs text-muted-foreground">All elections created on the platform.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>Active Elections</span>
              </div>
              <p className="text-4xl font-bold mt-1">
                <AnimatedCounter to={activeElections} />
              </p>
              <p className="text-xs text-muted-foreground">Currently open for voting.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Total Votes Cast</span>
              </div>
              <p className="text-4xl font-bold mt-1">
                <AnimatedCounter to={totalVotes} />
              </p>
              <p className="text-xs text-muted-foreground">Total votes across all elections.</p>
            </div>
          </motion.div>
        )}

        {/* Elections List */}
        <div>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="ended">Ended</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              {isLoading ? renderSkeletons() : (
                filteredElections(1).length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredElections(1).map((election, index) => <ElectionCard key={election.address} election={election} index={index} />)}
                  </div>
                ) : (
                  <EmptyState 
                    title="No Active Elections"
                    description="There are currently no active elections. Check back later or create a new one!"
                  />
                )
              )}
            </TabsContent>
            <TabsContent value="upcoming">
              {isLoading ? renderSkeletons() : (
                filteredElections(0).length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredElections(0).map((election, index) => <ElectionCard key={election.address} election={election} index={index} />)}
                  </div>
                ) : (
                  <EmptyState 
                    title="No Upcoming Elections"
                    description="There are no elections scheduled to start soon."
                  />
                )
              )}
            </TabsContent>
            <TabsContent value="ended">
              {isLoading ? renderSkeletons() : (
                filteredElections(2).length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredElections(2).map((election, index) => <ElectionCard key={election.address} election={election} index={index} />)}
                  </div>
                ) : (
                  <EmptyState 
                    title="No Past Elections"
                    description="There is no history of completed elections yet."
                  />
                )
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <CreateElectionModal isOpen={isCreateModalOpen} onOpenChange={setCreateModalOpen} />
    </>
  );
};

export default Index;