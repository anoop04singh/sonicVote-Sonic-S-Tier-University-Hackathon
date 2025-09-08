import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const httpLink = new HttpLink({
  uri: "https://api.studio.thegraph.com/query/120348/sonic-vote/version/latest",
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});