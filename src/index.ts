// Dependencies
import * as fetch from 'isomorphic-fetch'

// Interfaces
export type Constructor<T = object> = new (...args: any[]) => T

export interface IModel extends Constructor {
  [key: string]: any
}

export interface JsonObject {
  [key: string]: any
}

interface Cache<T> {
  [key: string]: T
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

/** SuplexStore */
export class SuplexStore {
  /** The model's class declaration */
  private Model: IModel

  /** Property name of the model's identifier */
  private idProp: string

  /** Stores all instances of the models */
  private cache: Cache<IModel> = {}

  /** Keeps track of pending HTTP requests */
  private pendingRequests: PendingRequests = {}

  constructor(Model: IModel, idProp: string) {
    this.Model = Model
    this.idProp = idProp
  }

  /**
   * Retrieve a model and, optionally, update its properties
   *
   * @param {(string|number)} id - Value of the model's identifier
   * @param {Object} [props] - Properties to update
   * @return {Model} The model's instance
   */
  get(id: string | number, props?: JsonObject): IModel {
    if (typeof this.cache[id] === 'undefined') {
      this.cache[id] = new this.Model() as IModel
    }

    if (props) {
      Object.keys(props).forEach(key => {
        if (this.cache[id].hasOwnProperty(key)) {
          this.cache[id][key] = props[key]
        }
      })
    }

    return this.cache[id]
  }

  /**
   * Transform an object's properties before injecting into the model
   *
   * @callback SuplexStore~transform
   * @param {Object} o - The input object
   * @return {Object} The modified object
   */
  /**
   * Load an array of objects into models
   *
   * @param {Object[]} collection - An array of objects
   * @param {SuplexStore~transform} [transform] - Callback to transform an object's properties (e.g. rename properties, filter values)
   * @return {Model[]} An array of models
   */
  load(
    collection: JsonObject[],
    transform = (o: JsonObject): JsonObject => o
  ): IModel[] {
    return collection.map(o => this.get(o[this.idProp], transform(o)))
  }

  /**
   * Fetch a URL resource
   *
   * @param {(string|Object)} request - A string or request object for a URL resource
   * @return {Object} A response object with the body parsed
   * @throws {FetchError} Thrown if a duplicate request is pending
   */
  async fetch(request: string | Request) {
    const key = JSON.stringify(request)
    const pendingRequests = this.pendingRequests

    try {
      if (pendingRequests[key]) {
        throw new FetchError('Duplicate request')
      }

      pendingRequests[key] = true

      const response = await fetch(request)
      const body =
        (response.headers.get('Content-Type') || '')
          .indexOf('application/json') > -1
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

export default (Model: IModel, idProp: string) => new SuplexStore(Model, idProp)
