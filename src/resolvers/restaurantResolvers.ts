import { UpdateRestaurantInput } from './../generated/graphql';
import {
  UserDbObject,
  ShareRestaurantInput,
  RestaurantDbObject,
  Restaurant,
  User,
  QueryRestaurantArgs
} from '../generated/graphql';
import { ObjectID } from 'mongodb';
import { mongoDbProvider } from '../mongodb.provider';

const mockCurrentUserId = '0123456789abcdef01234567';

// add login/out features following these https://github.com/tharun267/apollo-server-jwt-auth/blob/master/src/resolvers/userResolvers.js
const restaurantResolvers = {
  Query: {
    restaurants: async (): Promise<RestaurantDbObject[]> => {
      const result = await mongoDbProvider.restaurantsCollection
        .find()
        .toArray();

      return result;
    },
    restaurant: async (
      obj: Restaurant | RestaurantDbObject,
      { id }: QueryRestaurantArgs
    ): Promise<RestaurantDbObject> => {
      const resId = new ObjectID(id);
      const result = await mongoDbProvider.restaurantsCollection.findOne({
        _id: resId
      });
      return result;
    }
  },
  Mutation: {
    likeRestaurant: async (
      obj: Restaurant | RestaurantDbObject,
      { restaurantId }: { restaurantId: string },
      { loggedIn }: { loggedIn: boolean }
    ): Promise<RestaurantDbObject> => {
      if (!loggedIn) return;
      const result = await mongoDbProvider.restaurantsCollection.findOneAndUpdate(
        {
          _id: new ObjectID(restaurantId)
        },
        { $inc: { likes: 1 } },
        { returnOriginal: false, upsert: false } // upsert false to prevent creating doc when non existing res
      );

      return result.value;
    },
    updateRestaurant: async (
      obj: Restaurant | RestaurantDbObject,
      { input }: { input: UpdateRestaurantInput }
    ): Promise<RestaurantDbObject> => {
      //TODO: add auth, only user who shared the res can update it.

      const result = await mongoDbProvider.restaurantsCollection.findOneAndUpdate(
        {
          _id: new ObjectID(input.id)
        },
        {
          $set: {
            name: input.name,
            description: input.description,
            location: input.location
          }
        },
        { returnOriginal: false, upsert: true }
      );

      return result.value;
    },
    shareRestaurant: async (
      obj: Restaurant | RestaurantDbObject,
      { input }: { input: ShareRestaurantInput },
      { loggedIn }: { loggedIn: boolean }
    ): Promise<RestaurantDbObject> => {
      if (!loggedIn) return;

      const result = await mongoDbProvider.restaurantsCollection.insertOne({
        name: input.name,
        description: input.description,
        likes: 0,
        location: input.location,
        author: new ObjectID(mockCurrentUserId) //TODO: should I add user's id from where?
      });

      return result.ops[0] as RestaurantDbObject;
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
  }
};

export default restaurantResolvers;
