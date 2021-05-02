import {
  UserDbObject,
  ShareRestaurantInput,
  RestaurantDbObject,
  Restaurant,
  User,
  QueryRestaurantArgs,
  UpdateRestaurantInput
} from '../generated/graphql';
import { ObjectID } from 'mongodb';
import { mongoDbProvider } from '../mongodb.provider';
import { AuthenticationError } from 'apollo-server';

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
      { loggedIn }: { user: UserDbObject; loggedIn: boolean }
    ): Promise<RestaurantDbObject> => {
      if (!loggedIn) return;
      const result = await mongoDbProvider.restaurantsCollection.findOneAndUpdate(
        {
          _id: new ObjectID(restaurantId)
        },
        { $inc: { likes: 1 } },
        {
          returnOriginal: false,
          upsert: false
        } /* upsert false to prevent creating doc when non existing res */
      );

      return result.value;
    },
    updateRestaurant: async (
      obj: Restaurant | RestaurantDbObject,
      { input }: { input: UpdateRestaurantInput },
      { user }: { user: UserDbObject }
    ): Promise<RestaurantDbObject> => {
      const resId = new ObjectID(input.id);
      const { author } = await mongoDbProvider.restaurantsCollection.findOne({
        _id: resId
      });

      if (author === user._id) {
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
      } else {
        throw new AuthenticationError('Only author can update it!');
      }
    },
    shareRestaurant: async (
      obj: Restaurant | RestaurantDbObject,
      { input }: { input: ShareRestaurantInput },
      { loggedIn, user }: { user: UserDbObject; loggedIn: boolean }
    ): Promise<RestaurantDbObject> => {
      if (!loggedIn) throw new AuthenticationError('Please Login First!🙅🏻‍♀️');

      const result = await mongoDbProvider.restaurantsCollection.insertOne({
        name: input.name,
        description: input.description, // can removed if it's optional
        location: input.location,
        author: new ObjectID(user._id)
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
    ): Promise<User | UserDbObject> => {
      return obj.author instanceof ObjectID
        ? ((await mongoDbProvider.usersCollection.findOne({
            _id: new ObjectID(obj.author)
          })) as Promise<UserDbObject>)
        : obj.author;
    }
  }
};

export default restaurantResolvers;
