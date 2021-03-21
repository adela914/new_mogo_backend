import { ApolloServer } from 'apollo-server';

import { environment } from './environment';
import { addMockUsersAsync, mongoDbProvider } from './mongodb.provider';
import * as typeDefs from './type-defs.graphql';

(async function bootstrapAsync(): Promise<void> {
  await mongoDbProvider.connectAsync(environment.mongoDb.databaseName);
  await addMockUsersAsync(); // TODO: Remove in PROD.

  const server = new ApolloServer({
    typeDefs,
    introspection: environment.apollo.introspection,
    mockEntireSchema: false, // TODO: Remove in PROD.
    mocks: true, // TODO: Remove in PROD.
    playground: environment.apollo.playground
  });

  server
    .listen(environment.port)
    .then(({ url }) => console.log(`Server ready at ${url}. `));

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(async () => {
      server.stop();
      await mongoDbProvider.closeAsync();
    });
  }
})();
