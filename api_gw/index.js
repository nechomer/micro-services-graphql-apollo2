const express = require('express');
const { ApolloServer, gql, UserInputError, makeExecutableSchema, mergeSchemas } = require('apollo-server-express');

// const { makeExecutableSchema, mergeSchemas } = require('graphql-tools');
const createRemoteSchema = require('./remote-schema');


const port = 4000;

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Object {
      name: String
  }

  type Query {
    hello: String
    objectWithApolloError: Object
    objectWithDeepApolloError: Object
  }
`;

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    hello: () => 'Hello world!',
    objectWithApolloError: () => { throw new UserInputError('apollo error from depth 0', { invalidArgs: [ { name: "invalid name" } ] }) },
    objectWithDeepApolloError: () => ({})
  },
  Object: {
      name: () => { throw new UserInputError('apollo error from depth 1', { invalidArgs: [ { name: "invalid name" } ] }) },
  }
};

const myGraphQLSchema = makeExecutableSchema({
    typeDefs,
    resolvers,
});

const formatError = (error) => {
    console.error(error);
    return error;
};

const app = express();

app.listen({ port }, () =>
  console.log(`🚀 API GW Service is ready at http://localhost:${port}/graphql`),
);

(async () => {
    const serviceASchema = await createRemoteSchema({ port: 4001, name: 'service A' });
    const serviceBSchema = await createRemoteSchema({ port: 4002, name: 'service B' });
    const schema = mergeSchemas({
        schemas: [
            myGraphQLSchema,
            serviceASchema,
            serviceBSchema
        ],
    });

    const server = new ApolloServer({
        schema,
        formatError,
      });
      
      server.applyMiddleware({ app });

    console.log(`🚀 API GW Service Playground is ready at http://localhost:${port}/graphql`);
})();
