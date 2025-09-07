import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useWallet } from "@/context/WalletContext";
import { Link } from "react-router-dom";
import { fetchFromIPFS } from "@/lib/ipfs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useQuery, gql } from "@apollo/client";

const GET_VOTING_HISTORY = gql`
  query GetVotingHistory($voterAddress: Bytes!) {
    votes(where: { voter: $voterAddress }, orderBy: timestamp, orderDirection: desc) {
      id
      ipfsURI
      timestamp
      election {
        id
        metadataURI
        startDate
        endDate
        electionType
      }
    }
  }
`;

const Dashboard = () => {
  const { address } = useWallet();
  const [votingHistory, setVotingHistory] = useState<any[]>([]);
  const { loading: isLoading, data: subgraphData } = useQuery(GET_VOTING_HISTORY, {
    variables: { voterAddress: address?.toLowerCase() },
    skip: !address,
  });

  useEffect(() => {
    if (subgraphData?.votes) {
      const fetchMetadata = async () => {
        const historyWithMetadata = await Promise.all(
          subgraphData.votes.map(async (vote: any) => {
            try {
              const electionIpfsHash = vote.election.metadataURI.replace('ipfs://', '');
              const electionMetadata = await fetchFromIPFS(electionIpfsHash);

              const voteIpfsHash = vote.ipfsURI.replace('ipfs://', '');
              const voteData = await fetchFromIPFS(voteIpfsHash);

              return {
                ...vote,
                address: vote.election.id,
                title: electionMetadata.title,
                electionType: vote.election.electionType,
                startDate: vote.election.startDate,
                endDate: vote.election.endDate,
                voteData,
              };
            } catch (e) {
              console.error(`Failed to load metadata for vote ${vote.id}:`, e);
              return { ...vote, title: "Error loading details" };
            }
          })
        );
        setVotingHistory(historyWithMetadata);
      };
      fetchMetadata();
    }
  }, [subgraphData]);

  const getEffectiveStatus = (startDate: number, endDate: number) => {
    const nowInSeconds = Date.now() / 1000;
    if (nowInSeconds >= endDate) return 2; // Ended
    if (nowInSeconds < startDate) return 0; // Upcoming
    return 1; // Active
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1: return <Badge variant="default">Active</Badge>;
      case 2: return <Badge variant="secondary">Ended</Badge>;
      case 0: return <Badge variant="outline">Upcoming</Badge>;
      default: return <Badge variant="destructive">Unknown</Badge>;
    }
  };

  const formatVoteData = (voteData: any) => {
    if (!voteData) return "N/A";
    if (voteData.selectedOption) {
      return `Selected: "${voteData.selectedOption}"`;
    }
    if (voteData.votes) {
      return `Distributed votes: ${Object.entries(voteData.votes)
        .map(([option, count]) => `${option}: ${count} votes`)
        .join(', ')}`;
    }
    if (voteData.ranks) {
      return `Ranked: ${voteData.ranks.map((rank: string, index: number) => `${index + 1}. ${rank}`).join(', ')}`;
    }
    return "Could not parse vote data.";
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
          <CardDescription>A record of all elections you've participated in. Click the arrow to expand for details.</CardDescription>
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right w-[100px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {votingHistory.map((vote) => {
                  const effectiveStatus = getEffectiveStatus(Number(vote.startDate), Number(vote.endDate));
                  return (
                    <Collapsible asChild key={vote.address}>
                      <>
                        <TableRow>
                          <TableCell className="font-medium">
                            <Link to={`/election/${vote.address}`} className="hover:underline text-primary">
                              {vote.title}
                            </Link>
                          </TableCell>
                          <TableCell>{vote.electionType}</TableCell>
                          <TableCell>{getStatusBadge(effectiveStatus)}</TableCell>
                          <TableCell className="text-right">
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-9 p-0">
                                <ChevronDown className="h-4 w-4" />
                                <span className="sr-only">Toggle details</span>
                              </Button>
                            </CollapsibleTrigger>
                          </TableCell>
                        </TableRow>
                        <CollapsibleContent asChild>
                          <TableRow>
                            <TableCell colSpan={4} className="p-0">
                              <div className="p-4 bg-muted/30">
                                <h4 className="font-semibold mb-2 text-sm">Your Vote Details</h4>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <p>{formatVoteData(vote.voteData)}</p>
                                  <div className="flex items-center gap-2">
                                    <span>IPFS CID:</span>
                                    <a 
                                      href={`https://gateway.pinata.cloud/ipfs/${vote.ipfsURI.replace('ipfs://', '')}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="font-mono text-xs text-primary hover:underline flex items-center"
                                    >
                                      {vote.ipfsURI.replace('ipfs://', '').substring(0, 20)}...
                                      <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
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