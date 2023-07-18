import { Collection, Db, MongoClient, ObjectID } from 'mongodb';

import { environment } from './environment';

export class MongoDbProvider {
  private database?: Db;
  private mongoClient: MongoClient;

  constructor(url: string) {
    this.mongoClient = new MongoClient(url, {
      useUnifiedTopology: true,
      useNewUrlParser: true
    });
  }

  get restaurantsCollection(): Collection {
    const restaurantsCollection = this.getCollection('restaurants');

    if (!restaurantsCollection) {
      throw new Error('Restaurants collection is undefined');
    }

    return restaurantsCollection;
  }

  get usersCollection(): Collection {
    const usersCollection = this.getCollection('users');

    if (!usersCollection) {
      throw new Error('Users collection is undefined');
    }

    return usersCollection;
  }

  /**
   * Connect to MongoDB.
   * @async
   * @param databaseName - Database name.
   */
  async connectAsync(databaseName: string): Promise<void> {
    await this.mongoClient.connect();
    this.database = this.mongoClient.db(databaseName);
  }

  /**
   * Close the database and its underlying connections.
   */
  async closeAsync(): Promise<void> {
    await this.mongoClient.close();
  }

  /**
   * Fetch a specific collection.
   * @private
   * @param collectionName - Collection name.
   * @returns The collection instance.
   */
  private getCollection(collectionName: string): Collection {
    if (!this.database) {
      throw new Error('Database is undefined.');
    }

    return this.database.collection(collectionName);
  }
}

export const mongoDbProvider = new MongoDbProvider(environment.mongoDb.url);

/**
 * Add mock users if `users` collection is empty.
 * TODO: Remove in Production.
 */
export async function addMockUsersAsync(): Promise<void> {
  const usersCount = await mongoDbProvider.usersCollection.countDocuments();
  if (usersCount === 0) {
    await mongoDbProvider.usersCollection.insertMany([
      {
        _id: new ObjectID('0123456789abcdef01234567'),
        name: 'Test',
        description: 'User 1'
      },
      {
        _id: new ObjectID('fedcba987654321098765432'),
        name: 'Test',
        description: 'User 2'
      }
    ]);
  }
}
