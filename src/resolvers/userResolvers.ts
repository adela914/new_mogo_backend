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

const userResolvers = {
  Query: {
    currentUser: async (
      parent: User,
      args: QueryUserArgs,
      context: { user: UserDbObject; loggedIn: boolean }
    ): Promise<UserDbObject> => {
      if (context.loggedIn) {
        const userId = new ObjectID(context.user._id);
        const result = await mongoDbProvider.usersCollection.findOne({
          _id: userId
        });
        return result;
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
      //TODO: Check conditions
      const user = await mongoDbProvider.usersCollection.findOne({
        email: input.email
      });

      if (user) {
        throw new AuthenticationError('User Already Exists!');
      }

      const newUser = {
        email: input.email,
        password: await encryptPassword(input.password)
      };

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
  },
  // when Graphql schema is User
  User: {
    id: (obj: User | UserDbObject): string => {
      return (obj as UserDbObject)._id
        ? (obj as UserDbObject)._id.toString()
        : (obj as User).id;
    },
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
