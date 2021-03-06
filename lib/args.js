const path  = require('path')
const yargs =
  require('yargs')
  .usage("oas --spec <path to oas spec>")
  .options(
    { s:
      { alias:    'spec'
      , describe: 'MANDATORY. name of a requirable module(json, js or yaml) that returns the OAS document or a promise that resolves to OAS document. Relative paths are resolved relative to process.cwd()'
      }
    , p:
      { alias:    'port'
      , describe: 'the TCP port to bind the server, overrides whatever is found in the spec'
      //, type:     'number'
      , default:  3000
      }
    , n:
      { alias:    'hostname'
      , describe: 'the hostname to run the server, overrides whatever is found in the spec'
      , default:  'localhost'
      }
    , m:
      { alias:    'management-path'
      , describe: 'the base path for management operations (PUT = set responds, GET = view log)'
      , default:  '/oas'
      }
    , g:
      { alias:    'shutdown-grace'
      , describe: 'how much ms to wait for graceful shutdown before killing the server abruptly'
      , default:  1500
      }
    , l:
      { alias:    'logLevel'
      , describe: 'log level: DEBUG|INFO|WARN|ERROR|FATAL'
      , default:  'INFO'
      }
    , h:
      { alias:    'help'
      , describe: 'you\'re looking at it...'
      }
    }
  )

module.exports = parse

function parse(process, log) {
    const argv = process.argv
    //strip ["node","<scriptname>"] from argv
    const args = yargs.parse(argv.slice(2))

    if (!args.spec || args.help) {
        yargs.showHelp(log)
        return process.exit()
    }

    return args
}
