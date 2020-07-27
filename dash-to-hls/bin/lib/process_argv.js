const grep_argv = require('./grep_argv')

let argv_vals
try {
  argv_vals = grep_argv({
    "--help":                                 {bool: true},
    "--version":                              {bool: true},

    "--tls":                                  {bool: true},
    "--host":                                 {},
    "--port":                                 {num:  true},

    "--req-headers":                          {file: "json"},
    "--origin":                               {},
    "--referer":                              {},
    "--useragent":                            {},
    "--header":                               {many: true},

    "--req-options":                          {file: "json"},
    "--req-secure-honor-server-cipher-order": {bool: true},
    "--req-secure-ciphers":                   {},
    "--req-secure-protocol":                  {},
    "--req-secure-curve":                     {},

    "-v":                                     {num:  true},
    "--acl-whitelist":                        {}
  }, true)
}
catch(e) {
  console.log('ERROR: ' + e.message)
  process.exit(0)
}

if (argv_vals["--help"]) {
  console.log(`
usage:
======
dash-to-hls [--help] [--version] [--tls] [--host <ip_address>] [--port <number>] [--req-headers <filepath>] [--origin <header>] [--referer <header>] [--useragent <header>] [--header <name=value>] [--req-options <filepath>] [--req-secure-honor-server-cipher-order] [--req-secure-ciphers <string>] [--req-secure-protocol <string>] [--req-secure-curve <string>] [-v <number>] [--acl-whitelist <ip_address_list>]
` )
  process.exit(0)
}

if (argv_vals["--version"]) {
  let data = require('../../../package.json')
  console.log(data.version)
  process.exit(0)
}

if (argv_vals["--origin"] || argv_vals["--referer"] || argv_vals["--useragent"] || (Array.isArray(argv_vals["--header"]) && argv_vals["--header"].length)) {
  argv_vals["--req-headers"] = argv_vals["--req-headers"] || {}

  if (argv_vals["--origin"]) {
    argv_vals["--req-headers"]["Origin"] = argv_vals["--origin"]
  }
  if (argv_vals["--referer"]) {
    argv_vals["--req-headers"]["Referer"] = argv_vals["--referer"]
  }
  if (argv_vals["--useragent"]) {
    argv_vals["--req-headers"]["User-Agent"] = argv_vals["--useragent"]
  }
  if (Array.isArray(argv_vals["--header"]) && argv_vals["--header"].length) {
    let split = function(str, sep) {
      let chunks, start

      chunks = str.split(sep, 2)
      if (chunks.length !== 2) return chunks

      start = chunks[0].length
      start = chunks[1] ? str.indexOf(chunks[1], start) : -1

      if (start === -1)
        delete chunks[1]
      else
        chunks[1] = str.substr(start)

      return chunks
    }

    argv_vals["--header"].forEach((header) => {
      let parts = split(header, /\s*[:=]\s*/g)
      let key, val

      if (parts.length === 2) {
        key = parts[0]
        val = parts[1]
        argv_vals["--req-headers"][key] = val
      }
    })
  }
}

// =============================================================================
// references:
// =============================================================================
//   https://stackoverflow.com/a/44635449
//   https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options
//   https://www.openssl.org/docs/man1.1.0/ssl/ssl.html#Dealing-with-Protocol-Methods
//   https://www.openssl.org/docs/man1.1.0/ssl/SSL_CTX_new.html
// =============================================================================
if (argv_vals["--req-secure-honor-server-cipher-order"] || argv_vals["--req-secure-ciphers"] || argv_vals["--req-secure-protocol"] || argv_vals["--req-secure-curve"]) {
  argv_vals["--req-options"] = argv_vals["--req-options"] || {}

  if (argv_vals["--req-secure-honor-server-cipher-order"]) {
    argv_vals["--req-options"]["honorCipherOrder"] = true
  }
  if (argv_vals["--req-secure-ciphers"]) {
    argv_vals["--req-options"]["ciphers"] = argv_vals["--req-secure-ciphers"]
  }
  if (argv_vals["--req-secure-protocol"]) {
    argv_vals["--req-options"]["secureProtocol"] = argv_vals["--req-secure-protocol"]
  }
  if (argv_vals["--req-secure-curve"]) {
    argv_vals["--req-options"]["ecdhCurve"] = argv_vals["--req-secure-curve"]
  }
}

const bootstrap_server = function(start_server) {
  start_server({
    host:           argv_vals["--host"],
    port:           argv_vals["--port"],
    req_headers:    argv_vals["--req-headers"],
    req_options:    argv_vals["--req-options"],
    verbosity:      argv_vals["-v"]             ||  0,
    acl_whitelist:  argv_vals["--acl-whitelist"]
  })
}

module.exports = {argv_vals, bootstrap_server}
