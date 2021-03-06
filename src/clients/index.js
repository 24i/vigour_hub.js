import { set, create, getType, emit } from 'brisky-struct'
import { serializeError } from '../emit'

const emitClientUpstream = (t, type, val) => {
  if (t.root().client) {
    if (!t.root().socket) {
      console.log('emit: 💗 wait until connected', t.root())
    } else {
      const bc = { [t.key]: {} }
      bc[t.key][type] = val
      t.root().socket.send(JSON.stringify([null, {
        emit: {
          broadcast: bc
        }
      }]))
    }
  }
}

export default {
  types: {
    clients: {
      type: 'struct',
      instances: false,
      props: {
        default: {
          type: 'hub',
          instances: false,
          props: {
            cache: true,
            upstreamSubscriptions: true,
            resolve: true,
            socket: true,
            context: true
          },
          define: {
            // event system
            emit (type, val, stamp, dontSend) {
              let sendval = val
              if (val instanceof Error) {
                sendval = serializeError(this, val)
              } else if (val && typeof val === 'object' && val._$isError) {
                const msg = (val.from ? 'from "' + val.from + '": ' : '') +
                  val.message
                const err = new Error(msg)
                err.from = val.from
                err.type = val.err
                err.stack = val.stack
                val = err
              }
              if (!dontSend) {
                if (this.socket) {
                  this.socket.send(JSON.stringify([null, {
                    emit: { [type]: sendval }
                  }]))
                } else {
                  emitClientUpstream(this, type, sendval)
                }
              }
              if (this.root().client === this) {
                emit(this.root(), type, val, stamp)
              }
              emit(this, type, val, stamp)
            }
          }
        }
      }
    }
  },
  props: {
    clients: (t, val, key, stamp) => {
      if (!t.clients) {
        const clients = getType(t, key)
        t.clients = create(val, stamp, clients, t, key)
      } else {
        set(t.clients, val, stamp)
      }
    }
  },
  define: {
    broadcast (type, val, stamp) {
      const h = this
      if (h.clients) {
        // send all
        h.clients.forEach(client => {
          if (client !== h.client) {
            client.emit(type, val, stamp)
          }
        })
      }
    }
  }
}
