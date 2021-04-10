import {
  UserDbObject,
  Restaurant,
  User,
  QueryUserArgs,
  UserLoginInput,
  UserLoginOutput
} from '../generated/graphql';
import { getToken, encryptPassword, comparePassword } from '../util';
import { ObjectID } from 'mongodb';
import { mongoDbProvider } from '../mongodb.provider';

import { AuthenticationError } from 'apollo-server';

// const mockCurrentUserId = '0123456789abcdef01234567';

// add login/out features following these https://github.com/tharun267/apollo-server-jwt-auth/blob/master/src/resolvers/userResolvers.js
const userResolvers = {
  Query: {
    currentUser: (
      parent: User,
      args: QueryUserArgs,
      context: { user: User; loggedIn: boolean }
    ): User => {
      if (context.loggedIn) {
        return context.user;
      } else {
        throw new AuthenticationError('Please Login Again!');
      }
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
      parent: User,
      { input }: { input: UserLoginInput }
    ): Promise<UserLoginOutput> => {
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
      parent: User,
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

export default userResolvers;
