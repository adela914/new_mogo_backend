import {
  UserDbObject,
  CreateUserInput,
  ShareRestaurantInput,
  RestaurantDbObject,
  Restaurant,
  User,
  QueryUserArgs
} from './generated/graphql';
import { ObjectID } from 'mongodb';
import { mongoDbProvider } from './mongodb.provider';

const mockCurrentUserId = '0123456789abcdef01234567';

export const resolvers = {
  Query: {
    restaurants: async (): Promise<RestaurantDbObject[]> => {
      const result = await mongoDbProvider.restaurantsCollection
        .find()
        .toArray();

      return result;
    },
    users: async (): Promise<UserDbObject[]> => {
      const result = await mongoDbProvider.usersCollection.find().toArray();

      return result;
    },
    user: async (
      obj: User | UserDbObject,
      { id }: QueryUserArgs
    ): Promise<UserDbObject> => {
      console.log(obj, id);
      const userId = new ObjectID(id);
      const result = await mongoDbProvider.usersCollection.findOne({
        _id: userId
      });
      return result;
    }
  },
  Mutation: {
    shareRestaurant: async (
      obj: Restaurant | RestaurantDbObject,
      { input }: { input: ShareRestaurantInput }
    ): Promise<RestaurantDbObject> => {
      const result = await mongoDbProvider.restaurantsCollection.insertOne({
        name: input.name,
        description: input.description,
        author: new ObjectID(mockCurrentUserId)
      });

      return result.ops[0] as RestaurantDbObject;
    },
    createUser: async (
      obj: User | UserDbObject,
      { input }: { input: CreateUserInput }
    ): Promise<UserDbObject> => {
      const result = await mongoDbProvider.usersCollection.insertOne({
        firstName: input.firstName,
        lastName: input.lastName
      });

      return result.ops[0] as UserDbObject;
    }
  },
  Restaurant: {
    id: (obj: Restaurant | RestaurantDbObject): string =>
      (obj as RestaurantDbObject)._id
        ? (obj as RestaurantDbObject)._id.toString()
        : (obj as Restaurant).id,
    author: async (
      obj: Restaurant | RestaurantDbObject
    ): Promise<User | UserDbObject> =>
      obj.author instanceof ObjectID
        ? (mongoDbProvider.usersCollection.findOne({
            _id: obj.author
          }) as Promise<UserDbObject>)
        : obj.author
  },
  User: {
    id: (obj: User | UserDbObject): string =>
      (obj as UserDbObject)._id
        ? (obj as UserDbObject)._id.toString()
        : (obj as User).id,
    restaurants: (obj: User | UserDbObject): Promise<Restaurant[]> =>
      mongoDbProvider.restaurantsCollection
        .find({
          author: (obj as User).id
            ? new ObjectID((obj as User).id)
            : (obj as UserDbObject)._id
        })
        .toArray()
  }
};

export default resolvers;
