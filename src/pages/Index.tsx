import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, ArrowRight, Users, Clock, Vote } from "lucide-react";
import { CreateElectionModal } from "@/components/modals/CreateElectionModal";
import { useWallet } from "@/context/WalletContext";
import { elections } from "@/data/mockElections";

const ElectionCard = ({ election }: { election: typeof elections[0] }) => {
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-900/50 text-green-300 border border-green-700/60';
      case 'Ended':
        return 'bg-gray-700/50 text-gray-300 border border-gray-600/60';
      case 'Upcoming':
        return 'bg-blue-900/50 text-blue-300 border border-blue-700/60';
      default:
        return '';
    }
  };

  const getElectionTypeLabel = (type: string) => {
    switch (type) {
      case 'Simple Majority': return 'Simple Majority';
      case 'Quadratic': return 'Quadratic';
      case 'Ranked-Choice': return 'Ranked-Choice';
      case 'Cumulative': return 'Cumulative';
      default: return type;
    }
  };

  return (
    <Card className="flex flex-col bg-card/50 backdrop-blur-sm border-0 transition-all duration-300 hover:bg-card/75 hover:scale-105 hover:shadow-lg hover:shadow-primary/10">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{election.title}</CardTitle>
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusChip(election.status)}`}>
            {election.status}
          </span>
        </div>
        <CardDescription>{election.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Vote className="h-4 w-4" />
            <span>{getElectionTypeLabel(election.type)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{election.voters} Voters</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Ends: {new Date(election.endDate).toLocaleDateString()}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="secondary" className="w-full group">
          <Link to={`/election/${election.id}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

const Index = () => {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const { isConnected } = useWallet();

  const filteredElections = (status: string) => elections.filter(e => e.status === status);

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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredElections("Active").map((election) => (
                  <ElectionCard key={election.id} election={election} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="upcoming">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredElections("Upcoming").map((election) => (
                  <ElectionCard key={election.id} election={election} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="ended">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredElections("Ended").map((election) => (
                  <ElectionCard key={election.id} election={election} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <CreateElectionModal isOpen={isCreateModalOpen} onOpenChange={setCreateModalOpen} />
    </>
  );
};

export default Index;