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
    likeRestaurant: async (obj, { restaurantId }) => {
      const result = await mongoDbProvider.restaurantsCollection.findOneAndUpdate(
        {
          _id: new ObjectID(restaurantId)
        },
        { $inc: { likes: 1 } },
        { returnOriginal: false, upsert: true }
      );

      return result.value;
    },
    updateRestaurant: async (obj, { input }) => {
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
      { input }: { input: ShareRestaurantInput }
    ): Promise<RestaurantDbObject> => {
      const result = await mongoDbProvider.restaurantsCollection.insertOne({
        name: input.name,
        description: input.description,
        likes: 0,
        location: input.location,
        author: new ObjectID(mockCurrentUserId) //should I add user's id from where?
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
