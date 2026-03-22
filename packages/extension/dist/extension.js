"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../cli/dist/contracts/bridge.js
var require_bridge = __commonJS({
  "../cli/dist/contracts/bridge.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BRIDGE_ACTIONS = exports2.BRIDGE_PATHS = void 0;
    exports2.isBridgeAction = isBridgeAction;
    exports2.BRIDGE_PATHS = {
      ping: "/ping",
      send: "/send",
      chat: "/chat",
      action: "/action",
      listCascades: "/list-cascades",
      artifacts: "/artifacts",
      conversation: (conversationId) => `/conversation/${conversationId}`,
      artifact: (conversationId, artifactPath) => `/artifacts/${conversationId}?path=${encodeURIComponent(artifactPath)}`
    };
    exports2.BRIDGE_ACTIONS = {
      startNewChat: "start_new_chat",
      focusChat: "focus_chat",
      acceptStep: "accept_step",
      allow: "allow",
      rejectStep: "reject_step",
      terminalRun: "terminal_run",
      switchChat: "switch_chat"
    };
    function isBridgeAction(value) {
      return Object.values(exports2.BRIDGE_ACTIONS).includes(value);
    }
  }
});

// ../cli/dist/contracts/conversation.js
var require_conversation = __commonJS({
  "../cli/dist/contracts/conversation.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.CORTEX_STEP_TYPE_NOTIFY_USER = exports2.CORTEX_STEP_TYPE_MODEL_RESPONSE = exports2.CORTEX_STEP_TYPE_PLANNER_RESPONSE = exports2.CORTEX_STEP_TYPE_USER_INPUT = exports2.CASCADE_RUN_STATUS_IDLE = void 0;
    exports2.getConversationSteps = getConversationSteps;
    exports2.isConversationFinished = isConversationFinished;
    exports2.isCascadeIdle = isCascadeIdle;
    exports2.extractConversationText = extractConversationText;
    exports2.CASCADE_RUN_STATUS_IDLE = "CASCADE_RUN_STATUS_IDLE";
    exports2.CORTEX_STEP_TYPE_USER_INPUT = "CORTEX_STEP_TYPE_USER_INPUT";
    exports2.CORTEX_STEP_TYPE_PLANNER_RESPONSE = "CORTEX_STEP_TYPE_PLANNER_RESPONSE";
    exports2.CORTEX_STEP_TYPE_MODEL_RESPONSE = "CORTEX_STEP_TYPE_MODEL_RESPONSE";
    exports2.CORTEX_STEP_TYPE_NOTIFY_USER = "CORTEX_STEP_TYPE_NOTIFY_USER";
    function isRecord2(value) {
      return typeof value === "object" && value !== null;
    }
    function hasCascadeStatusEntry(value) {
      return isRecord2(value) && (value.status === void 0 || typeof value.status === "string");
    }
    function getConversationSteps(data) {
      return data.trajectory?.steps ?? [];
    }
    function isConversationFinished(data) {
      const steps = getConversationSteps(data);
      const lastStep = steps.at(-1);
      return Boolean(lastStep && lastStep.type !== exports2.CORTEX_STEP_TYPE_USER_INPUT);
    }
    function isCascadeIdle(listData, conversationId) {
      if (!isRecord2(listData)) {
        return false;
      }
      const entry = listData[conversationId];
      if (!hasCascadeStatusEntry(entry)) {
        return false;
      }
      return entry.status === exports2.CASCADE_RUN_STATUS_IDLE;
    }
    function extractConversationText(data) {
      const steps = getConversationSteps(data);
      for (let index = steps.length - 1; index >= 0; index -= 1) {
        const step = steps[index];
        if (step.type === exports2.CORTEX_STEP_TYPE_PLANNER_RESPONSE) {
          return step.plannerResponse?.modifiedResponse ?? step.plannerResponse?.response ?? null;
        }
        if (step.type === exports2.CORTEX_STEP_TYPE_MODEL_RESPONSE) {
          return step.modelResponse?.text ?? null;
        }
        if (step.type === exports2.CORTEX_STEP_TYPE_NOTIFY_USER) {
          return step.notifyUser?.notificationContent ?? null;
        }
      }
      return null;
    }
  }
});

// ../cli/dist/client/http.js
var require_http = __commonJS({
  "../cli/dist/client/http.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createBridgeHttpClient = createBridgeHttpClient;
    var bridge_1 = require_bridge();
    function createBridgeHttpClient(baseUrl) {
      async function request(path3, options = {}) {
        const requestInit = {
          method: options.method ?? "GET",
          headers: {
            "Content-Type": "application/json",
            ...options.headers
          }
        };
        if (options.body !== void 0) {
          requestInit.body = options.body;
        }
        const response = await fetch(`${baseUrl}${path3}`, requestInit);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          return response.json();
        }
        return response.text();
      }
      return {
        request,
        ping: () => request(bridge_1.BRIDGE_PATHS.ping),
        send: (text) => request(bridge_1.BRIDGE_PATHS.send, {
          method: "POST",
          body: JSON.stringify({ text })
        }),
        listCascades: () => request(bridge_1.BRIDGE_PATHS.listCascades),
        getConversation: (conversationId) => request(bridge_1.BRIDGE_PATHS.conversation(conversationId)),
        runAction: (type) => request(bridge_1.BRIDGE_PATHS.action, {
          method: "POST",
          body: JSON.stringify({ type })
        })
      };
    }
  }
});

// ../cli/dist/client/ask.js
var require_ask = __commonJS({
  "../cli/dist/client/ask.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.waitForAskResponse = waitForAskResponse;
    var conversation_1 = require_conversation();
    async function waitForAskResponse(client, text, options = {}) {
      const sendResult = await client.send(text);
      if (!sendResult.success || !sendResult.conversation_id) {
        throw new Error("Failed to obtain conversation_id after sending.");
      }
      const conversationId = sendResult.conversation_id;
      const pollIntervalMs = options.pollIntervalMs ?? 3e3;
      while (true) {
        await delay2(pollIntervalMs);
        options.onPoll?.();
        try {
          const cascades = await client.listCascades();
          if (!(0, conversation_1.isCascadeIdle)(cascades, conversationId)) {
            continue;
          }
          const conversation = await client.getConversation(conversationId);
          if (!(0, conversation_1.isConversationFinished)(conversation)) {
            continue;
          }
          return {
            conversationId,
            conversation,
            text: (0, conversation_1.extractConversationText)(conversation)
          };
        } catch (error) {
          options.onPollError?.(error);
        }
      }
    }
    function delay2(ms) {
      return new Promise((resolve2) => setTimeout(resolve2, ms));
    }
  }
});

