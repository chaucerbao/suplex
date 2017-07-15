# Suplex
A simple, yet efficient, store management library

## Installation

```
npm install --save suplex
```

## Quick Start
Create your own models and stores, then attach Suplex

```
import Suplex from 'suplex'

// Start by defining a model
class User {
  id: 0
  name: ''
  email: ''
}

// Then, create a store to manage those models
class UserStore {
  suplex: any

  constructor() {
    this.suplex = suplex(User, 'id')
  }

  // Let's make an array to hold all the users
  all = []

  // And a function to fetch a list of users from some API
  async fetchAll() {
    const response = await this.suplex.fetch('http://jsonplaceholder.typicode.com/users')
    this.all = this.suplex.load(response.body)
  }
}

// Now, use it!
const userStore = new UserStore()

await userStore.fetchAll()

console.log(userStore.all)
```

## Usage

Suplex(Store, [Model, keyProp])

get(id, [props])
Retrieves (creates if necessary) a model from the store's internal cache, and update its properties.

load(collection, [transform])
Loops over an array of objects, injecting each object into a model and caching it. If a `transform` callback is provided, each object will be run through the callback before being loaded into a model. This is useful if you need to process a JSON response from an API before consuming it (e.g. rename properties, filter values).

fetch(request)
Makes an API call and returns the response. If there's a duplicate request while the first one is still pending, an error is thrown.
