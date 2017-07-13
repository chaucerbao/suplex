# Suplex
A simple, yet efficient, store management library

## Installation

```
npm install --save suplex
```

## Quick Start
Create your own models and stores that extend the Suplex `Model` and `Store`.

```
import { Model, Store } from 'suplex'

// Start by defining a model for your resource, let's make a User model
class User extends Model {
  name: ''
  email: ''
}

// Then create a store to manage your models
class UserStore extends Store {
  // Tell the store about the model it's responsible for
  Model = User

  // Let's make an array to hold all the users
  all: []

  // This will fetch an array of users from some API
  async getAll() {
    // Call the API
    const response = await this._fetch('http://jsonplaceholder.typicode.com/users')

    // Load each object returned into User models, and store it in the `all` array
    this.all = this._map(response.body)
  }
}

// Now that you've defined your model and store, let's use them!
// Create an object to hold all your stores
const stores = {}

// Load it with all the stores you want
Object.assign(stores, {
  userStore: new UserStore(stores)
  // ...
})

// Finally, you can access your data anywhere through your `stores` object!
async function start() {
  await stores.userStore.getAll()

  console.log(stores.userStore.all)
}

start()
```

## Usage

### Model methods
update(props)
Updates properties inside the model. Only properties that are defined in the model will be updated. Extra properties are ignored.

### Store methods
_load(key, [props])
Get a model from the store's internal cache, and update its properties. If no model is found with the `key`, a new model is created.

_map(collection, [transform])
Loops over a JSON array of objects, loading each object in the store's internal cache. If a `transform` callback is provided, each object will be run through the callback before being loaded into a model. This is useful if you need to process the JSON from an API before consuming it in your model (e.g. rename properties, filter values).

_fetch(request)
Makes an API call and returns the response. If it detects a duplicate API call before the first one completes, it will throw an error.
