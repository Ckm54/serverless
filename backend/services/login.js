import * as aws from 'aws-sdk';
import util from '../utils/util';
import bcrypt from 'bcryptjs';
import auth from '../utils/auth'
import { getUser } from './register';

aws.config.update({
  region: 'ap-northeast-1'
});

const dynamodb = new aws.DynamoDB.DocumentClient();
const usersTable = 'test-users';

async function login(user) {
  const username = user.username;
  const password = user.password;
  if(!user || !username || !password) {
    return util.buildResponse(401, {
      message: "username and password required"
    })
  }

  const dynamoUser = await getUser(username.toLowercase().trim());

  if(!dynamoUser || !dynamoUser.username) {
    return util.buildResponse(403, {
      message: "user does not exist"
    })
  }

  if(!bcrypt.compareSync(password, dynamoUser.password)) {
    return util.buildResponse(403, {
      message: "Password is incorrect"
    })
  }

  const userInfo = {
    username: dynamoUser.username,
    name: dynamoUser.name
  }

  const token = auth.generateToken(userInfo)

  const response = {
    user: userInfo,
    token: token
  }
  return util.buildResponse(200, response)
}

module.exports.login = login;