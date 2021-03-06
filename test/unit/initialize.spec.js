import initializeApi from '../../lib/api/initialize'
import Promise from 'yaku'

describe('initializeApi(apiCreator)', function () {
  beforeEach(function () {
    this.apiCreator = sinon.stub().returns({})
    const init = initializeApi((...args) => this.apiCreator(...args))
    this.initialize = function () {
      return new Promise((resolve) => init(resolve))
    }
  })

  describe('callback', function () {
    beforeEach(function () {
      this.api = {}
      this.init = initializeApi(() => this.api)
    })

    it('is not invoked before connecting', function () {
      const cb = sinon.spy()
      this.init(cb)
      expect(cb).to.not.be.called
    })

    it('is invoked after connecting', function (done) {
      this.init(() => done())
      sendConnect()
    })

    it('is invoked when registering it after connecting', function () {
      sendConnect()
      return wait()
      .then(() => {
        const cb = sinon.spy()
        this.init(cb)
        expect(cb).to.be.called
      })
    })

    it('receives the result of the apiCreator', function (done) {
      this.init((arg) => {
        expect(arg).to.equal(this.api)
        done()
      })
      sendConnect()
    })
  })

  it('calls apiCreator with channel and params', function () {
    const params = {id: 'foo', val: 'x'}
    sendConnect(params)
    return this.initialize()
    .then(() => {
      const [channel, params] = this.apiCreator.args[0]
      expect(channel.call).to.be.a('function')
      expect(channel.send).to.be.a('function')
      expect(channel.addHandler).to.be.a('function')
      expect(params).to.deep.equal(params)
    })
  })

  it('calls handlers for queued messages', function () {
    sendConnect(null, [{method: 'M', params: ['X', 'Y']}])
    const handler = sinon.stub()
    this.apiCreator = function (channel) {
      channel.addHandler('M', handler)
    }
    return this.initialize()
    .then(() => {
      expect(handler).to.have.been.calledOnce
      expect(handler).to.have.been.calledWithExactly('X', 'Y')
    })
  })

  it('adds focus handlers', function () {
    let send = sinon.spy()
    this.apiCreator = function (channel) {
      channel.send = send
    }
    sendConnect()
    return this.initialize()
    .then(() => {
      document.dispatchEvent(new Event('focus'))
      expect(send).to.be.calledOnce
      expect(send).to.be.calledWithExactly('setActive', true)

      send.reset()
      document.dispatchEvent(new Event('blur'))
      expect(send).to.be.calledOnce
      expect(send).to.be.calledWithExactly('setActive', false)
    })
  })

  function sendConnect (params, messageQueue) {
    window.postMessage({
      method: 'connect',
      params: [
        params || {id: 'foo'},
        messageQueue || []
      ]
    }, '*')
  }

  function wait () {
    return new Promise((resolve) => setTimeout(resolve))
  }
})
