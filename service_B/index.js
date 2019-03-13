const express = require('express');
const { ApolloServer, gql, UserInputError } = require('apollo-server-express');

const port = 4002;

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type CompanyB {
    employeeB: EmployeeB
  }
  type EmployeeB {
    name: String
  }
  type Query {
    helloFromB: String
    companyBWithApolloError: CompanyB
    companyBWithDeepApolloError: CompanyB
  }
`;

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    helloFromB: () => 'Hello world!',
    companyBWithApolloError: () => { throw new UserInputError('apollo error from depth 0', { invalidArgs: [ { name: "invalid name" } ] });},
    companyBWithDeepApolloError: () => ({}), //return empty object
  },
  CompanyB: {
    employeeB: (src) => { throw new UserInputError('apollo error from depth 1', { invalidArgs: [ { name: "invalid name" } ] });},
  }
};

const formatError = (error) => {
  console.error(error);
  return error;
};

const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError,
});


server.applyMiddleware({ app });

app.listen({ port }, () =>
  console.log(`🚀 Service B is ready at http://localhost:${port}/graphql`),
);
