import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/context/WalletContext";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { ELECTION_FACTORY_ADDRESS, ELECTION_FACTORY_ABI, ELECTION_ABI } from "@/contracts";
import { fetchFromIPFS } from "@/lib/ipfs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";

const Dashboard = () => {
  const { address, provider } = useWallet();
  const [votingHistory, setVotingHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVotingHistory = async () => {
      if (!provider || !address) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const factoryContract = new ethers.Contract(ELECTION_FACTORY_ADDRESS, ELECTION_FACTORY_ABI, provider);
        const electionAddresses = await factoryContract.getDeployedElections();

        const historyPromises = electionAddresses.map(async (electionAddress: string) => {
          try {
            const electionContract = new ethers.Contract(electionAddress, ELECTION_ABI, provider);
            const hasVoted = await electionContract.voters(address);

            if (hasVoted) {
              const details = await electionContract.getElectionDetails();
              const onChainData = {
                address: electionAddress,
                status: Number(details[1]),
                electionType: Number(details[2]),
                endDate: details[3],
                metadataURI: details[4],
              };
              const ipfsHash = onChainData.metadataURI.replace('ipfs://', '');
              const metadata = await fetchFromIPFS(ipfsHash);
              return { ...onChainData, ...metadata };
            }
            return null;
          } catch (e) {
            console.error(`Failed to process election ${electionAddress}:`, e);
            return null;
          }
        });

        const historyData = (await Promise.all(historyPromises)).filter(e => e !== null);
        setVotingHistory(historyData.reverse());
      } catch (error) {
        console.error("Failed to fetch voting history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVotingHistory();
  }, [provider, address]);

  const getEffectiveStatus = (status: number, endDate: number) => {
    const nowInSeconds = Date.now() / 1000;
    if (status === 1 && nowInSeconds > endDate) {
      return 2; // Mark as Ended
    }
    return status;
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1: return <Badge variant="default">Active</Badge>;
      case 2: return <Badge variant="secondary">Ended</Badge>;
      case 0: return <Badge variant="outline">Upcoming</Badge>;
      default: return <Badge variant="destructive">Unknown</Badge>;
    }
  };

  const getElectionTypeLabel = (type: number) => {
    const types = ["Simple Majority", "Quadratic", "Ranked-Choice", "Cumulative"];
    return types[type] || "Unknown";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">My Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back! Here's an overview of your voting activity.
        </p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Wallet Address</p>
          <p className="font-mono break-all">{address || "Not connected"}</p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle>Voting History</CardTitle>
          <CardDescription>A record of all elections you've participated in.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : votingHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Election</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {votingHistory.map((vote) => {
                  const effectiveStatus = getEffectiveStatus(vote.status, Number(vote.endDate));
                  return (
                    <TableRow key={vote.address}>
                      <TableCell className="font-medium">
                        <Link to={`/election/${vote.address}`} className="hover:underline text-primary">
                          {vote.title}
                        </Link>
                      </TableCell>
                      <TableCell>{getElectionTypeLabel(vote.electionType)}</TableCell>
                      <TableCell className="text-right">
                        {getStatusBadge(effectiveStatus)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState 
              title="No Voting History"
              description="You haven't participated in any elections yet. Find an active election to cast your vote!"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;