'use strict';

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient(JSON.parse(process.env.DYNAMO_OPTIONS));

const users = require('../users');
const contents = require('../contents');

const admin = {
  email: 'admin@example.com',
  password: 'password'
};
const user = {
  email: 'test@example.com',
  password: 'password',
};

describe('Contents', () => {
  this.adminToken;
  this.userToken;
  this.anotherUserToken;
  this.contentId;

  before(async () => {
    const loginInfo = admin;
    loginInfo.type = 'login';
    const response = await users.post({
      body: JSON.stringify(admin),
      headers: {
        'x-slsmu-site': 'localhost'
      }
    });
    this.adminToken = JSON.parse(response.body).token;
    if (response.statusCode === 500) {
      throw response.body;
    }
    return;
  });

  before(async () => {
    // Create user first
    const tmp = {
      email: user.email,
      password: user.password,
      userRole: 'user',
      type: 'add'
    };
    await users.post({
      body: JSON.stringify(tmp),
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'x-slsmu-site': 'localhost'
      }
    });
    const loginInfo = user;
    loginInfo.type = 'login';

    const response = await users.post({
      body: JSON.stringify(user),
      headers: {
        'x-slsmu-site': 'localhost'
      }
    });
    this.userToken = JSON.parse(response.body).token;
    if (response.statusCode === 500) {
      throw response.body;
    }
    return;
  });


  before(async () => {
    // Create another user first
    const tmp = {
      email: 'test1@example.com',
      password: 'password',
      userRole: 'user',
      type: 'add'
    };
    await users.post({
      body: JSON.stringify(tmp),
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'x-slsmu-site': 'localhost'
      }
    });
    const response = await users.post({
      body: JSON.stringify({
        email: 'test1@example.com',
        password: 'password',
        type: 'login'
      }),
      headers: {
        'x-slsmu-site': 'localhost'
      }
    });
    this.anotherUserToken = JSON.parse(response.body).token;
    if (response.statusCode === 500) {
      throw response.body;
    }
    return;
  });

  it('should create content', async () => {
    const tmp = {
      contentText: 'This is only a test',
      title: 'Test post',
      contentType: 'post',
      type: 'add'
    };
    const response = await contents.post({
      body: JSON.stringify(tmp),
      headers: {
        'Authorization': `Bearer ${this.userToken}`,
        'x-slsmu-site': 'localhost'
      }
    });
    if (response.statusCode === 500) {
      throw response.body;
    }
    return;
  });

  it('should create private content', async () => {
    const tmp = {
      contentText: 'This is a private a test',
      title: 'Private',
      contentType: 'post',
      type: 'add',
      private: true
    };
    const response = await contents.post({
      body: JSON.stringify(tmp),
      headers: {
        'Authorization': `Bearer ${this.userToken}`,
        'x-slsmu-site': 'localhost'
      }
    });
    if (response.statusCode === 500) {
      throw response.body;
    }
    return;
  });

  it('should not create content (validation error)', async () => {
    const tmp = {
      contentText: 'This is only a test',
      title: 101,
      contentType: 'post',
      type: 'add'
    };
    const response = await contents.post({
      body: JSON.stringify(tmp),
      headers: {
        'Authorization': `Bearer ${this.userToken}`,
        'x-slsmu-site': 'localhost'
      }
    });
    if (response.statusCode !== 500) {
      throw response.body;
    }
    return;
  });

  it('should not list contents as user (not allowed as viewers)', async () => {
    const response = await contents.get({
      queryStringParameters: {
        type: 'list',
        contentType: 'post'
      },
      headers: {
        'Authorization': `Bearer ${this.userToken}`,
        'x-slsmu-site': 'localhost'
      }
    });
    if (response.statusCode !== 500) {
      throw response.body;
    }
    return;
  });

  it('should list contents as admin', async () => {
    const response = await contents.get({
      queryStringParameters: {
        type: 'list',
        contentType: 'post'
      },
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'x-slsmu-site': 'localhost'
      }
    });
    if (response.statusCode === 500) {
      throw response.body;
    }
    this.contentId = JSON.parse(response.body).Items[0].id;
    return;
  });

  it('should list contents as guest', async () => {
    const response = await contents.get({
      queryStringParameters: {
        type: 'list',
        contentType: 'post'
      },
      headers: {
        'x-slsmu-site': 'localhost'
      }
    });
    if (response.statusCode === 500) {
      throw response.body;
    }
    return;
  });

  it('should list private content only', async () => {
    const response = await contents.get({
      queryStringParameters: {
        type: 'list',
        contentType: 'post',
        private: true
      },
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'x-slsmu-site': 'localhost'
      }
    });
    if (response.statusCode === 500) {
      throw response.body;
    }
    for (const content of JSON.parse(response.body).Items) {
      if (content.title === 'Private') {
        throw 'Private content is showed by not allowed user';
      }
    }
    return;
  });

  it('should get content as admin', async () => {
    const response = await contents.get({
      queryStringParameters: {
        id: this.contentId,
        type: 'get',
        contentType: 'post'
      },
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'x-slsmu-site': 'localhost'
      }
    });
    if (response.statusCode === 500) {
      throw response.body;
    }
    return;
  });

  it('should get private content as allowed user', async () => {
    const response = await contents.get({
      queryStringParameters: {
        id: this.contentId,
        type: 'get',
        contentType: 'post'
      },
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'x-slsmu-site': 'localhost'
      }
    });
    if (response.statusCode === 500) {
      throw response.body;
    }
    return;
  });

  it('should not get content as user (not allowed as viewers)', async () => {
    const response = await contents.get({
      queryStringParameters: {
        id: this.contentId,
        type: 'get',
        contentType: 'post'
      },
      headers: {
        'Authorization': `Bearer ${this.userToken}`,
        'x-slsmu-site': 'localhost'
      }
    });
    if (response.statusCode !== 500) {
      throw response.body;
    }
    return;
  });

  it('should get content as guest', async () => {
    const response = await contents.get({
      queryStringParameters: {
        id: this.contentId,
        type: 'get',
        contentType: 'post'
      },
      headers: {
        'x-slsmu-site': 'localhost'
      }
    });
    if (response.statusCode === 500) {
      throw response.body;
    }
    return;
  });

  it('should update content', async () => {
    const tmp = {
      id: this.contentId,
      contentText: 'This is only a test',
      title: 'Test post',
      contentType: 'post',
      type: 'update'
    };
    const response = await contents.post({
      body: JSON.stringify(tmp),
      headers: {
        'Authorization': `Bearer ${this.userToken}`,
        'x-slsmu-site': 'localhost'
      }
    });
    if (response.statusCode === 500) {
      throw response.body;
    }
    return;
  });

  it('should not delete as guest', async () => {
    const response = await contents.get({
      queryStringParameters: {
        type: 'delete',
        id: this.contentId,
        contentType: 'post'
      },
      headers: {
        'x-slsmu-site': 'localhost'
      }
    });
    if (response.statusCode !== 500) {
      throw response.body;
    }
    return;
  });

  it('should not delete as not owner or admin', async () => {
    const response = await contents.get({
      queryStringParameters: {
        type: 'delete',
        id: this.contentId,
        contentType: 'post'
      },
      headers: {
        'Authorization': `Bearer ${this.anotherUserToken}`,
        'x-slsmu-site': 'localhost'
      }
    });
    if (response.statusCode !== 500) {
      throw response.body;
    }
    return;
  });

  it('should delete as owner', async () => {
    const response = await contents.get({
      queryStringParameters: {
        type: 'delete',
        id: this.contentId,
        contentType: 'post'
      },
      headers: {
        'Authorization': `Bearer ${this.userToken}`,
        'x-slsmu-site': 'localhost'
      }
    });
    if (response.statusCode === 500) {
      throw response.body;
    }
    return;
  });

  after(async () => {
    const TableNameUser = `${process.env.DB_PREFIX}users`;
    // Clean all
    await dynamodb.delete({
      TableName: TableNameUser,
      Key: {
        email: user.email
      }
    }).promise();
    await dynamodb.delete({
      TableName: TableNameUser,
      Key: {
        email: 'test1@example.com'
      }
    }).promise();
    return;
  });
});
