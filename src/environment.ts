const defaultPort = 4000;

interface Environment {
  apollo: {
    introspection: boolean;
    playground: boolean;
  };
  mongoDb: {
    databaseName: string;
    url: string;
  };
  port: number | string;
}

export const environment: Environment = {
  apollo: {
    introspection: true, // TODO: Set false in PROD.
    playground: true // TODO: Set false in PROD.
  },
  mongoDb: {
    databaseName: process.env.MONGODB_DB_NAME || 'newMogo',
    url:
      process.env.MONGODB_CONNECTION_STRING ||
      process.env.MONGODB_URL ||
      'mongodb://localhost/mogoDB'
  },
  port: process.env.PORT || defaultPort
};
