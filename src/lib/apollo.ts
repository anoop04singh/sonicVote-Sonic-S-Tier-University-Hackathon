import { ApolloClient, InMemoryCache } from "@apollo/client";

export const client = new ApolloClient({
  uri: "https://api.studio.thegraph.com/query/120348/sonic-vote/0.1",
  cache: new InMemoryCache(),
});