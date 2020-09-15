### Chatbot VTEX AWS Lambda

#### Basic configuration

```
git clone https://github.com/jovsky/chatbot-vtex-lambda.git
```
```
npm install
```
#### Required libraries
```
serverless
```
### Environment configuration
#### 1. Install serverless as global
```
npm install -g serverless
```
#### 2. Create secret key in AWS account
```
- Sign in to your AWS account 
- Go to AWS console
- Click on services tab
- Click on IAM
- Click on users
- Create new user
- Click on security credentials
- Create new access key to obtain the secret
```
#### 3. Setting config in your terminal
```
serverless config credentials --provider aws --key <key> --secret <secret>
```
#### 4. Deploy the bot service
```
sls deploy
```
