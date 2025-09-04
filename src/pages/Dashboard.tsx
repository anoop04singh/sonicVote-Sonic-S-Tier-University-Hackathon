import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/context/WalletContext";
import { Link } from "react-router-dom";

const mockVoteHistory = [
  {
    id: 3,
    title: "DAO Treasury Allocation",
    yourVote: "Option A: Invest in new protocols",
    date: "2024-07-25",
    status: "Ended",
  },
  {
    id: 1,
    title: "Community Governance Vote",
    yourVote: "Mobile App Development",
    date: "2024-08-01",
    status: "Active",
  },
];

const Dashboard = () => {
  const { address } = useWallet();

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
          <p className="font-mono">{address}</p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle>Voting History</CardTitle>
          <CardDescription>A record of all elections you've participated in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Election</TableHead>
                <TableHead>Your Vote</TableHead>
                <TableHead>Date Voted</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockVoteHistory.map((vote) => (
                <TableRow key={vote.id}>
                  <TableCell className="font-medium">
                    <Link to={`/election/${vote.id}`} className="hover:underline text-primary">
                      {vote.title}
                    </Link>
                  </TableCell>
                  <TableCell>{vote.yourVote}</TableCell>
                  <TableCell>{vote.date}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={vote.status === 'Active' ? 'default' : 'secondary'}>
                      {vote.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;