import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, ArrowRight, Users, Clock, Vote } from "lucide-react";
import { CreateElectionModal } from "@/components/modals/CreateElectionModal";
import { useWallet } from "@/context/WalletContext";
import { elections as mockElections } from "@/data/mockElections"; // For metadata simulation
import { ethers } from "ethers";
import { ELECTION_FACTORY_ADDRESS, ELECTION_FACTORY_ABI, ELECTION_ABI } from "@/contracts";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";

const ElectionCard = ({ election }: { election: any }) => {
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
    <Card className="flex flex-col bg-card/50 backdrop-blur-sm border-0 transition-all duration-300 hover:bg-card/75 hover:scale-105 hover:shadow-lg hover:shadow-primary/10">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{election.title}</CardTitle>
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusChip(election.status)}`}>
            {["Upcoming", "Active", "Ended"][election.status]}
          </span>
        </div>
        <CardDescription>{election.description}</CardDescription>
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

        const electionsData = await Promise.all(
          electionAddresses.map(async (address: string, index: number) => {
            const electionContract = new ethers.Contract(address, ELECTION_ABI, provider);
            const details = await electionContract.getElectionDetails();
            
            const mockMeta = mockElections[index % mockElections.length];
            
            return {
              address,
              creator: details[0],
              status: Number(details[1]),
              electionType: Number(details[2]),
              endDate: details[3],
              metadataURI: details[4],
              totalVoters: details[5],
              title: mockMeta.title,
              description: mockMeta.description,
              options: mockMeta.options,
            };
          })
        );
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

  return (
    <>
      <div className="space-y-16">
        {/* Hero Section */}
        <div className="text-center py-16 md:py-24">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-br from-primary to-red-500 bg-clip-text text-transparent animate-gradient-x">
            SonicVote
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            A decentralized, transparent, and secure voting platform built on the Sonic blockchain. Create, manage, and participate in elections with confidence.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            {isConnected && (
              <button className="animated-hero-button group" onClick={() => setCreateModalOpen(true)}>
                <div className="flex items-center">
                  <PlusCircle className="mr-2 h-5 w-5 transition-colors duration-500 group-hover:text-background z-10 relative" />
                  <span className="button-content" data-text="Create Election">Create Election</span>
                </div>
              </button>
            )}
          </div>
        </div>

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
                    {filteredElections(1).map((election) => <ElectionCard key={election.address} election={election} />)}
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
                    {filteredElections(0).map((election) => <ElectionCard key={election.address} election={election} />)}
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
                    {filteredElections(2).map((election) => <ElectionCard key={election.address} election={election} />)}
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