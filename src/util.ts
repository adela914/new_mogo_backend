import { UserDbObject } from './generated/graphql';
import jwt = require('jsonwebtoken');
import bcrypt = require('bcryptjs');

const secret = process.env.SECRET;

export const encryptPassword = (password: string): Promise<boolean> =>
  new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        reject(err);
        return false;
      }
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
          return false;
        }
        resolve(hash);
        return true;
      });
    });
  });

export const comparePassword = (
  password: string,
  hash: string
): Promise<boolean> =>
  new Promise((resolve, reject) => {
    try {
      const isMatch = bcrypt.compare(password, hash);
      resolve(isMatch);
      return true;
    } catch (err) {
      reject(err);
      return false;
    }
  });

export const getToken = (payload: string | Buffer): string => {
  const token = jwt.sign(payload, secret, {
    expiresIn: 604800 // 1 Week
  });
  return token;
};

export const getPayload = (
  token: string
): { loggedIn: boolean; payload?: UserDbObject } => {
  try {
    const payload = jwt.verify(token, secret) as UserDbObject;
    return { loggedIn: true, payload };
  } catch (err) {
    // Add Err Message
    return { loggedIn: false };
  }
};
