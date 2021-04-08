import {
  UserDbObject,
  ShareRestaurantInput,
  RestaurantDbObject,
  Restaurant,
  User,
  QueryUserArgs,
  UserLoginInput,
  UserLoginOutput
} from './generated/graphql';
import { getToken, encryptPassword, comparePassword } from './util';
import { ObjectID } from 'mongodb';
import { mongoDbProvider } from './mongodb.provider';

import { AuthenticationError } from 'apollo-server';

const mockCurrentUserId = '0123456789abcdef01234567';

// add login/out features following these https://github.com/tharun267/apollo-server-jwt-auth/blob/master/src/resolvers/userResolvers.js
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
      const userId = new ObjectID(id);
      const result = await mongoDbProvider.usersCollection.findOne({
        _id: userId
      });
      return result;
    }
  },
  Mutation: {
    register: async (
      parent,
      { input }: { input: UserLoginInput }
    ): Promise<UserLoginOutput> => {
      console.log(parent, input);
      const newUser = {
        email: input.email,
        password: await encryptPassword(input.password)
      };
      // Check conditions
      const user = await mongoDbProvider.usersCollection.findOne({
        email: input.email
      });

      if (user) {
        throw new AuthenticationError('User Already Exists!');
      }

      const regUser = (await mongoDbProvider.usersCollection.insertOne(newUser))
        .ops[0];
      const token = getToken(regUser);
      return { ...regUser, token };
    },
    login: async (
      parent,
      { input }: { input: UserLoginInput }
    ): Promise<UserLoginOutput> => {
      const user = await mongoDbProvider.usersCollection.findOne({
        email: input.email
      });
      const isMatch = await comparePassword(input.password, user.password);
      if (isMatch) {
        const token = getToken(user);
        return { ...user, token };
      } else {
        throw new AuthenticationError('Wrong Password!');
      }
    },
    likeRestaurant: async (obj, id, context) => {
      console.log(obj, id, context);
      //   const result = await mongoDbProvider.restaurantsCollection.findOneAndUpdate(
      //     {
      //       _id: id
      //     },
      //     {}
      //   );
      return 2;
    },
    shareRestaurant: async (
      obj: Restaurant | RestaurantDbObject,
      { input }: { input: ShareRestaurantInput }
    ): Promise<RestaurantDbObject> => {
      const result = await mongoDbProvider.restaurantsCollection.insertOne({
        name: input.name,
        description: input.description,
        author: new ObjectID(mockCurrentUserId) //should I add user's id from where?
      });

      return result.ops[0] as RestaurantDbObject;
    }
    //   createUser: async (
    //     obj: User | UserDbObject,
    //     { input }: { input: CreateUserInput }
    //   ): Promise<UserDbObject> => {
    //     const result = await mongoDbProvider.usersCollection.insertOne({
    //       firstName: input.firstName,
    //       lastName: input.lastName
    //     });

    //     return result.ops[0] as UserDbObject;
    //   }
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
