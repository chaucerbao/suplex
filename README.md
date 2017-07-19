# Suplex
A simple, yet efficient, store management library

## Installation

```sh
npm install --save @chaucerbao/suplex
```

## Quick Start
Create your own models and stores, then attach Suplex

```ts
import suplex from '@chaucerbao/suplex'

// Start by defining some model
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

  // Make an array to hold all the users
  all = []

  // And a function to fetch and load a list of users from some API
  async fetchAll() {
    const response = await this.suplex.fetch(
      '//jsonplaceholder.typicode.com/users'
    )
    this.all = this.suplex.load(response.body)
  }
}

// Now, initialize the store
const userStore = new UserStore()

// And access your data!
async function callApi() {
  await userStore.fetchAll()

  console.log(userStore.all)
}

callApi()
```

## Usage

**suplex(Model, idProp)**

Create a Suplex store to manage your models

```js
class TheModel {
  uniqueId: 0
  someProp: ''
}

const suplexStore = suplex(TheModel, 'uniqueId')
```

### Suplex store API

**.get(id, [props])** => Model

Dispenses a model from the store's internal storage, and optionally update its properties.

```js
const instance = suplexStore.get(20, {
  someProp: 'Updated value'
})
```

**.load(collection, [transform])** => Model[]

Loops over an array of objects, injecting each object into a model and storing it. If a `transform` callback is given, each object will run through the callback before being passed into the model. This is useful for processing a JSON response before consuming it (e.g. rename properties, filter values).

```js
const arrayOfModels = suplexStore.load(
  [
    { uniqueId: 1, wrongName: "One" },
    { uniqueId: 2, wrongName: "Two" }
  ],

  // Callback to rename the `wrongName` property into `someProp`
  model => ({ uniqueId: model.uniqueId, someProp: model.wrongName })
)
```

**.fetch(request)** => Response

Makes an API call and returns the response. If there's a duplicate request while one is still pending, an error is thrown.

```js
async callApi function() {
  const response = await suplexStore.fetch("http://api.domain.com/")

  // Content of the response is in `response.body`
  console.log(response.body)
}
```
