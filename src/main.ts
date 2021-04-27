import { UserDbObject } from './generated/graphql';
import { ApolloServer } from 'apollo-server';
import { DIRECTIVES } from '@graphql-codegen/typescript-mongodb';
import { environment } from './environment';
import { addMockUsersAsync, mongoDbProvider } from './mongodb.provider';
import * as typeDefs from './type-defs.graphql';
import resolvers from './resolvers/index';
import { getPayload } from './util';

(async function bootstrapAsync(): Promise<void> {
  await mongoDbProvider.connectAsync(environment.mongoDb.databaseName);
  await addMockUsersAsync(); // TODO: Remove in PROD.

  const server = new ApolloServer({
    resolvers,
    typeDefs: [DIRECTIVES, typeDefs],
    introspection: environment.apollo.introspection,
    // mockEntireSchema: false, // TODO: Remove in PROD.
    // mocks: true, // TODO: Remove in PROD.
    playground: environment.apollo.playground,
    context: ({ req }): { user: UserDbObject; loggedIn: boolean } => {
      // get the user token from the headers
      const token = req.headers.authorization || '';
      // try to retrieve a user with the token
      const { payload: user, loggedIn } = getPayload(token);

      // add the user to the context
      return { user, loggedIn };
    }
  });

  server
    .listen(environment.port)
    .then(({ url }) => console.log(`Server ready at ${url}. `))
    .catch((errors) => console.log(errors));

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => server.stop());
  }
})();
