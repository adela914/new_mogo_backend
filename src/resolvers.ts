import { UserDbObject, CreateUserInput } from './generated/graphql';
// import { ObjectID } from 'mongodb';
import { mongoDbProvider } from './mongodb.provider';

// const mockCurrentUserId = '0123456789abcdef01234567';

export const resolvers = {
  Mutation: {
    createUser: async (
      obj: any,
      { input }: { input: CreateUserInput }
    ): Promise<UserDbObject> => {
      const result = await mongoDbProvider.usersCollection.insertOne({
        firstName: input.firstName,
        lastName: input.lastName
      });

      return result.ops[0] as UserDbObject;
    }
  }
};

export default resolvers;
