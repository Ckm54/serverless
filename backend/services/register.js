import * as aws from 'aws-sdk';
import util from '../utils/util';
import bcrypt from 'bcryptjs';

aws.config.update({
  region: 'ap-northeast-1'
});

const dynamodb = new aws.DynamoDB.DocumentClient();
const usersTable = 'test-users';

async function register(userInfo) {
  const name = userInfo.name;
  const email = userInfo.email;
  const username = userInfo.username;
  const password = userInfo.password;

  if(!username || !name || !email || !password) {
    return util.buildResponse(401, {
      message: "All fields are required"
    })
  }

  const dynamoUser = await getUser(username);
  if(dynamoUser && dynamoUser.username){
    return util.buildResponse(401, {
      message: "Username already exists in our database. Please choose a different username"
    })
  }

  const encryptedPassword = bcrypt.hashSync(password.trim(), 10);
  const user = {
    name: name,
    email: email,
    username: username.toLowerCase().trim(),
    password: encryptedPassword
  }

  const saveUserResponse = await saveUser(user);

  if(!saveUserResponse) {
    return util.buildResponse(503, {
      message: "Server error! Please try again later"
    })
  }

  return util.buildResponse(200, {
    username: username
  })
}

async function getUser(username) {
  const params = {
    TableName: usersTable,
    Key: {
      username: username
    }
  }

  return await dynamodb.get(params).promise().then(response => {
    return response.Item;
  }, error => {
    console.log("There was an error getting user: ", error)
  })
}

async function saveUser(user) {
  const params = {
    TableName: usersTable,
    Item: user
  }

  return await dynamodb.put(params).promise().then(() => {
    return true;
  }, error => console.log("An error occurred saving user: ", error))
}

module.exports.register = register