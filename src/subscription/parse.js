const isFn = /^\$fn\|/
const dummy = () => false
// const client = (tree) => {
//   while (tree) {
//     if (tree._ && tree._.client) {
//       return tree._.client
//     }
//     tree = tree._p
//   }
// }

// const clientContext = fn => (state, subs, tree, key) => {
//   if (state) {
//     const $root = state.root
//     const inContext = $root._client
//     var prev
//     if (inContext) {
//       $root._client = client(tree)
//     } else {
//       prev = $root.client
//       $root.client = client(tree)
//     }
//     const ret = fn(state, tree, subs, key)
//     if (inContext) {
//       $root._client = inContext
//     } else {
//       $root.client = prev
//     }
//     return ret
//   } else {
//     return fn(state, tree, subs, key)
//   }
// }

const parse = (obj, state, key) => {
  const result = {}
  for (let i in obj) {
    if (isFn.test(i)) {
      let val = obj[i]
      i = i.slice(4)
      // need to fix bublé stuff in these fn creations -- prop need to add buble
      // runtime in a hub
      let pass
      try {
        obj[i] = new Function('return ' + val)() // eslint-disable-line
        // if (/\.client|\[['"']client['"]\]/.test(val)) { // eslint-disable-line
        //   obj[i] = clientContext(obj[i])
        // }
        pass = true
        // do dry run with your own key in a props object
        // 2 options for this ofcourse
        // obj[i](state, {}, {}, i)
        // do we want to test for null / void 0?
      } catch (e) {
        let msg
        // if (!pass) {
        msg = `cannot parse function ${key}.exec\n${val}`
        // } else {
        //   msg = `cannot run function ${key}.exec\n${val}`
        // }
        state.emit('error', new Error(msg))
        obj[i] = dummy
      }
    }
    if (typeof obj[i] !== 'object') {
      result[i] = obj[i]
    } else {
      result[i] = parse(obj[i], state, i)
    }
  }
  return result
}

export default parse
