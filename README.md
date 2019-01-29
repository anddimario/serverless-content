Multisite cms on aws lambda+dynamodb+s3

### Features
- serverless
- multiple site backend
- manage users, contents and images

### Requirements
- nodejs > 8
- [serverless](https://serverless.com/) > 1
- For fe: `npm install -g webpack-dev-server`

### Run on localhost
```
npm i
export AWS_REGION='localhost'
export DB_PREFIX='localhost_'
export SITE='localhost'
cp config.example.js config.js
sls offline start
```

### Run fe on localhost
```
cd client
npm i
npm run dev
```

### Build fe
This command build in `dist/`
```
cd client
npm run build
```

### API docs
```
npm run doc
```

### Create an admin
- `node scripts/superUser SITE ADMIN_EMAIL ADMIN_PASSWORD`
**NOTE** You need env variables, based on region

### User curl examples
- update user (admin)
```
curl -H "Authorization: Bearer MY_TOKEN" --data '{"type":"update","fullname":"test","email":"..."}' -H "Content-Type: application/json" http://localhost:3000/users
```
- update password (admin)
```
curl -H "Authorization: Bearer MY_TOKEN" --data '{"type":"update-password","newpassword":"...","email":"..."}' -H "Content-Type: application/json" http://localhost:3000/users
```
- update password
```
curl -H "Authorization: Bearer MY_TOKEN" --data '{"type":"update-password","newpassword":"..."}' -H "Content-Type: application/json" http://localhost:3000/users
```
- update me
```
curl -H "Authorization: Bearer MY_TOKEN" --data '{"type":"update","fullname":"test"}' -H "Content-Type: application/json" http://localhost:3000/users
```
- delete user (admin)
```
curl -H "Authorization: Bearer MY_TOKEN" "http://localhost:3000/users?type=delete&email=test@example.com"
```
- users list (admin)
```
curl -H "Authorization: Bearer MY_TOKEN" "http://localhost:3000/users?type=list"
```
- user info (admin)
```
curl -H "Authorization: Bearer MY_TOKEN" "http://localhost:3000/users?email=test@example.com&type=get"
```
- user info (owner)
```
curl -H "Authorization: Bearer MY_TOKEN" "http://localhost:3000/users?type=me"
```

### Contents
You can add contents in different table (default is `contents` that it's defined in `serverless.yaml`). In `config.example.js` there's an example of contents definition. `viewers` is an array of roles that specified the roles that can read the content, if `guest` role is specified, this allow not authenticated users.

### Contents curl example TODO rifare con apidoc
- add content
```
curl -H "Authorization: Bearer MY_TOKEN" --data '{"type":"add","contentText":"This is only a test","title":"Test post","contentType":"post"}' -H "Content-Type: application/json" http://localhost:3000/contents
```
- get content
```
curl -H "Authorization: Bearer MY_TOKEN" http://localhost:3000/contents?id=content-id&type=get&contentType=post
```
- delete content
```
curl -H "Authorization: Bearer MY_TOKEN" http://localhost:3000/contents?id=content-id&type=delete&contentType=post
```
- list contents
```
curl -H "Authorization: Bearer MY_TOKEN" http://localhost:3000/contents?type=get&contentType=post
```
- update content
```
curl -H "Authorization: Bearer MY_TOKEN" --data '{"type":"update","contentText":"This is only a test","title":"Test post","contentType":"post","id":"...."}' -H "Content-Type: application/json" http://localhost:3000/contents
```

### Validation
Validations use `ajv`, you can add validators on config.js, then add in your code as: `validation(ref, data)`. For each contents, in definitions there's a `fields` value, an array with the fields in body that must insert in dynamo.

### Tests
```
export AWS_REGION='localhost'
export DB_PREFIX='localhost_'
export SITE='localhost'
sls dynamodb start --migrate &
node scripts/superUser localhost admin@example.com password
npm run test
```
**NOTE** Tests assume that use dynamodb inmemory, so there's no after hooks to remove data

### Todo
- complete fe
- password recovery
- image manager on s3
- test deploy on aws and docs about it

### Thanks
FE login/registration: http://jasonwatmore.com/post/2018/07/14/vue-vuex-user-registration-and-login-tutorial-example
