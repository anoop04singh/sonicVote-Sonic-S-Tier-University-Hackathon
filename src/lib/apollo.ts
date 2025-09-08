import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const GRAPH_API_KEY = import.meta.env.VITE_GRAPH_API_KEY;

if (!GRAPH_API_KEY) {
  console.error("VITE_GRAPH_API_KEY is not set. Please add it to your .env.local file.");
}

const httpLink = new HttpLink({
  uri: `https://gateway.thegraph.com/api/${GRAPH_API_KEY}/subgraphs/id/DhHm4E3T5YNhT6VxubamJCU8bAFNL48SkeRtamLvEt9p`,
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});