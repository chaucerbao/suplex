// Dependencies
import * as fetch from 'isomorphic-fetch'

// Interfaces
export interface Stores {
  [storeName: string]: Store
}

export interface JsonObject {
  [key: string]: any
}

interface Cache {
  [key: number]: Model
}

interface PendingRequests {
  [key: string]: boolean
}

// Custom error
class FetchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FetchError'
  }
}

/** Base model */
export class Model {
  [key: string]: any

  id: number = 0

  protected _stores: Stores

  /**
   * Model constructor
   *
   * @param {Object.<string, Store>} stores - A dictionary of stores
   */
  constructor(stores = {}) {
    this._stores = stores
  }

  /**
   * Updates property values in the model.
   *
   * @param {Object} props - Properties values to update
   * @return {Model} This model's instance
   */
  update(props: JsonObject): Model {
    Object.keys(props).forEach((key: string) => {
      if (this.hasOwnProperty(key)) {
        this[key] = props[key]
      }
    })

    return this
  }
}

/** Base store */
export class Store {
  protected Model = Model

  protected _stores: Stores = {}
  private _cache: Cache = {}
  private _pendingRequests: PendingRequests = {}

  /**
   * Store constructor
   *
   * @param {Object.<string, Store>} stores - A dictionary of stores
   */
  constructor(stores = {}) {
    this._stores = stores
  }

  /**
   * Load a model from cache and update its properties
   *
   * @param {number} key - The cached model's unique identifier
   * @param {Object} [props] - Properties values to update
   * @return {Model} The model's instance
   */
  _load(key: number, props?: JsonObject): Model {
    if (typeof this._cache[key] === 'undefined') {
      this._cache[key] = new this.Model(this._stores)
    }

    if (props) {
      this._cache[key].update(props)
    }

    return this._cache[key]
  }

  /**
   * Transform a JSON object before storing into cache
   *
   * @callback Store~transform
   * @param {Object} instance - A JSON object that represents a model instance
   * @return {Object} A new JSON object with updated properties
   */
  /**
   * Load a collection of objects into cache and return their models
   *
   * @param {Object[]} collection - A collection of JSON objects that represent models
   * @param {Store~transform} [transform] - Callback that transforms a JSON object before caching (e.g. rename properties, filter values)
   * @return {Model[]} A collection of models
   */
  _map(
    collection: JsonObject[],
    transform = (instance: JsonObject): JsonObject => instance
  ): Model[] {
    return collection.map((instance: JsonObject) =>
      this._load(instance.id, transform(instance))
    )
  }

  /**
   * Fetch a URL resource
   *
   * @param {(string|Object)} request - A Request object or string to a URL resource
   * @return {Object} A response object with the body parsed and available
   * @throws {FetchError} Will throw if a duplicate request is still pending
   */
  async _fetch(request: Request | string) {
    const key = JSON.stringify(request)
    const pendingRequests = this._pendingRequests

    try {
      if (pendingRequests[key]) {
        throw new FetchError('Duplicate request')
      }

      pendingRequests[key] = true

      const response = await fetch(request)
      const body =
        response.headers.get('Content-Type') === 'application/json'
          ? await response.json()
          : await response.text()

      delete pendingRequests[key]

      return Object.assign({}, response, { body })
    } catch (err) {
      if (err.name !== 'FetchError') {
        delete pendingRequests[key]
      }

      throw err
    }
  }
}
