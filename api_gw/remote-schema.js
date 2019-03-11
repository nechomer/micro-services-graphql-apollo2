const { HttpLink } = require('apollo-link-http');
const { ApolloLink } = require('apollo-link');
const { onError } = require('apollo-link-error');
const fetch = require('node-fetch');
const { makeRemoteExecutableSchema, introspectSchema, ApolloError, toApolloError, UserInputError } = require('apollo-server-express');


async function createRemoteSchema({ port, name }) {
    const uri = `http://localhost:${port}/graphql`;
    console.log(`stitching schema for ${name} from ${uri}`);

    const httpLink = new HttpLink({ uri, fetch });
    const schema = await introspectSchema(httpLink);

    // as seen at : https://github.com/apollographql/graphql-tools/issues/1046
    // fixe an issue with message returns as [object object] to client
    const errorLinkFixer = new ApolloLink((operation, forward) => {
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

    const errorLink = onError(({ graphQLErrors, response }) => {
        if (graphQLErrors && graphQLErrors.length === 1) {
        
          response.errors = graphQLErrors.concat(new ApolloError(`stitching schema error from ${name}`));
        //   response.errors = graphQLErrors.map(toApolloError);
        }
        // if (graphQLErrors && graphQLErrors.length) {
        //     console.log('before');
        //     graphQLErrors.forEach(console.error);
        //     console.log('between');
        //     // response.errors = graphQLErrors.map(() => { return new UserInputError('my error', { money: 'not enough'}); });
        //     response.errors = [new UserInputError('my error', { money: 'not enough'})];
        //     response.errors = response.errors.map(toApolloError);
        //     // response.errors = graphQLErrors.map(toApolloError);
        //     response.errors.forEach(console.error);
        //     console.log('after');
        // }
    });

    const link = ApolloLink.from([errorLink, errorLinkFixer, httpLink]);

    const executableSchema = makeRemoteExecutableSchema({
        schema,
        link,
    });

    return executableSchema;
};

module.exports = createRemoteSchema;