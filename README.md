# Express Router for Typescript
Allows us to write express routers in typescript way (class-based, typesafe and asyncronous). It's a pluggable library so it's totally compatible with legacy codes, not enforcing application to use its styles.

This simple:
```typescript
class UserRouter extends ExpressRouter {
	@GET({path: '/'})
	async getUsers() {
		return await UserModel.find().toArray()
	}
	
	@POST({path: '/'})
	async addUsers(@Body() user: IUser) {
		if (!isValidEmail(user.email)) throw new AppLogicError('Invalid email format', 400)
		
		const dupUser = await UserModel.findOne({email: user.email});
		if (dupUser) throw new AppLogicError('Email registered', 400)
		
		const result = await UserModel.insertOne(user)
		if (!result.ok) throw new Exception(500, 'Cannot insert user')
		user._id = result.insertedId;

		return user;		
	}
}
```

Instead of that verbose:
```typescript
const router = express.Router();

router.get('/', (req, resp) => {
	return UserModel.find().toArray()
	.then(users => resp.json(users))
	.catch(err => {resp.status(500); resp.json({error: err.message})})
})

router.post('/', (req, resp) => {
	if (!isValidEmail(req.body.email)) {
		resp.status(400)
		resp.send({error: 'Invalid email format'})
		return
	}
	
	return UserModel.findOne({email: req.body.email})
	.then(dupUser => {
		if (dupUser) {
			resp.status(400);
			return resp.send({error: 'Email registered'})
		}
		})
	}
		return UserModel.insertOne(user).then(result => {
			if (!result.ok) {
				resp.status(500);
				return resp.send({error: 'Cannot insert user'})
			}
			else {
				user._id = result.insertedId
				return resp.send(user)
			}
		})
	})
})

export default router;
```

