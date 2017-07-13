// Dependencies
import test from 'ava'
import * as nock from 'nock'

// Test subject
import { Model, Store } from './'

// Mocks
class MockModel extends Model {
  mockProp: string = 'value'

  get stores() {
    return this._stores
  }
}

class MockStore extends Store {
  Model = MockModel

  get stores() {
    return this._stores
  }
}

// Create a `stores` collection
const stores = {}
Object.assign(stores, {
  mock: new MockStore(stores)
})

// Model
test('Construct a new model', t => {
  const model = new MockModel(stores)

  t.is(model.stores, stores)
})

test("Update a model's properties", t => {
  const model = new MockModel(stores)

  t.is(model.mockProp, 'value')
  t.is(model.invalidProp, undefined)

  const result = model.update({
    mockProp: 'updated',
    invalidProp: true
  })

  t.is(result, model)
  t.is(model.mockProp, 'updated')
  t.is(model.invalidProp, undefined)
})

// Stores
test('Construct a new store', t => {
  const store = new MockStore(stores)

  t.is(store.stores, stores)
})

test('Set and get a single model from cache', t => {
  const store = new MockStore(stores)

  const model = store._load(1, { mockProp: 'one' })

  t.is(model.mockProp, 'one')

  const result = store._load(1)

  t.is(result, model)
  t.is(result.mockProp, 'one')
})

test('Load a collection of models into cache', t => {
  const store = new MockStore(stores)

  const collection = [
    {
      id: 1,
      mockProp: 'one'
    },
    {
      id: 2,
      mockProp: 'two'
    }
  ]

  const result = store._map(collection)

  t.is(result.length, 2)
  t.true(result[0] instanceof MockModel)
  t.is(result[0].id, 1)
  t.is(result[0].mockProp, 'one')
  t.true(result[1] instanceof MockModel)
  t.is(result[1].id, 2)
  t.is(result[1].mockProp, 'two')
})

test('Load a collection of models into cache, with a transform', t => {
  const store = new MockStore(stores)

  const collection = [
    {
      id: 1,
      badPropName: 'ONE'
    },
    {
      id: 2,
      badPropName: 'TWO'
    }
  ]

  const result = store._map(collection, model => ({
    id: model.id,
    mockProp: model.badPropName.toLowerCase()
  }))

  t.is(result.length, 2)
  t.true(result[0] instanceof MockModel)
  t.is(result[0].id, 1)
  t.is(result[0].mockProp, 'one')
  t.true(result[1] instanceof MockModel)
  t.is(result[1].id, 2)
  t.is(result[1].mockProp, 'two')
})

test('Fetches a JSON resource', async t => {
  const store = new MockStore(stores)
  const http = nock('http://domain.com')
    .get('/resource/1')
    .reply(200, { id: 1, mockProp: 'one' })

  const response = await store._fetch('http://domain.com/resource/1')

  t.is(response.status, 200)
  t.deepEqual(response.body, { id: 1, mockProp: 'one' })
  http.done()

  nock.cleanAll()
})

test('Fetches a text resource', async t => {
  const store = new MockStore(stores)
  const http = nock('http://domain.com')
    .get('/resource/1')
    .reply(200, 'Text resource')

  const response = await store._fetch('http://domain.com/resource/1')

  t.is(response.status, 200)
  t.is(response.body, 'Text resource')
  http.done()

  nock.cleanAll()
})

test('Throws a FetchError on duplicate requests', async t => {
  const store = new MockStore(stores)
  const http = nock('http://domain.com').get('/resource/1').reply(200)

  store._fetch('http://domain.com/resource/1')
  const error = await t.throws(store._fetch('http://domain.com/resource/1'))

  t.is(error.message, 'Duplicate request')
  http.done()

  nock.cleanAll()
})
