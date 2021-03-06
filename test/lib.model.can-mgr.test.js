const sut = require('../lib/model/can-mgr')

module.exports = 
{ 'lib/model/can-mgr' :
  { 'should be a factory function that expects one argument - options' :
    () => Should(sut)
      .be.a.Function()
      .have.property('length', 1)
  , 'when invoked with invalid options' :
    { 'should throw sinchronously a friendly error' :
      block(() => {
          const cases = 
            { 'no context' : 
              { opts: null
              , msg: /options is not an object/
              }
            , 'missing sway' :
              { opts: 
                { logger: { of: () => (() => {}) }
                //, sway: { ... }
                }
              , msg: /options.sway is missing or not a SwayAPI object/
              }
            , 'missing logger' :
              { opts: 
                { sway:
                  { getOperations: () => [] 
                  , getOperation:  () => null
                  }
                //, logger: { of: () => (() => {}) }
                }
              , msg: /options.logger is missing or is not a logger provider/
              }
            , 'invalid sway' :
              { opts: 
                { logger: { of: () => (() => {}) }
                , sway: 
                  {  getOperations: () => []
                  //, getOperation: () => null
                  }
                }
              , msg: /options.sway is missing or not a SwayAPI object/
              }
            , 'invalid logger' :
              { opts: 
                { sway: { getOperations: () => [] }
                , logger: { /* of: () => (() => {}) */ }
                }
              , msg: /options.logger is missing or is not a logger provider/
              }
            , 'provided with a can with invalid descriptor for one operation' : 
              { opts: 
                { sway: 
                  { getOperations: () => [] 
                  , getOperation: () => null
                  }
                , logger: { of: () => (() => {}) }
                , cans: { 
                    someOpId: {}  //<-- cans[operation] -> should be an Array
                  }
                }
              , msg: /Invalid input passed to canMgr/
              }
            }
          return Object.keys(cases).reduce( (suite, title) => {
              var oCase = cases[title]
              suite[title] = () => {
                  let ex
                  try { sut(oCase.opts) } 
                  catch(x) { ex = x }
                  
                  Should.exist(ex)
                  Should(ex.message).match(oCase.msg, ex.stack)
              }
              return suite
          }, {})
      })
    }
  , 'when invoked with valid options {logger, sway}' :
    block(() => {
        let ex
        let api
        return { 
          before: () => {
              try { 
                api = sut(
                  { sway: 
                    { getOperations: () => [] 
                    , getOperation: (key) => null
                    }
                  , logger: { of: () => ({}) }
                  }
                )
              } catch(x) { ex = x }
          }
        , 'should not fail' :
          () => Should.not.exist(ex)
        , 'should return an initiated mgr instance with 2 apis: .response(key), and .set(cans)' :
          () => Should(api).be.an.Object().have.properties(['response', 'set'])
        }
    })
  , 'when invoked with valid options and an initial cans store' :
    block(() => {
        const mockOpId = 'some-operation'
        const mockResponse =
          { type:         "text"
          , status:       333
          , headers:      { location: "http://go.over/there" }
          , body:         "ok"
          }
        const mockSway =
          { getOperations: () => [ { operationId: mockOpId } ]
          , getOperation: (key) => key == mockKey ? { operationId: mockOpId } : null
          }
        const cans = 
          { [mockOpId]: 
            [ { times:    3
              , response: mockResponse 
              }
            ]
          }
        let mgr
        let response
        const mockKey = {}
        return { 
          beforeAll: () => {
              mgr = sut(
                { sway:   mockSway
                , logger: { of: () => ({ debug: () => {} }) }
                , cans
                }
              )
          }
        , 'and .response(key) called with operation that deos not exists in the provided sway' :
          { beforeAll: () => { response = mgr.response(null) }
          , 'should return the response from the cans initiation': () => Should(response).be.Null()
          }
        , 'and .response(key) called with operation that exists in the provided sway' :
          { beforeAll: () => { response = mgr.response(mockKey) }
          , 'should return the response from the cans initiation': () => Should(response).eql(mockResponse)
          }
        }
    })
  , 'an initiated mgr insance' :
    { '.set(cansDescr)':
      { 'when set with invalid canned-responses with' :
        block(() => {
            let mgr
            const existingOpId = 'some-op-id'
            const suite =
              { beforeAll: () => {
                    mgr = sut(
                      { sway:
                        { getOperations: () => [ { operationId: existingOpId } ]
                        , getOperation: (key) => key == mockKey ? { operationId: existingOpId } : null
                        }
                      , logger: { of: () => ({ debug: () => {} }) }
                      }
                    )
                }
              }
            
            const cases =
              { 'descriptor for an operation not in OAS document':
                { opId:      'no-such-op'
                , rejection: /unknown operation/
                , opDescr:   { times: 3, response: {} }
                }
              , 'descr.times is not a number': 
                { opId:      existingOpId
                , rejection: /descr.times is not a number/
                , opDescr:   { times: "don't know" }
                }
              , 'unsupported response type':
                { opId:      existingOpId
                , rejection:  /unsupported response type/
                , opDescr:  { times: 1, response: { type: "no-such-type" } }
                }
              , 'response.status - not a valid http code' :
                { opId:      existingOpId
                , rejection: /provided response.status is not a legal http status/
                , opDescr:
                  { times:    3
                  , response:
                    { status: 20000
                    }
                  }
                } 
              , 'response.status - not a number' :
                { opId:      existingOpId
                , rejection: /provided response.status is not a legal http status/
                , opDescr:
                  { times:    3
                  , response:
                    { status: "success"
                    }
                  }
                }  
              , 'response.headers - not an object' :
                { opId:      existingOpId
                , rejection: /provided response.headers is not an object/
                , opDescr:
                  { times:    3
                  , response:
                    { headers: "not an object"
                    }
                  }
                }              
              , 'http-header with non-scalar value' :
                { opId:      existingOpId
                , rejection: /provided an http header with a non-scalar value/
                , opDescr:
                  { times:    3
                  , response:
                    { headers:
                      { illegal: { value: { cannot: { be: Object } } }
                      }
                    }
                  }
                }
              }
            
            return Object.keys(cases).reduce( (suite, title) => {
                const oCase = cases[title]
                let err, rej
                suite[title] = 
                  { beforeAll: () => {
                        err = mgr.set(
                          { [oCase.opId] : [ oCase.opDescr ]}
                        )
                    }
                  , 'should return an error decorated with collection of rejections':
                    () => Should(err)
                      .be.an.Error()
                      .have.property('rejections')
                      .have.property('length', 1)
                  , 'the rejection: ':
                    { beforeAll: () => { Should( rej = err.rejections[0] ).be.ok() }
                    , 'should have .operationId as the operationId who\'s can fails':
                      () => Should(rej).have.property('operationId', oCase.opId)
                    , 'should have .opDescr as the descriptor that failed': 
                      () => Should(rej).have.property('opDescr', oCase.opDescr)
                    , ['should have .rejection matches ' + oCase.rejection]: 
                      () => Should(err.rejections[0])
                      .have.property('reject')
                      .match( oCase.rejection )
                    }
                  }
                return suite
            }, suite)
        })
      , 'when set with valid canned-responses' :
        { 'with a valid can with response.type:text': 
          { 'should not fail': 'TBD'
          , 'should accept the can': 'TBD'
          }
        , 'with a valid can with response.type:json': { 'TBD' : 'like prev' }
        //, 'with a valid can with response.type:xml':  { 'TBD' : 'like prev' }
        //, 'with a valid can with resposne.type:yaml': { 'TBD' : 'like prev' }
        , 'with a valid can with times: <number>': { 'TBD' : 'like prev' }
        , 'with a valid can with times: "Infinity" (as string)': { 'TBD' : 'like next' }
        , 'with a valid can with times: Infinity (JS constant)':
          { 'should not fail': 'TBD'
          , 'should accept the can': 'TBD'
          , 'can.times should be Infinity': 'TBD'
          }
        , 'with a valid can with params matcher': { 'TBD' : 'like prev' }
          /* { times: 1
             , response: { ... }
             , params: 
               { p1: "exact" --> { exact: ["exact"] }
               , p2: /match/ --> { match: [/match/] }
               , p3: [/match1/,/match2/] --> { match: [ /match1/, /match2/ ] }
               , p4: { some: object } --> { eql: { some: object } }
               , p5: { includes: { some: object } }
               , p6: "`js-module:exported.path.to.predicate`"
               , p7: function predicate(key) { return true|false }
               }
             }
          */
        }
      }
    , '.response(key)' :
      { 'when provided with key that does not match an operation' :
        block(() => {
            let response
            let initCans
            let mgr
            return { 
              beforeAll: () => {
                  mgr = sut(
                    { sway:
                      { getOperations: () => [{ operationId: 'existing-operation' }]
                      , getOperation: (key) => null
                      }
                    , logger: { of: () => ({ debug: () => {} }) }
                    }
                  )
                  
                  const err = mgr.set({ 'existing-operation': [ {times: 1, response: {status: 200}} ] })
                  if (err) { console.log(err.rejections[0]); throw err }
                  
                  initCans = JSON.stringify( mgr.set.cans )
                  
                  response = mgr.response({url: "/some/path", method: "get"})
              }
            , 'should return null' :
              () => Should(response).be.Null()
            , 'should not mutate any entry in the can':
              () => Should( JSON.stringify( mgr.set.cans ) ).eql( initCans )
            }
        })
      , 'when provided with a key that matches an operation' : 
        { 'and there is NO cans set for this operation' :
          block(() => {
              let response
              let initCans
              let mgr
              return { 
                beforeAll: () => {
                    mgr = sut(
                      { sway:
                        { getOperations: () => 
                          [ { operationId: 'op1' }
                          , { operationId: 'op2' }
                          ]
                        , getOperation: (key) => { operationId: 'op1' }
                        }
                      , logger: { of: () => ({ debug: () => {} }) }
                      }
                    )
                    
                    const err = mgr.set({ 'op2': [ {times: 1} ] })
                    if (err) { console.log(err.rejections[0]); throw err }
                    
                    initCans = JSON.stringify( mgr.set.cans )
                    
                    const mockKey = {}
                    response = mgr.response(mockKey)
                }
              , 'should return null' :
                () => Should(response).be.Null()
              , 'should not mutate any entry in the can':
                () => Should( JSON.stringify( mgr.set.cans ) ).eql( initCans )
              }
          })
        , 'and there is a can set for this operation' :
          block(() => {
              const mockCannedResp = { status: 200, headers: {}, body: { ok: true }, type: "json" }
              const cans = { 'twoTimesCan': 
                [ { times: 2
                  , response: mockCannedResp
                  }
                , { times: Infinity 
                  , response: { status: 200, headers: {}, body: "OK", type: "text" }
                  }
                ]
              }
              const mockSway = { 
                getOperations: () => [{ operationId: 'twoTimesCan' }]
              , getOperation: (key) => ({ operationId: 'twoTimesCan' })
              }
              let response
              let initCans
              let mgr
              return { 
                beforeAll: () => {
                    mgr = sut(
                      { sway: mockSway
                      , logger: { of: () => ({ debug: () => {}, info: () => {} }) }
                      }
                    )
                    
                    const err = mgr.set(cans)
                    
                    if (err) { console.log(err.rejections[0]); throw err }
                    
                    initCan = mgr.set.cans.twoTimesCan
                }
              , 'and there is a responder in the can' :
                { beforeAll: () => {
                      response = mgr.response({mock:'key'})
                  }
                , 'should return the canned response' :
                  () => Should(response).eql( mockCannedResp )
                , 'should decrease the .times indicator on the responder' :
                  () => Should(initCan[0]).have.property('times', 1)
                , 'and the responder is used-up' :
                  { before: () => mgr.response({mock:'key'})
                  , 'should drop the responder from the can for this operation' :
                    () => Should(mgr.set.cans.twoTimesCan).have.property('length', 1)
                  }
                , 'and the can is used up' :
                  { before: () => mgr.response({mock:'key'})
                  }
                }
              , 'and there is no responder in the can': 'TBD  - should empty cans be already discarded?'
              }
          })        
        }
      }
    }
  }
}