'use strict';
const AWS = require('aws-sdk');
const crypto = require('crypto');
const { promisify } = require('util');
const authorize = require('./libs/authorize');
const config = require('./config');

const dynamodb = new AWS.DynamoDB.DocumentClient(config.DYNAMO);

const pbkdf2 = promisify(crypto.pbkdf2);
const randomBytes = promisify(crypto.randomBytes);

module.exports.post = async (event, context) => {
  try {
    console.log(event)
    const authorized = await authorize(event);
    if (!authorized.auth) {
      throw 'Not authorized';
    }

    const response = {
      statusCode: 200,
    };
    const body = JSON.parse(event.body);
    switch (body.type) {
      case 'add':
        if (authorized.user.userRole === 'admin') {
          // create a password
          const len = 128;
          const iterations = 4096;
          let salt = await randomBytes(len);
          salt = salt.toString('base64');

          const derivedKey = await pbkdf2(body.password, salt, iterations, len, 'sha512');
          const hash = derivedKey.toString('base64');

          await dynamodb.put({
            TableName: 'users',
            Item: {
              email: body.email,
              userRole: 'user',
              salt,
              password: hash
            }
          }).promise();
          response.body = JSON.stringify({
            message: true
          });
        } else {
          throw 'Not authorized';
        }
        break;
      default:
        throw 'Undefined method'
    }

    return response;

  } catch (e) {
    console.log(e)
    const response = {
      statusCode: 500,
      body: JSON.stringify({
        message: e.toString()
      }),
    };

    return response;

  }
};

module.exports.get = async (event, context) => {
  try {
    console.log(event)
    const authorized = await authorize(event);
    console.log(authorized)
    if (!authorized.auth) {
      throw 'Not authorized';
    }

    const response = {
      statusCode: 200,
    };
    switch (event.queryStringParameters.type) {
      case 'get':
        if (authorized.user.userRole === 'admin') {
          const user = await dynamodb.get({
            TableName: 'users',
            Key: {
              email: event.queryStringParameters.email
            }
          }).promise();
          response.body = JSON.stringify(user.Item);
        } else {
          throw 'Not authorized';
        }
        break;
      case 'me':
          const user = await dynamodb.get({
            TableName: 'users',
            Key: {
              email: authorized.user.email
            }
          }).promise();
          delete user.Item.password;
          delete user.Item.salt;
          response.body = JSON.stringify(user.Item);
        break;
      case 'list':
        if (authorized.user.userRole === 'admin') {
          const users = await dynamodb.scan({
            TableName: 'users',
            ProjectionExpression: 'email, userRole'
          }).promise();
          response.body = JSON.stringify(users.Items);
        } else {
          throw 'Not authorized';
        }
        break;
      case 'delete':
        if (authorized.user.userRole === 'admin') {
          await dynamodb.delete({
            TableName: 'users',
            Key: {
              email: event.queryStringParameters.email
            }
          }).promise();
          response.body = JSON.stringify({
            message: true
          });
        } else {
          throw 'Not authorized';
        }
        break;
      default:
        throw 'Undefined method'
    }
    return response;

  } catch (e) {
    console.log(e)
    const response = {
      statusCode: 500,
      body: JSON.stringify({
        message: e.toString()
      }),
    };

    return response;

  }
};