## Installation
- This is for typescript only. So we need [typescript](https://www.npmjs.com/package/typescript)
- [reflect-metadata](https://www.npmjs.com/package/reflect-metadata) must be turned on (`tsconfig.json`)

```json
{
	"experimentalDecorators": true,
	"emitDecoratorMetadata": true
}
```

- Install via `npm` or [yarn](https://www.npmjs.com/package/yarn):

```bash
npm install --save express-router-ts
```

## Getting started
Pretty straight forward, first having routing class:
```typescript
import { ExpressRouter, POST, Body} from 'express-router-ts'

export class AuthRouter extends ExpressRouter {
	@POST({path: '/login'})
	async login(@Body('username') username: string, @Body('password') password: string) {
		const user = await UserModel.findOne({username});
		if (!user) throw new Error('User not found');
		
		if (user.passwordSHA != sha(password, user.salt)) throw new Error('Cannot login')
		return await jwt.generateToken(user._id)
	}
	
	@POST({path: '/register'})
	async register(@Body('username') username: string, @Body('password') password: string) {
		const dupUser = await UserModel.findOne({username});
		if (dupUser) throw new Error('User registered');
	
		const salt = randomstring.generate({length: 16})
		const result = await UserModel.insertOne({
			username,
			passwordSHA: sha(password, salt),
			salt
		})
		if (!result.ok) throw new Error('Cannot insert user')
		
		return {_id: result.insertedId}
	}
}
```

Then loading it into your `express` server using its `.Router` property:
```typescript
const server = express();
server.use('/auth', new AuthRouter().Router)
```

## Routing

### ExpressRouter class
`ExpressRouter` is the base of every router class. Each of them is equivalent (and will be mapped) to an [express.Router](https://expressjs.com/en/guide/routing.html#express-router) object. An `ExpressRouter` object has only 2 properties:
- `Router`: returns an equivalent `express.Router` object
- `Path`: The route path of the router (only used if it's loaded via [loadDir](##loaddir-method) method)

Beside, the `ExpressRouter` class itself has some useful static methods / properties:
- `ExpressRouter.loadDir`:  loading a directory of router files instead of each object. Check [loadDir](#loaddir-method)
- `ExpressRouter.NEXT`: A symbol used to trigger `next()` function. Check [Middlewares](#middlewares)
- `ExpressRouter.ResponseHandler`: Check [Response handlers](#reponse-handlers)
- `ExpressRouter.ErrorHandler`: Check [Response handlers](#reponse-handlers)

### Route methods
Similarly, a route method is a method inside a router class marked with a correspond HTTP method decorator. It's equivalent to a [express route handler](https://expressjs.com/en/guide/routing.html#route-handlers) function although it **must** be async:
```typescript
class UserRouter extends ExpressRouter {
	@GET({path: '/:id'})
	async getUser(@Params('id') id: string) {
		return await UserModel.findOne({_id: new ObjectId(id)
		return resp.json({
			_id: result.insertedId,
			...req.body
		});
	}
	
	@PUT({path: '/:id'})
	@ValidBody({
		'+@name': 'string',
		'+@email': 'string',
		'++': false
	})
	async updateUser(@Params('id') id: string, @Body() updateBody: any) {
		const result = await UserModel.updateOne({_id: new ObjectId(id)}, {$set: updateBody});
		return result.ok == true
	}
}
```
There are some kind of decorators inside a route method definition:
- HTTP method decorator: (`@GET`, `@POST`, `@PUT`,....) Defined decorators imported from `express-router-ts` lib. It may have `path`option:
	- `path`: The route path of the method. Default is the method name.
- [Middleware decorators](#middlewares): The [@ValidBody](#valid-body) decorator in the example above
- [Argument decorators](#argument-mappers): How to retrieve values for the method arguments
- [Response decorators](#response-handlers): In case we need different response handler instead of default. Check [Response a file](#response-a-file) code samples.
- The method body: Your logic

### Middlewares
[Middlewares](https://expressjs.com/en/guide/using-middleware.html) is represented as a method decorator. Use `addMiddlewareDecor` function to create a middleware, example:
```typescript
export function ApiLog() {
	return addMiddlewareDecor(async req => {
		console.log(`${req.method} ${req.url}; Time: ${Date.now()}`)
		throw ExpressRouter.NEXT
	})
}

class UserRouter extends ExpressRouter {
	@ApiLog() // <- it's used here
	@GET({path: '/:id'})
	async getUser(@Params('id') id: string) {
		return await UserModel.findOne({_id: new ObjectId(id)});
	}
}
```

**Note**: In order to forward request to the next handler, we throw `ExpressRouter.NEXT` symbol. It's equivalent to call `next()` function in traditional `expressjs`.

### Argument mappers
Decorators indicate how to retrieve values for route method arguments. We supports all default mappers to get data from request object:
- `@Query(arg?: string | Function)`: corresponding field name in request's query or a function to extract values from query. Default are empty string which will returns all the query object.
- `@Body(arg?: string | Function)`: Same as above, but for body object.
- `@Query(arg?: string | Function)`: Same as above, for url params.
- `@Req(arg?: string | Function)`: Same as above, but work for entire request object.

We can create new mappers as well, use `argMapperDecor` function:
```typescript
// Assume that we're using express-session 
// https://www.npmjs.com/package/express-session
export function SessionId() {
	return argMapperDecor(async req => {
		return req.session.id;
	})
}

export const Nonce = argMapperDecor(async req => {
	return uuid.v4()
}

class ExampleRouter extends ExpressRouter {
	const count = {}
	
	@GET({path: '/count'})
	async countReq(@SessionId() sid: string, @Nonce nonce: string) {
		if (!this.count[sid]) this.count[sid] = 0
		this.count[sid] += 1
		
		return {
			nonce,
			counter: this.count[sid]
		}
	}
}
```

### Reponse handlers
Response handlers is used to format the returned data (from route methods) before responding to client. There're 2 type of response handlers:
- `ResponseHandler`: success response
- `ErrorHandler`: used if having exception

Default, all route methods using global response handlers, declared as static fields in `ExpressRouter` class (`ExpressRouter.ResponseHandler` and `ExpressRouter.ErrorHandler`) that does nothing but response data directly to client (and set status code to 500 if error).

I usually apply my own response handlers:
```typescript
export class AppApiResponse {
	constructor(success: boolean = true) {
		this.success = success;
	}
	
	success: boolean;
	httpCode?: number;
	headers?: {[header: string]: string} = {}
	err?: IAppErrorResponse;
	data?: any;
	meta?: any;
}

ExpressRouter.ResponseHandler = (data, req, resp) => {
	let appResp = new AppApiResponse();

	if (data  instanceof  AppApiResponse) {
		appResp = data;
	}
	else {
		appResp.success = true;
		appResp.httpCode = 200;
		appResp.data = data;
	}
	
	response(appResp, resp)
}

ExpressRouter.ErrorHandler= (err, req, resp) => {
	let appResp = new AppApiResponse();

	appResp.success = false;
	appResp.err = {
		message: err.message || 'Unknown error',
		code: err.code,
		params: err.params
	}
	appResp.httpCode = _.isNumber(err.httpCode) ? err.httpCode : 500;
	
	response(appResp, resp)
}

function response(appResp, resp) {
	if (_.isNumber(appResp.httpCode)) {
		resp.statusCode = appResp.httpCode;
	}
	delete  appResp.httpCode;
	
	// Remove headers from response body
	if (!_.isEmpty(appResp.headers)) {
		_.keys(appResp.headers).forEach(h  =>  resp.setHeader(h, appResp.headers[h]));
	}
	delete  appResp.headers;

	resp.send(appResp);
}
```

Example responses:
```typescript
@GET()
async routeMethodSuccess() {
	return {
		"name": "Mike",
		"age": 19
	}
}

// Success: Status 200
{
	"success": true,
	"data": {
		"name": "Mike",
		"age": 19
	}
}


@GET()
async routeMethodFailed() {
	throw new AppError("User not found", 400)
}

// Error: Status 400
{
	"success": false,
	"err": {
		"message": "User not found"
	}
}
```

### `loadDir` method
We usually store all routers inside one directory. So instead of loading each of them explicitly to the app, why don't load all directly, using `ExpressRouter.loadDir` method:
![loadDir](https://i.imgur.com/hz0oEpx.png)

Some note for using this function:
- To be imported, the router file must export an object of that router as default export.
```typescript
class ExampleRouter extends ExpressRouter {
	@GET({path: '/'})
	async api() {
		return 'Hello'
	}
}

export default new ExampleRouter(); // <-- Important! must export default here
```
- The route path of the router is the filename as default, unless the `.Path` property of the router is set
```typescript
// filename: example.ts
class ExampleRouter extends ExpressRouter {
}

export default new ExampleRouter();
// This router will be routed under '/example' path as default
```
```typescript
// filename: custompath.ts
class CustomPathRouter extends ExpressRouter {
	get Path() {
		return '/users'
	}
}

export default new CustomPathRouter();
// This router will be routed under '/users' path as defined in `Path` property
```
- While this lib is for `typescript`, the actual loaded files are usually `.js` files, so please take attention into your builder configuration and `cwd` to ensure the loading path is set correctly.

## Code Samples

### Valid body
A typical problem when writing REST is ensure the body format is valid, let's write a middleware decorator for that. In this example I use [ajv2](https://www.npmjs.com/package/ajv2) to validate json:
```typescript
const ajv = newAjv2();

export function ValidBody(schema: object) {
	const validator = ajv(schema);

	return addMiddlewareDecor(async  req  => {
		if (!validator(req.body)) throw new AppLogicError('Invalid request body!', 400, validator.errors);
	})
}
```
```typescript
class UserRouter extends ExpressRouter {
	@PUT({path: '/:id'})
	@ValidBody({
		'+@name': 'string',
		'+@email': 'string',
		'++': false
	})
	async updateUser(@Params('id') id: string, @Body() updateBody: any) {
		const result = await UserModel.updateOne({_id: new ObjectId(id)}, {$set: updateBody});
		return result.ok == true
	}
}
```

### Authorization
Another common problem is authorization. Ensure an API is called by user with proper permission only. Let's have a simple role-based access control middleware with [jwt](https://www.npmjs.com/package/jsonwebtoken) for tokens:
```typescript
export function AuthRole(...roles: string[]) {
	return  addMiddlewareDecor(async (req: express.Request) => {
		if (!req.session.user) {
			const  accessToken = req.header('authorization');
			if (!accessToken) throw new AppLogicError(`Unauthorized! ${err}`,  401);
			
			try {
				data = jwt.verify(accessToken, 'secrect');
				req.session.user = data && await UserModel.find({_id: new ObjectId(data.id)})
				if (!req.session.user) throw new Error()
			}
			catch (err) {
				throw new AppLogicError(`Unauthorized! ${err}`, 401);
			}
		}

		if (roles.length > 0) {
			const user = req.session.user;
			if (!roles.find(r  =>  user.roles.includes(r))) new AppLogicError(`Unauthorized! ${err}`, 401);
		}
	});
}
```
```typescript
	@GET({path: '/me'})
	@AuthRole() // <- Every authenticated user can get their profile
	async getProfile(@Req('session.user') user: IUser) {
		return user;
	}
	
	@PUT({path: '/:id'})
	@ValidBody({
		'+@name': 'string',
		'+@email': 'string',
		'++': false
	})
	@AuthRole('ADMIN') // <- Only user with admin role can access to this API
	async updateUser(@Params('id') id: string, @Body() updateBody: any) {
		const result = await UserModel.updateOne({_id: new ObjectId(id)}, {$set: updateBody});
		return result.ok == true
	}
}
```

### Response a CSV
In all examples above, we just use the default `ResponseHandler` which formated respons data as `json` only. What if we want to response data in other formats ?
In this example we will write an API that response a `CSV` file:
```typescript
export function CSVResponse(fnFilename: (data: any, req: express.Request) =>  string, csvOptions: object) {
	return ResponseHandler(async (data, req, resp) => {
		const csv = toCSV(data, csvOptions) // toCSV function converts from json to csv, replace with your own logic
		const filename = fnFilename(data, req)
		resp.set({"Content-Disposition":`attachment; filename="${filename}"`})
		resp.send(csv)
	})
}
```

The API below will response a list of all users as a CSV file. While this decorator applied for this API only, all other APIs still responses data in json format (as default).
```typescript
class UserRouter extends ExpressRouter {
	@GET({path: '/'})
	@AuthRole('ADMIN')
	@CSVResponse(() => 'users.csv')
	async getAllUsers() {
		return await User.findAll();
	}
}
```

## Issue Reporting

If you have found a bug or have a feature request, feel free to report them at this repository issues section.

## Contributing

You are welcome

> Written with [StackEdit](https://stackedit.io/).