// ../cli/dist/index.js
var require_dist = __commonJS({
  "../cli/dist/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    __exportStar(require_bridge(), exports2);
    __exportStar(require_conversation(), exports2);
    __exportStar(require_http(), exports2);
    __exportStar(require_ask(), exports2);
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/constants.js"(exports2, module2) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module2.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
      kListener: Symbol("kListener"),
      kStatusCode: Symbol("status-code"),
      kWebSocket: Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/buffer-util.js"(exports2, module2) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module2.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = require("bufferutil");
        module2.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module2.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/limiter.js"(exports2, module2) {
    "use strict";
    var kDone = Symbol("kDone");
    var kRun = Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module2.exports = Limiter;
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/permessage-deflate.js"(exports2, module2) {
    "use strict";
    var zlib = require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = Symbol("permessage-deflate");
    var kTotalLength = Symbol("total-length");
    var kCallback = Symbol("callback");
    var kBuffers = Symbol("buffers");
    var kError = Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       * @param {Boolean} [isServer=false] Create the instance in either server or
       *     client mode
       * @param {Number} [maxPayload=0] The maximum allowed message length
       */
      constructor(options, isServer, maxPayload) {
        this._maxPayload = maxPayload | 0;
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._isServer = !!isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module2.exports = PerMessageDeflate;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/validation.js"(exports2, module2) {
    "use strict";
    var { isUtf8 } = require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module2.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module2.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = require("utf-8-validate");
        module2.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/receiver.js"(exports2, module2) {
    "use strict";
    var { Writable } = require("stream");
    var PerMessageDeflate = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module2.exports = Receiver2;
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/sender.js"(exports2, module2) {
    "use strict";
    var { Duplex } = require("stream");
    var { randomFillSync } = require("crypto");
    var PerMessageDeflate = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else {
            buf.set(data, 2);
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module2.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/event-target.js"(exports2, module2) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = Symbol("kCode");
    var kData = Symbol("kData");
    var kError = Symbol("kError");
    var kMessage = Symbol("kMessage");
    var kReason = Symbol("kReason");
    var kTarget = Symbol("kTarget");
    var kType = Symbol("kType");
    var kWasClean = Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module2.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/extension.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension) => {
        let configurations = extensions[extension];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module2.exports = { format, parse };
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/websocket.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var https = require("https");
    var http = require("http");
    var net = require("net");
    var tls = require("tls");
    var { randomBytes, createHash } = require("crypto");
    var { Duplex, Readable: Readable2 } = require("stream");
    var { URL: URL2 } = require("url");
    var PerMessageDeflate = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener: addEventListener2, removeEventListener }
    } = require_event_target();
    var { format, parse } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate.extensionName]) {
          this._extensions[PerMessageDeflate.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener2;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module2.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL2) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL2(address);
        } catch (e) {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString("base64");
      const request = isSecure ? https.request : http.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate(
          opts.perMessageDeflate !== true ? opts.perMessageDeflate : {},
          false,
          opts.maxPayload
        );
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL2(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/stream.js"(exports2, module2) {
    "use strict";
    var WebSocket2 = require_websocket();
    var { Duplex } = require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module2.exports = createWebSocketStream2;
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/subprotocol.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module2.exports = { parse };
  }
});

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/lib/websocket-server.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var http = require("http");
    var { Duplex } = require("stream");
    var { createHash } = require("crypto");
    var extension = require_extension();
    var PerMessageDeflate = require_permessage_deflate();
    var subprotocol = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 13 && version !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate(
            this.options.perMessageDeflate,
            true,
            this.options.maxPayload
          );
          try {
            const offers = extension.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
              extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate.extensionName]) {
          const params = extensions[PerMessageDeflate.extensionName].params;
          const value = extension.format({
            [PerMessageDeflate.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module2.exports = WebSocketServer2;
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// ../../node_modules/.pnpm/antigravity-sdk@1.7.0_@types+vscode@1.110.0/node_modules/antigravity-sdk/dist/index.js
var require_dist2 = __commonJS({
  "../../node_modules/.pnpm/antigravity-sdk@1.7.0_@types+vscode@1.110.0/node_modules/antigravity-sdk/dist/index.js"(exports2) {
    "use strict";
    var path3 = require("path");
    var fs3 = require("fs");
    var vscode4 = require("vscode");
    var crypto2 = require("crypto");
    function _interopNamespace(e) {
      if (e && e.__esModule) return e;
      var n = /* @__PURE__ */ Object.create(null);
      if (e) {
        Object.keys(e).forEach(function(k) {
          if (k !== "default") {
            var d = Object.getOwnPropertyDescriptor(e, k);
            Object.defineProperty(n, k, d.get ? d : {
              enumerable: true,
              get: function() {
                return e[k];
              }
            });
          }
        });
      }
      n.default = e;
      return Object.freeze(n);
    }
    var path3__namespace = /* @__PURE__ */ _interopNamespace(path3);
    var fs3__namespace = /* @__PURE__ */ _interopNamespace(fs3);
    var vscode__namespace = /* @__PURE__ */ _interopNamespace(vscode4);
    var crypto__namespace = /* @__PURE__ */ _interopNamespace(crypto2);
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
      get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
    }) : x)(function(x) {
      if (typeof require !== "undefined") return require.apply(this, arguments);
      throw Error('Dynamic require of "' + x + '" is not supported');
    });
    var __commonJS2 = (cb, mod) => function __require2() {
      return mod || (0, cb[__getOwnPropNames2(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    };
    var require_package = __commonJS2({
      "package.json"(exports$1, module3) {
        module3.exports = {
          name: "antigravity-sdk",
          version: "1.7.0",
          description: "Community SDK for building extensions for Antigravity IDE",
          main: "dist/index.js",
          types: "dist/index.d.ts",
          files: [
            "dist"
          ],
          scripts: {
            build: "tsup",
            dev: "tsup --watch",
            lint: "eslint src/",
            docs: "typedoc --out docs-site src/index.ts",
            prepublishOnly: "npm run build"
          },
          keywords: [
            "antigravity",
            "antigravity-ide",
            "google-antigravity",
            "sdk",
            "cascade",
            "ai-agent",
            "vscode-extension"
          ],
          author: "Kanezal",
          license: "AGPL-3.0-or-later",
          repository: {
            type: "git",
            url: "git+https://github.com/Kanezal/antigravity-sdk.git"
          },
          homepage: "https://kanezal.github.io/antigravity-sdk",
          engines: {
            node: ">=16.0.0"
          },
          antigravityVersions: ">=1.107.0",
          peerDependencies: {
            "@types/vscode": "^1.85.0"
          },
          devDependencies: {
            "@types/node": "^20.0.0",
            "@types/vscode": "^1.85.0",
            "@typescript-eslint/eslint-plugin": "^8.0.0",
            "@typescript-eslint/parser": "^8.0.0",
            eslint: "^9.0.0",
            tsup: "^8.0.0",
            typedoc: "^0.27.0",
            typescript: "^5.0.0"
          },
          dependencies: {
            "sql.js": "^1.14.0"
          }
        };
      }
    });
    var TerminalExecutionPolicy = /* @__PURE__ */ ((TerminalExecutionPolicy2) => {
      TerminalExecutionPolicy2[TerminalExecutionPolicy2["OFF"] = 1] = "OFF";
      TerminalExecutionPolicy2[TerminalExecutionPolicy2["AUTO"] = 2] = "AUTO";
      TerminalExecutionPolicy2[TerminalExecutionPolicy2["EAGER"] = 3] = "EAGER";
      return TerminalExecutionPolicy2;
    })(TerminalExecutionPolicy || {});
    var ArtifactReviewPolicy = /* @__PURE__ */ ((ArtifactReviewPolicy2) => {
      ArtifactReviewPolicy2[ArtifactReviewPolicy2["ALWAYS"] = 1] = "ALWAYS";
      ArtifactReviewPolicy2[ArtifactReviewPolicy2["TURBO"] = 2] = "TURBO";
      ArtifactReviewPolicy2[ArtifactReviewPolicy2["AUTO"] = 3] = "AUTO";
      return ArtifactReviewPolicy2;
    })(ArtifactReviewPolicy || {});
    var CortexStepType = /* @__PURE__ */ ((CortexStepType2) => {
      CortexStepType2["RunCommand"] = "RunCommand";
      CortexStepType2["WriteToFile"] = "WriteToFile";
      CortexStepType2["ViewFile"] = "ViewFile";
      CortexStepType2["ViewFileOutline"] = "ViewFileOutline";
      CortexStepType2["ViewCodeItem"] = "ViewCodeItem";
      CortexStepType2["SearchWeb"] = "SearchWeb";
      CortexStepType2["ReadUrlContent"] = "ReadUrlContent";
      CortexStepType2["OpenBrowserUrl"] = "OpenBrowserUrl";
      CortexStepType2["ReadBrowserPage"] = "ReadBrowserPage";
      CortexStepType2["ListBrowserPages"] = "ListBrowserPages";
      CortexStepType2["ListDirectory"] = "ListDirectory";
      CortexStepType2["FindByName"] = "FindByName";
      CortexStepType2["CodebaseSearch"] = "CodebaseSearch";
      CortexStepType2["GrepSearch"] = "GrepSearch";
      CortexStepType2["SendCommandInput"] = "SendCommandInput";
      CortexStepType2["ReadTerminal"] = "ReadTerminal";
      CortexStepType2["ShellExec"] = "ShellExec";
      CortexStepType2["McpTool"] = "McpTool";
      CortexStepType2["InvokeSubagent"] = "InvokeSubagent";
      CortexStepType2["Memory"] = "Memory";
      CortexStepType2["KnowledgeGeneration"] = "KnowledgeGeneration";
      CortexStepType2["UserInput"] = "UserInput";
      CortexStepType2["SystemMessage"] = "SystemMessage";
      CortexStepType2["PlannerResponse"] = "PlannerResponse";
      CortexStepType2["Wait"] = "Wait";
      CortexStepType2["ProposeCode"] = "ProposeCode";
      CortexStepType2["WriteCascadeEdit"] = "WriteCascadeEdit";
      return CortexStepType2;
    })(CortexStepType || {});
    var StepStatus = /* @__PURE__ */ ((StepStatus2) => {
      StepStatus2["Running"] = "running";
      StepStatus2["Completed"] = "completed";
      StepStatus2["Failed"] = "failed";
      StepStatus2["WaitingForUser"] = "waiting_for_user";
      StepStatus2["Cancelled"] = "cancelled";
      return StepStatus2;
    })(StepStatus || {});
    var TrajectoryType = /* @__PURE__ */ ((TrajectoryType2) => {
      TrajectoryType2["Chat"] = "chat";
      TrajectoryType2["Cascade"] = "cascade";
      return TrajectoryType2;
    })(TrajectoryType || {});
    var EventEmitter = class {
      constructor() {
        this._listeners = /* @__PURE__ */ new Set();
        this._disposed = false;
        this.event = (listener) => {
          if (this._disposed) {
            throw new Error("EventEmitter has been disposed");
          }
          this._listeners.add(listener);
          return {
            dispose: () => {
              this._listeners.delete(listener);
            }
          };
        };
      }
      /**
       * Fire the event, notifying all listeners.
       *
       * @param data - The event data to send to listeners
       */
      fire(data) {
        if (this._disposed) {
          return;
        }
        for (const listener of this._listeners) {
          try {
            listener(data);
          } catch (error) {
            console.error("[AntigravitySDK] Event listener error:", error);
          }
        }
      }
      /**
       * Subscribe to the event, but only fire once.
       *
       * @param listener - Callback to invoke once
       * @returns Disposable to cancel before the event fires
       */
      once(listener) {
        const sub = this.event((data) => {
          sub.dispose();
          listener(data);
        });
        return sub;
      }
      /**
       * Get the current number of listeners.
       */
      get listenerCount() {
        return this._listeners.size;
      }
      /**
       * Dispose of the emitter and all listeners.
       */
      dispose() {
        this._disposed = true;
        this._listeners.clear();
      }
    };
    var DisposableStore = class {
      constructor() {
        this._disposables = [];
        this._disposed = false;
      }
      /**
       * Add a disposable to the store.
       *
       * @param disposable - The disposable to track
       * @returns The same disposable (for chaining)
       */
      add(disposable) {
        if (this._disposed) {
          disposable.dispose();
          console.warn("[AntigravitySDK] Adding disposable to already disposed store");
        } else {
          this._disposables.push(disposable);
        }
        return disposable;
      }
      /**
       * Dispose all tracked disposables.
       */
      dispose() {
        if (this._disposed) {
          return;
        }
        this._disposed = true;
        for (const d of this._disposables) {
          try {
            d.dispose();
          } catch (error) {
            console.error("[AntigravitySDK] Dispose error:", error);
          }
        }
        this._disposables.length = 0;
      }
    };
    function toDisposable(fn) {
      return { dispose: fn };
    }
    var AntigravitySDKError = class extends Error {
      constructor(message) {
        super(`[AntigravitySDK] ${message}`);
        this.name = "AntigravitySDKError";
      }
    };
    var AntigravityNotFoundError = class extends AntigravitySDKError {
      constructor() {
        super("Antigravity IDE not detected. Make sure this extension is running inside Antigravity.");
        this.name = "AntigravityNotFoundError";
      }
    };
    var CommandExecutionError = class extends AntigravitySDKError {
      constructor(command, reason) {
        super(`Command "${command}" failed: ${reason}`);
        this.command = command;
        this.reason = reason;
        this.name = "CommandExecutionError";
      }
    };
    var StateReadError = class extends AntigravitySDKError {
      constructor(key, reason) {
        super(`Failed to read state key "${key}": ${reason}`);
        this.key = key;
        this.reason = reason;
        this.name = "StateReadError";
      }
    };
    var SessionNotFoundError = class extends AntigravitySDKError {
      constructor(sessionId) {
        super(`Session "${sessionId}" not found`);
        this.sessionId = sessionId;
        this.name = "SessionNotFoundError";
      }
    };
    var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
      LogLevel2[LogLevel2["Debug"] = 0] = "Debug";
      LogLevel2[LogLevel2["Info"] = 1] = "Info";
      LogLevel2[LogLevel2["Warn"] = 2] = "Warn";
      LogLevel2[LogLevel2["Error"] = 3] = "Error";
      LogLevel2[LogLevel2["Off"] = 4] = "Off";
      return LogLevel2;
    })(LogLevel || {});
    var _Logger = class _Logger2 {
      /**
       * Create a logger for a specific module.
       *
       * @param module - Module name (shown in log prefix)
       */
      constructor(module3) {
        this.module = module3;
      }
      /**
       * Set the global log level for all SDK loggers.
       *
       * @param level - Minimum level to output
       */
      static setLevel(level) {
        _Logger2._globalLevel = level;
      }
      /**
       * Route SDK logs to a VS Code OutputChannel (or any line-based sink).
       * Pass `null` to disable.
       *
       * @example
       * ```typescript
       * const out = vscode.window.createOutputChannel('My Extension');
       * Logger.setOutput(msg => out.appendLine(msg));
       * ```
       */
      static setOutput(fn) {
        _Logger2._outputFn = fn;
      }
      /** Log a debug message. */
      debug(message, ...args) {
        this._log(0, message, args);
      }
      /** Log an informational message. */
      info(message, ...args) {
        this._log(1, message, args);
      }
      /** Log a warning. */
      warn(message, ...args) {
        this._log(2, message, args);
      }
      /** Log an error. */
      error(message, ...args) {
        this._log(3, message, args);
      }
      _log(level, message, args) {
        if (level < _Logger2._globalLevel) {
          return;
        }
        const prefix = `[AntigravitySDK:${this.module}]`;
        const fn = level === 3 ? console.error : level === 2 ? console.warn : level === 1 ? console.info : console.debug;
        fn(prefix, message, ...args);
        if (_Logger2._outputFn) {
          const levelStr = LogLevel[level].toUpperCase().padEnd(5);
          const extra = args.length ? " " + args.map((a) => a instanceof Error ? a.message : String(a)).join(" ") : "";
          _Logger2._outputFn(`[SDK:${this.module}] ${levelStr} ${message}${extra}`);
        }
      }
    };
    _Logger._globalLevel = 2;
    _Logger._outputFn = null;
    var Logger = _Logger;
    function parseVersion(v) {
      return String(v).split(".").map(Number);
    }
    function cmpVersion(a, b) {
      for (let i = 0; i < 3; i++) {
        const diff = (a[i] || 0) - (b[i] || 0);
        if (diff !== 0) return diff < 0 ? -1 : 1;
      }
      return 0;
    }
    function parseRange(range) {
      return range.trim().split(/\s+/).map((part) => {
        const m = part.match(/^(>=|<=|>|<|=)?(\d[\d.]*)$/);
        if (!m) throw new Error(`Invalid AG version constraint: "${part}"`);
        return { op: m[1] || "=", ver: parseVersion(m[2]) };
      });
    }
    function satisfies(version, rangeStr) {
      const v = parseVersion(version);
      return parseRange(rangeStr).every(({ op, ver }) => {
        const cmp = cmpVersion(v, ver);
        switch (op) {
          case ">=":
            return cmp >= 0;
          case "<=":
            return cmp <= 0;
          case ">":
            return cmp > 0;
          case "<":
            return cmp < 0;
          case "=":
            return cmp === 0;
          default:
            return false;
        }
      });
    }
    function detectAGVersion() {
      try {
        const localAppData = process.env.LOCALAPPDATA || "";
        const agPkgPath = path3__namespace.join(localAppData, "Programs", "Antigravity", "resources", "app", "package.json");
        if (!fs3__namespace.existsSync(agPkgPath)) return null;
        const agPkg = JSON.parse(fs3__namespace.readFileSync(agPkgPath, "utf8"));
        const version = agPkg.version;
        if (!version) return null;
        const sdkPkgPath = path3__namespace.join(__dirname, "..", "..", "package.json");
        const sdkPkg = JSON.parse(fs3__namespace.readFileSync(sdkPkgPath, "utf8"));
        const supportedRange = sdkPkg.antigravityVersions ?? "*";
        const compatible = supportedRange === "*" || satisfies(version, supportedRange);
        return { version, compatible, supportedRange };
      } catch {
        return null;
      }
    }
    var log = new Logger("CommandBridge");
    var AntigravityCommands2 = {
      // ─── Agent Panel & UI (VERIFIED: .open/.focus suffix required) ────────
      /** Open the Cascade agent panel */
      OPEN_AGENT_PANEL: "antigravity.agentPanel.open",
      /** Focus the Cascade agent panel */
      FOCUS_AGENT_PANEL: "antigravity.agentPanel.focus",
      /** Open the agent side panel */
      OPEN_AGENT_SIDE_PANEL: "antigravity.agentSidePanel.open",
      /** Focus the agent side panel */
      FOCUS_AGENT_SIDE_PANEL: "antigravity.agentSidePanel.focus",
      /** Toggle side panel visibility */
      TOGGLE_SIDE_PANEL: "antigravity.agentSidePanel.toggleVisibility",
      /** Open agent (generic) */
      OPEN_AGENT: "antigravity.openAgent",
      /** Toggle chat focus */
      TOGGLE_CHAT_FOCUS: "antigravity.toggleChatFocus",
      /** Switch between workspace editor and agent view */
      SWITCH_WORKSPACE_AGENT: "antigravity.switchBetweenWorkspaceAndAgent",
      // ─── Conversation Management (Critical for SDK) ──────────────────────
      /** Start a new conversation */
      START_NEW_CONVERSATION: "antigravity.startNewConversation",
      /** Send a prompt to the agent panel */
      SEND_PROMPT_TO_AGENT: "antigravity.sendPromptToAgentPanel",
      /** Send text to chat */
      SEND_TEXT_TO_CHAT: "antigravity.sendTextToChat",
      /** Send a chat action message */
      SEND_CHAT_ACTION: "antigravity.sendChatActionMessage",
      /** Set which conversation is visible */
      SET_VISIBLE_CONVERSATION: "antigravity.setVisibleConversation",
      /** Execute a cascade action */
      EXECUTE_CASCADE_ACTION: "antigravity.executeCascadeAction",
      /** Broadcast conversation deletion to all windows */
      BROADCAST_CONVERSATION_DELETION: "antigravity.broadcastConversationDeletion",
      /** Track that a background conversation was created */
      TRACK_BACKGROUND_CONVERSATION: "antigravity.trackBackgroundConversationCreated",
      // ─── Agent Step Control (VERIFIED) ────────────────────────────────────
      /** Accept the current agent step */
      ACCEPT_AGENT_STEP: "antigravity.agent.acceptAgentStep",
      /** Reject the current agent step */
      REJECT_AGENT_STEP: "antigravity.agent.rejectAgentStep",
      /** Accept a pending command */
      COMMAND_ACCEPT: "antigravity.command.accept",
      /** Reject a pending command */
      COMMAND_REJECT: "antigravity.command.reject",
      /** Accept a terminal command */
      TERMINAL_ACCEPT: "antigravity.terminalCommand.accept",
      /** Reject a terminal command */
      TERMINAL_REJECT: "antigravity.terminalCommand.reject",
      /** Run a terminal command */
      TERMINAL_RUN: "antigravity.terminalCommand.run",
      /** Open new conversation (prioritized) */
      OPEN_NEW_CONVERSATION: "antigravity.prioritized.chat.openNewConversation",
      // ─── Terminal Integration ─────────────────────────────────────────────
      /** Notify terminal command started */
      TERMINAL_COMMAND_START: "antigravity.onManagerTerminalCommandStart",
      /** Notify terminal command data */
      TERMINAL_COMMAND_DATA: "antigravity.onManagerTerminalCommandData",
      /** Notify terminal command finished */
      TERMINAL_COMMAND_FINISH: "antigravity.onManagerTerminalCommandFinish",
      /** Update last terminal command */
      UPDATE_TERMINAL_LAST_COMMAND: "antigravity.updateTerminalLastCommand",
      /** Notify shell command completion */
      ON_SHELL_COMPLETION: "antigravity.onShellCommandCompletion",
      /** Show managed terminal */
      SHOW_MANAGED_TERMINAL: "antigravity.showManagedTerminal",
      /** Send terminal output to chat */
      SEND_TERMINAL_TO_CHAT: "antigravity.sendTerminalToChat",
      /** Send terminal output to side panel */
      SEND_TERMINAL_TO_SIDE_PANEL: "antigravity.sendTerminalToSidePanel",
      // ─── Agent & Mode ─────────────────────────────────────────────────────
      /** Initialize the agent */
      INITIALIZE_AGENT: "antigravity.initializeAgent",
      // ─── Conversation Picker & Workspace ──────────────────────────────────
      /** Open conversation workspace picker */
      OPEN_CONVERSATION_PICKER: "antigravity.openConversationWorkspaceQuickPick",
      /** Open conversation picker (alternative) */
      OPEN_CONV_PICKER_ALT: "antigravity.openConversationPicker",
      /** Set working directories */
      SET_WORKING_DIRS: "antigravity.setWorkingDirectories",
      // ─── Review & Diff ────────────────────────────────────────────────────
      /** Open review changes view */
      OPEN_REVIEW_CHANGES: "antigravity.openReviewChanges",
      /** Open diff view */
      OPEN_DIFF_VIEW: "antigravity.openDiffView",
      /** Open diff zones */
      OPEN_DIFF_ZONES: "antigravity.openDiffZones",
      /** Close all diff zones */
      CLOSE_ALL_DIFF_ZONES: "antigravity.closeAllDiffZones",
      // ─── Rules & Workflows ────────────────────────────────────────────────
      /** Create a new rule */
      CREATE_RULE: "antigravity.createRule",
      /** Create a new workflow */
      CREATE_WORKFLOW: "antigravity.createWorkflow",
      /** Create a global workflow */
      CREATE_GLOBAL_WORKFLOW: "antigravity.createGlobalWorkflow",
      /** Open global rules */
      OPEN_GLOBAL_RULES: "antigravity.openGlobalRules",
      /** Open workspace rules */
      OPEN_WORKSPACE_RULES: "antigravity.openWorkspaceRules",
      // ─── Plugins & MCP ────────────────────────────────────────────────────
      /** Open configure plugins page */
      OPEN_CONFIGURE_PLUGINS: "antigravity.openConfigurePluginsPage",
      /** Get Cascade plugin template */
      GET_PLUGIN_TEMPLATE: "antigravity.getCascadePluginTemplate",
      /** Poll MCP server states */
      POLL_MCP_SERVERS: "antigravity.pollMcpServerStates",
      /** Open MCP config file */
      OPEN_MCP_CONFIG: "antigravity.openMcpConfigFile",
      /** Open MCP docs page */
      OPEN_MCP_DOCS: "antigravity.openMcpDocsPage",
      /** Update plugin installation count */
      UPDATE_PLUGIN_COUNT: "antigravity.updatePluginInstallationCount",
      // ─── Autocomplete ─────────────────────────────────────────────────────
      /** Enable autocomplete */
      ENABLE_AUTOCOMPLETE: "antigravity.enableAutocomplete",
      /** Disable autocomplete */
      DISABLE_AUTOCOMPLETE: "antigravity.disableAutocomplete",
      /** Accept completion */
      ACCEPT_COMPLETION: "antigravity.acceptCompletion",
      /** Force supercomplete */
      FORCE_SUPERCOMPLETE: "antigravity.forceSupercomplete",
      /** Snooze autocomplete temporarily */
      SNOOZE_AUTOCOMPLETE: "antigravity.snoozeAutocomplete",
      /** Cancel snooze */
      CANCEL_SNOOZE: "antigravity.cancelSnoozeAutocomplete",
      // ─── Auth & Account ───────────────────────────────────────────────────
      /** Login to Antigravity */
      LOGIN: "antigravity.login",
      /** Cancel login */
      CANCEL_LOGIN: "antigravity.cancelLogin",
      /** Handle auth refresh */
      HANDLE_AUTH_REFRESH: "antigravity.handleAuthRefresh",
      /** Sign in to Antigravity */
      SIGN_IN: "antigravity.SignInToAntigravity",
      // ─── Diagnostics & Debug ──────────────────────────────────────────────
      /** Get diagnostics info */
      GET_DIAGNOSTICS: "antigravity.getDiagnostics",
      /** Download diagnostics bundle */
      DOWNLOAD_DIAGNOSTICS: "antigravity.downloadDiagnostics",
      /** Capture traces */
      CAPTURE_TRACES: "antigravity.captureTraces",
      /** Enable tracing */
      ENABLE_TRACING: "antigravity.enableTracing",
      /** Clear and disable tracing */
      CLEAR_TRACING: "antigravity.clearAndDisableTracing",
      /** Get manager trace */
      GET_MANAGER_TRACE: "antigravity.getManagerTrace",
      /** Get workbench trace */
      GET_WORKBENCH_TRACE: "antigravity.getWorkbenchTrace",
      /** Toggle debug info widget */
      TOGGLE_DEBUG_INFO: "antigravity.toggleDebugInfoWidget",
      /** Open troubleshooting */
      OPEN_TROUBLESHOOTING: "antigravity.openTroubleshooting",
      /** Open issue reporter */
      OPEN_ISSUE_REPORTER: "antigravity.openIssueReporter",
      // ─── Language Server ──────────────────────────────────────────────────
      /** Restart the language server */
      RESTART_LANGUAGE_SERVER: "antigravity.restartLanguageServer",
      /** Kill language server and reload window */
      KILL_LS_AND_RELOAD: "antigravity.killLanguageServerAndReloadWindow",
      // ─── Git & Commit ─────────────────────────────────────────────────────
      /** Generate commit message via AI */
      GENERATE_COMMIT_MESSAGE: "antigravity.generateCommitMessage",
      /** Cancel commit message generation */
      CANCEL_COMMIT_MESSAGE: "antigravity.cancelGenerateCommitMessage",
      // ─── Browser ──────────────────────────────────────────────────────────
      /** Open browser */
      OPEN_BROWSER: "antigravity.openBrowser",
      /** Get browser onboarding port (returns number, e.g. 57401) */
      GET_BROWSER_PORT: "antigravity.getBrowserOnboardingPort",
      // ─── Settings & Import ────────────────────────────────────────────────
      /** Open quick settings panel */
      OPEN_QUICK_SETTINGS: "antigravity.openQuickSettingsPanel",
      /** Open customizations tab */
      OPEN_CUSTOMIZATIONS: "antigravity.openCustomizationsTab",
      /** Import VS Code settings */
      IMPORT_VSCODE_SETTINGS: "antigravity.importVSCodeSettings",
      /** Import VS Code extensions */
      IMPORT_VSCODE_EXTENSIONS: "antigravity.importVSCodeExtensions",
      /** Import Cursor settings */
      IMPORT_CURSOR_SETTINGS: "antigravity.importCursorSettings",
      /** Import Cursor extensions */
      IMPORT_CURSOR_EXTENSIONS: "antigravity.importCursorExtensions",
      // ─── Misc ─────────────────────────────────────────────────────────────
      /** Reload window */
      RELOAD_WINDOW: "antigravity.reloadWindow",
      /** Open documentation */
      OPEN_DOCS: "antigravity.openDocs",
      /** Open changelog */
      OPEN_CHANGELOG: "antigravity.openChangeLog",
      /** Explain and fix problem (from diagnostics) */
      EXPLAIN_AND_FIX: "antigravity.explainAndFixProblem",
      /** Open a URL */
      OPEN_URL: "antigravity.openGenericUrl",
      /** Editor mode settings */
      EDITOR_MODE_SETTINGS: "antigravity.editorModeSettings"
    };
    var CommandBridge = class {
      constructor() {
        this._disposed = false;
      }
      /**
       * Execute an Antigravity command.
       *
       * @param command - The command ID to execute
       * @param args - Arguments to pass to the command
       * @returns The command's return value
       * @throws {CommandExecutionError} If the command fails
       */
      async execute(command, ...args) {
        if (this._disposed) {
          throw new CommandExecutionError(command, "CommandBridge has been disposed");
        }
        log.debug(`Executing: ${command}`, args.length > 0 ? args : "");
        try {
          const result = await vscode__namespace.commands.executeCommand(command, ...args);
          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          log.error(`Command failed: ${command}`, message);
          throw new CommandExecutionError(command, message);
        }
      }
      /**
       * Check if a command is registered and available.
       *
       * @param command - Command ID to check
       * @returns true if the command exists
       */
      async isAvailable(command) {
        const commands4 = await vscode__namespace.commands.getCommands(true);
        return commands4.includes(command);
      }
      /**
       * Get all registered Antigravity commands.
       *
       * @returns List of command IDs starting with 'antigravity.'
       */
      async getAntigravityCommands() {
        const commands4 = await vscode__namespace.commands.getCommands(true);
        return commands4.filter((cmd) => cmd.startsWith("antigravity."));
      }
      /**
       * Register a command handler.
       *
       * @param command - Command ID to register
       * @param handler - Function to handle the command
       * @returns Disposable to unregister the command
       */
      register(command, handler) {
        return vscode__namespace.commands.registerCommand(command, handler);
      }
      dispose() {
        this._disposed = true;
      }
    };
    var log2 = new Logger("StateBridge");
    var USSKeys = {
      /** Agent preferences — terminal policy, review policy, secure mode, etc. (1020 bytes) */
      AGENT_PREFERENCES: "antigravityUnifiedStateSync.agentPreferences",
      /** Conversation/trajectory summaries — titles, timestamps, workspace URIs (74KB+) */
      TRAJECTORY_SUMMARIES: "antigravityUnifiedStateSync.trajectorySummaries",
      /** Agent manager window state (192 bytes) */
      AGENT_MANAGER_WINDOW: "antigravityUnifiedStateSync.agentManagerWindow",
      /** Enterprise override store (56 bytes) */
      OVERRIDE_STORE: "antigravityUnifiedStateSync.overrideStore",
      /** Model preferences — selected model, sentinel key */
      MODEL_PREFERENCES: "antigravityUnifiedStateSync.modelPreferences",
      /** Artifact review state (1204 bytes) */
      ARTIFACT_REVIEW: "antigravityUnifiedStateSync.artifactReview",
      /** Browser preferences (380 bytes) */
      BROWSER_PREFERENCES: "antigravityUnifiedStateSync.browserPreferences",
      /** Editor preferences (108 bytes) */
      EDITOR_PREFERENCES: "antigravityUnifiedStateSync.editorPreferences",
      /** Tab preferences (404 bytes) */
      TAB_PREFERENCES: "antigravityUnifiedStateSync.tabPreferences",
      /** Window preferences (44 bytes) */
      WINDOW_PREFERENCES: "antigravityUnifiedStateSync.windowPreferences",
      /** Scratch/playground workspaces (268 bytes) */
      SCRATCH_WORKSPACES: "antigravityUnifiedStateSync.scratchWorkspaces",
      /** Sidebar workspaces — recent workspace list (5604 bytes) */
      SIDEBAR_WORKSPACES: "antigravityUnifiedStateSync.sidebarWorkspaces",
      /** User status info (5196 bytes) */
      USER_STATUS: "antigravityUnifiedStateSync.userStatus",
      /** Model credits/usage info */
      MODEL_CREDITS: "antigravityUnifiedStateSync.modelCredits",
      /** Onboarding state (140 bytes) */
      ONBOARDING: "antigravityUnifiedStateSync.onboarding",
      /** Seen NUX (new user experience) IDs (76 bytes) */
      SEEN_NUX_IDS: "antigravityUnifiedStateSync.seenNuxIds",
      // ⚠️ Jetski-specific state (separate sync namespace)
      /** Agent manager initialization state — contains auth tokens, workspace map (5144 bytes) */
      AGENT_MANAGER_INIT: "jetskiStateSync.agentManagerInitState",
      // ⚠️ Non-USS but relevant keys
      /** All user settings — JSON format */
      ALL_USER_SETTINGS: "antigravityUserSettings.allUserSettings",
      /** Allowed model configs for commands */
      ALLOWED_COMMAND_MODEL_CONFIGS: "antigravity_allowed_command_model_configs",
      /** Chat session store index (JSON: {"version":1,"entries":{}}) */
      CHAT_SESSION_INDEX: "chat.ChatSessionStore.index"
    };
    var SENSITIVE_KEYS = /* @__PURE__ */ new Set([
      "antigravityUnifiedStateSync.oauthToken",
      "jetskiStateSync.agentManagerInitState",
      "antigravityAuthStatus"
    ]);
    var SENTINEL_KEYS = {
      PLANNING_MODE: "planningModeSentinelKey",
      ARTIFACT_REVIEW_POLICY: "artifactReviewPolicySentinelKey",
      TERMINAL_AUTO_EXECUTION_POLICY: "terminalAutoExecutionPolicySentinelKey",
      ALLOW_NON_WORKSPACE_FILES: "allowAgentAccessNonWorkspaceFilesSentinelKey",
      ALLOW_GITIGNORE_ACCESS: "allowCascadeAccessGitignoreFilesSentinelKey",
      SECURE_MODE: "secureModeSentinelKey",
      EXPLAIN_FIX_IN_CONVO: "explainAndFixInCurrentConversationSentinelKey",
      AUTO_CONTINUE_ON_MAX: "autoContinueOnMaxGeneratorInvocationsSentinelKey",
      DISABLE_AUTO_OPEN_EDITED: "disableAutoOpenEditedFilesSentinelKey",
      ENABLE_SOUNDS: "enableSoundsForSpecialEventsSentinelKey",
      DISABLE_AUTO_FIX_LINTS: "disableCascadeAutoFixLintsSentinelKey",
      ENABLE_SHELL_INTEGRATION: "enableShellIntegrationSentinelKey",
      SANDBOX_ALLOW_NETWORK: "sandboxAllowNetworkSentinelKey",
      ENABLE_TERMINAL_SANDBOX: "enableTerminalSandboxSentinelKey"
    };
    var StateBridge = class {
      constructor() {
        this._dbPath = null;
        this._db = null;
        this._disposed = false;
      }
      /**
       * Initialize the state bridge by locating and opening state database.
       *
       * @throws {StateReadError} If the database cannot be found
       */
      async initialize() {
        const dbPath = this._findStateDb();
        if (!dbPath) {
          throw new StateReadError("state.vscdb", "Could not locate Antigravity state database");
        }
        this._dbPath = dbPath;
        try {
          const path6 = __require("path");
          const fs7 = __require("fs");
          let initSqlJs;
          const localSqlJs = path6.join(__dirname, "sql-wasm.js");
          if (fs7.existsSync(localSqlJs)) {
            initSqlJs = __require(localSqlJs);
          } else {
            initSqlJs = __require("sql.js");
          }
          const candidates = [
            // 1. Adjacent to this file (if wasm was bundled/copied to dist/)
            path6.join(__dirname, "sql-wasm.wasm"),
            // 2. sql.js package dist/ (standard npm install)
            path6.resolve(__dirname, "..", "node_modules", "sql.js", "dist", "sql-wasm.wasm"),
            // 3. Hoisted node_modules (monorepo / npm workspaces)
            path6.resolve(__dirname, "..", "..", "node_modules", "sql.js", "dist", "sql-wasm.wasm"),
            // 4. Walk up to find it (deep hoisting)
            path6.resolve(__dirname, "..", "..", "..", "node_modules", "sql.js", "dist", "sql-wasm.wasm")
          ];
          try {
            const sqlJsMain = __require.resolve("sql.js");
            candidates.unshift(path6.join(path6.dirname(sqlJsMain), "sql-wasm.wasm"));
          } catch {
          }
          let wasmPath = null;
          for (const p of candidates) {
            if (fs7.existsSync(p)) {
              wasmPath = p;
              break;
            }
          }
          if (!wasmPath) {
            throw new Error("sql-wasm.wasm not found in any expected location");
          }
          log2.debug(`sql-wasm.wasm located at: ${wasmPath}`);
          const SQL = await initSqlJs({
            locateFile: () => wasmPath
          });
          const fileBuffer = fs7.readFileSync(dbPath);
          const fileSizeKb = (fileBuffer.length / 1024).toFixed(1);
          this._db = new SQL.Database(fileBuffer);
          log2.info(`State database opened via sql.js: ${dbPath} (${fileSizeKb} KB)`);
        } catch (error) {
          log2.warn("sql.js not available, will use child_process fallback", error);
        }
      }
      /**
       * Read a raw value from the state database.
       *
       * @param key - The SQLite key to read
       * @returns The raw string value, or null if not found
       * @throws {StateReadError} If the key is sensitive or read fails
       */
      async getRawValue(key) {
        if (this._disposed) {
          throw new StateReadError(key, "StateBridge has been disposed");
        }
        if (!this._dbPath) {
          throw new StateReadError(key, "StateBridge not initialized");
        }
        if (SENSITIVE_KEYS.has(key)) {
          log2.warn(`Blocked access to sensitive key: ${key}`);
          throw new StateReadError(key, "Access to sensitive keys is blocked by the SDK for security");
        }
        log2.debug(`getRawValue: ${key} (${this._db ? "sql.js" : "child_process"})`);
        try {
          if (this._db) {
            return this._querySqlJs(key);
          }
          return await this._queryChildProcess(key);
        } catch (error) {
          if (error instanceof StateReadError) throw error;
          const msg = error instanceof Error ? error.message : String(error);
          throw new StateReadError(key, msg);
        }
      }
      /**
       * Get agent preferences from USS.
       *
       * @returns Parsed agent preferences
       */
      async getAgentPreferences() {
        log2.debug("getAgentPreferences: reading USS key");
        const raw2 = await this.getRawValue(USSKeys.AGENT_PREFERENCES);
        if (!raw2) {
          log2.warn("No agent preferences found, returning defaults");
          return this._defaultPreferences();
        }
        log2.debug(`getAgentPreferences: raw value length=${raw2.length}, parsing protobuf sentinels`);
        try {
          const prefs = this._parseAgentPreferences(raw2);
          log2.debug(`getAgentPreferences: terminalPolicy=${prefs.terminalExecutionPolicy}, secureMode=${prefs.secureModeEnabled}`);
          return prefs;
        } catch (error) {
          log2.error("Failed to parse preferences, returning defaults", error);
          return this._defaultPreferences();
        }
      }
      /**
       * Get all stored USS keys from the state database.
       *
       * @returns List of key names related to Antigravity (excludes sensitive keys)
       */
      async getAntigravityKeys() {
        if (!this._dbPath) {
          throw new StateReadError("*", "StateBridge not initialized");
        }
        let keys;
        if (this._db) {
          const result = this._db.exec(
            "SELECT key FROM ItemTable WHERE key LIKE '%antigravity%' OR key LIKE '%jetskiStateSync%' OR key LIKE 'chat.%'"
          );
          keys = result.length > 0 ? result[0].values.map((r) => r[0]) : [];
        } else {
          const result = await this._queryChildProcess("*");
          keys = result ? result.split("\n").map((l) => l.trim()).filter(Boolean) : [];
        }
        return keys.filter((k) => !SENSITIVE_KEYS.has(k));
      }
      /**
       * Query using sql.js (in-process, pure JS).
       */
      _querySqlJs(key) {
        const stmt = this._db.prepare("SELECT value FROM ItemTable WHERE key = $key");
        stmt.bind({ $key: key });
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row.value ?? null;
        }
        stmt.free();
        return null;
      }
      /**
       * Query using child_process sqlite3 CLI (fallback).
       */
      async _queryChildProcess(key) {
        const { exec } = __require("child_process");
        const { promisify } = __require("util");
        const execAsync = promisify(exec);
        const sql = key === "*" ? "SELECT key FROM ItemTable WHERE key LIKE '%antigravity%' OR key LIKE '%jetskiStateSync%'" : `SELECT value FROM ItemTable WHERE key = '${key.replace(/'/g, "''")}'`;
        try {
          const { stdout } = await execAsync(`sqlite3 "${this._dbPath}" "${sql}"`, {
            encoding: "utf8",
            timeout: 5e3
          });
          return stdout.trim() || null;
        } catch {
          return null;
        }
      }
      /**
       * Locate the state.vscdb file across platforms.
       */
      _findStateDb() {
        const candidates = [];
        const appData = process.env.APPDATA;
        if (appData) {
          candidates.push(path3__namespace.join(appData, "Antigravity", "User", "globalStorage", "state.vscdb"));
        }
        const home = process.env.HOME;
        if (home) {
          candidates.push(
            path3__namespace.join(
              home,
              "Library",
              "Application Support",
              "Antigravity",
              "User",
              "globalStorage",
              "state.vscdb"
            )
          );
        }
        if (home) {
          candidates.push(
            path3__namespace.join(home, ".config", "Antigravity", "User", "globalStorage", "state.vscdb")
          );
        }
        for (const candidate of candidates) {
          if (fs3__namespace.existsSync(candidate)) {
            return candidate;
          }
        }
        return null;
      }
      /**
       * Parse agent preferences from Base64(Protobuf).
       *
       * The protobuf structure uses "sentinel keys" as string fields:
       * - `planningModeSentinelKey` → nested message with Base64(varint)
       * - `terminalAutoExecutionPolicySentinelKey` → nested message with Base64(varint)
       * - `artifactReviewPolicySentinelKey` → nested message with Base64(varint)
       *
       * Each sentinel value is itself a small Base64 string (e.g., "EAM=" = varint 3 = EAGER).
       */
      _parseAgentPreferences(raw2) {
        const buffer = Buffer.from(raw2, "base64");
        const text = buffer.toString("utf8");
        const terminalPolicy = this._extractSentinelValue(text, SENTINEL_KEYS.TERMINAL_AUTO_EXECUTION_POLICY);
        const artifactPolicy = this._extractSentinelValue(text, SENTINEL_KEYS.ARTIFACT_REVIEW_POLICY);
        const planningMode = this._extractSentinelValue(text, SENTINEL_KEYS.PLANNING_MODE);
        const secureMode = this._extractSentinelValue(text, SENTINEL_KEYS.SECURE_MODE);
        const terminalSandbox = this._extractSentinelValue(text, SENTINEL_KEYS.ENABLE_TERMINAL_SANDBOX);
        const sandboxNetwork = this._extractSentinelValue(text, SENTINEL_KEYS.SANDBOX_ALLOW_NETWORK);
        const shellIntegration = this._extractSentinelValue(text, SENTINEL_KEYS.ENABLE_SHELL_INTEGRATION);
        const nonWorkspaceFiles = this._extractSentinelValue(text, SENTINEL_KEYS.ALLOW_NON_WORKSPACE_FILES);
        const gitignoreAccess = this._extractSentinelValue(text, SENTINEL_KEYS.ALLOW_GITIGNORE_ACCESS);
        const explainFix = this._extractSentinelValue(text, SENTINEL_KEYS.EXPLAIN_FIX_IN_CONVO);
        const autoContinue = this._extractSentinelValue(text, SENTINEL_KEYS.AUTO_CONTINUE_ON_MAX);
        const disableAutoOpen = this._extractSentinelValue(text, SENTINEL_KEYS.DISABLE_AUTO_OPEN_EDITED);
        const enableSounds = this._extractSentinelValue(text, SENTINEL_KEYS.ENABLE_SOUNDS);
        const disableAutoFix = this._extractSentinelValue(text, SENTINEL_KEYS.DISABLE_AUTO_FIX_LINTS);
        return {
          terminalExecutionPolicy: terminalPolicy ?? 1,
          artifactReviewPolicy: artifactPolicy ?? 1,
          planningMode: planningMode ?? 0,
          secureModeEnabled: (secureMode ?? 0) === 1,
          terminalSandboxEnabled: (terminalSandbox ?? 0) === 1,
          sandboxAllowNetwork: (sandboxNetwork ?? 0) === 1,
          shellIntegrationEnabled: (shellIntegration ?? 1) === 1,
          allowNonWorkspaceFiles: (nonWorkspaceFiles ?? 0) === 1,
          allowGitignoreAccess: (gitignoreAccess ?? 0) === 1,
          explainFixInCurrentConvo: (explainFix ?? 0) === 1,
          autoContinueOnMax: autoContinue ?? 0,
          disableAutoOpenEdited: (disableAutoOpen ?? 0) === 1,
          enableSounds: (enableSounds ?? 0) === 1,
          disableAutoFixLints: (disableAutoFix ?? 0) === 1,
          allowedCommands: [],
          deniedCommands: []
        };
      }
      /**
       * Extract a varint value from a protobuf sentinel key.
       *
       * The structure is: sentinel_key_string followed by a small
       * Base64 value like "EAM=" (which decodes to a protobuf varint).
       *
       * Known mappings:
       * - "CAE=" → field 1, value 1 (OFF / ALWAYS)
       * - "EAI=" → field 2, value 2 (AUTO / TURBO)
       * - "EAM=" → field 2, value 3 (EAGER / AUTO)
       */
      _extractSentinelValue(text, sentinelKey) {
        const idx = text.indexOf(sentinelKey);
        if (idx === -1) return null;
        const after = text.substring(idx + sentinelKey.length, idx + sentinelKey.length + 30);
        const b64Match = after.match(/([A-Za-z0-9+/]{2,8}={0,2})/);
        if (!b64Match) return null;
        try {
          const decoded = Buffer.from(b64Match[1], "base64");
          if (decoded.length >= 2) {
            return decoded[1];
          } else if (decoded.length === 1) {
            return decoded[0];
          }
        } catch {
        }
        return null;
      }
      _defaultPreferences() {
        return {
          terminalExecutionPolicy: 1,
          // OFF
          artifactReviewPolicy: 1,
          // ALWAYS
          planningMode: 0,
          secureModeEnabled: false,
          terminalSandboxEnabled: false,
          sandboxAllowNetwork: false,
          shellIntegrationEnabled: true,
          allowNonWorkspaceFiles: false,
          allowGitignoreAccess: false,
          explainFixInCurrentConvo: false,
          autoContinueOnMax: 0,
          disableAutoOpenEdited: false,
          enableSounds: false,
          disableAutoFixLints: false,
          allowedCommands: [],
          deniedCommands: []
        };
      }
      dispose() {
        this._disposed = true;
        if (this._db) {
          try {
            this._db.close();
          } catch {
          }
          this._db = null;
        }
        this._dbPath = null;
      }
    };
    var log3 = new Logger("EventMonitor");
    var EventMonitor = class {
      constructor(_state) {
        this._state = _state;
        this._disposables = new DisposableStore();
        this._ussTimer = null;
        this._trajTimer = null;
        this._ussSnapshots = /* @__PURE__ */ new Map();
        this._trajSnapshots = /* @__PURE__ */ new Map();
        this._activeSessionId = "";
        this._running = false;
        this._onStateChanged = this._disposables.add(new EventEmitter());
        this.onStateChanged = this._onStateChanged.event;
        this._onNewConversation = this._disposables.add(new EventEmitter());
        this.onNewConversation = this._onNewConversation.event;
        this._onStepCountChanged = this._disposables.add(new EventEmitter());
        this.onStepCountChanged = this._onStepCountChanged.event;
        this._onActiveSessionChanged = this._disposables.add(new EventEmitter());
        this.onActiveSessionChanged = this._onActiveSessionChanged.event;
        this._watchedKeys = [
          USSKeys.TRAJECTORY_SUMMARIES,
          USSKeys.AGENT_PREFERENCES,
          USSKeys.USER_STATUS
        ];
      }
      /**
       * Start polling for state changes.
       *
       * @param intervalMs - USS polling interval (default: 3000ms)
       * @param trajectoryIntervalMs - Trajectory polling interval (default: 5000ms).
       *   Set to 0 to disable trajectory polling (saves CPU).
       */
      start(intervalMs = 3e3, trajectoryIntervalMs = 5e3) {
        if (this._running) return;
        this._running = true;
        log3.info(`Starting event monitor (USS: ${intervalMs}ms, Traj: ${trajectoryIntervalMs}ms)`);
        this._takeUSSSnapshot().catch(() => {
        });
        this._ussTimer = setInterval(async () => {
          try {
            await this._pollUSS();
          } catch (error) {
            log3.error("USS poll error", error);
          }
        }, intervalMs);
        if (trajectoryIntervalMs > 0) {
          this._pollTrajectories().catch(() => {
          });
          this._trajTimer = setInterval(async () => {
            try {
              await this._pollTrajectories();
            } catch (error) {
              log3.error("Trajectory poll error", error);
            }
          }, trajectoryIntervalMs);
        }
      }
      /**
       * Stop polling.
       */
      stop() {
        if (this._ussTimer) {
          clearInterval(this._ussTimer);
          this._ussTimer = null;
        }
        if (this._trajTimer) {
          clearInterval(this._trajTimer);
          this._trajTimer = null;
        }
        this._running = false;
        log3.info("Event monitor stopped");
      }
      /** Check if the monitor is currently running. */
      get isRunning() {
        return this._running;
      }
      /** Get the currently active session ID. */
      get activeSessionId() {
        return this._activeSessionId;
      }
      // ─── USS Polling ────────────────────────────────────────────────────
      async _takeUSSSnapshot() {
        for (const key of this._watchedKeys) {
          try {
            const value = await this._state.getRawValue(key);
            this._ussSnapshots.set(key, value ? value.length : 0);
          } catch {
            this._ussSnapshots.set(key, 0);
          }
        }
      }
      async _pollUSS() {
        for (const key of this._watchedKeys) {
          try {
            const value = await this._state.getRawValue(key);
            const newSize = value ? value.length : 0;
            const previousSize = this._ussSnapshots.get(key) ?? 0;
            if (newSize !== previousSize) {
              log3.debug(`USS change: ${key} (${previousSize} -> ${newSize})`);
              this._ussSnapshots.set(key, newSize);
              this._onStateChanged.fire({ key, newSize, previousSize });
              if (key === USSKeys.TRAJECTORY_SUMMARIES && newSize > previousSize) {
                this._onNewConversation.fire();
              }
            }
          } catch {
          }
        }
      }
      // ─── Trajectory Polling ─────────────────────────────────────────────
      async _pollTrajectories() {
        let trajectories;
        try {
          const raw2 = await vscode__namespace.commands.executeCommand("antigravity.getDiagnostics");
          if (!raw2 || typeof raw2 !== "string") return;
          const diag = JSON.parse(raw2);
          if (!Array.isArray(diag.recentTrajectories)) return;
          trajectories = diag.recentTrajectories;
        } catch {
          return;
        }
        for (const traj of trajectories) {
          const id = traj.googleAgentId;
          if (!id) continue;
          const prev = this._trajSnapshots.get(id);
          const newCount = traj.lastStepIndex ?? 0;
          if (prev && prev.stepCount !== newCount) {
            const delta = newCount - prev.stepCount;
            log3.debug(`Step change: "${traj.summary}" ${prev.stepCount} -> ${newCount} (+${delta})`);
            this._onStepCountChanged.fire({
              sessionId: id,
              title: traj.summary ?? "Untitled",
              previousCount: prev.stepCount,
              newCount,
              delta
            });
          }
          this._trajSnapshots.set(id, {
            id,
            title: traj.summary ?? "Untitled",
            stepCount: newCount,
            lastModified: traj.lastModifiedTime ?? ""
          });
        }
        if (trajectories.length > 0) {
          const newActiveId = trajectories[0].googleAgentId;
          if (newActiveId && newActiveId !== this._activeSessionId) {
            const previousId = this._activeSessionId;
            this._activeSessionId = newActiveId;
            if (previousId !== "") {
              log3.debug(`Active session changed: "${trajectories[0].summary}"`);
              this._onActiveSessionChanged.fire({
                sessionId: newActiveId,
                title: trajectories[0].summary ?? "Untitled",
                previousSessionId: previousId
              });
            }
          }
        }
      }
      dispose() {
        this.stop();
        this._disposables.dispose();
      }
    };
    var log4 = new Logger("LSBridge");
    var Models3 = {
      GEMINI_FLASH: 1018,
      GEMINI_PRO_LOW: 1164,
      GEMINI_PRO_HIGH: 1165,
      CLAUDE_SONNET: 1163,
      CLAUDE_OPUS: 1154,
      GPT_OSS: 342
    };
    var LSBridge = class {
      constructor(executeCommand) {
        this._port = null;
        this._csrfToken = null;
        this._useTls = false;
        this._executeCommand = executeCommand;
      }
      /**
       * Discover the Language Server port and CSRF token.
       * Must be called before other methods.
       *
       * Discovery chain:
       * 1. Parse LS process CLI arguments (--port, --csrf_token)
       * 2. Fallback: getDiagnostics console logs (port only)
       * 3. Manual: call setConnection() after initialize() returns false
       */
      async initialize() {
        const fromProcess = await this._discoverFromProcess();
        if (fromProcess) {
          this._port = fromProcess.port;
          this._csrfToken = fromProcess.csrfToken;
          this._useTls = fromProcess.useTls;
          log4.info(`LS discovered from process: port=${this._port}, tls=${this._useTls}, csrf=${this._csrfToken ? "found" : "missing"}`);
          return true;
        }
        this._port = await this._discoverPortFromDiagnostics();
        if (this._port) {
          log4.warn(`LS port from diagnostics: ${this._port}, but CSRF token not found \u2014 RPC calls may fail with 401`);
          return true;
        }
        log4.warn("Could not discover LS connection. Use setConnection(port, csrfToken) manually.");
        return false;
      }
      /** Whether the bridge is ready (port discovered) */
      get isReady() {
        return this._port !== null;
      }
      /** The discovered LS port */
      get port() {
        return this._port;
      }
      /** Whether CSRF token is available */
      get hasCsrfToken() {
        return this._csrfToken !== null;
      }
      /**
       * Manually set the LS connection parameters.
       *
       * Use this when auto-discovery fails (e.g., non-standard install,
       * or you've discovered the port/token through other means like `lsof`).
       *
       * @param port - LS port number
       * @param csrfToken - CSRF token from LS process CLI args
       * @param useTls - Whether to use HTTPS (default: false, extension_server uses HTTP)
       *
       * @example
       * ```typescript
       * const ls = new LSBridge(commandBridge);
       * const ok = await ls.initialize();
       * if (!ok) {
       *     // Manual fallback: get port and csrf from your own discovery
       *     ls.setConnection(54321, 'abc123-csrf-token');
       * }
       * ```
       */
      setConnection(port, csrfToken, useTls = false) {
        this._port = port;
        this._csrfToken = csrfToken;
        this._useTls = useTls;
        log4.info(`LS connection set manually: port=${port}, tls=${useTls}, csrf=${csrfToken ? "provided" : "empty"}`);
      }
      // ─── Headless Cascade API ────────────────────────────────────────
      /**
       * Create a new cascade and optionally send a message.
       * Fully headless — no UI panel opened, no conversation switched.
       *
       * @returns cascadeId or null on failure
       */
      async createCascade(options) {
        this._ensureReady();
        const startResp = await this._rpc("StartCascade", { source: 0 });
        const cascadeId = startResp?.cascadeId;
        if (!cascadeId) {
          log4.error("StartCascade returned no cascadeId");
          return null;
        }
        log4.info(`Cascade created: ${cascadeId}`);
        if (options.text) {
          await this._sendMessage(cascadeId, options.text, options.model, options.plannerType);
          log4.info(`Message sent to: ${cascadeId}`);
        }
        return cascadeId;
      }
      /**
       * Send a message to an existing cascade.
       *
       * @returns true if sent successfully
       */
      async sendMessage(options) {
        this._ensureReady();
        await this._sendMessage(options.cascadeId, options.text, options.model);
        return true;
      }
      /**
       * Switch the UI to show a specific cascade conversation.
       */
      async focusCascade(cascadeId) {
        this._ensureReady();
        await this._rpc("SmartFocusConversation", { cascadeId });
      }
      /**
       * Cancel a running cascade invocation.
       */
      async cancelCascade(cascadeId) {
        this._ensureReady();
        await this._rpc("CancelCascadeInvocation", { cascadeId });
      }
      // ─── Conversation Annotations API ───────────────────────────────
      /**
       * Native conversation annotations (verified from jetski_cortex.proto).
       *
       * ConversationAnnotations protobuf fields:
       *   - title (string)              — custom user title, overrides auto-summary
       *   - tags (string[])             — tags/labels
       *   - archived (bool)             — archive status  
       *   - starred (bool)              — pinned/starred
       *   - last_user_view_time (Timestamp)
       *
       * @param cascadeId - Conversation ID
       * @param annotations - Partial annotation fields to set
       * @param merge - If true, merge with existing annotations (default: true)
       */
      async updateAnnotations(cascadeId, annotations, merge = true) {
        this._ensureReady();
        const proto = {};
        if (annotations.title !== void 0) proto.title = annotations.title;
        if (annotations.starred !== void 0) proto.starred = annotations.starred;
        if (annotations.archived !== void 0) proto.archived = annotations.archived;
        if (annotations.tags !== void 0) proto.tags = annotations.tags;
        await this._rpc("UpdateConversationAnnotations", {
          cascadeId,
          annotations: proto,
          mergeAnnotations: merge
        });
        log4.info(`Annotations updated for ${cascadeId.substring(0, 8)}...`);
      }
      /**
       * Set a custom title for a conversation.
       *
       * This sets the `title` field in ConversationAnnotations.
       * When set, this title should be displayed instead of the
       * auto-generated `summary` from the LLM.
       *
       * @param cascadeId - Conversation ID
       * @param title - Custom title to set
       */
      async setTitle(cascadeId, title) {
        await this.updateAnnotations(cascadeId, { title });
      }
      /**
       * Star (pin) or unstar a conversation.
       *
       * This sets the `starred` field in ConversationAnnotations.
       *
       * @param cascadeId - Conversation ID
       * @param starred - true to star, false to unstar
       */
      async setStar(cascadeId, starred) {
        await this.updateAnnotations(cascadeId, { starred });
      }
      // ─── Conversation Read API ──────────────────────────────────────
      /**
       * Get details of a specific conversation.
       */
      async getConversation(cascadeId) {
        this._ensureReady();
        return this._rpc("GetConversation", { cascadeId });
      }
      /**
       * Get all cascade trajectories (conversation list).
       */
      async listCascades() {
        this._ensureReady();
        log4.debug("listCascades: fetching all trajectories");
        const resp = await this._rpc("GetAllCascadeTrajectories", {});
        const summaries = resp?.trajectorySummaries ?? {};
        log4.debug(`listCascades: ${Object.keys(summaries).length} entries`);
        return summaries;
      }
      /**
       * Get trajectory descriptions (lighter than full trajectories).
       * Returns { trajectories: [...] }.
       */
      async getTrajectoryDescriptions() {
        this._ensureReady();
        return this._rpc("GetUserTrajectoryDescriptions", {});
      }
      /**
       * Get user status (tier, models, etc.)
       */
      async getUserStatus() {
        this._ensureReady();
        return this._rpc("GetUserStatus", {});
      }
      /**
       * Make a raw RPC call to any LS method.
       * @param method - RPC method name (e.g. 'StartCascade')
       * @param payload - JSON payload
       */
      async rawRPC(method, payload) {
        this._ensureReady();
        return this._rpc(method, payload);
      }
      // ─── Internal ────────────────────────────────────────────────────
      _ensureReady() {
        if (!this._port) {
          throw new Error("LSBridge not initialized. Call initialize() first.");
        }
      }
      async _sendMessage(cascadeId, text, model, plannerType) {
        const payload = {
          cascadeId,
          items: [{ chunk: { case: "text", value: text } }],
          cascadeConfig: {
            plannerConfig: {
              plannerTypeConfig: {
                case: plannerType || "conversational",
                value: {}
              },
              requestedModel: {
                choice: { case: "model", value: model || Models3.GEMINI_FLASH }
              }
            }
          }
        };
        await this._rpc("SendUserCascadeMessage", payload);
      }
      /**
       * Discover LS port and CSRF token from the Language Server process.
       *
       * VERIFIED 2026-03-01 from Antigravity extension.js source:
       *
       * 1. CSRF header is "x-codeium-csrf-token" (NOT x-csrf-token)
       * 2. CSRF value is --csrf_token from CLI (NOT --extension_server_csrf_token)
       * 3. ConnectRPC endpoint is on httpsPort (HTTPS) or httpPort (HTTP)
       *    These ports are NOT in CLI args (--random_port flag means random).
       *    We discover them via netstat/PID, excluding extension_server_port.
       *
       * Source code proof:
       *   n.header.set("x-codeium-csrf-token", e)        // header name
       *   address = `127.0.0.1:${te.httpsPort}`           // ConnectRPC address
       *   csrfToken = a = d.randomUUID() → --csrf_token   // token source
       *   t.headers["x-codeium-csrf-token"] === this.csrfToken ? ... : 403
       *
       * Discovery: 2 phases
       *   Phase 1: Get-CimInstance/ps → PID, --csrf_token, --extension_server_port
       *   Phase 2: netstat → find LISTENING ports for PID, exclude ext_server_port
       */
      async _discoverFromProcess() {
        try {
          const platform = process.platform;
          let processInfo = await this._findLSProcess(platform);
          if (!processInfo) {
            log4.debug("No LS processes found");
            return null;
          }
          log4.debug(`LS process found: PID=${processInfo.pid}, csrf=present, ext_port=${processInfo.extPort}`);
          const connectPort = await this._findConnectPort(platform, processInfo.pid, processInfo.extPort);
          if (!connectPort) {
            log4.debug("Could not find ConnectRPC port via netstat, trying extension_server_port as fallback");
            if (processInfo.extPort) {
              return { port: processInfo.extPort, csrfToken: processInfo.csrfToken, useTls: false };
            }
            return null;
          }
          return {
            port: connectPort.port,
            csrfToken: processInfo.csrfToken,
            useTls: connectPort.tls
          };
        } catch (err) {
          log4.debug("Process discovery failed", err);
        }
        return null;
      }
      /**
       * Phase 1: Find the LS process for this workspace.
       */
      async _findLSProcess(platform) {
        const { exec } = __require("child_process");
        const { promisify } = __require("util");
        const execAsync = promisify(exec);
        let output;
        if (platform === "win32") {
          const psScript = "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'language_server' -and $_.CommandLine -match 'csrf_token' } | ForEach-Object { $_.ProcessId.ToString() + '|' + $_.CommandLine }";
          const encoded = Buffer.from(psScript, "utf16le").toString("base64");
          const result = await execAsync(
            `powershell.exe -NoProfile -EncodedCommand ${encoded}`,
            { encoding: "utf8", timeout: 1e4, windowsHide: true }
          );
          output = result.stdout;
        } else {
          const result = await execAsync(
            "ps -eo pid,args 2>/dev/null | grep language_server | grep csrf_token | grep -v grep",
            { encoding: "utf8", timeout: 5e3 }
          );
          output = result.stdout;
        }
        const lines = output.split("\n").filter((l) => l.trim().length > 0);
        if (lines.length === 0) return null;
        const workspaceHint = this._getWorkspaceHint();
        let bestLine = null;
        if (workspaceHint) {
          for (const line of lines) {
            if (line.includes(workspaceHint)) {
              bestLine = line;
              break;
            }
          }
        }
        if (!bestLine) bestLine = lines[0];
        let pid;
        if (platform === "win32") {
          pid = parseInt(bestLine.split("|")[0].trim(), 10);
        } else {
          pid = parseInt(bestLine.trim().split(/\s+/)[0], 10);
        }
        const csrfToken = this._extractArg(bestLine, "csrf_token");
        const extPortStr = this._extractArg(bestLine, "extension_server_port");
        const extPort = extPortStr ? parseInt(extPortStr, 10) : 0;
        if (!csrfToken || isNaN(pid)) return null;
        return { pid, csrfToken, extPort };
      }
      /**
       * Phase 2: Find ConnectRPC port via netstat.
       *
       * The LS process listens on multiple ports:
       * - httpsPort (HTTPS, ConnectRPC) ← this is what we want
       * - httpPort  (HTTP, ConnectRPC)  ← also works
       * - lspPort   (LSP JSON-RPC)
       * - extension_server_port is separate (for Extension Host IPC)
       *
       * We find all LISTENING ports for the LS PID, exclude ext_server_port,
       * then try HTTPS first (preferred), fall back to HTTP.
       */
      async _findConnectPort(platform, pid, extPort) {
        try {
          const { exec } = __require("child_process");
          const { promisify } = __require("util");
          const execAsync = promisify(exec);
          let output;
          if (platform === "win32") {
            const result = await execAsync(
              `netstat -aon | findstr "LISTENING" | findstr "${pid}"`,
              { encoding: "utf8", timeout: 5e3, windowsHide: true }
            );
            output = result.stdout;
          } else {
            const result = await execAsync(
              `ss -tlnp 2>/dev/null | grep "pid=${pid}" || netstat -tlnp 2>/dev/null | grep "${pid}"`,
              { encoding: "utf8", timeout: 5e3 }
            );
            output = result.stdout;
          }
          const portMatches = output.matchAll(/127\.0\.0\.1:(\d+)/g);
          const ports = [];
          for (const m of portMatches) {
            const p = parseInt(m[1], 10);
            if (p !== extPort && !ports.includes(p)) {
              ports.push(p);
            }
          }
          if (ports.length === 0) return null;
          log4.debug(`LS ports (excl ext ${extPort}): ${ports.join(", ")}`);
          for (const port of ports) {
            log4.debug(`Probing port ${port} (HTTPS)...`);
            const tls = await this._probePort(port, true);
            if (tls) {
              log4.debug(`Port ${port} accepted HTTPS`);
              return { port, tls: true };
            }
          }
          for (const port of ports) {
            log4.debug(`Probing port ${port} (HTTP)...`);
            const http = await this._probePort(port, false);
            if (http) {
              log4.debug(`Port ${port} accepted HTTP`);
              return { port, tls: false };
            }
          }
        } catch (err) {
          log4.debug("netstat port discovery failed", err);
        }
        return null;
      }
      /**
       * Quick probe: check if a port accepts ConnectRPC requests.
       * Returns true if the port responds (even with error) on the given protocol.
       */
      _probePort(port, useTls) {
        const mod = useTls ? __require("https") : __require("http");
        const proto = useTls ? "https" : "http";
        return new Promise((resolve2) => {
          const req = mod.request(`${proto}://127.0.0.1:${port}/exa.language_server_pb.LanguageServerService/GetUserStatus`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Content-Length": 2 },
            rejectUnauthorized: false,
            timeout: 2e3
          }, (res) => {
            resolve2(res.statusCode === 401 || res.statusCode === 200);
          });
          req.on("error", () => resolve2(false));
          req.on("timeout", () => {
            req.destroy();
            resolve2(false);
          });
          req.write("{}");
          req.end();
        });
      }
      /**
       * Get a workspace hint string used to match the correct LS process.
       *
       * The LS process has --workspace_id like:
       *   file_d_3A_programming_better_antigravity
       * which is an encoded version of the workspace URI.
       */
      _getWorkspaceHint() {
        try {
          const vscode42 = __require("vscode");
          const folders = vscode42.workspace?.workspaceFolders;
          if (folders && folders.length > 0) {
            const folder = folders[0].uri.fsPath;
            const parts = folder.replace(/\\/g, "/").split("/");
            return parts.slice(-2).join("_").replace(/[-.\s]/g, "_").toLowerCase();
          }
        } catch {
        }
        return "";
      }
      /**
       * Extract a CLI argument value from a command-line string.
       * Supports both --key=value and --key value formats.
       */
      _extractArg(cmdLine, argName) {
        const eqMatch = cmdLine.match(new RegExp(`--${argName}=([^\\s"]+)`));
        if (eqMatch) return eqMatch[1];
        const spaceMatch = cmdLine.match(new RegExp(`--${argName}\\s+([^\\s"]+)`));
        if (spaceMatch) return spaceMatch[1];
        return null;
      }
      /**
       * Fallback: discover port from getDiagnostics console logs.
       * NOTE: This does NOT discover the CSRF token.
       * In recent Antigravity versions, the port URL may no longer appear in logs.
       */
      async _discoverPortFromDiagnostics() {
        try {
          const raw2 = await this._executeCommand("antigravity.getDiagnostics");
          if (!raw2 || typeof raw2 !== "string") return null;
          const diag = JSON.parse(raw2);
          const logs = diag.agentWindowConsoleLogs || "";
          const m1 = logs.match(/127\.0\.0\.1:(\d+)\/exa\.language_server_pb/);
          if (m1) return parseInt(m1[1], 10);
          const m2 = logs.match(/https?:\/\/127\.0\.0\.1:(\d+)/);
          if (m2) return parseInt(m2[1], 10);
          if (diag.mainThreadLogs) {
            const mainLogs = typeof diag.mainThreadLogs === "string" ? diag.mainThreadLogs : JSON.stringify(diag.mainThreadLogs);
            const m3 = mainLogs.match(/127\.0\.0\.1:(\d+)/);
            if (m3) return parseInt(m3[1], 10);
          }
        } catch (err) {
          log4.error("Failed to discover LS port from diagnostics", err);
        }
        return null;
      }
      /**
       * Make an authenticated RPC call to the Language Server.
       * Sends x-csrf-token header when available.
       *
       * VERIFIED 2026-03-01:
       * - extension_server_port uses plain HTTP (no TLS)
       * - Main LS port (--random_port) uses HTTPS with self-signed cert
       */
      async _rpc(method, payload) {
        const httpModule = this._useTls ? __require("https") : __require("http");
        const protocol = this._useTls ? "https" : "http";
        const url = `${protocol}://127.0.0.1:${this._port}/exa.language_server_pb.LanguageServerService/${method}`;
        log4.debug(`RPC \u2192 ${method} (port=${this._port}, tls=${this._useTls}, csrf=${!!this._csrfToken})`);
        return new Promise((resolve2, reject) => {
          const body = JSON.stringify(payload);
          const headers = {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body)
          };
          if (this._csrfToken) {
            headers["x-codeium-csrf-token"] = this._csrfToken;
          }
          const reqOptions = {
            method: "POST",
            headers
          };
          if (this._useTls) {
            reqOptions.rejectUnauthorized = false;
          }
          const req = httpModule.request(url, reqOptions, (res) => {
            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });
            res.on("end", () => {
              if (res.statusCode === 200) {
                log4.debug(`RPC \u2190 ${method} OK (${data.length} bytes)`);
                try {
                  resolve2(JSON.parse(data));
                } catch {
                  resolve2(data);
                }
              } else {
                const hint = res.statusCode === 401 ? " (CSRF token may be invalid or missing -- try setConnection() with the correct token)" : "";
                reject(new Error(`LS ${method}: ${res.statusCode} -- ${data.substring(0, 200)}${hint}`));
              }
            });
          });
          req.on("error", (err) => reject(err));
          req.write(body);
          req.end();
        });
      }
    };
    var log5 = new Logger("CascadeManager");
    var CascadeManager = class {
      constructor(_commands, _state) {
        this._commands = _commands;
        this._state = _state;
        this._disposables = new DisposableStore();
        this._sessions = [];
        this._initialized = false;
        this._onSessionsChanged = this._disposables.add(new EventEmitter());
        this.onSessionsChanged = this._onSessionsChanged.event;
      }
      /**
       * Initialize the cascade manager.
       * Loads the initial session list from getDiagnostics.
       */
      async initialize() {
        if (this._initialized) return;
        await this._loadSessions();
        this._initialized = true;
        log5.info(`Initialized with ${this._sessions.length} sessions`);
      }
      // ─── Read API ───────────────────────────────────────────────────────────
      /**
       * Get all known Cascade sessions.
       *
       * Uses `getDiagnostics.recentTrajectories` (clean JSON with titles).
       *
       * @returns List of trajectory entries sorted by recency
       */
      async getSessions() {
        if (!this._initialized) {
          await this._loadSessions();
        }
        return [...this._sessions];
      }
      /**
       * Refresh the session list.
       *
       * @returns Updated session list
       */
      async refreshSessions() {
        await this._loadSessions();
        this._onSessionsChanged.fire(this._sessions);
        return [...this._sessions];
      }
      /**
       * Get agent preferences (all 16 sentinel values).
       */
      async getPreferences() {
        log5.debug("getPreferences: delegating to StateBridge");
        return this._state.getAgentPreferences();
      }
      /**
       * Get IDE diagnostics (176KB JSON with system info, logs, trajectories).
       *
       * Structure (verified):
       * - isRemote, systemInfo (OS, user, email)
       * - extensionLogs (Array[375])
       * - rendererLogs, mainThreadLogs, agentWindowConsoleLogs
       * - languageServerLogs
       * - recentTrajectories (Array[10])
       *
       * @returns Parsed diagnostics information
       */
      async getDiagnostics() {
        log5.debug("getDiagnostics: executing antigravity.getDiagnostics");
        const raw2 = await this._commands.execute(AntigravityCommands2.GET_DIAGNOSTICS);
        if (!raw2 || typeof raw2 !== "string") {
          throw new Error("getDiagnostics returned unexpected type");
        }
        log5.debug(`getDiagnostics: raw length=${raw2.length} bytes, parsing`);
        const parsed = JSON.parse(raw2);
        log5.debug(`getDiagnostics: user=${parsed.systemInfo?.userName}, trajectories=${parsed.recentTrajectories?.length ?? 0}`);
        return {
          isRemote: parsed.isRemote ?? false,
          systemInfo: {
            operatingSystem: parsed.systemInfo?.operatingSystem ?? "unknown",
            timestamp: parsed.systemInfo?.timestamp ?? "",
            userEmail: parsed.systemInfo?.userEmail ?? "",
            userName: parsed.systemInfo?.userName ?? ""
          },
          raw: parsed
        };
      }
      /**
       * Get the Chrome DevTools MCP URL.
       *
       * Verified: returns `http://127.0.0.1:{port}/mcp`
       *
       * @returns MCP URL string
       */
      async getMcpUrl() {
        const result = await this._commands.execute("antigravity.getChromeDevtoolsMcpUrl");
        return result ?? "";
      }
      /**
       * Check if a file is gitignored.
       *
       * @param filePath - Relative or absolute file path
       * @returns true if gitignored, false/null otherwise
       */
      async isFileGitIgnored(filePath) {
        const result = await this._commands.execute("antigravity.isFileGitIgnored", filePath);
        return result === true;
      }
      // ─── Write API ──────────────────────────────────────────────────────────
      //
      // Two-layer architecture (VERIFIED 2026-02-28):
      //
      // Layer 1 -- HEADLESS LS API (RECOMMENDED):
      //   Access: sdk.ls (LSBridge from antigravity-sdk)
      //   Method: Preact VNode tree -> component.props.lsClient -> 148 LS methods
      //   Creates cascade WITHOUT opening panel or switching UI.
      //   Usage:  await sdk.ls.createCascade({ text: 'prompt' })
      //
      // Layer 2 — COMMAND API (FALLBACK, this file):
      //   Access: vscode.commands.executeCommand (extension host)
      //   Method: startNewConversation → sendPromptToAgentPanel → restore
      //   PROBLEM: Always switches UI, causes flickering, race conditions.
      //   Use only when renderer integration is not available.
      //
      // ────────────────────────────────────────────────────────────────────────
      /**
       * Create a new Cascade conversation via VS Code commands.
       *
       * ⚠️ **FALLBACK APPROACH** — causes UI flickering.
       * For true headless creation, use `sdk.ls.createCascade()`
       * from the SDK's LS bridge (see LSBridge module).
       *
       * VERIFIED 2026-02-28:
       * - `startNewConversation` ✅ creates new chat (but switches UI)
       * - `prioritized.chat.openNewConversation` ❌ does NOT create new
       * - `sendPromptToAgentPanel` ✅ sends to currently visible chat (always opens panel)
       * - `sendTextToChat` ❌ does not visibly work
       *
       * @param options - Session creation options
       * @returns Session ID (googleAgentId) or empty string if not detected
       */
      async createSession(options) {
        log5.info(`Creating session (command fallback): "${options.task.substring(0, 50)}..."`);
        const beforeIds = new Set(this._sessions.map((s) => s.id));
        let previousActiveId = "";
        if (options.background) {
          try {
            const raw2 = await this._commands.execute(AntigravityCommands2.GET_DIAGNOSTICS);
            if (raw2 && typeof raw2 === "string") {
              const diag = JSON.parse(raw2);
              if (Array.isArray(diag.recentTrajectories) && diag.recentTrajectories.length > 0) {
                previousActiveId = diag.recentTrajectories[0].googleAgentId ?? "";
              }
            }
          } catch {
          }
        }
        await this._commands.execute(AntigravityCommands2.START_NEW_CONVERSATION);
        await this._delay(1500);
        if (options.task) {
          await this._commands.execute(AntigravityCommands2.SEND_PROMPT_TO_AGENT, options.task);
        }
        if (options.background) {
          await this._commands.execute(AntigravityCommands2.TRACK_BACKGROUND_CONVERSATION);
        }
        const newId = await this._waitForNewSession(beforeIds, 8e3);
        if (options.background && previousActiveId) {
          await this._delay(500);
          await this._commands.execute(AntigravityCommands2.SET_VISIBLE_CONVERSATION, previousActiveId);
          log5.info(`Background session created, restored to ${previousActiveId}`);
        }
        if (newId) {
          log5.info(`Session created: ${newId}`);
        } else {
          log5.warn("Session created but ID not detected within timeout");
        }
        return newId;
      }
      /**
       * Create a background Cascade conversation via commands.
       *
       * ⚠️ **FALLBACK** — Uses quick-switch approach (UI flickers briefly).
       * For true headless background sessions, use the SDK's LS bridge:
       * ```typescript
       * // Using LSBridge:
       * const cascadeId = await sdk.ls.createCascade({ text: 'task', modelId: 1018 });
       * ```
       *
       * @param task - Initial task/prompt to send
       * @returns Session ID or empty string
       */
      async createBackgroundSession(task) {
        return this.createSession({ task, background: true });
      }
      /**
       * Send a message to the active Cascade conversation.
       *
       * Uses `antigravity.sendTextToChat` — the primary text sending command.
       */
      async sendMessage(text) {
        await this._commands.execute(AntigravityCommands2.SEND_TEXT_TO_CHAT, text);
      }
      /**
       * Send a prompt directly to the agent panel.
       *
       * Uses `antigravity.sendPromptToAgentPanel` — focuses the agent panel.
       */
      async sendPrompt(text) {
        await this._commands.execute(AntigravityCommands2.SEND_PROMPT_TO_AGENT, text);
      }
      /**
       * Send a chat action message (e.g., typing indicator, feedback).
       *
       * Uses `antigravity.sendChatActionMessage`.
       */
      async sendChatAction(action) {
        await this._commands.execute(AntigravityCommands2.SEND_CHAT_ACTION, action);
      }
      /**
       * Switch to a specific conversation.
       *
       * @param sessionId - Conversation UUID (googleAgentId)
       */
      async focusSession(sessionId) {
        await this._commands.execute(AntigravityCommands2.SET_VISIBLE_CONVERSATION, sessionId);
      }
      /**
       * Open a new conversation in the agent panel (prioritized command).
       *
       * Uses `antigravity.prioritized.chat.openNewConversation` which both
       * opens the panel AND creates a fresh conversation.
       */
      async openNewConversation() {
        await this._commands.execute(AntigravityCommands2.OPEN_NEW_CONVERSATION);
      }
      /**
       * Execute a Cascade action.
       *
       * Uses `antigravity.executeCascadeAction`.
       *
       * @param action - Action data to execute
       */
      async executeCascadeAction(action) {
        await this._commands.execute(AntigravityCommands2.EXECUTE_CASCADE_ACTION, action);
      }
      // ─── Step Control ───────────────────────────────────────────────────────
      /**
       * Accept the current agent step (code edit, file write, etc.).
       *
       * Uses `antigravity.agent.acceptAgentStep`.
       */
      async acceptStep() {
        await this._commands.execute(AntigravityCommands2.ACCEPT_AGENT_STEP);
      }
      /** Reject the current agent step. */
      async rejectStep() {
        await this._commands.execute(AntigravityCommands2.REJECT_AGENT_STEP);
      }
      /**
       * Accept a pending command (non-terminal, e.g. file edit confirmation).
       *
       * Uses `antigravity.command.accept`.
       * This is DIFFERENT from terminalCommand.accept.
       */
      async acceptCommand() {
        await this._commands.execute(AntigravityCommands2.COMMAND_ACCEPT);
      }
      /** Reject a pending command (non-terminal). */
      async rejectCommand() {
        await this._commands.execute(AntigravityCommands2.COMMAND_REJECT);
      }
      // ─── Terminal Control ───────────────────────────────────────────────────
      /**
       * Accept a pending terminal command.
       *
       * Uses `antigravity.terminalCommand.accept`.
       */
      async acceptTerminalCommand() {
        await this._commands.execute(AntigravityCommands2.TERMINAL_ACCEPT);
      }
      /** Reject a pending terminal command. */
      async rejectTerminalCommand() {
        await this._commands.execute(AntigravityCommands2.TERMINAL_REJECT);
      }
      /** Run a pending terminal command. */
      async runTerminalCommand() {
        await this._commands.execute(AntigravityCommands2.TERMINAL_RUN);
      }
      // ─── Panel Control ──────────────────────────────────────────────────────
      /** Open the Cascade agent panel */
      async openPanel() {
        await this._commands.execute(AntigravityCommands2.OPEN_AGENT_PANEL);
      }
      /** Focus the Cascade agent panel */
      async focusPanel() {
        await this._commands.execute(AntigravityCommands2.FOCUS_AGENT_PANEL);
      }
      /** Open the agent side panel */
      async openSidePanel() {
        await this._commands.execute(AntigravityCommands2.OPEN_AGENT_SIDE_PANEL);
      }
      /** Focus the agent side panel */
      async focusSidePanel() {
        await this._commands.execute(AntigravityCommands2.FOCUS_AGENT_SIDE_PANEL);
      }
      /**
       * Get the browser integration port (e.g., 57401).
       */
      async getBrowserPort() {
        return this._commands.execute(AntigravityCommands2.GET_BROWSER_PORT);
      }
      // ─── Private ────────────────────────────────────────────────────────────
      /**
       * Load sessions from getDiagnostics.recentTrajectories (clean JSON).
       *
       * VERIFIED structure per entry:
       * {
       *   googleAgentId: "uuid",      ← conversation ID
       *   trajectoryId:  "uuid",      ← internal trajectory ID
       *   summary:       "title",     ← human-readable title
       *   lastStepIndex: 992,         ← step count
       *   lastModifiedTime: "ISO"     ← last activity
       * }
       */
      async _loadSessions() {
        try {
          const raw2 = await this._commands.execute(AntigravityCommands2.GET_DIAGNOSTICS);
          if (raw2 && typeof raw2 === "string") {
            const diag = JSON.parse(raw2);
            if (Array.isArray(diag.recentTrajectories)) {
              this._sessions = diag.recentTrajectories.map((entry) => ({
                id: entry.googleAgentId ?? "",
                title: entry.summary ?? "Untitled",
                stepCount: entry.lastStepIndex ?? 0,
                workspaceUri: "",
                lastModifiedTime: entry.lastModifiedTime ?? "",
                trajectoryId: entry.trajectoryId ?? ""
              }));
              log5.debug(`Loaded ${this._sessions.length} sessions from getDiagnostics`);
              return;
            }
          }
        } catch (error) {
          log5.warn("getDiagnostics failed, falling back to USS", error);
        }
        try {
          await this._loadSessionsFromUSS();
        } catch (error) {
          log5.error("Failed to load sessions from USS", error);
          this._sessions = [];
        }
      }
      /**
       * Fallback: extract sessions from USS trajectory summaries protobuf.
       */
      async _loadSessionsFromUSS() {
        const raw2 = await this._state.getRawValue("antigravityUnifiedStateSync.trajectorySummaries");
        if (!raw2) {
          this._sessions = [];
          return;
        }
        const buffer = Buffer.from(raw2, "base64");
        const text = buffer.toString("utf8");
        const uuids = [...new Set(text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g) || [])];
        this._sessions = uuids.map((id, i) => ({
          id,
          title: `Conversation ${i + 1}`,
          stepCount: 0,
          workspaceUri: ""
        }));
        log5.debug(`Loaded ${this._sessions.length} sessions from USS (fallback)`);
      }
      /**
       * Wait for a new session to appear in getDiagnostics.
       * Polls every 500ms up to timeoutMs.
       *
       * @returns New session ID or empty string if timeout
       */
      async _waitForNewSession(beforeIds, timeoutMs) {
        const deadline = Date.now() + timeoutMs;
        const pollInterval = 500;
        while (Date.now() < deadline) {
          await this._delay(pollInterval);
          try {
            const raw2 = await this._commands.execute(AntigravityCommands2.GET_DIAGNOSTICS);
            if (!raw2 || typeof raw2 !== "string") continue;
            const diag = JSON.parse(raw2);
            if (!Array.isArray(diag.recentTrajectories)) continue;
            for (const entry of diag.recentTrajectories) {
              const id = entry.googleAgentId;
              if (id && !beforeIds.has(id)) {
                await this._loadSessions();
                return id;
              }
            }
          } catch {
          }
        }
        return "";
      }
      /**
       * Simple delay utility.
       */
      _delay(ms) {
        return new Promise((resolve2) => setTimeout(resolve2, ms));
      }
      dispose() {
        this._disposables.dispose();
      }
    };
    var IntegrationPoint = /* @__PURE__ */ ((IntegrationPoint2) => {
      IntegrationPoint2["TOP_BAR"] = "topBar";
      IntegrationPoint2["TOP_RIGHT"] = "topRight";
      IntegrationPoint2["INPUT_AREA"] = "inputArea";
      IntegrationPoint2["BOTTOM_ICONS"] = "bottomIcons";
      IntegrationPoint2["TURN_METADATA"] = "turnMeta";
      IntegrationPoint2["USER_BADGE"] = "userBadge";
      IntegrationPoint2["BOT_ACTION"] = "botAction";
      IntegrationPoint2["DROPDOWN_MENU"] = "dropdownMenu";
      IntegrationPoint2["CHAT_TITLE"] = "chatTitle";
      return IntegrationPoint2;
    })(IntegrationPoint || {});
    var Selectors = {
      /** The entire agent side panel container */
      PANEL: ".antigravity-agent-side-panel",
      /** Top bar with title and action icons */
      TOP_BAR: ".flex.items-center.justify-between",
      /** Icons area in top bar (contains +, refresh, ..., X) */
      TOP_ICONS: ".flex.items-center.gap-2",
      /** Chat title element */
      TITLE: ".flex.min-w-0.items-center.overflow-hidden",
      /** Message turns container (direct children are turns) */
      TURNS_CONTAINER: "#conversation .gap-y-3",
      /** User message bubble (inside turn) */
      USER_BUBBLE: ".rounded-lg",
      /** Input box container */
      INPUT_BOX: "#antigravity\\.agentSidePanelInputBox",
      /** 3-dot dropdown menu (appears dynamically) */
      DROPDOWN_MARKER_TEXT: ["Customization", "Export"],
      /** Dropdown menu item class pattern */
      DROPDOWN_ITEM: ".cursor-pointer"
    };
    var AG_PREFIX = "ag-";
    var AG_DATA_ATTR = "data-ag-sdk";
    var ScriptGenerator = class {
      /**
       * Generate the complete integration script.
       *
       * @param configs — Registered integration configurations
       * @param namespace — Optional namespace slug for file naming (used for heartbeat URL)
       * @returns — Complete JS code as a string
       */
      generate(configs, namespace) {
        const parts = [];
        parts.push(this._header());
        parts.push(this._css(configs));
        parts.push(this._helpers());
        parts.push(this._toast());
        parts.push(this._stats());
        const grouped = this._groupByPoint(configs);
        for (const [point, cfgs] of Object.entries(grouped)) {
          parts.push(this._generatePoint(point, cfgs));
        }
        parts.push(this._mainLoop(Object.keys(grouped)));
        parts.push(this._footer(namespace));
        return parts.join("\n");
      }
      // ─── Grouping ──────────────────────────────────────────────────────
      _groupByPoint(configs) {
        const groups = {};
        for (const c of configs) {
          if (c.enabled === false) continue;
          if (!groups[c.point]) groups[c.point] = [];
          groups[c.point].push(c);
        }
        return groups;
      }
      // ─── Code Sections ────────────────────────────────────────────────
      _header() {
        return `(function agSDK(){
'use strict';
if(window.__agSDK)return;
window.__agSDK=true;

// \u2500\u2500\u2500 Theme Detection \u2500\u2500\u2500
var _isDark=document.body.classList.contains('vscode-dark')||document.body.classList.contains('vscode-high-contrast');
var _theme={
  bg:_isDark?'rgba(25,25,30,.95)':'rgba(245,245,250,.95)',
  fg:_isDark?'#ccc':'#333',
  fgDim:_isDark?'rgba(200,200,200,.45)':'rgba(80,80,80,.5)',
  fgHover:_isDark?'rgba(200,200,200,.8)':'rgba(40,40,40,.9)',
  accent:_isDark?'#4fc3f7':'#0288d1',
  accentBg:_isDark?'rgba(79,195,247,.12)':'rgba(2,136,209,.08)',
  success:_isDark?'#81c784':'#388e3c',
  successBg:_isDark?'rgba(76,175,80,.1)':'rgba(56,142,60,.06)',
  warn:_isDark?'#ffb74d':'#e65100',
  border:_isDark?'rgba(79,195,247,.06)':'rgba(0,0,0,.06)',
  borderHover:_isDark?'rgba(79,195,247,.2)':'rgba(2,136,209,.15)',
  sep:_isDark?'rgba(255,255,255,.06)':'rgba(0,0,0,.06)',
  shadow:_isDark?'rgba(0,0,0,.5)':'rgba(0,0,0,.15)',
  metaBg:_isDark?'linear-gradient(135deg,rgba(79,195,247,.03),rgba(156,39,176,.02))':'linear-gradient(135deg,rgba(2,136,209,.03),rgba(123,31,162,.02))',
  metaBgHover:_isDark?'linear-gradient(135deg,rgba(79,195,247,.07),rgba(156,39,176,.05))':'linear-gradient(135deg,rgba(2,136,209,.07),rgba(123,31,162,.05))'
};
// Watch for theme changes (VS Code toggles body classes)
new MutationObserver(function(){var newDark=document.body.classList.contains('vscode-dark');if(newDark!==_isDark){location.reload();}}).observe(document.body,{attributes:true,attributeFilter:['class']});
`;
      }
      _footer(namespace) {
        const heartbeatFile = namespace ? `ag-sdk-${namespace}-heartbeat` : "ag-sdk-heartbeat";
        return `
var _heartbeatMaxAge=172800000;
function checkHeartbeat(){
  try{
    var xhr=new XMLHttpRequest();
    xhr.open('GET','./${heartbeatFile}?t='+Date.now(),false);
    xhr.send();
    if(xhr.status!==200)return false;
    var ts=parseInt(xhr.responseText,10);
    if(isNaN(ts))return false;
    return(Date.now()-ts)<_heartbeatMaxAge;
  }catch(e){return false;}
}
function boot(){
  if(!checkHeartbeat()){
    console.log('[AG SDK] Heartbeat missing or stale \u2014 extension disabled? Skipping.');
    return;
  }
  if(document.readyState==='complete')setTimeout(start,3000);
  else window.addEventListener('load',function(){setTimeout(start,3000);});
}
boot();
})();`;
      }
      _css(configs) {
        new Set(configs.map((c) => c.point));
        return `
// \u2500\u2500\u2500 Theme-Aware CSS \u2500\u2500\u2500
var _cssRules=[
  '.${AG_PREFIX}meta{padding:3px 8px;background:'+_theme.metaBg+';border-top:1px solid '+_theme.border+';font-family:"Cascadia Code","Fira Code",monospace;font-size:9px;color:'+_theme.fgDim+';display:flex;align-items:center;gap:5px;flex-wrap:wrap;transition:all .2s;cursor:default;user-select:none;margin-top:2px;border-radius:0 0 6px 6px}',
  '.${AG_PREFIX}meta:hover{background:'+_theme.metaBgHover+';color:'+_theme.fgHover+'}',
  '.${AG_PREFIX}t{padding:1px 4px;border-radius:3px;font-size:8px;font-weight:700;letter-spacing:.3px}',
  '.${AG_PREFIX}u{background:'+_theme.successBg+';color:'+_theme.success+'}',
  '.${AG_PREFIX}b{background:'+_theme.accentBg+';color:'+_theme.accent+'}',
  '.${AG_PREFIX}k{color:'+_theme.fgDim+';font-size:8px}',
  '.${AG_PREFIX}v{color:'+_theme.fg+';font-size:8px;opacity:.55}',
  '.${AG_PREFIX}hi{color:'+_theme.accent+'}',
  '.${AG_PREFIX}w{color:'+_theme.warn+'}',
  '.${AG_PREFIX}s{color:'+_theme.sep+'}',
  // Toast
  '.${AG_PREFIX}toast{position:fixed;bottom:80px;right:20px;background:'+_theme.bg+';border:1px solid '+_theme.borderHover+';border-radius:8px;padding:10px 14px;font-family:"Cascadia Code",monospace;font-size:10px;color:'+_theme.fg+';z-index:99999;max-width:320px;backdrop-filter:blur(10px);box-shadow:0 4px 24px '+_theme.shadow+';animation:${AG_PREFIX}fade .25s ease}',
  '@keyframes ${AG_PREFIX}fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}',
  '.${AG_PREFIX}toast-t{color:'+_theme.accent+';font-weight:700;margin-bottom:5px;font-size:11px;display:flex;align-items:center;gap:6px}',
  '.${AG_PREFIX}toast-r{display:flex;gap:8px;margin:1px 0}',
  '.${AG_PREFIX}toast-k{color:'+_theme.fgDim+';min-width:70px}',
  '.${AG_PREFIX}toast-v{color:'+_theme.fg+'}',
  '.${AG_PREFIX}toast-badge{font-size:8px;padding:1px 5px;border-radius:3px;font-weight:700}',
  // Buttons
  '.${AG_PREFIX}hdr{display:inline-flex;align-items:center;gap:3px;padding:1px 6px;border-radius:4px;cursor:pointer;color:'+_theme.fgDim+';font-size:9px;font-family:"Cascadia Code",monospace;transition:all .15s;user-select:none}',
  '.${AG_PREFIX}hdr:hover{background:'+_theme.accentBg+';color:'+_theme.accent+'}',
  '.${AG_PREFIX}inp{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;border-radius:4px;cursor:pointer;color:'+_theme.fgDim+';font-size:11px;transition:all .15s;flex-shrink:0;padding:0 4px;font-family:"Cascadia Code",monospace}',
  '.${AG_PREFIX}inp:hover{background:'+_theme.accentBg+';color:'+_theme.accent+'}',
  '.${AG_PREFIX}menu{padding:4px 8px;cursor:pointer;font-size:11px;color:'+_theme.fg+';opacity:.7;transition:all .12s;display:flex;align-items:center;gap:6px;white-space:nowrap}',
  '.${AG_PREFIX}menu:hover{background:'+_theme.accentBg+';color:'+_theme.accent+';opacity:1}',
  '.${AG_PREFIX}vote{display:inline-flex;align-items:center;gap:3px;padding:1px 6px;border-radius:3px;cursor:pointer;color:'+_theme.fgDim+';font-size:9px;font-family:"Cascadia Code",monospace;transition:all .15s;margin-left:4px}',
  '.${AG_PREFIX}vote:hover{background:'+_theme.accentBg+';color:'+_theme.accent+'}',
  '.${AG_PREFIX}ubadge{display:inline-flex;align-items:center;gap:2px;padding:1px 5px;border-radius:3px;background:'+_theme.successBg+';cursor:pointer;color:'+_theme.success+';opacity:.4;font-size:8px;font-family:"Cascadia Code",monospace;transition:all .15s;margin-left:3px}',
  '.${AG_PREFIX}ubadge:hover{background:'+_theme.successBg+';color:'+_theme.success+';opacity:1}',
  '.${AG_PREFIX}title-hint{position:absolute;right:0;top:50%;transform:translateY(-50%);font-size:8px;color:'+_theme.accent+';opacity:.3;pointer-events:none;font-family:"Cascadia Code",monospace;transition:opacity .2s}',
  '.${AG_PREFIX}title-wrap:hover .${AG_PREFIX}title-hint{opacity:1}'
];
var css=document.createElement('style');
css.textContent=_cssRules.join('\\n');
document.head.appendChild(css);
`;
      }
      _helpers() {
        return `
function mk(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;}
function fmt(n){return n>=1000?(n/1000).toFixed(1)+'k':''+n;}
`;
      }
      _toast() {
        return `
var _toastT=0;
function toast(title,badge,rows){
  var old=document.querySelector('.${AG_PREFIX}toast');if(old)old.remove();
  var t=mk('div','${AG_PREFIX}toast');
  var hdr=mk('div','${AG_PREFIX}toast-t');
  hdr.appendChild(document.createTextNode(title));
  if(badge){var b=mk('span','${AG_PREFIX}toast-badge');b.textContent=badge[0];b.style.background=badge[1];b.style.color=badge[2];hdr.appendChild(b);}
  t.appendChild(hdr);
  rows.forEach(function(r){var row=mk('div','${AG_PREFIX}toast-r');row.appendChild(mk('span','${AG_PREFIX}toast-k',r[0]));row.appendChild(mk('span','${AG_PREFIX}toast-v',r[1]));t.appendChild(row);});
  document.body.appendChild(t);
  clearTimeout(_toastT);_toastT=setTimeout(function(){if(t.parentNode)t.remove();},6000);
  t.addEventListener('click',function(){t.remove();});
}
`;
      }
      _stats() {
        return `
function getStats(){
  var c=document.querySelector(${JSON.stringify(Selectors.TURNS_CONTAINER)});
  if(!c)return null;
  var turns=0,uC=0,bC=0,code=0;
  Array.from(c.children).forEach(function(ch){
    if(ch.getAttribute('${AG_DATA_ATTR}')||ch.children.length<1)return;
    turns++;
    uC+=(ch.children[0]?.textContent?.trim()||'').length;
    bC+=(ch.children[1]?.textContent?.trim()||'').length;
    code+=(ch.children[1]?.querySelectorAll('pre')?.length||0);
  });
  return{turns:turns,u:uC,b:bC,code:code};
}
`;
      }
      // ─── Point generators ─────────────────────────────────────────────
      _generatePoint(point, configs) {
        switch (point) {
          case "topBar":
            return this._genTopBar(configs);
          case "topRight":
            return this._genTopRight(configs);
          case "inputArea":
            return this._genInputArea(configs);
          case "bottomIcons":
            return this._genBottomIcons(configs);
          case "turnMeta":
            return this._genTurnMeta(configs);
          case "userBadge":
            return this._genUserBadge(configs);
          case "botAction":
            return this._genBotAction(configs);
          case "dropdownMenu":
            return this._genDropdown(configs);
          case "chatTitle":
            return this._genTitle(configs);
          default:
            return `// Unknown point: ${point}`;
        }
      }
      _genToastCall(toast) {
        if (!toast) return "";
        const badge = toast.badge ? `[${JSON.stringify(toast.badge.text)},${JSON.stringify(toast.badge.bgColor)},${JSON.stringify(toast.badge.textColor)}]` : "null";
        const rows = toast.rows.map((r) => {
          if (r.dynamic) {
            return `[${JSON.stringify(r.key)},${r.value}]`;
          }
          return `[${JSON.stringify(r.key)},${JSON.stringify(r.value)}]`;
        }).join(",");
        return `toast(${JSON.stringify(toast.title)},${badge},[${rows}]);`;
      }
      _genTopBar(configs) {
        const buttons = configs.map((c) => {
          const toastCall = this._genToastCall(c.toast);
          return `  var btn_${c.id}=mk('a','${AG_PREFIX}hdr ${AG_PREFIX}${c.id}');
  btn_${c.id}.textContent=${JSON.stringify(c.icon)};
  btn_${c.id}.title=${JSON.stringify(c.tooltip || "")};
  btn_${c.id}.addEventListener('click',function(){${toastCall}});
  iconsArea.insertBefore(btn_${c.id},iconsArea.children[1]);`;
        });
        return `
function integrateTopBar(){
  var p=document.querySelector(${JSON.stringify(Selectors.PANEL)});if(!p)return;
  var topBar=p.querySelector(${JSON.stringify(Selectors.TOP_BAR)});if(!topBar)return;
  var iconsArea=topBar.querySelector(${JSON.stringify(Selectors.TOP_ICONS)});
  if(!iconsArea||iconsArea.querySelector('.${AG_PREFIX}${configs[0].id}'))return;
${buttons.join("\n")}
}
`;
      }
      _genTopRight(configs) {
        const buttons = configs.map((c) => {
          const toastCall = this._genToastCall(c.toast);
          return `  var btn_${c.id}=mk('a','${AG_PREFIX}hdr ${AG_PREFIX}${c.id}');
  btn_${c.id}.textContent=${JSON.stringify(c.icon)};
  btn_${c.id}.title=${JSON.stringify(c.tooltip || "")};
  btn_${c.id}.addEventListener('click',function(){${toastCall}});
  iconsArea.insertBefore(btn_${c.id},iconsArea.lastElementChild);`;
        });
        return `
function integrateTopRight(){
  var p=document.querySelector(${JSON.stringify(Selectors.PANEL)});if(!p)return;
  var topBar=p.querySelector(${JSON.stringify(Selectors.TOP_BAR)});if(!topBar)return;
  var iconsArea=topBar.querySelector(${JSON.stringify(Selectors.TOP_ICONS)});
  if(!iconsArea||iconsArea.querySelector('.${AG_PREFIX}${configs[0].id}'))return;
${buttons.join("\n")}
}
`;
      }
      _genInputArea(configs) {
        const buttons = configs.map((c) => {
          const toastCall = this._genToastCall(c.toast);
          return `  var btn=mk('div','${AG_PREFIX}inp ${AG_PREFIX}${c.id}');
  btn.textContent=${JSON.stringify(c.icon)};
  btn.title=${JSON.stringify(c.tooltip || "")};
  btn.addEventListener('click',function(){${toastCall}});
  btnRow.insertBefore(btn,btnRow.firstChild);`;
        });
        return `
function integrateInputArea(){
  var ib=document.querySelector(${JSON.stringify(Selectors.INPUT_BOX)});
  if(!ib||ib.querySelector('.${AG_PREFIX}${configs[0].id}'))return;
  var allBtns=ib.querySelectorAll('button,[role="button"]');
  if(allBtns.length===0)return;
  var btnRow=allBtns[allBtns.length-1].parentElement;if(!btnRow)return;
${buttons.join("\n")}
}
`;
      }
      _genBottomIcons(configs) {
        const buttons = configs.map((c) => {
          const toastCall = this._genToastCall(c.toast);
          return `  var btn=mk('div','${AG_PREFIX}inp ${AG_PREFIX}${c.id}');
  btn.textContent=${JSON.stringify(c.icon)};
  btn.title=${JSON.stringify(c.tooltip || "")};
  btn.addEventListener('click',function(){${toastCall}});
  row.appendChild(btn);`;
        });
        return `
function integrateBottomIcons(){
  var ib=document.querySelector(${JSON.stringify(Selectors.INPUT_BOX)});
  if(!ib||ib.querySelector('.${AG_PREFIX}${configs[0].id}'))return;
  var rows=ib.querySelectorAll('.flex.items-center');
  var row=null;
  for(var i=0;i<rows.length;i++){if(rows[i].querySelectorAll('svg').length>=2){row=rows[i];}}
  if(!row)return;
${buttons.join("\n")}
}
`;
      }
      _genTurnMeta(configs) {
        const cfg = configs[0];
        const metricParts = [];
        for (const m of cfg.metrics) {
          switch (m) {
            case "turnNumber":
              metricParts.push(`meta.appendChild(mk('span','${AG_PREFIX}t ${AG_PREFIX}b','T'+tI));`);
              break;
            case "userCharCount":
              metricParts.push(`if(uL>0){meta.appendChild(mk('span','${AG_PREFIX}t ${AG_PREFIX}u','USER'));meta.appendChild(mk('span','${AG_PREFIX}k',fmt(uL)));}`);
              break;
            case "separator":
              metricParts.push(`if(uL>0&&bL>0)meta.appendChild(mk('span','${AG_PREFIX}s','\\u2502'));`);
              break;
            case "aiCharCount":
              metricParts.push(`if(bL>0){meta.appendChild(mk('span','${AG_PREFIX}t ${AG_PREFIX}b','AI'));meta.appendChild(mk('span','${AG_PREFIX}k',fmt(bL)));}`);
              break;
            case "codeBlocks":
              metricParts.push(`if(codes>0){meta.appendChild(mk('span','${AG_PREFIX}k','code:'));meta.appendChild(mk('span','${AG_PREFIX}v ${AG_PREFIX}w',''+codes));}`);
              break;
            case "thinkingIndicator":
              metricParts.push(`if(brain)meta.appendChild(mk('span','${AG_PREFIX}v','\\u{1F9E0}'));`);
              break;
            case "ratio":
              metricParts.push(`if(uL>0&&bL>0){meta.appendChild(mk('span','${AG_PREFIX}k',(bL/uL).toFixed(1)+'x'));}`);
              break;
          }
        }
        const clickHandler = cfg.clickable !== false ? `meta.addEventListener('click',function(){toast('Turn '+tI,null,[['user:',fmt(uL)],['AI:',fmt(bL)],['ratio:',uL>0?(bL/uL).toFixed(1)+'x':'\\u2014']]);});` : "";
        return `
function integrateTurnMeta(){
  var c=document.querySelector(${JSON.stringify(Selectors.TURNS_CONTAINER)});if(!c)return;
  var tI=0;
  Array.from(c.children).forEach(function(turn){
    if(turn.getAttribute('${AG_DATA_ATTR}')||turn.children.length<1)return;
    turn.setAttribute('${AG_DATA_ATTR}','1');
    tI++;var uL=(turn.children[0]?.textContent?.trim()||'').length;
    var bL=(turn.children[1]?.textContent?.trim()||'').length;
    if(uL===0&&bL===0)return;
    var codes=turn.children[1]?.querySelectorAll('pre')?.length||0;
    var brain=(turn.children[1]?.textContent||'').includes('Thought');
    var meta=mk('div','${AG_PREFIX}meta');
    ${metricParts.join("\n    ")}
    ${clickHandler}
    turn.appendChild(meta);
  });
}
`;
      }
      _genUserBadge(configs) {
        const cfg = configs[0];
        let displayExpr = 'fmt(uLen)+" ch"';
        if (cfg.display === "wordCount") {
          displayExpr = '(txt.split(/\\\\s+/).length)+" w"';
        } else if (cfg.display === "custom" && cfg.customFormat) {
          displayExpr = cfg.customFormat;
        }
        return `
function integrateUserBadges(){
  var c=document.querySelector(${JSON.stringify(Selectors.TURNS_CONTAINER)});if(!c)return;
  Array.from(c.children).forEach(function(turn,i){
    if(turn.getAttribute('${AG_DATA_ATTR}u')||turn.children.length<1)return;
    var bubble=turn.children[0]?.querySelector(${JSON.stringify(Selectors.USER_BUBBLE)});
    if(!bubble)return;
    var txt=turn.children[0]?.textContent?.trim()||'';
    var uLen=txt.length;if(uLen<5)return;
    turn.setAttribute('${AG_DATA_ATTR}u','1');
    var row=turn.children[0]?.querySelector('.flex.w-full,.flex.flex-row')||turn.children[0];
    var badge=mk('span','${AG_PREFIX}ubadge');
    badge.textContent=${displayExpr};
    badge.title='SDK: User message';
    row.appendChild(badge);
  });
}
`;
      }
      _genBotAction(configs) {
        const items = configs.map((c) => {
          const toastCall = this._genToastCall(c.toast);
          return `var b=mk('span','${AG_PREFIX}vote');b.textContent=${JSON.stringify(c.icon + " " + c.label)};
      b.addEventListener('click',function(ev){ev.stopPropagation();${toastCall}});
      row.appendChild(b);`;
        });
        return `
function integrateBotAction(){
  var c=document.querySelector(${JSON.stringify(Selectors.TURNS_CONTAINER)});if(!c)return;
  c.querySelectorAll('span,button,a,div').forEach(function(el){
    if(el.getAttribute('${AG_DATA_ATTR}v'))return;
    var txt=el.textContent?.trim();
    if(txt==='Good'||txt==='Bad'){
      var row=el.parentElement;if(!row||row.querySelector('.${AG_PREFIX}vote'))return;
      el.setAttribute('${AG_DATA_ATTR}v','1');
      ${items.join("\n      ")}
    }
  });
}
`;
      }
      _genDropdown(configs) {
        const markers = JSON.stringify(Selectors.DROPDOWN_MARKER_TEXT);
        const items = configs.map((c) => {
          const toastCall = this._genToastCall(c.toast);
          const sep = c.separator ? `var sep=mk('div','');sep.style.cssText='height:1px;background:rgba(255,255,255,.06);margin:4px 8px';dd.appendChild(sep);` : "";
          return `${sep}
    var mi=mk('div','${AG_PREFIX}menu');
    ${c.icon ? `mi.appendChild(mk('span','',${JSON.stringify(c.icon)}));` : ""}
    mi.appendChild(document.createTextNode(${JSON.stringify(c.label)}));
    mi.addEventListener('click',function(){${toastCall}});
    dd.appendChild(mi);`;
        });
        return `
function integrateDropdown(){
  var dds=document.querySelectorAll('.rounded-bg.py-1,.rounded-lg.py-1');
  dds.forEach(function(dd){
    if(dd.getAttribute('${AG_DATA_ATTR}m'))return;
    var items=dd.querySelectorAll(${JSON.stringify(Selectors.DROPDOWN_ITEM)});
    var markers=${markers};
    var found=false;
    items.forEach(function(it){markers.forEach(function(m){if((it.textContent||'').includes(m))found=true;});});
    if(!found)return;
    dd.setAttribute('${AG_DATA_ATTR}m','1');
    ${items.join("\n    ")}
  });
}
`;
      }
      _genTitle(configs) {
        const cfg = configs[0];
        const toastCall = this._genToastCall(cfg.toast);
        const event = cfg.interaction || "dblclick";
        return `
function integrateTitle(){
  var p=document.querySelector(${JSON.stringify(Selectors.PANEL)});if(!p)return;
  var el=p.querySelector(${JSON.stringify(Selectors.TITLE)});
  if(!el||el.getAttribute('${AG_DATA_ATTR}t'))return;
  el.setAttribute('${AG_DATA_ATTR}t','1');
  el.style.cursor='pointer';
  el.classList.add('${AG_PREFIX}title-wrap');
  el.style.position='relative';
  ${cfg.hint ? `var hint=mk('span','${AG_PREFIX}title-hint',${JSON.stringify(cfg.hint)});el.appendChild(hint);` : ""}
  el.addEventListener(${JSON.stringify(event)},function(){
    var title=el.textContent?.replace(${JSON.stringify(cfg.hint || "")},'')?.trim()||'';
    ${toastCall || `toast('Chat',null,[['title:',title],['chars:',''+title.length]]);`}
  });
}
`;
      }
      // ─── Main loop ────────────────────────────────────────────────────
      _mainLoop(points) {
        const fnMap = {
          [
            "topBar"
            /* TOP_BAR */
          ]: "integrateTopBar",
          [
            "topRight"
            /* TOP_RIGHT */
          ]: "integrateTopRight",
          [
            "inputArea"
            /* INPUT_AREA */
          ]: "integrateInputArea",
          [
            "bottomIcons"
            /* BOTTOM_ICONS */
          ]: "integrateBottomIcons",
          [
            "turnMeta"
            /* TURN_METADATA */
          ]: "integrateTurnMeta",
          [
            "userBadge"
            /* USER_BADGE */
          ]: "integrateUserBadges",
          [
            "botAction"
            /* BOT_ACTION */
          ]: "integrateBotAction",
          [
            "dropdownMenu"
            /* DROPDOWN_MENU */
          ]: "integrateDropdown",
          [
            "chatTitle"
            /* CHAT_TITLE */
          ]: "integrateTitle"
        };
        const calls = points.map((p) => `    ${fnMap[p]} (); `).join("\n");
        return `
    function fullScan() {
${calls}
    }
    var _timer = 0;
    function debounced() { clearTimeout(_timer); _timer = setTimeout(function () { requestAnimationFrame(fullScan); }, 400); }
    function start() {
      var p = document.querySelector(${JSON.stringify(Selectors.PANEL)});
      if (!p) { setTimeout(start, 1000); return; }
      fullScan();
      new MutationObserver(debounced).observe(p, { childList: true, subtree: true });
      setInterval(fullScan, 8000);
      console.log('[AG SDK] Active \\u2014 ${points.length} integration points');
    }
    `;
      }
    };
    var PREFIX = "ag-sdk";
    var MARKER_START = "<!-- AG SDK -->";
    var MARKER_END = "<!-- /AG SDK -->";
    var MANIFEST_FILE = `${PREFIX}-manifest.json`;
    var LOADER_FILE = `${PREFIX}-loader.js`;
    var WorkbenchPatcher = class {
      /**
       * @param namespace - Unique slug for this extension (e.g. 'kanezal-better-antigravity').
       */
      constructor(namespace = "default") {
        const appData = process.env.LOCALAPPDATA || "";
        this._workbenchDir = path3__namespace.join(
          appData,
          "Programs",
          "Antigravity",
          "resources",
          "app",
          "out",
          "vs",
          "code",
          "electron-browser",
          "workbench"
        );
        this._workbenchHtml = path3__namespace.join(this._workbenchDir, "workbench.html");
        this._manifestPath = path3__namespace.join(this._workbenchDir, MANIFEST_FILE);
        this._loaderPath = path3__namespace.join(this._workbenchDir, LOADER_FILE);
        this._slug = namespace.replace(/[^a-zA-Z0-9-]/g, "-");
        this._scriptPath = path3__namespace.join(this._workbenchDir, `${PREFIX}-${this._slug}.js`);
        this._heartbeatPath = path3__namespace.join(this._workbenchDir, `${PREFIX}-${this._slug}-heartbeat`);
      }
      // ─── Queries ──────────────────────────────────────────────────────
      /** Check if workbench.html exists and is accessible. */
      isAvailable() {
        return fs3__namespace.existsSync(this._workbenchHtml);
      }
      /** Check if the shared SDK loader is installed in workbench.html. */
      isLoaderInstalled() {
        if (!this.isAvailable()) return false;
        try {
          return fs3__namespace.readFileSync(this._workbenchHtml, "utf8").includes(MARKER_START);
        } catch {
          return false;
        }
      }
      /** Check if THIS extension is registered in the manifest. */
      isInstalled() {
        const manifest = this._readManifest();
        return manifest.extensions.includes(this._slug);
      }
      /** Get all registered extension namespaces from manifest. */
      getRegisteredExtensions() {
        return this._readManifest().extensions;
      }
      // ─── Install ──────────────────────────────────────────────────────
      /**
       * Install this extension's script into the SDK framework.
       *
       * - If loader is not in workbench.html → patch HTML (first extension)
       * - Writes/updates this extension's script file
       * - Registers in manifest
       * - Updates the loader script
       *
       * @param scriptContent — Generated JS for this extension
       */
      install(scriptContent) {
        if (!this.isAvailable()) {
          throw new Error(`Workbench not found at: ${this._workbenchDir}`);
        }
        this._cleanupLegacy();
        if (!this.isLoaderInstalled()) {
          this._patchHtml();
        }
        fs3__namespace.writeFileSync(this._scriptPath, scriptContent, "utf8");
        const manifest = this._readManifest();
        if (!manifest.extensions.includes(this._slug)) {
          manifest.extensions.push(this._slug);
        }
        this._writeManifest(manifest);
        this._writeLoader();
        const titlesPath = path3__namespace.join(this._workbenchDir, `${PREFIX}-titles-${this._slug}.json`);
        if (!fs3__namespace.existsSync(titlesPath)) {
          fs3__namespace.writeFileSync(titlesPath, "{}", "utf8");
        }
      }
      // ─── Uninstall ────────────────────────────────────────────────────
      /**
       * Uninstall this extension from the SDK framework.
       *
       * - Removes from manifest
       * - Deletes this extension's script + heartbeat + titles
       * - If last extension → removes loader from workbench.html + cleans up
       */
      uninstall() {
        if (!this.isAvailable()) return;
        const manifest = this._readManifest();
        manifest.extensions = manifest.extensions.filter((ns) => ns !== this._slug);
        this._tryDelete(this._scriptPath);
        this._tryDelete(this._heartbeatPath);
        this._tryDelete(path3__namespace.join(this._workbenchDir, `${PREFIX}-titles-${this._slug}.json`));
        if (manifest.extensions.length === 0) {
          this._unpatchHtml();
          this._tryDelete(this._loaderPath);
          this._tryDelete(this._manifestPath);
        } else {
          this._writeManifest(manifest);
          this._writeLoader();
        }
      }
      // ─── Heartbeat ────────────────────────────────────────────────────
      /** Write/refresh heartbeat marker. */
      writeHeartbeat() {
        try {
          fs3__namespace.writeFileSync(this._heartbeatPath, Date.now().toString(), "utf8");
        } catch {
        }
      }
      /** Remove heartbeat marker. */
      removeHeartbeat() {
        this._tryDelete(this._heartbeatPath);
      }
      // ─── Accessors ────────────────────────────────────────────────────
      getWorkbenchDir() {
        return this._workbenchDir;
      }
      getScriptPath() {
        return this._scriptPath;
      }
      getHeartbeatPath() {
        return this._heartbeatPath;
      }
      // ─── Private: HTML patching ───────────────────────────────────────
      /** Add the shared loader <script> to workbench.html (ONE time). */
      _patchHtml() {
        let html = fs3__namespace.readFileSync(this._workbenchHtml, "utf8");
        const loaderTag = [
          MARKER_START,
          `<script src="./${LOADER_FILE}"></script>`,
          MARKER_END
        ].join("\n");
        html = html.replace("</html>", `${loaderTag}
</html>`);
        fs3__namespace.writeFileSync(this._workbenchHtml, html, "utf8");
      }
      /** Remove the shared loader <script> from workbench.html. */
      _unpatchHtml() {
        try {
          let html = fs3__namespace.readFileSync(this._workbenchHtml, "utf8");
          const regex = new RegExp(
            `\\n?${escapeRegex(MARKER_START)}[\\s\\S]*?${escapeRegex(MARKER_END)}\\n?`,
            "g"
          );
          html = html.replace(regex, "");
          fs3__namespace.writeFileSync(this._workbenchHtml, html, "utf8");
        } catch {
        }
      }
      // ─── Private: Manifest ────────────────────────────────────────────
      _readManifest() {
        try {
          if (fs3__namespace.existsSync(this._manifestPath)) {
            const data = JSON.parse(fs3__namespace.readFileSync(this._manifestPath, "utf8"));
            return { extensions: Array.isArray(data.extensions) ? data.extensions : [] };
          }
        } catch {
        }
        return { extensions: [] };
      }
      _writeManifest(manifest) {
        fs3__namespace.writeFileSync(this._manifestPath, JSON.stringify(manifest, null, 2), "utf8");
      }
      // ─── Private: Loader ──────────────────────────────────────────────
      /**
       * Generate and write the shared loader script.
       *
       * The loader runs in the renderer. On startup it:
       * 1. Fetches the manifest to get the list of extensions
       * 2. For each extension, checks its heartbeat (skip if stale >48h)
       * 3. Creates <script> tags to load each active extension's script
       */
      _writeLoader() {
        const manifest = this._readManifest();
        const scriptEntries = manifest.extensions.map((ns) => ({
          ns,
          script: `${PREFIX}-${ns}.js`,
          heartbeat: `${PREFIX}-${ns}-heartbeat`
        }));
        const loaderCode = `(function agSDKLoader() {
'use strict';
if (window.__agSDKLoader) return;
window.__agSDKLoader = true;

var MAX_AGE = 172800000; // 48h
var entries = ${JSON.stringify(scriptEntries)};

function checkHeartbeat(hbFile, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', './' + hbFile + '?t=' + Date.now(), true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            var ts = parseInt(xhr.responseText, 10);
            callback(!isNaN(ts) && (Date.now() - ts) < MAX_AGE);
        } else {
            callback(false);
        }
    };
    xhr.onerror = function() { callback(false); };
    xhr.send();
}

function loadScript(src) {
    var s = document.createElement('script');
    s.src = './' + src;
    s.async = false;
    document.head.appendChild(s);
}

entries.forEach(function(entry) {
    checkHeartbeat(entry.heartbeat, function(alive) {
        if (alive) {
            loadScript(entry.script);
            console.log('[AG-SDK] Loaded: ' + entry.ns);
        } else {
            console.log('[AG-SDK] Skipped (stale heartbeat): ' + entry.ns);
        }
    });
});

console.log('[AG-SDK] Loader initialized (' + entries.length + ' extension(s))');
})();`;
        fs3__namespace.writeFileSync(this._loaderPath, loaderCode, "utf8");
      }
      // ─── Private: Cleanup ─────────────────────────────────────────────
      /**
       * Clean up legacy per-namespace HTML blocks and old files
       * from previous SDK versions that used per-extension HTML patching.
       */
      _cleanupLegacy() {
        try {
          const html = fs3__namespace.readFileSync(this._workbenchHtml, "utf8");
          const cleaned = html.replace(
            /\n?<!-- AG SDK \[[^\]]+\] -->[\s\S]*?<!-- \/AG SDK \[[^\]]+\] -->\n?/g,
            ""
          );
          if (cleaned !== html) {
            fs3__namespace.writeFileSync(this._workbenchHtml, cleaned, "utf8");
          }
        } catch {
        }
        const legacyFiles = [
          "ag-sdk-integrate.js",
          "ag-sdk-heartbeat",
          "ag-sdk-titles.json",
          "ag-sdk-titles-undefined.json",
          "ag-sdk-titles-default.json"
        ];
        for (const name of legacyFiles) {
          this._tryDelete(path3__namespace.join(this._workbenchDir, name));
        }
        try {
          const html = fs3__namespace.readFileSync(this._workbenchHtml, "utf8");
          const cleaned = html.replace(/<script src="\.\/ag-sdk-integrate\.js"><\/script>\n?/g, "").replace(/<!-- X-Ray SDK Integration -->\n?<script[^>]*ag-sdk-integrate[^>]*><\/script>\n?<!-- \/X-Ray SDK Integration -->\n?/g, "");
          if (cleaned !== html) {
            fs3__namespace.writeFileSync(this._workbenchHtml, cleaned, "utf8");
          }
        } catch {
        }
      }
      _tryDelete(filePath) {
        try {
          if (fs3__namespace.existsSync(filePath)) fs3__namespace.unlinkSync(filePath);
        } catch {
        }
      }
    };
    function escapeRegex(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    var log6 = new Logger("IntegrityManager");
    var REGISTRY_FILENAME = ".ag-sdk-integrity.json";
    var IntegrityManager = class {
      /**
       * @param workbenchDir — Absolute path to the workbench directory
       *   (e.g. `%LOCALAPPDATA%/Programs/Antigravity/resources/app/out/vs/code/electron-browser/workbench/`)
       * @param namespace — Unique slug for this extension (e.g. 'kanezal-better-antigravity')
       */
      constructor(workbenchDir, namespace) {
        this._namespace = namespace;
        this._registryPath = path3__namespace.join(workbenchDir, REGISTRY_FILENAME);
        const appDir = path3__namespace.resolve(workbenchDir, "..", "..", "..", "..", "..");
        this._productJsonPath = path3__namespace.join(appDir, "product.json");
        this._appOutDir = path3__namespace.join(appDir, "out");
      }
      /**
       * Suppress the integrity check by updating ALL mismatched hashes in product.json.
       *
       * Scans every file listed in product.json checksums, recomputes SHA256 for each,
       * and updates any that have changed. This handles not just workbench.html but also
       * workbench.desktop.main.js (auto-run fix), jetskiAgent files, etc.
       *
       * Call this after any file patching. Safe to call multiple times.
       */
      suppressCheck() {
        try {
          if (!fs3__namespace.existsSync(this._productJsonPath)) {
            log6.warn(`product.json not found at ${this._productJsonPath}`);
            return;
          }
          const productJson = JSON.parse(fs3__namespace.readFileSync(this._productJsonPath, "utf8"));
          if (!productJson.checksums) {
            log6.debug("No checksums in product.json \u2014 nothing to update");
            return;
          }
          const registry = this._readRegistry();
          if (!registry.namespaces.includes(this._namespace)) {
            registry.namespaces.push(this._namespace);
          }
          let updatedCount = 0;
          for (const [relPath, storedHash] of Object.entries(productJson.checksums)) {
            const filePath = path3__namespace.join(this._appOutDir, relPath);
            let actualHash;
            try {
              const content = fs3__namespace.readFileSync(filePath);
              actualHash = this._computeHash(content);
            } catch {
              continue;
            }
            if (actualHash !== storedHash) {
              if (!(relPath in registry.originalHashes)) {
                registry.originalHashes[relPath] = storedHash;
                log6.debug(`Saved original hash for ${relPath}`);
              }
              productJson.checksums[relPath] = actualHash;
              updatedCount++;
              log6.info(`Updated hash: ${relPath} (${storedHash.substring(0, 8)}... -> ${actualHash.substring(0, 8)}...)`);
            }
          }
          this._writeRegistry(registry);
          if (updatedCount > 0) {
            fs3__namespace.writeFileSync(this._productJsonPath, JSON.stringify(productJson, null, "	"), "utf8");
            log6.info(`Updated ${updatedCount} hash(es) in product.json`);
          } else {
            log6.debug("All hashes already match \u2014 no update needed");
          }
        } catch (err) {
          log6.error("Failed to suppress integrity check", err);
        }
      }
      /**
       * Release the integrity check suppression.
       *
       * Call this when uninstalling the integration. If no other SDK namespaces
       * remain active, restores all original hashes in product.json.
       */
      releaseCheck() {
        try {
          const registry = this._readRegistry();
          registry.namespaces = registry.namespaces.filter((ns) => ns !== this._namespace);
          this._writeRegistry(registry);
          if (registry.namespaces.length > 0) {
            log6.debug(`${registry.namespaces.length} other namespace(s) still active, recomputing hashes`);
            this.suppressCheck();
            return;
          }
          if (Object.keys(registry.originalHashes).length > 0) {
            this._restoreOriginalHashes(registry.originalHashes);
            log6.info(`Restored ${Object.keys(registry.originalHashes).length} original hash(es)`);
          }
          this._deleteRegistry();
        } catch (err) {
          log6.error("Failed to release integrity check", err);
        }
      }
      /**
       * Re-apply integrity suppression after auto-repair.
       *
       * Call this after auto-repair has re-patched files
       * (e.g. after an AG update that overwrote workbench files).
       */
      repair() {
        log6.info("Repairing integrity check suppression...");
        this.suppressCheck();
      }
      // ── Private helpers ─────────────────────────────────────────────
      /**
       * Compute SHA256 hash matching Antigravity's ChecksumService format:
       * base64 WITHOUT trailing '=' padding.
       */
      _computeHash(content) {
        return crypto__namespace.createHash("sha256").update(content).digest("base64").replace(/=+$/, "");
      }
      /**
       * Restore all original hashes in product.json.
       */
      _restoreOriginalHashes(originalHashes) {
        if (!fs3__namespace.existsSync(this._productJsonPath)) return;
        const productJson = JSON.parse(fs3__namespace.readFileSync(this._productJsonPath, "utf8"));
        if (!productJson.checksums) return;
        for (const [relPath, hash] of Object.entries(originalHashes)) {
          if (relPath in productJson.checksums) {
            productJson.checksums[relPath] = hash;
          }
        }
        fs3__namespace.writeFileSync(this._productJsonPath, JSON.stringify(productJson, null, "	"), "utf8");
      }
      /**
       * Read the coordination registry from disk.
       */
      _readRegistry() {
        try {
          if (fs3__namespace.existsSync(this._registryPath)) {
            const raw2 = fs3__namespace.readFileSync(this._registryPath, "utf8");
            const data = JSON.parse(raw2);
            let originalHashes = {};
            if (data.originalHashes && typeof data.originalHashes === "object") {
              originalHashes = data.originalHashes;
            } else if (typeof data.originalHash === "string") {
              originalHashes["vs/code/electron-browser/workbench/workbench.html"] = data.originalHash;
            }
            return {
              namespaces: Array.isArray(data.namespaces) ? data.namespaces : [],
              originalHashes
            };
          }
        } catch {
        }
        return { namespaces: [], originalHashes: {} };
      }
      /**
       * Write the coordination registry to disk.
       */
      _writeRegistry(registry) {
        try {
          fs3__namespace.writeFileSync(this._registryPath, JSON.stringify(registry, null, 2), "utf8");
        } catch (err) {
          log6.error("Failed to write integrity registry", err);
        }
      }
      /**
       * Delete the coordination registry file.
       */
      _deleteRegistry() {
        try {
          if (fs3__namespace.existsSync(this._registryPath)) {
            fs3__namespace.unlinkSync(this._registryPath);
          }
        } catch {
        }
      }
    };
    var TITLES_STORAGE_PREFIX = "ag-sdk-titles";
    var TITLES_DATA_PREFIX = "ag-sdk-titles";
    function generateTitleProxyCode(namespace = "default") {
      const slug = namespace.replace(/[^a-zA-Z0-9-]/g, "-");
      const storageKey = `${TITLES_STORAGE_PREFIX}-${slug}`;
      const dataFile = `./${TITLES_DATA_PREFIX}-${slug}.json`;
      return `
// \u2500\u2500 AG SDK: Title Proxy \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Intercepts summaries provider to inject custom chat titles.
// Uses structural matching (obfuscation-safe).

(function initTitleProxy(){
  var PANEL_SEL='.antigravity-agent-side-panel';
  var TITLE_SEL='.flex.min-w-0.items-center.overflow-hidden';
  var STORAGE_KEY='${storageKey}';
  var DATA_FILE='${dataFile}';
  
  var _provider=null;
  var _origGetState=null;
  var _listeners=[];
  var _customTitles={};
  var _searchTime=0;

  // \u2500\u2500 Load / Save \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  
  function loadTitles(){
    // Step 1: Load from localStorage (sync, fast)
    try{_customTitles=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch(e){_customTitles={};}
    // Step 2: Merge extension-host titles from data file (async fetch)
    fetch(DATA_FILE).then(function(r){
      if(!r.ok)return;
      return r.text();
    }).then(function(text){
      if(!text)return;
      try{
        var extTitles=JSON.parse(text);
        if(extTitles&&typeof extTitles==='object'){
          for(var k in extTitles){_customTitles[k]=extTitles[k];}
          saveTitles();
          notifyListeners();
        }
      }catch(e){}
    }).catch(function(){});
  }
  
  function saveTitles(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(_customTitles));}catch(e){}
  }
  
  // \u2500\u2500 Notify \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  
  function notifyListeners(){
    for(var i=0;i<_listeners.length;i++){try{_listeners[i]();}catch(e){}}
  }
  
  // \u2500\u2500 Provider Wrapping \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  
  function wrapProvider(provider){
    if(provider.__agSDKWrapped)return;
    provider.__agSDKWrapped=true;
    _provider=provider;
    var origFn=provider.getState;
    _origGetState=origFn;
    
    // Wrap getState to inject custom titles
    provider.getState=function(){
      var state=origFn.call(provider);
      if(!state||!state.summaries)return state;
      var hasOverrides=false;
      for(var cid in _customTitles){if(state.summaries[cid]){hasOverrides=true;break;}}
      if(!hasOverrides)return state;
      var ns={};
      for(var k in state.summaries)ns[k]=state.summaries[k];
      for(var cid in _customTitles){
        if(ns[cid]){
          var copy={};for(var p in ns[cid])copy[p]=ns[cid][p];
          copy.summary=_customTitles[cid];
          ns[cid]=copy;
        }
      }
      var newState={};for(var sk in state)newState[sk]=state[sk];
      newState.summaries=ns;
      return newState;
    };
    
    // Intercept onDidChange to capture listeners
    var origOnDidChange=provider.onDidChange;
    provider.onDidChange=function(callback){
      _listeners.push(callback);
      var origDispose=origOnDidChange.call(this,callback);
      return{dispose:function(){
        var idx=_listeners.indexOf(callback);
        if(idx>=0)_listeners.splice(idx,1);
        origDispose.dispose();
      }};
    };
    
    console.log('[AG SDK] Title proxy active, custom titles:', Object.keys(_customTitles).length);
    
    // Force re-render so custom titles appear immediately
    // (without waiting for next native summaries update)
    setTimeout(function(){notifyListeners();},50);
  }
  
  // \u2500\u2500 VNode BFS Walk \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  
  function findProvider(){
    if(_provider)return;
    var panel=document.querySelector(PANEL_SEL);
    if(!panel||!panel.__k)return;
    // Throttle only AFTER confirming panel exists (don't block retries when panel isn't mounted)
    var now=Date.now();
    if(_searchTime&&now-_searchTime<30000)return;
    _searchTime=now;
    var queue=[panel.__k],visited=0;
    while(queue.length>0&&visited<3000){
      var node=queue.shift();
      if(!node)continue;
      if(Array.isArray(node)){
        for(var ai=0;ai<node.length;ai++){if(node[ai])queue.push(node[ai]);}
        continue;
      }
      visited++;
      var comp=node.__c;
      if(comp&&comp.context&&typeof comp.context==='object'){
        for(var key in comp.context){
          try{
            var ctx=comp.context[key];
            if(!ctx||!ctx.props||!ctx.props.value)continue;
            var val=ctx.props.value;
            // Structural match: {provider: {getState() -> {summaries}}}
            if(val.provider&&typeof val.provider.getState==='function'){
              var ts=val.provider.getState();
              if(ts&&ts.summaries){wrapProvider(val.provider);return;}
            }
            // Structural match: {trajectorySummariesProvider: {getState() -> {summaries}}}
            if(val.trajectorySummariesProvider&&typeof val.trajectorySummariesProvider.getState==='function'){
              var ts2=val.trajectorySummariesProvider.getState();
              if(ts2&&ts2.summaries){wrapProvider(val.trajectorySummariesProvider);return;}
            }
          }catch(e){}
        }
      }
      // Direct props match
      if(comp&&comp.props&&comp.props.trajectorySummariesProvider){
        var tsp=comp.props.trajectorySummariesProvider;
        if(typeof tsp.getState==='function'){
          try{var ts3=tsp.getState();
            if(ts3&&ts3.summaries){wrapProvider(tsp);return;}
          }catch(e){}
        }
      }
      if(node.__k){
        if(Array.isArray(node.__k)){for(var ki=0;ki<node.__k.length;ki++){if(node.__k[ki])queue.push(node.__k[ki]);}}
        else{queue.push(node.__k);}
      }
    }
  }
  
  // \u2500\u2500 CascadeId Resolution \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  
  function findCascadeIdByTitle(text){
    if(!_origGetState)return '';
    try{
      var state=_origGetState.call(_provider);
      if(!state||!state.summaries)return '';
      // Reverse lookup custom titles first
      for(var cid in _customTitles){if(_customTitles[cid]===text)return cid;}
      // Match original summaries
      var bestId='',bestTime=0;
      for(var cid in state.summaries){
        var e=state.summaries[cid];
        if(e&&e.summary===text){
          var t=0;try{t=new Date(e.lastModifiedTime).getTime();}catch(e){}
          if(!bestId||t>bestTime){bestId=cid;bestTime=t;}
        }
      }
      return bestId;
    }catch(e){return '';}
  }
  
  // \u2500\u2500 Public API \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  
  window.__agSDKTitles={
    rename:function(cascadeId,title){
      if(!cascadeId||!title)return false;
      _customTitles[cascadeId]=title;
      saveTitles();
      notifyListeners();
      return true;
    },
    renameByCurrentTitle:function(currentTitle,newTitle){
      var cid=findCascadeIdByTitle(currentTitle);
      if(!cid)return false;
      return this.rename(cid,newTitle);
    },
    remove:function(cascadeId){
      delete _customTitles[cascadeId];
      saveTitles();
      notifyListeners();
    },
    getTitle:function(cascadeId){return _customTitles[cascadeId]||null;},
    getAll:function(){var copy={};for(var k in _customTitles)copy[k]=_customTitles[k];return copy;},
    getActiveCascadeId:function(){
      var panel=document.querySelector(PANEL_SEL);
      if(!panel)return '';
      var titleEl=panel.querySelector(TITLE_SEL);
      if(!titleEl)return '';
      var text='';
      function findText(el){
        for(var i=0;i<el.childNodes.length;i++){
          var n=el.childNodes[i];
          if(n.nodeType===3&&n.textContent.trim().length>0)return n.textContent.trim();
          if(n.nodeType===1){var found=findText(n);if(found)return found;}
        }
        return '';
      }
      text=findText(titleEl);
      return text?findCascadeIdByTitle(text):'';
    },
    isReady:function(){return !!_provider;},
    reload:function(){loadTitles();notifyListeners();}
  };
  
  // \u2500\u2500 Init \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  
  loadTitles();
  
  function poll(){
    findProvider();
  }
  
  // Poll until provider found, then every 30s for recovery
  var pollTimer=setInterval(function(){poll();},2000);
  
  // Initial attempt after DOM is ready
  if(document.querySelector(PANEL_SEL)){
    poll();
  }

})();
`;
    }
    function getTitlesDataFile(namespace = "default") {
      const slug = namespace.replace(/[^a-zA-Z0-9-]/g, "-");
      return `${TITLES_DATA_PREFIX}-${slug}.json`;
    }
    var log7 = new Logger("TitleManager");
    var TitleManager = class {
      constructor() {
        this._titles = {};
        this._dataPath = "";
        this._initialized = false;
      }
      /**
       * Initialize with the workbench directory path.
       *
       * @param workbenchDir - Path to workbench directory where data file is stored
       * @param namespace - Extension namespace for file isolation
       */
      initialize(workbenchDir, namespace = "default") {
        this._dataPath = path3__namespace.join(workbenchDir, getTitlesDataFile(namespace));
        this._load();
        this._initialized = true;
        log7.info(`Initialized, ${Object.keys(this._titles).length} custom titles loaded`);
      }
      /**
       * Check if the manager is initialized.
       */
      get isInitialized() {
        return this._initialized;
      }
      /**
       * Set a custom title for a conversation.
       *
       * The title will be displayed in the Agent View title bar
       * and conversation list instead of the auto-generated summary.
       *
       * @param cascadeId - The conversation's cascade ID (UUID)
       * @param title - The custom title to display
       *
       * @example
       * ```typescript
       * // Rename the active conversation
       * const id = sdk.titles.getActiveCascadeId();
       * sdk.titles.rename(id, 'Project Alpha Discussion');
       * ```
       */
      rename(cascadeId, title) {
        if (!cascadeId) {
          log7.warn("rename: cascadeId is required");
          return;
        }
        if (!title || !title.trim()) {
          log7.warn("rename: title cannot be empty");
          return;
        }
        this._titles[cascadeId] = title.trim();
        this._save();
        log7.debug(`Renamed ${cascadeId.substring(0, 8)}... -> "${title.trim()}"`);
      }
      /**
       * Get the custom title for a conversation.
       *
       * @param cascadeId - The conversation's cascade ID
       * @returns The custom title, or undefined if no custom title is set
       */
      getTitle(cascadeId) {
        return this._titles[cascadeId];
      }
      /**
       * Get all custom titles.
       *
       * @returns A copy of the titles map (cascadeId -> title)
       */
      getAll() {
        return { ...this._titles };
      }
      /**
       * Remove a custom title, reverting to the auto-generated summary.
       *
       * @param cascadeId - The conversation's cascade ID
       */
      remove(cascadeId) {
        if (this._titles[cascadeId]) {
          delete this._titles[cascadeId];
          this._save();
          log7.debug(`Removed title for ${cascadeId.substring(0, 8)}...`);
        }
      }
      /**
       * Remove all custom titles.
       */
      clear() {
        this._titles = {};
        this._save();
        log7.debug("Cleared all custom titles");
      }
      /**
       * Get the number of custom titles.
       */
      get count() {
        return Object.keys(this._titles).length;
      }
      /** Load titles from the data file */
      _load() {
        try {
          if (fs3__namespace.existsSync(this._dataPath)) {
            const content = fs3__namespace.readFileSync(this._dataPath, "utf8");
            this._titles = JSON.parse(content) || {};
          }
        } catch (err) {
          log7.warn(`Failed to load titles: ${err}`);
          this._titles = {};
        }
      }
      /** Save titles to the data file */
      _save() {
        if (!this._dataPath) return;
        try {
          fs3__namespace.writeFileSync(this._dataPath, JSON.stringify(this._titles, null, 2), "utf8");
        } catch (err) {
          log7.warn(`Failed to save titles: ${err}`);
        }
      }
      dispose() {
      }
    };
    var log8 = new Logger("IntegrationManager");
    var IntegrationManager = class {
      /**
       * @param namespace - Unique slug that isolates this extension's files.
       *   Derived automatically from `context.extension.id` when using AntigravitySDK.
       *   Multiple SDK-based extensions can coexist without conflicts.
       */
      constructor(namespace = "default") {
        this._configs = /* @__PURE__ */ new Map();
        this._generator = new ScriptGenerator();
        this._titles = new TitleManager();
        this._watcher = null;
        this._autoRepairDebounce = null;
        this._titleProxyEnabled = false;
        this._namespace = namespace;
        this._patcher = new WorkbenchPatcher(namespace);
        this._integrity = new IntegrityManager(
          this._patcher.getWorkbenchDir(),
          namespace
        );
      }
      // ─── Registration ──────────────────────────────────────────────────
      /**
       * Register a single integration point.
       *
       * @throws If an integration with the same ID already exists
       */
      register(config) {
        if (this._configs.has(config.id)) {
          throw new Error(`Integration '${config.id}' is already registered`);
        }
        this._configs.set(config.id, config);
        log8.debug(`Registered integration: ${config.id} (${config.point})`);
      }
      /**
       * Register multiple integration points at once.
       */
      registerMany(configs) {
        for (const c of configs) {
          this.register(c);
        }
      }
      /**
       * Remove a registered integration by ID.
       */
      unregister(id) {
        this._configs.delete(id);
        log8.debug(`Unregistered integration: ${id}`);
      }
      /**
       * Get all registered integrations.
       */
      getRegistered() {
        return Array.from(this._configs.values());
      }
      // ─── Convenience methods (fluent API) ──────────────────────────────
      /**
       * Add a button to the top bar (near +, refresh icons).
       */
      addTopBarButton(id, icon, tooltip, toast) {
        this.register({
          id,
          point: "topBar",
          icon,
          tooltip,
          toast
        });
        return this;
      }
      /**
       * Add a button to the top-right corner (before X).
       */
      addTopRightButton(id, icon, tooltip, toast) {
        this.register({
          id,
          point: "topRight",
          icon,
          tooltip,
          toast
        });
        return this;
      }
      /**
       * Add a button next to the send/voice buttons.
       */
      addInputButton(id, icon, tooltip, toast) {
        this.register({
          id,
          point: "inputArea",
          icon,
          tooltip,
          toast
        });
        return this;
      }
      /**
       * Add an icon to the bottom icon row (file, terminal, etc.).
       */
      addBottomIcon(id, icon, tooltip, toast) {
        this.register({
          id,
          point: "bottomIcons",
          icon,
          tooltip,
          toast
        });
        return this;
      }
      /**
       * Enable per-turn metadata display.
       */
      addTurnMetadata(id, metrics, clickable = true) {
        this.register({
          id,
          point: "turnMeta",
          metrics,
          clickable
        });
        return this;
      }
      /**
       * Add character count badges to user messages.
       */
      addUserBadges(id, display = "charCount") {
        this.register({
          id,
          point: "userBadge",
          display
        });
        return this;
      }
      /**
       * Add an action button next to Good/Bad feedback.
       */
      addBotAction(id, icon, label, toast) {
        this.register({
          id,
          point: "botAction",
          icon,
          label,
          toast
        });
        return this;
      }
      /**
       * Add item(s) to the 3-dot dropdown menu.
       */
      addDropdownItem(id, label, icon, toast, separator = false) {
        this.register({
          id,
          point: "dropdownMenu",
          label,
          icon,
          toast,
          separator
        });
        return this;
      }
      /**
       * Enable chat title interaction.
       */
      addTitleInteraction(id, interaction = "dblclick", hint, toast) {
        this.register({
          id,
          point: "chatTitle",
          interaction,
          hint,
          toast
        });
        return this;
      }
      // ─── Title Proxy ─────────────────────────────────────────────────
      /**
       * Enable the title proxy feature.
       *
       * Adds renderer-side code that intercepts the summaries provider
       * and injects custom chat titles. Uses structural matching to find
       * the provider (obfuscation-safe).
       *
       * After enabling, call `install()` or `updateScript()` to apply.
       *
       * @example
       * ```typescript
       * const sdk = new AntigravitySDK(context);
       * await sdk.initialize();
       *
       * sdk.integration.enableTitleProxy();
       * await sdk.integration.install();
       *
       * // Now rename from extension host:
       * sdk.integration.titles.rename(cascadeId, 'My Custom Title');
       * ```
       */
      enableTitleProxy() {
        this._titleProxyEnabled = true;
        if (this._patcher.isAvailable()) {
          this._titles.initialize(this._patcher.getWorkbenchDir(), this._namespace);
        }
        log8.info("Title proxy enabled");
        return this;
      }
      /**
       * Access the title manager for programmatic title control.
       *
       * Requires `enableTitleProxy()` to be called first.
       *
       * @example
       * ```typescript
       * sdk.integration.titles.rename(cascadeId, 'My Title');
       * sdk.integration.titles.remove(cascadeId);
       * const all = sdk.integration.titles.getAll();
       * ```
       */
      get titles() {
        if (!this._titleProxyEnabled) {
          log8.warn("Title proxy not enabled. Call enableTitleProxy() first.");
        }
        return this._titles;
      }
      // ─── Build & Install ───────────────────────────────────────────────
      /**
       * Generate the integration script from all registered configs.
       *
       * If title proxy is enabled, appends the title proxy renderer code.
       *
       * @returns Complete JavaScript code as a string
       */
      build() {
        const configs = Array.from(this._configs.values());
        if (configs.length === 0 && !this._titleProxyEnabled) {
          throw new Error("No integration points registered and title proxy not enabled");
        }
        log8.debug(`build: ${configs.length} configs, titleProxy=${this._titleProxyEnabled}, ns=${this._namespace}`);
        let script = "";
        if (configs.length > 0) {
          log8.info(`Building script for ${configs.length} integration(s): ${configs.map((c) => c.id).join(", ")}`);
          script = this._generator.generate(configs, this._namespace);
          log8.debug(`build: generated ${script.length} bytes`);
        }
        if (this._titleProxyEnabled) {
          log8.info("Appending title proxy code");
          script += "\n" + generateTitleProxyCode(this._namespace);
        }
        return script;
      }
      /**
       * Install this extension's script into the shared SDK framework.
       *
       * For seamless hot-reload behavior, use `installSeamless()` instead.
       *
       * The first extension to call install() patches workbench.html with
       * the shared loader. Subsequent extensions just register in the manifest.
       *
       * @returns true if the script content actually changed on disk
       */
      async install() {
        if (!this._patcher.isAvailable()) {
          throw new Error("Antigravity workbench not found. Is Antigravity installed?");
        }
        const script = this.build();
        const scriptPath = this._patcher.getScriptPath();
        let oldContent = "";
        try {
          if (fs3__namespace.existsSync(scriptPath)) {
            oldContent = fs3__namespace.readFileSync(scriptPath, "utf8");
          }
        } catch {
        }
        log8.debug(`install: writing script to ${scriptPath}`);
        this._patcher.install(script);
        log8.debug("install: suppressing integrity check");
        this._integrity.suppressCheck();
        this._patcher.writeHeartbeat();
        const changed = oldContent !== script;
        log8.info(
          `Installed integration (${this._configs.size} points, titleProxy: ${this._titleProxyEnabled}) -> ${scriptPath} [${changed ? "CHANGED" : "unchanged"}]`
        );
        log8.debug(`install: registered extensions = ${this._patcher.getRegisteredExtensions().join(", ") || "none"}`);
        return changed;
      }
      /**
       * Seamless install — handles everything automatically.
       *
       * This is the **recommended** install method for extension developers.
       * It handles the entire lifecycle:
       *
       * 1. **First install:** Writes script + patches HTML + prompts user to reload
       * 2. **Update:** Compares content, if changed → auto-reloads window (no prompt)
       * 3. **No change:** Does nothing
       *
       * The developer never needs to think about reload.
       *
       * @param executeCommand - Function to execute VS Code commands
       *   (pass `vscode.commands.executeCommand` or equivalent)
       *
       * @example
       * ```typescript
       * const sdk = new AntigravitySDK(context);
       * await sdk.initialize();
       *
       * sdk.integration.enableTitleProxy();
       * // That's it. SDK handles install, reload, everything.
       * await sdk.integration.installSeamless(
       *   (cmd) => vscode.commands.executeCommand(cmd),
       *   (msg, ...items) => vscode.window.showInformationMessage(msg, ...items),
       * );
       * ```
       */
      async installSeamless(executeCommand, showMessage) {
        const loaderWasPresent = this._patcher.isLoaderInstalled();
        const wasRegistered = this._patcher.isInstalled();
        const scriptPath = this._patcher.getScriptPath();
        let oldContent = "";
        try {
          if (fs3__namespace.existsSync(scriptPath)) {
            oldContent = fs3__namespace.readFileSync(scriptPath, "utf8");
          }
        } catch {
        }
        const changed = await this.install();
        if (!loaderWasPresent) {
          log8.info("First SDK install. Prompting for reload.");
          if (showMessage) {
            const action = await showMessage(
              "Antigravity SDK installed. Reload to activate.",
              "Reload Now"
            );
            if (action === "Reload Now") {
              await executeCommand("workbench.action.reloadWindow");
            }
          }
        } else if (!wasRegistered) {
          log8.info("SDK loader already present \u2014 extension registered, auto-reloading...");
          setTimeout(() => executeCommand("workbench.action.reloadWindow"), 500);
        } else if (changed) {
          log8.info("Script changed on disk. Auto-reloading window...");
          setTimeout(() => executeCommand("workbench.action.reloadWindow"), 500);
        } else {
          log8.debug("Script unchanged. No reload needed.");
        }
      }
      /**
       * Remove this extension from the SDK framework.
       *
       * If this is the last extension, the loader is removed from workbench.html
       * and all original checksums are restored.
       *
       * ⚠️ Requires Antigravity restart to take effect.
       */
      async uninstall() {
        const remaining = this._patcher.getRegisteredExtensions().filter((n) => n !== this._namespace);
        log8.debug(`uninstall: removing ns=${this._namespace}, remaining: ${remaining.join(", ") || "none (last extension)"}`);
        this._patcher.uninstall();
        this._integrity.releaseCheck();
        this.disableAutoRepair();
        log8.info(remaining.length > 0 ? `Uninstalled ${this._namespace}. ${remaining.length} extension(s) still active.` : `Uninstalled ${this._namespace}. SDK fully removed. Restart Antigravity.`);
      }
      /**
       * Check if this extension is registered in the SDK framework.
       */
      isInstalled() {
        return this._patcher.isInstalled();
      }
      /**
       * Check if the shared SDK loader is installed in workbench.html.
       */
      isLoaderInstalled() {
        return this._patcher.isLoaderInstalled();
      }
      /**
       * Signal that the extension is active.
       *
       * Call this in your extension's `activate()` function.
       * The integration script checks for this heartbeat;
       * if it's missing or stale (>48h), the script won't start.
       *
       * This prevents orphaned integrations from running after
       * an extension is disabled or uninstalled.
       *
       * @example
       * ```typescript
       * export function activate(context: vscode.ExtensionContext) {
       *   const sdk = new AntigravitySDK(context);
       *   sdk.integration.signalActive();
       *   // ...
       * }
       * ```
       */
      signalActive() {
        this._patcher.writeHeartbeat();
        log8.debug("Heartbeat refreshed");
      }
      // ─── Dynamic Update ─────────────────────────────────────────────────
      /**
       * Re-generate and overwrite the integration script without re-patching workbench.html.
       *
       * Use this after registering/unregistering integration points at runtime.
       * The script file is updated in-place; the next Antigravity restart
       * will pick up the changes. workbench.html <script> tag is unchanged.
       *
       * @returns true if script was updated
       */
      updateScript() {
        if (!this._patcher.isLoaderInstalled()) {
          log8.warn("Cannot update script \u2014 SDK loader is not installed");
          return false;
        }
        try {
          const script = this.build();
          fs3__namespace.writeFileSync(this._patcher.getScriptPath(), script, "utf8");
          log8.info(`Script updated (${this._configs.size} points)`);
          return true;
        } catch (err) {
          log8.error("Failed to update script", err);
          return false;
        }
      }
      // ─── Auto-Repair ────────────────────────────────────────────────────
      /**
       * Enable auto-repair: watches workbench.html for changes
       * and automatically re-applies the integration patch.
       *
       * This handles Antigravity updates that overwrite workbench.html.
       * The watcher detects when the file changes and re-patches it
       * if the integration marker is missing.
       *
       * @example
       * ```typescript
       * const integrator = new IntegrationManager();
       * integrator.useDemoPreset();
       * await integrator.install();
       * integrator.enableAutoRepair(); // Survive Antigravity updates
       * ```
       */
      enableAutoRepair() {
        if (this._watcher) return;
        const htmlPath = this._patcher.getWorkbenchDir() + "\\workbench.html";
        if (!fs3__namespace.existsSync(htmlPath)) {
          log8.warn("Cannot enable auto-repair \u2014 workbench.html not found");
          return;
        }
        try {
          this._watcher = fs3__namespace.watch(htmlPath, (eventType) => {
            if (eventType !== "change") return;
            if (this._autoRepairDebounce) clearTimeout(this._autoRepairDebounce);
            this._autoRepairDebounce = setTimeout(() => {
              this._tryRepair();
            }, 2e3);
          });
          log8.info("Auto-repair enabled \u2014 watching workbench.html");
        } catch (err) {
          log8.error("Failed to enable auto-repair", err);
        }
      }
      /**
       * Disable auto-repair watcher.
       */
      disableAutoRepair() {
        if (this._watcher) {
          this._watcher.close();
          this._watcher = null;
          log8.info("Auto-repair disabled");
        }
        if (this._autoRepairDebounce) {
          clearTimeout(this._autoRepairDebounce);
          this._autoRepairDebounce = null;
        }
      }
      /**
       * Whether auto-repair is active.
       */
      get isAutoRepairEnabled() {
        return this._watcher !== null;
      }
      _tryRepair() {
        try {
          if (this._patcher.isLoaderInstalled()) {
            log8.debug("Auto-repair: SDK loader still present, no action needed");
            return;
          }
          if (this._configs.size === 0 && !this._titleProxyEnabled) {
            log8.debug("Auto-repair: no configs registered, skipping");
            return;
          }
          log8.info("Auto-repair: SDK loader lost (Antigravity update?), re-installing...");
          const script = this.build();
          this._patcher.install(script);
          this._integrity.repair();
          log8.info("Auto-repair: re-installed successfully. Restart Antigravity.");
        } catch (err) {
          log8.error("Auto-repair failed", err);
        }
      }
      // ─── Preset ────────────────────────────────────────────────────────
      /**
       * Register the Demo preset — a complete demo of all 9 integration points.
       * Useful for testing and as a reference implementation.
       */
      useDemoPreset() {
        this.addTopBarButton("demo_overview", "\u{1F4E1}", "SDK: Session Overview", {
          title: "Session Overview",
          badge: { text: "TOP_BAR", bgColor: "rgba(79,195,247,.2)", textColor: "#4fc3f7" },
          rows: [
            { key: "location:", value: "Header icon bar" },
            { key: "use case:", value: "Session overview, navigation" }
          ]
        });
        this.addTopRightButton("demo_perf", "\u26A1", "SDK: Performance", {
          title: "Performance",
          badge: { text: "TOP_RIGHT", bgColor: "rgba(255,193,7,.2)", textColor: "#ffd54f" },
          rows: [
            { key: "location:", value: "Top right, before close" },
            { key: "use case:", value: "Status indicator" }
          ]
        });
        this.addInputButton("demo_stats", "\u{1F4CA}", "SDK: Stats", {
          title: "Input Stats",
          badge: { text: "INPUT_AREA", bgColor: "rgba(76,175,80,.2)", textColor: "#81c784" },
          rows: [
            { key: "location:", value: "Next to send button" },
            { key: "use case:", value: "Token counter, analytics" }
          ]
        });
        this.addBottomIcon("demo_actions", "\u2630", "SDK: Quick Actions", {
          title: "Quick Actions",
          badge: { text: "BOTTOM_ICONS", bgColor: "rgba(255,152,0,.2)", textColor: "#ffb74d" },
          rows: [
            { key: "location:", value: "Bottom icon row" },
            { key: "use case:", value: "Mode switches, quick actions" }
          ]
        });
        this.addTurnMetadata("demo_turns", [
          "turnNumber",
          "userCharCount",
          "separator",
          "aiCharCount",
          "codeBlocks",
          "thinkingIndicator"
        ]);
        this.addUserBadges("demo_ubadge", "charCount");
        this.addBotAction("demo_inspect", "\u{1F50D}", "inspect", {
          title: "Response Inspector",
          badge: { text: "BOT_ACTION", bgColor: "rgba(156,39,176,.2)", textColor: "#ce93d8" },
          rows: [
            { key: "location:", value: "Next to Good/Bad" },
            { key: "use case:", value: "Response analysis" }
          ]
        });
        this.addDropdownItem("demo_menu_stats", "SDK Stats", "\u{1F4CA}", {
          title: "Extended Stats",
          badge: { text: "DROPDOWN", bgColor: "rgba(233,30,99,.2)", textColor: "#f48fb1" },
          rows: [
            { key: "location:", value: "3-dot dropdown menu" },
            { key: "use case:", value: "Extended actions" }
          ]
        }, true);
        this.addDropdownItem("demo_menu_debug", "SDK Debug", "\u{1F9EA}", {
          title: "Debug Info",
          badge: { text: "DEBUG", bgColor: "rgba(255,87,34,.2)", textColor: "#ff8a65" },
          rows: [
            { key: "location:", value: "3-dot dropdown menu" },
            { key: "use case:", value: "Debug, diagnostics" }
          ]
        });
        this.addTitleInteraction("demo_title", "dblclick", "dblclick", {
          title: "Chat Title",
          badge: { text: "TITLE", bgColor: "rgba(0,150,136,.2)", textColor: "#80cbc4" },
          rows: [
            { key: "location:", value: "Conversation title" },
            { key: "use case:", value: "Rename, bookmark" }
          ]
        });
        return this;
      }
      // ─── Dispose ───────────────────────────────────────────────────────
      dispose() {
        this.disableAutoRepair();
        this._configs.clear();
        this._titles.dispose();
      }
    };
    var log9 = new Logger("SDK");
    var AntigravitySDK2 = class {
      /**
       * Create a new Antigravity SDK instance.
       *
       * @param context - VS Code extension context
       * @param options - SDK options
       */
      constructor(_context, options) {
        this._context = _context;
        this._disposables = new DisposableStore();
        this._initialized = false;
        this._agVersion = null;
        if (options?.debug) {
          Logger.setLevel(
            0
            /* Debug */
          );
        }
        const namespace = this._context.extension.id.replace(/\./g, "-");
        this.commands = this._disposables.add(new CommandBridge());
        this.state = this._disposables.add(new StateBridge());
        this.cascade = this._disposables.add(new CascadeManager(this.commands, this.state));
        this.monitor = this._disposables.add(new EventMonitor(this.state));
        this.integration = this._disposables.add(new IntegrationManager(namespace));
        this.ls = new LSBridge(
          (cmd, ...args) => Promise.resolve(vscode__namespace.commands.executeCommand(cmd, ...args))
        );
        log9.info(`SDK created (namespace: ${namespace})`);
      }
      /**
       * Initialize the SDK and verify Antigravity is running.
       *
       * Call this before using any SDK features.
       *
       * @throws {AntigravityNotFoundError} If Antigravity is not detected
       */
      async initialize() {
        if (this._initialized) {
          return;
        }
        log9.info("Initializing SDK...");
        this._agVersion = detectAGVersion();
        if (this._agVersion) {
          const { version, compatible, supportedRange } = this._agVersion;
          if (!compatible) {
            log9.warn(`AG v${version} is outside supported range (${supportedRange}) \u2014 some features may not work`);
          } else {
            log9.info(`AG v${version} detected (supported: ${supportedRange})`);
          }
        }
        const isAntigravity = await this._detectAntigravity();
        if (!isAntigravity) {
          throw new AntigravityNotFoundError();
        }
        await this.state.initialize();
        await this.cascade.initialize();
        const lsOk = await this.ls.initialize();
        if (lsOk) {
          log9.info(`LS bridge ready on port ${this.ls.port} (csrf: ${this.ls.hasCsrfToken ? "ok" : "missing"})`);
        } else {
          log9.warn("LS bridge not available \u2014 use sdk.ls.setConnection(port, csrfToken) or command fallback");
        }
        this.integration.signalActive();
        this._initialized = true;
        log9.info("SDK initialized successfully");
      }
      /**
       * Check if the SDK has been initialized.
       */
      get isInitialized() {
        return this._initialized;
      }
      /**
       * Get the SDK version.
       */
      get version() {
        try {
          return require_package().version;
        } catch {
          return "unknown";
        }
      }
      /**
       * Get info about the installed Antigravity version and SDK compatibility.
       * Available after initialize().
       */
      get agVersion() {
        return this._agVersion;
      }
      /**
       * Detect if we're running inside Antigravity IDE.
       */
      async _detectAntigravity() {
        try {
          const commands4 = await this.commands.getAntigravityCommands();
          const hasAgentPanel = commands4.includes("antigravity.agentPanel.open");
          if (hasAgentPanel) {
            log9.debug(`Detected Antigravity (${commands4.length} commands)`);
            return true;
          }
          const appName = vscode__namespace.env.appName;
          if (appName?.toLowerCase().includes("antigravity")) {
            log9.debug(`Detected Antigravity via appName: ${appName}`);
            return true;
          }
          return false;
        } catch {
          return false;
        }
      }
      /**
       * Dispose of the SDK and all its resources.
       */
      dispose() {
        log9.info("Disposing SDK");
        this._disposables.dispose();
      }
    };
    exports2.AntigravityCommands = AntigravityCommands2;
    exports2.AntigravityNotFoundError = AntigravityNotFoundError;
    exports2.AntigravitySDK = AntigravitySDK2;
    exports2.AntigravitySDKError = AntigravitySDKError;
    exports2.ArtifactReviewPolicy = ArtifactReviewPolicy;
    exports2.CascadeManager = CascadeManager;
    exports2.CommandBridge = CommandBridge;
    exports2.CommandExecutionError = CommandExecutionError;
    exports2.CortexStepType = CortexStepType;
    exports2.DisposableStore = DisposableStore;
    exports2.EventEmitter = EventEmitter;
    exports2.EventMonitor = EventMonitor;
    exports2.IntegrationManager = IntegrationManager;
    exports2.IntegrationPoint = IntegrationPoint;
    exports2.IntegrityManager = IntegrityManager;
    exports2.LSBridge = LSBridge;
    exports2.LogLevel = LogLevel;
    exports2.Logger = Logger;
    exports2.Models = Models3;
    exports2.SessionNotFoundError = SessionNotFoundError;
    exports2.StateBridge = StateBridge;
    exports2.StateReadError = StateReadError;
    exports2.StepStatus = StepStatus;
    exports2.TerminalExecutionPolicy = TerminalExecutionPolicy;
    exports2.TitleManager = TitleManager;
    exports2.TrajectoryType = TrajectoryType;
    exports2.USSKeys = USSKeys;
    exports2.detectAGVersion = detectAGVersion;
    exports2.toDisposable = toDisposable;
  }
});

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode3 = __toESM(require("vscode"));

