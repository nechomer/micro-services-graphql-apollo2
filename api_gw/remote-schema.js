const { HttpLink } = require('apollo-link-http');
const { ApolloLink } = require('apollo-link');
const fetch = require('node-fetch');
const { makeRemoteExecutableSchema, introspectSchema } = require('apollo-server-express');


async function createRemoteSchema({ port, name }) {
    const uri = `http://localhost:${port}/graphql`;
    console.log(`stitching schema for ${name} from ${uri}`);

    // as seen at : https://github.com/apollographql/graphql-tools/issues/1046
    // fixe an issue with message returns as [object object] to client
    const errorLink = new ApolloLink((operation, forward) => {
        return forward(operation).map(data => {
            if(data.errors) {
                for(const error of data.errors) {
                    if(!(error instanceof Error))
                    Object.setPrototypeOf(error, Error.prototype);
                }
            }
      
            return data;
        });
    });
    const httpLink = new HttpLink({ uri, fetch });
    const schema = await introspectSchema(httpLink);

    const link = errorLink.concat(httpLink);
    // const link = httpLink;

    const executableSchema = makeRemoteExecutableSchema({
        schema,
        link,
    });

    return executableSchema;
};

module.exports = createRemoteSchema;