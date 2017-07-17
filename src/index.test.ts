// Dependencies
import test from 'ava'
import * as nock from 'nock'

// Test subject
import suplex from './'

// Mocks
class MockModel {
  id: number = 0
  mockProp: boolean = false
}

test('Create a SuplexStore instance', t => {
  const store = suplex(MockModel, 'id')

  t.is(store.constructor.name, 'SuplexStore')
})

test('Retrieve the same instance of a model', t => {
  const store = suplex(MockModel, 'id')

  const modelA = store.get('key')
  const modelB = store.get('key')

  t.is(modelB, modelA)
})

test('Retrieve the same instance of a model when given variants of the same key', t => {
  const store = suplex(MockModel, 'id')

  const modelA = store.get(1)
  const modelB = store.get('1')

  t.is(modelB, modelA)
})

test('Retrieve different instances of a model when given different keys', t => {
  const store = suplex(MockModel, 'id')

  const modelA = store.get('A')
  const modelB = store.get('B')

  t.deepEqual(modelB, modelA)
  t.not(modelB, modelA)
})

test('Retrieve and update properties of a model', t => {
  const store = suplex(MockModel, 'id')

  const modelA = store.get('key')
  t.false(modelA.mockProp)

  const modelB = store.get('key', { mockProp: true })
  t.true(modelB.mockProp)
})

test('Update only properties that exist in the model', t => {
  const store = suplex(MockModel, 'id')

  const modelA = store.get('key')
  t.false(modelA.mockProp)
  t.is(modelA.invalidProp, undefined)

  const modelB = store.get('key', { mockProp: true, invalidProp: true })
  t.true(modelB.mockProp)
  t.is(modelA.invalidProp, undefined)
})

test('Return a model for each object in an array', t => {
  const store = suplex(MockModel, 'id')
  const json = [{ id: 1, mockProp: true }, { id: 2, mockProp: false }]

  const [modelA, modelB] = store.load(json)

  t.true(modelA instanceof MockModel)
  t.is(modelA.id, 1)
  t.true(modelA.mockProp)

  t.true(modelB instanceof MockModel)
  t.is(modelB.id, 2)
  t.false(modelB.mockProp)
})

test('Return a model for each object in an array after a transform', t => {
  const store = suplex(MockModel, 'id')
  const json = [{ id: 1, invalidProp: true }, { id: 2, invalidProp: false }]

  const transform = (model: { [key: string]: any }) => ({
    id: model.id,
    mockProp: !model.invalidProp
  })

  const [modelA, modelB] = store.load(json, transform)

  t.true(modelA instanceof MockModel)
  t.is(modelA.id, 1)
  t.false(modelA.mockProp)

  t.true(modelB instanceof MockModel)
  t.is(modelB.id, 2)
  t.true(modelB.mockProp)
})

test('Return a JSON response from an API call', async t => {
  const store = suplex(MockModel, 'id')
  const http = nock('http://domain.com')
    .get('/')
    .reply(200, { id: 1, mockProp: true })

  const response = await store.fetch('http://domain.com/')

  t.true(response.ok)
  t.deepEqual(response.body, { id: 1, mockProp: true })
  http.done()

  nock.cleanAll()
})

test('Return a text response from an HTTP call', async t => {
  const store = suplex(MockModel, 'id')
  const http = nock('http://domain.com').get('/').reply(200, 'Text')

  const response = await store.fetch('http://domain.com/')

  t.true(response.ok)
  t.is(response.body, 'Text')
  http.done()

  nock.cleanAll()
})

test('Throws an error if a duplicate request is in progress', async t => {
  const store = suplex(MockModel, 'id')
  const http = nock('http://domain.com').get('/').reply(200)

  store.fetch('http://domain.com/')
  const error = await t.throws(store.fetch('http://domain.com/'))

  t.is(error.message, 'Duplicate request')
  http.done()

  nock.cleanAll()
})

test.cb('Quick start example in the README', t => {
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

    t.is(userStore.all.length, 10)
    t.end()
  }

  callApi()
})