// ../../node_modules/.pnpm/@hono+node-server@1.19.11_hono@4.12.8/node_modules/@hono/node-server/dist/index.mjs
var import_http = require("http");
var import_http2 = require("http2");
var import_http22 = require("http2");
var import_stream = require("stream");
var import_crypto = __toESM(require("crypto"), 1);
var RequestError = class extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "RequestError";
  }
};
var toRequestError = (e) => {
  if (e instanceof RequestError) {
    return e;
  }
  return new RequestError(e.message, { cause: e });
};
var GlobalRequest = global.Request;
var Request2 = class extends GlobalRequest {
  constructor(input, options) {
    if (typeof input === "object" && getRequestCache in input) {
      input = input[getRequestCache]();
    }
    if (typeof options?.body?.getReader !== "undefined") {
      ;
      options.duplex ??= "half";
    }
    super(input, options);
  }
};
var newHeadersFromIncoming = (incoming) => {
  const headerRecord = [];
  const rawHeaders = incoming.rawHeaders;
  for (let i = 0; i < rawHeaders.length; i += 2) {
    const { [i]: key, [i + 1]: value } = rawHeaders;
    if (key.charCodeAt(0) !== /*:*/
    58) {
      headerRecord.push([key, value]);
    }
  }
  return new Headers(headerRecord);
};
var wrapBodyStream = Symbol("wrapBodyStream");
var newRequestFromIncoming = (method, url, headers, incoming, abortController) => {
  const init = {
    method,
    headers,
    signal: abortController.signal
  };
  if (method === "TRACE") {
    init.method = "GET";
    const req = new Request2(url, init);
    Object.defineProperty(req, "method", {
      get() {
        return "TRACE";
      }
    });
    return req;
  }
  if (!(method === "GET" || method === "HEAD")) {
    if ("rawBody" in incoming && incoming.rawBody instanceof Buffer) {
      init.body = new ReadableStream({
        start(controller) {
          controller.enqueue(incoming.rawBody);
          controller.close();
        }
      });
    } else if (incoming[wrapBodyStream]) {
      let reader;
      init.body = new ReadableStream({
        async pull(controller) {
          try {
            reader ||= import_stream.Readable.toWeb(incoming).getReader();
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
            } else {
              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
          }
        }
      });
    } else {
      init.body = import_stream.Readable.toWeb(incoming);
    }
  }
  return new Request2(url, init);
};
var getRequestCache = Symbol("getRequestCache");
var requestCache = Symbol("requestCache");
var incomingKey = Symbol("incomingKey");
var urlKey = Symbol("urlKey");
var headersKey = Symbol("headersKey");
var abortControllerKey = Symbol("abortControllerKey");
var getAbortController = Symbol("getAbortController");
var requestPrototype = {
  get method() {
    return this[incomingKey].method || "GET";
  },
  get url() {
    return this[urlKey];
  },
  get headers() {
    return this[headersKey] ||= newHeadersFromIncoming(this[incomingKey]);
  },
  [getAbortController]() {
    this[getRequestCache]();
    return this[abortControllerKey];
  },
  [getRequestCache]() {
    this[abortControllerKey] ||= new AbortController();
    return this[requestCache] ||= newRequestFromIncoming(
      this.method,
      this[urlKey],
      this.headers,
      this[incomingKey],
      this[abortControllerKey]
    );
  }
};
[
  "body",
  "bodyUsed",
  "cache",
  "credentials",
  "destination",
  "integrity",
  "mode",
  "redirect",
  "referrer",
  "referrerPolicy",
  "signal",
  "keepalive"
].forEach((k) => {
  Object.defineProperty(requestPrototype, k, {
    get() {
      return this[getRequestCache]()[k];
    }
  });
});
["arrayBuffer", "blob", "clone", "formData", "json", "text"].forEach((k) => {
  Object.defineProperty(requestPrototype, k, {
    value: function() {
      return this[getRequestCache]()[k]();
    }
  });
});
Object.setPrototypeOf(requestPrototype, Request2.prototype);
var newRequest = (incoming, defaultHostname) => {
  const req = Object.create(requestPrototype);
  req[incomingKey] = incoming;
  const incomingUrl = incoming.url || "";
  if (incomingUrl[0] !== "/" && // short-circuit for performance. most requests are relative URL.
  (incomingUrl.startsWith("http://") || incomingUrl.startsWith("https://"))) {
    if (incoming instanceof import_http22.Http2ServerRequest) {
      throw new RequestError("Absolute URL for :path is not allowed in HTTP/2");
    }
    try {
      const url2 = new URL(incomingUrl);
      req[urlKey] = url2.href;
    } catch (e) {
      throw new RequestError("Invalid absolute URL", { cause: e });
    }
    return req;
  }
  const host = (incoming instanceof import_http22.Http2ServerRequest ? incoming.authority : incoming.headers.host) || defaultHostname;
  if (!host) {
    throw new RequestError("Missing host header");
  }
  let scheme;
  if (incoming instanceof import_http22.Http2ServerRequest) {
    scheme = incoming.scheme;
    if (!(scheme === "http" || scheme === "https")) {
      throw new RequestError("Unsupported scheme");
    }
  } else {
    scheme = incoming.socket && incoming.socket.encrypted ? "https" : "http";
  }
  const url = new URL(`${scheme}://${host}${incomingUrl}`);
  if (url.hostname.length !== host.length && url.hostname !== host.replace(/:\d+$/, "")) {
    throw new RequestError("Invalid host header");
  }
  req[urlKey] = url.href;
  return req;
};
var responseCache = Symbol("responseCache");
var getResponseCache = Symbol("getResponseCache");
var cacheKey = Symbol("cache");
var GlobalResponse = global.Response;
var Response2 = class _Response {
  #body;
  #init;
  [getResponseCache]() {
    delete this[cacheKey];
    return this[responseCache] ||= new GlobalResponse(this.#body, this.#init);
  }
  constructor(body, init) {
    let headers;
    this.#body = body;
    if (init instanceof _Response) {
      const cachedGlobalResponse = init[responseCache];
      if (cachedGlobalResponse) {
        this.#init = cachedGlobalResponse;
        this[getResponseCache]();
        return;
      } else {
        this.#init = init.#init;
        headers = new Headers(init.#init.headers);
      }
    } else {
      this.#init = init;
    }
    if (typeof body === "string" || typeof body?.getReader !== "undefined" || body instanceof Blob || body instanceof Uint8Array) {
      ;
      this[cacheKey] = [init?.status || 200, body, headers || init?.headers];
    }
  }
  get headers() {
    const cache = this[cacheKey];
    if (cache) {
      if (!(cache[2] instanceof Headers)) {
        cache[2] = new Headers(
          cache[2] || { "content-type": "text/plain; charset=UTF-8" }
        );
      }
      return cache[2];
    }
    return this[getResponseCache]().headers;
  }
  get status() {
    return this[cacheKey]?.[0] ?? this[getResponseCache]().status;
  }
  get ok() {
    const status = this.status;
    return status >= 200 && status < 300;
  }
};
["body", "bodyUsed", "redirected", "statusText", "trailers", "type", "url"].forEach((k) => {
  Object.defineProperty(Response2.prototype, k, {
    get() {
      return this[getResponseCache]()[k];
    }
  });
});
["arrayBuffer", "blob", "clone", "formData", "json", "text"].forEach((k) => {
  Object.defineProperty(Response2.prototype, k, {
    value: function() {
      return this[getResponseCache]()[k]();
    }
  });
});
Object.setPrototypeOf(Response2, GlobalResponse);
Object.setPrototypeOf(Response2.prototype, GlobalResponse.prototype);
async function readWithoutBlocking(readPromise) {
  return Promise.race([readPromise, Promise.resolve().then(() => Promise.resolve(void 0))]);
}
function writeFromReadableStreamDefaultReader(reader, writable, currentReadPromise) {
  const cancel = (error) => {
    reader.cancel(error).catch(() => {
    });
  };
  writable.on("close", cancel);
  writable.on("error", cancel);
  (currentReadPromise ?? reader.read()).then(flow, handleStreamError);
  return reader.closed.finally(() => {
    writable.off("close", cancel);
    writable.off("error", cancel);
  });
  function handleStreamError(error) {
    if (error) {
      writable.destroy(error);
    }
  }
  function onDrain() {
    reader.read().then(flow, handleStreamError);
  }
  function flow({ done, value }) {
    try {
      if (done) {
        writable.end();
      } else if (!writable.write(value)) {
        writable.once("drain", onDrain);
      } else {
        return reader.read().then(flow, handleStreamError);
      }
    } catch (e) {
      handleStreamError(e);
    }
  }
}
function writeFromReadableStream(stream, writable) {
  if (stream.locked) {
    throw new TypeError("ReadableStream is locked.");
  } else if (writable.destroyed) {
    return;
  }
  return writeFromReadableStreamDefaultReader(stream.getReader(), writable);
}
var buildOutgoingHttpHeaders = (headers) => {
  const res = {};
  if (!(headers instanceof Headers)) {
    headers = new Headers(headers ?? void 0);
  }
  const cookies = [];
  for (const [k, v] of headers) {
    if (k === "set-cookie") {
      cookies.push(v);
    } else {
      res[k] = v;
    }
  }
  if (cookies.length > 0) {
    res["set-cookie"] = cookies;
  }
  res["content-type"] ??= "text/plain; charset=UTF-8";
  return res;
};
var X_ALREADY_SENT = "x-hono-already-sent";
if (typeof global.crypto === "undefined") {
  global.crypto = import_crypto.default;
}
var outgoingEnded = Symbol("outgoingEnded");
var handleRequestError = () => new Response(null, {
  status: 400
});
var handleFetchError = (e) => new Response(null, {
  status: e instanceof Error && (e.name === "TimeoutError" || e.constructor.name === "TimeoutError") ? 504 : 500
});
var handleResponseError = (e, outgoing) => {
  const err = e instanceof Error ? e : new Error("unknown error", { cause: e });
  if (err.code === "ERR_STREAM_PREMATURE_CLOSE") {
    console.info("The user aborted a request.");
  } else {
    console.error(e);
    if (!outgoing.headersSent) {
      outgoing.writeHead(500, { "Content-Type": "text/plain" });
    }
    outgoing.end(`Error: ${err.message}`);
    outgoing.destroy(err);
  }
};
var flushHeaders = (outgoing) => {
  if ("flushHeaders" in outgoing && outgoing.writable) {
    outgoing.flushHeaders();
  }
};
var responseViaCache = async (res, outgoing) => {
  let [status, body, header] = res[cacheKey];
  let hasContentLength = false;
  if (!header) {
    header = { "content-type": "text/plain; charset=UTF-8" };
  } else if (header instanceof Headers) {
    hasContentLength = header.has("content-length");
    header = buildOutgoingHttpHeaders(header);
  } else if (Array.isArray(header)) {
    const headerObj = new Headers(header);
    hasContentLength = headerObj.has("content-length");
    header = buildOutgoingHttpHeaders(headerObj);
  } else {
    for (const key in header) {
      if (key.length === 14 && key.toLowerCase() === "content-length") {
        hasContentLength = true;
        break;
      }
    }
  }
  if (!hasContentLength) {
    if (typeof body === "string") {
      header["Content-Length"] = Buffer.byteLength(body);
    } else if (body instanceof Uint8Array) {
      header["Content-Length"] = body.byteLength;
    } else if (body instanceof Blob) {
      header["Content-Length"] = body.size;
    }
  }
  outgoing.writeHead(status, header);
  if (typeof body === "string" || body instanceof Uint8Array) {
    outgoing.end(body);
  } else if (body instanceof Blob) {
    outgoing.end(new Uint8Array(await body.arrayBuffer()));
  } else {
    flushHeaders(outgoing);
    await writeFromReadableStream(body, outgoing)?.catch(
      (e) => handleResponseError(e, outgoing)
    );
  }
  ;
  outgoing[outgoingEnded]?.();
};
var isPromise = (res) => typeof res.then === "function";
var responseViaResponseObject = async (res, outgoing, options = {}) => {
  if (isPromise(res)) {
    if (options.errorHandler) {
      try {
        res = await res;
      } catch (err) {
        const errRes = await options.errorHandler(err);
        if (!errRes) {
          return;
        }
        res = errRes;
      }
    } else {
      res = await res.catch(handleFetchError);
    }
  }
  if (cacheKey in res) {
    return responseViaCache(res, outgoing);
  }
  const resHeaderRecord = buildOutgoingHttpHeaders(res.headers);
  if (res.body) {
    const reader = res.body.getReader();
    const values = [];
    let done = false;
    let currentReadPromise = void 0;
    if (resHeaderRecord["transfer-encoding"] !== "chunked") {
      let maxReadCount = 2;
      for (let i = 0; i < maxReadCount; i++) {
        currentReadPromise ||= reader.read();
        const chunk = await readWithoutBlocking(currentReadPromise).catch((e) => {
          console.error(e);
          done = true;
        });
        if (!chunk) {
          if (i === 1) {
            await new Promise((resolve2) => setTimeout(resolve2));
            maxReadCount = 3;
            continue;
          }
          break;
        }
        currentReadPromise = void 0;
        if (chunk.value) {
          values.push(chunk.value);
        }
        if (chunk.done) {
          done = true;
          break;
        }
      }
      if (done && !("content-length" in resHeaderRecord)) {
        resHeaderRecord["content-length"] = values.reduce((acc, value) => acc + value.length, 0);
      }
    }
    outgoing.writeHead(res.status, resHeaderRecord);
    values.forEach((value) => {
      ;
      outgoing.write(value);
    });
    if (done) {
      outgoing.end();
    } else {
      if (values.length === 0) {
        flushHeaders(outgoing);
      }
      await writeFromReadableStreamDefaultReader(reader, outgoing, currentReadPromise);
    }
  } else if (resHeaderRecord[X_ALREADY_SENT]) {
  } else {
    outgoing.writeHead(res.status, resHeaderRecord);
    outgoing.end();
  }
  ;
  outgoing[outgoingEnded]?.();
};
var getRequestListener = (fetchCallback, options = {}) => {
  const autoCleanupIncoming = options.autoCleanupIncoming ?? true;
  if (options.overrideGlobalObjects !== false && global.Request !== Request2) {
    Object.defineProperty(global, "Request", {
      value: Request2
    });
    Object.defineProperty(global, "Response", {
      value: Response2
    });
  }
  return async (incoming, outgoing) => {
    let res, req;
    try {
      req = newRequest(incoming, options.hostname);
      let incomingEnded = !autoCleanupIncoming || incoming.method === "GET" || incoming.method === "HEAD";
      if (!incomingEnded) {
        ;
        incoming[wrapBodyStream] = true;
        incoming.on("end", () => {
          incomingEnded = true;
        });
        if (incoming instanceof import_http2.Http2ServerRequest) {
          ;
          outgoing[outgoingEnded] = () => {
            if (!incomingEnded) {
              setTimeout(() => {
                if (!incomingEnded) {
                  setTimeout(() => {
                    incoming.destroy();
                    outgoing.destroy();
                  });
                }
              });
            }
          };
        }
      }
      outgoing.on("close", () => {
        const abortController = req[abortControllerKey];
        if (abortController) {
          if (incoming.errored) {
            req[abortControllerKey].abort(incoming.errored.toString());
          } else if (!outgoing.writableFinished) {
            req[abortControllerKey].abort("Client connection prematurely closed.");
          }
        }
        if (!incomingEnded) {
          setTimeout(() => {
            if (!incomingEnded) {
              setTimeout(() => {
                incoming.destroy();
              });
            }
          });
        }
      });
      res = fetchCallback(req, { incoming, outgoing });
      if (cacheKey in res) {
        return responseViaCache(res, outgoing);
      }
    } catch (e) {
      if (!res) {
        if (options.errorHandler) {
          res = await options.errorHandler(req ? e : toRequestError(e));
          if (!res) {
            return;
          }
        } else if (!req) {
          res = handleRequestError();
        } else {
          res = handleFetchError(e);
        }
      } else {
        return handleResponseError(e, outgoing);
      }
    }
    try {
      return await responseViaResponseObject(res, outgoing, options);
    } catch (e) {
      return handleResponseError(e, outgoing);
    }
  };
};
var createAdaptorServer = (options) => {
  const fetchCallback = options.fetch;
  const requestListener = getRequestListener(fetchCallback, {
    hostname: options.hostname,
    overrideGlobalObjects: options.overrideGlobalObjects,
    autoCleanupIncoming: options.autoCleanupIncoming
  });
  const createServer = options.createServer || import_http.createServer;
  const server = createServer(options.serverOptions || {}, requestListener);
  return server;
};
var serve = (options, listeningListener) => {
  const server = createAdaptorServer(options);
  server.listen(options?.port ?? 3e3, options.hostname, () => {
    const serverInfo = server.address();
    listeningListener && listeningListener(serverInfo);
  });
  return server;
};

// src/server.ts
var import_antigravity_chat = __toESM(require_dist());

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/utils/body.js
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/utils/url.js
var splitPath = (path3) => {
  const paths = path3.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path: path3 } = extractGroupsFromPath(routePath);
  const paths = splitPath(path3);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path3) => {
  const groups = [];
  path3 = path3.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path: path3 };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey2 = `${label}#${next}`;
    if (!patternCache[cacheKey2]) {
      if (match2[2]) {
        patternCache[cacheKey2] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey2, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey2] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey2];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path3 = url.slice(start, end);
      return tryDecodeURI(path3.includes("%25") ? path3.replace(/%25/g, "%2525") : path3);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path3) => {
  if (path3.charCodeAt(path3.length - 1) !== 63 || !path3.includes(":")) {
    return null;
  }
  const segments = path3.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/request.js
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path3 = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path3;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body, init) => new Response(body, init);
var Context = class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout) => this.#layout = layout;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path3, ...handlers) => {
      for (const p of [path3].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path3, app) {
    const subApp = this.basePath(path3);
    app.routes.map((r) => {
      let handler;
      if (app.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path3) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path3);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path3, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path3);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path3, "*"), handler);
    return this;
  }
  #addRoute(method, path3, handler) {
    method = method.toUpperCase();
    path3 = mergePath(this._basePath, path3);
    const r = { basePath: this._basePath, path: path3, method, handler };
    this.router.add(method, path3, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env2, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env2, "GET")))();
    }
    const path3 = this.getPath(request, { env: env2 });
    const matchResult = this.router.match(method, path3);
    const c = new Context(request, {
      path: path3,
      matchResult,
      env: env2,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path3) {
  const matchers = this.buildAllMatchers();
  const match2 = (method2, path22) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path22];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path22.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  };
  this.match = match2;
  return match2(method, path3);
}

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class _Node {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path3, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path3 = path3.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path3.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path3) {
  return wildcardRegExpCache[path3] ??= new RegExp(
    path3 === "*" ? "" : `^${path3.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path3, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path3] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path3, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path3) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path3) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path3)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path3, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path3 === "/*") {
      path3 = "*";
    }
    const paramCount = (path3.match(/\/:/g) || []).length;
    if (/\*$/.test(path3)) {
      const re = buildWildcardRegExp(path3);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path3] ||= findMiddleware(middleware[m], path3) || findMiddleware(middleware[METHOD_NAME_ALL], path3) || [];
        });
      } else {
        middleware[method][path3] ||= findMiddleware(middleware[method], path3) || findMiddleware(middleware[METHOD_NAME_ALL], path3) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path3) || [path3];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path22 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path22] ||= [
            ...findMiddleware(middleware[m], path22) || findMiddleware(middleware[METHOD_NAME_ALL], path22) || []
          ];
          routes[m][path22].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path3) => [path3, r[method][path3]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path3) => [path3, r[METHOD_NAME_ALL][path3]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path3, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path3, handler]);
  }
  match(method, path3) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path3);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = (children) => {
  for (const _ in children) {
    return true;
  }
  return false;
};
var Node2 = class _Node2 {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path3, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path3);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path3) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path3);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path3[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path3.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path3, handler) {
    const results = checkOptionalParameter(path3);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path3, handler);
  }
  match(method, path3) {
    return this.#node.search(method, path3);
  }
};

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// ../../node_modules/.pnpm/hono@4.12.8/node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  };
};

// ../../node_modules/.pnpm/ws@8.19.0/node_modules/ws/wrapper.mjs
var import_stream2 = __toESM(require_stream(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);

// src/server.ts
var vscode2 = __toESM(require("vscode"));
var import_antigravity_sdk2 = __toESM(require_dist2());

// src/artifacts.ts
var fs = __toESM(require("node:fs"));
var path = __toESM(require("node:path"));
var os = __toESM(require("node:os"));
var BRAIN_DIR = path.join(
  os.homedir(),
  ".gemini",
  "antigravity",
  "brain"
);
function listConversations() {
  if (!fs.existsSync(BRAIN_DIR)) return [];
  return fs.readdirSync(BRAIN_DIR, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith(".")).map((d) => {
    const dir = path.join(BRAIN_DIR, d.name);
    const files = safeListFiles(dir);
    return {
      id: d.name,
      hasArtifacts: files.length > 0,
      files
    };
  });
}
function readArtifact(conversationId, filename) {
  const filePath = path.join(BRAIN_DIR, conversationId, filename);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(BRAIN_DIR))) {
    return null;
  }
  if (!fs.existsSync(resolved)) return null;
  try {
    return fs.readFileSync(resolved, "utf8");
  } catch {
    return null;
  }
}
function safeListFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  try {
    return fs.readdirSync(dir, { withFileTypes: true }).filter((f) => f.isFile() && !f.name.startsWith(".")).map((f) => f.name);
  } catch {
    return [];
  }
}

// src/bridge-services.ts
var import_antigravity_sdk = __toESM(require_dist2());
var vscode = __toESM(require("vscode"));

// src/server-support.ts
function isRecord(value) {
  return typeof value === "object" && value !== null;
}
async function getBridgeDiagnostics(executeCommand) {
  try {
    const raw2 = await executeCommand("antigravity.getDiagnostics");
    return parseBridgeDiagnostics(raw2);
  } catch {
    return null;
  }
}
function parseBridgeDiagnostics(raw2) {
  if (!raw2) {
    return null;
  }
  const parsed = JSON.parse(raw2);
  if (!isRecord(parsed)) {
    return null;
  }
  return parsed;
}
function collectTrajectoryIds(diagnostics) {
  return new Set(
    (diagnostics?.recentTrajectories ?? []).map((trajectory) => trajectory.googleAgentId).filter((trajectoryId) => Boolean(trajectoryId))
  );
}
function findNewConversationId(diagnostics, beforeIds) {
  const newTrajectory = diagnostics?.recentTrajectories?.find((trajectory) => {
    return Boolean(trajectory.googleAgentId && !beforeIds.has(trajectory.googleAgentId));
  });
  return newTrajectory?.googleAgentId ?? null;
}
function getLastTrajectoryId(diagnostics) {
  return diagnostics?.recentTrajectories?.[0]?.googleAgentId ?? "empty";
}
function getTrajectoryCount(diagnostics) {
  return diagnostics?.recentTrajectories?.length ?? 0;
}
function createDiagnosticsSummary(diagnostics) {
  if (!diagnostics) {
    return { error: "No diagnostics available" };
  }
  return {
    extensionLogs: diagnostics.extensionLogs?.slice(-10),
    languageServerLogs: diagnostics.languageServerLogs?.logs?.slice(-10),
    recentTrajectories: diagnostics.recentTrajectories
  };
}
function delay(ms) {
  return new Promise((resolve2) => setTimeout(resolve2, ms));
}

// src/bridge-services.ts
var SdkRuntime = class {
  sdk;
  sdkReady = null;
  initialized = false;
  initError = null;
  constructor(context) {
    this.sdk = new import_antigravity_sdk.AntigravitySDK(context);
  }
  async initialize() {
    try {
      await this.sdk.initialize();
      this.initialized = true;
    } catch (error) {
      this.initError = toError(error);
      console.error("[Bridge] antigravity-sdk initialization failed:", this.initError);
      throw this.initError;
    }
  }
  async ready() {
    if (!this.sdkReady) {
      this.sdkReady = this.initialize();
    }
    await this.sdkReady;
    return this.sdk;
  }
  getState() {
    return {
      initialized: this.initialized,
      error: this.initError
    };
  }
};
var AntigravitySdkConversationService = class {
  constructor(runtime, executeCommand) {
    this.runtime = runtime;
    this.executeCommand = executeCommand;
  }
  async createHeadlessConversation(text, model) {
    const sdk = await this.runtime.ready();
    const startResponse = await sdk.ls.rawRPC("StartCascade", { source: 0 });
    const cascadeId = startResponse.cascadeId ?? null;
    if (!cascadeId) {
      return null;
    }
    const payload = {
      cascadeId,
      items: [{ chunk: { text } }],
      cascadeConfig: {
        plannerConfig: {
          plannerTypeConfig: { conversational: {} },
          requestedModel: { model: model ?? import_antigravity_sdk.Models.GEMINI_FLASH }
        }
      }
    };
    await sdk.ls.rawRPC("SendUserCascadeMessage", payload);
    return cascadeId;
  }
  async getConversation(conversationId) {
    const sdk = await this.runtime.ready();
    const cascades = await sdk.ls.listCascades();
    const trajectoryId = cascades[conversationId]?.trajectoryId ?? conversationId;
    return sdk.ls.rawRPC("GetCascadeTrajectory", {
      cascadeId: conversationId,
      trajectoryId
    });
  }
  async listCascades() {
    const sdk = await this.runtime.ready();
    return sdk.ls.listCascades();
  }
  async focusConversation(conversationId) {
    const sdk = await this.runtime.ready();
    await sdk.ls.focusCascade(conversationId);
  }
  async openConversation(conversationId) {
    await this.executeCommand("antigravity.prioritized.chat.open", { cascadeId: conversationId });
  }
};
var CommandActionService = class {
  constructor(executeCommand) {
    this.executeCommand = executeCommand;
  }
  async startNewChat() {
    await this.executeCommand(import_antigravity_sdk.AntigravityCommands.START_NEW_CONVERSATION);
  }
  async focusChat() {
    await this.executeCommand(import_antigravity_sdk.AntigravityCommands.FOCUS_AGENT_PANEL);
  }
  async acceptStep() {
    await this.executeCommand(import_antigravity_sdk.AntigravityCommands.ACCEPT_AGENT_STEP);
  }
  async rejectStep() {
    await this.executeCommand(import_antigravity_sdk.AntigravityCommands.REJECT_AGENT_STEP);
  }
  async runTerminalCommand() {
    await this.executeCommand(import_antigravity_sdk.AntigravityCommands.TERMINAL_RUN);
  }
};
var AntigravitySdkMonitoringService = class {
  constructor(runtime, executeCommand) {
    this.runtime = runtime;
    this.executeCommand = executeCommand;
  }
  async getLsStatus() {
    const state = this.runtime.getState();
    try {
      const sdk = await this.runtime.ready();
      const ready = sdk.ls.isReady && sdk.ls.hasCsrfToken;
      return {
        initialized: state.initialized,
        ready,
        port: sdk.ls.port,
        hasCsrfToken: sdk.ls.hasCsrfToken
      };
    } catch {
      return {
        initialized: false,
        ready: false,
        port: null,
        hasCsrfToken: false
      };
    }
  }
  async getLsDebugSummary() {
    const diagnostics = await this.getDiagnostics();
    try {
      const sdk = await this.runtime.ready();
      return {
        lsBridge: {
          isReady: sdk.ls.isReady && sdk.ls.hasCsrfToken,
          port: sdk.ls.port,
          hasCsrfToken: sdk.ls.hasCsrfToken
        },
        diagnostics: createDiagnosticsSummary(diagnostics)
      };
    } catch {
      return {
        lsBridge: {
          isReady: false,
          port: null,
          hasCsrfToken: false
        },
        diagnostics: createDiagnosticsSummary(diagnostics)
      };
    }
  }
  async getDiagnosticsRaw() {
    return this.executeCommand(import_antigravity_sdk.AntigravityCommands.GET_DIAGNOSTICS);
  }
  async getDiagnostics() {
    return getBridgeDiagnostics(this.executeCommand);
  }
};
var AntigravitySdkLegacySendService = class {
  constructor(executeCommand, monitoring) {
    this.executeCommand = executeCommand;
    this.monitoring = monitoring;
  }
  async sendPromptToNewConversation(text) {
    const beforeDiagnostics = await this.monitoring.getDiagnostics();
    const beforeIds = collectTrajectoryIds(beforeDiagnostics);
    await this.executeCommand(import_antigravity_sdk.AntigravityCommands.START_NEW_CONVERSATION);
    await delay(1500);
    const commandId = import_antigravity_sdk.AntigravityCommands.SEND_PROMPT_TO_AGENT;
    await this.executeCommand(commandId, text);
    let conversationId = null;
    let latestDiagnostics = beforeDiagnostics;
    for (let index = 0; index < 16; index += 1) {
      await delay(500);
      latestDiagnostics = await this.monitoring.getDiagnostics();
      conversationId = findNewConversationId(latestDiagnostics, beforeIds);
      if (conversationId) {
        break;
      }
    }
    const commandExists = await isCommandAvailable(commandId);
    return {
      conversationId,
      commandExists,
      trajectoriesCount: getTrajectoryCount(latestDiagnostics),
      beforeIdsCount: beforeIds.size,
      lastTrajectoryId: getLastTrajectoryId(latestDiagnostics)
    };
  }
};
function createBridgeServices(context, executeCommand) {
  const runtime = new SdkRuntime(context);
  const monitoring = new AntigravitySdkMonitoringService(runtime, executeCommand);
  return {
    conversation: new AntigravitySdkConversationService(runtime, executeCommand),
    actions: new CommandActionService(executeCommand),
    monitoring,
    legacySend: new AntigravitySdkLegacySendService(executeCommand, monitoring)
  };
}
async function isCommandAvailable(command) {
  const commands4 = await vscode.commands.getCommands(true);
  return commands4.includes(command);
}
function toError(error) {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

// src/server.ts
var BridgeCommands = {
  // Antigravity Native Commands
  SEND_TEXT_TO_CHAT: "antigravity.sendTextToChat",
  SEND_PROMPT_TO_AGENT: "antigravity.sendPromptToAgentPanel",
  ACCEPT_AGENT_STEP: "antigravity.agent.acceptAgentStep",
  REJECT_AGENT_STEP: "antigravity.agent.rejectAgentStep",
  TERMINAL_RUN: "antigravity.terminalCommand.run",
  START_NEW_CONVERSATION: "antigravity.startNewConversation",
  FOCUS_AGENT_PANEL: "antigravity.agentPanel.focus",
  OPEN_AGENT_PANEL: "antigravity.agentPanel.open"
};
function createBridgeServer(options) {
  const app = new Hono2();
  const executeCommand = (command, ...args) => {
    return Promise.resolve(vscode2.commands.executeCommand(command, ...args));
  };
  const services = createBridgeServices(options.context, executeCommand);
  app.use("*", cors());
  app.get("/ping", (c) => c.json({ status: "ok", mode: "native_api" }));
  app.get("/lsstatus", async (c) => {
    return c.json(await services.monitoring.getLsStatus());
  });
  app.post("/send", async (c) => {
    try {
      const { text } = await c.req.json();
      if (!text) {
        return c.json({ error: "Text is required" }, 400);
      }
      console.log(`[Bridge] Received HTTP /send request. Text: "${text}"`);
      const legacySendResult = await services.legacySend.sendPromptToNewConversation(text);
      console.log(`[Bridge] Command executed successfully without throwing.`);
      return c.json({
        success: true,
        conversation_id: legacySendResult.conversationId,
        method: "native_api",
        debug_info: {
          attempted_command: BridgeCommands.SEND_PROMPT_TO_AGENT,
          command_exists: legacySendResult.commandExists,
          polled_trajectories_count: legacySendResult.trajectoriesCount,
          before_ids_count: legacySendResult.beforeIdsCount,
          last_trajectories: legacySendResult.lastTrajectoryId
        }
      });
    } catch (e) {
      console.error("[Bridge] Failed vscode.commands.executeCommand:", e);
      return c.json({ error: e.message || "Failed to execute command", attempted_command: BridgeCommands.SEND_PROMPT_TO_AGENT, error_dump: String(e) }, 500);
    }
  });
  app.post("/action", async (c) => {
    try {
      const { type } = await c.req.json();
      switch (type) {
        case import_antigravity_chat.BRIDGE_ACTIONS.startNewChat:
          await services.actions.startNewChat();
          break;
        case import_antigravity_chat.BRIDGE_ACTIONS.focusChat:
          await services.actions.focusChat();
          break;
        case import_antigravity_chat.BRIDGE_ACTIONS.acceptStep:
        case import_antigravity_chat.BRIDGE_ACTIONS.allow:
          await services.actions.acceptStep();
          break;
        case import_antigravity_chat.BRIDGE_ACTIONS.rejectStep:
          await services.actions.rejectStep();
          break;
        case import_antigravity_chat.BRIDGE_ACTIONS.terminalRun:
          await services.actions.runTerminalCommand();
          break;
        case import_antigravity_chat.BRIDGE_ACTIONS.switchChat:
          return c.json({ error: "switch_chat natively requires an ID, use start_new_chat instead" }, 400);
        default:
          return c.json({ error: "Unknown action type" }, 400);
      }
      return c.json({ success: true, action: type });
    } catch (e) {
      return c.json({ error: e.message || "Failed to execute action" }, 500);
    }
  });
  app.get("/artifacts", async (c) => {
    try {
      const conversations = listConversations();
      return c.json({ conversations });
    } catch (e) {
      return c.json({ error: e.message }, 500);
    }
  });
  app.get("/dump", async (c) => {
    const allCommands = await vscode2.commands.getCommands(true);
    const agCommands = allCommands.filter((cmd) => cmd.toLowerCase().includes("antigravity") || cmd.toLowerCase().includes("chat") || cmd.toLowerCase().includes("agent"));
    return c.json({ commands: agCommands });
  });
  app.get("/dump-ls", async (c) => {
    return c.json(await services.monitoring.getLsDebugSummary());
  });
  app.get("/dump-diag-keys", async (c) => {
    try {
      const raw2 = await services.monitoring.getDiagnosticsRaw();
      if (!raw2) return c.json({ error: "No diagnostics" }, 500);
      const parsed = parseBridgeDiagnostics(raw2);
      if (!parsed) return c.json({ error: "No diagnostics" }, 500);
      const walk = (obj, prefix = "") => {
        if (!obj || typeof obj !== "object") return [];
        const record = obj;
        return Object.keys(record).flatMap((k) => {
          const v = record[k];
          const path3 = prefix ? `${prefix}.${k}` : k;
          if (Array.isArray(v) || typeof v !== "object" || v === null) return [path3];
          return [path3, ...walk(v, path3)];
        });
      };
      const { extensionLogs: _1, languageServerLogs: _2, ...rest } = parsed;
      return c.json({ keys: walk(rest), topLevel: Object.keys(parsed) });
    } catch (e) {
      return c.json({ error: e.message }, 500);
    }
  });
  app.get("/probe-csrf", async (c) => {
    const results = {};
    const cmds = [
      "antigravity.initializeAgent",
      "antigravity.getChromeDevtoolsMcpUrl"
    ];
    for (const cmd of cmds) {
      try {
        const r = await vscode2.commands.executeCommand(cmd);
        results[cmd] = r ?? null;
      } catch (e) {
        results[cmd] = { error: e.message };
      }
    }
    return c.json(results);
  });
  app.post("/chat", async (c) => {
    try {
      const body = await c.req.json();
      if (!body.text) {
        return c.json({ error: "Text is required" }, 400);
      }
      const cascadeId = await services.conversation.createHeadlessConversation(
        body.text,
        body.model || import_antigravity_sdk2.Models.GEMINI_FLASH
      );
      if (!cascadeId) {
        return c.json({ error: "Failed to create headless cascade (is LSBridge connected?)" }, 500);
      }
      return c.json({ conversation_id: cascadeId });
    } catch (e) {
      console.error("[Bridge] POST /chat failed:", e);
      return c.json({ error: e.message || String(e) }, 500);
    }
  });
  app.get("/conversation/:id", async (c) => {
    try {
      const id = c.req.param("id");
      return c.json(await services.conversation.getConversation(id));
    } catch (e) {
      return c.json({ error: `LS GetCascadeTrajectory: ${e.message}` }, 500);
    }
  });
  app.get("/list-cascades", async (c) => {
    try {
      return c.json(await services.conversation.listCascades());
    } catch (e) {
      return c.json({ error: e.message }, 500);
    }
  });
  app.post("/focus/:id", async (c) => {
    try {
      const id = c.req.param("id");
      await services.conversation.focusConversation(id);
      return c.json({ success: true });
    } catch (e) {
      return c.json({ error: `LS FocusCascade: ${e.message}` }, 500);
    }
  });
  app.post("/openchat/:id", async (c) => {
    try {
      const id = c.req.param("id");
      await services.conversation.openConversation(id);
      return c.json({ success: true, focusedId: id });
    } catch (e) {
      return c.json({ error: `VSCode OpenChat: ${e.message}` }, 500);
    }
  });
  app.get("/artifacts/:convoId", async (c) => {
    try {
      const { convoId } = c.req.param();
      const path3 = c.req.query("path");
      if (!path3) {
        return c.json({ error: "Path parameter is required" }, 400);
      }
      const content = readArtifact(convoId, path3);
      if (content === null) {
        return c.json({ error: "Artifact not found" }, 404);
      }
      return c.text(content);
    } catch (e) {
      return c.json({ error: e.message }, 500);
    }
  });
  const httpServer = serve({
    fetch: app.fetch,
    port: options.httpPort
  });
  const wsServer = new import_websocket_server.default({ port: options.wsPort });
  wsServer.on("connection", (ws) => {
    console.log("[Bridge] WS Client connected");
    ws.on("message", (_msg) => {
    });
    ws.send(JSON.stringify({ type: "bridge_ready", version: "1.0.0" }));
  });
  console.log(`[Bridge] HTTP :${options.httpPort} | WS :${options.wsPort}`);
  return {
    httpServer,
    wsServer,
    close: () => {
      httpServer.close();
      wsServer.close();
    }
  };
}

// src/extension.ts
var fs2 = __toESM(require("node:fs"));
var path2 = __toESM(require("node:path"));

// src/bridge-config.ts
var DEFAULT_HTTP_PORT = 5820;
var DEFAULT_WS_PORT = 5821;
function createBridgeConfig(values) {
  return {
    enabled: values.enabled ?? true,
    httpPort: values.httpPort ?? DEFAULT_HTTP_PORT,
    wsPort: values.wsPort ?? DEFAULT_WS_PORT
  };
}
function getBridgeStatusPresentation(config) {
  if (!config.enabled) {
    return {
      text: "$(circle-slash) Bridge: Disabled",
      tooltip: `Antigravity Bridge is disabled \u2014 configured HTTP :${config.httpPort} | WS :${config.wsPort}`,
      startMessage: `Antigravity Bridge is disabled \u2014 enable it to listen on HTTP :${config.httpPort} | WS :${config.wsPort}`,
      toggleMessage: "Antigravity Bridge enablement is controlled by settings. Update `antigravity-bridge.enabled` and reload the window."
    };
  }
  return {
    text: "$(zap) Bridge: Ready",
    tooltip: `Antigravity Bridge \u2014 HTTP :${config.httpPort} | WS :${config.wsPort}`,
    startMessage: `Antigravity Bridge running \u2014 HTTP :${config.httpPort} | WS :${config.wsPort}`,
    toggleMessage: "Antigravity Bridge is enabled. Change `antigravity-bridge.enabled`, `httpPort`, or `wsPort` in settings and reload the window to apply updates."
  };
}

// src/extension.ts
var bridge = null;
function activate(context) {
  restoreLegacyPatchedFiles();
  const config = loadBridgeConfig();
  if (config.enabled) {
    bridge = createBridgeServer({
      context,
      ...config
    });
  }
  registerStatusBar(context, config);
  registerCommands(context, config);
  registerCleanup(context);
  console.log("[Bridge] Extension activated in Native API Mode");
}
function deactivate() {
  bridge?.close();
  bridge = null;
  console.log("[Bridge] Extension deactivated");
}
function restoreLegacyPatchedFiles() {
  try {
    restoreBackupFile(
      path2.join(vscode3.env.appRoot, "out", "vs", "workbench", "workbench.desktop.main.js"),
      /\.js$/,
      "_orig.js",
      "[Bridge] Restored corrupt workbench JS file successfully."
    );
    restoreBackupFile(
      path2.join(vscode3.env.appRoot, "out", "vs", "code", "electron-browser", "workbench", "workbench.html"),
      /\.html$/,
      "_orig.html",
      "[Bridge] Restored corrupt workbench HTML file successfully."
    );
  } catch (error) {
    console.error("[Bridge] Failed to restore legacy patched files", error);
  }
}
function restoreBackupFile(targetPath, extensionPattern, backupSuffix, successMessage) {
  const backupPath = targetPath.replace(extensionPattern, backupSuffix);
  if (!fs2.existsSync(backupPath)) {
    return;
  }
  fs2.writeFileSync(targetPath, fs2.readFileSync(backupPath));
  fs2.unlinkSync(backupPath);
  console.log(successMessage);
}
function loadBridgeConfig() {
  const config = vscode3.workspace.getConfiguration("antigravity-bridge");
  return createBridgeConfig({
    enabled: config.get("enabled"),
    httpPort: config.get("httpPort") ?? 5820,
    wsPort: config.get("wsPort") ?? 5821
  });
}
function registerStatusBar(context, config) {
  const presentation = getBridgeStatusPresentation(config);
  const statusBar = vscode3.window.createStatusBarItem(
    vscode3.StatusBarAlignment.Right,
    100
  );
  statusBar.text = presentation.text;
  statusBar.tooltip = presentation.tooltip;
  statusBar.show();
  context.subscriptions.push(statusBar);
}
function registerCommands(context, config) {
  const presentation = getBridgeStatusPresentation(config);
  context.subscriptions.push(
    vscode3.commands.registerCommand("antigravity-bridge.start", () => {
      vscode3.window.showInformationMessage(presentation.startMessage);
    })
  );
  context.subscriptions.push(
    vscode3.commands.registerCommand("antigravity-bridge.toggle", () => {
      vscode3.window.showInformationMessage(presentation.toggleMessage);
    })
  );
}
function registerCleanup(context) {
  context.subscriptions.push({
    dispose: () => bridge?.close()
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
