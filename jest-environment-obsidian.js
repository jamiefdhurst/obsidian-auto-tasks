"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
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
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};

// src/constants.ts
var PACKAGE_NAME, RUNTIME_STATE_GLOBAL_NAME, RUNTIME_PACKAGE, LATEST_OBSIDIAN_VERSION;
var init_constants = __esm({
  "src/constants.ts"() {
    "use strict";
    PACKAGE_NAME = "jest-environment-obsidian";
    RUNTIME_STATE_GLOBAL_NAME = "$$jest-environment-obsidian-runtime";
    RUNTIME_PACKAGE = `${PACKAGE_NAME}/test-runtime`;
    LATEST_OBSIDIAN_VERSION = "1.1.16";
  }
});

// src/setup/mapped-modules.ts
var MappedModules, mapped_modules_default;
var init_mapped_modules = __esm({
  "src/setup/mapped-modules.ts"() {
    "use strict";
    init_constants();
    MappedModules = {
      obsidian: require.resolve(`${RUNTIME_PACKAGE}/modules/obsidian`)
    };
    mapped_modules_default = MappedModules;
  }
});

// src/setup/jest-resolver.ts
var require_jest_resolver = __commonJS({
  "src/setup/jest-resolver.ts"(exports, module2) {
    "use strict";
    init_mapped_modules();
    function createResolver(parent) {
      const parentAsync = parent?.async;
      const parentSync = parent?.sync ?? typeof parent === "function" ? parent : void 0;
      let asyncResolve = null;
      if (parentAsync != null) {
        asyncResolve = async function async(path, options) {
          if (path in mapped_modules_default)
            return mapped_modules_default[path];
          if (parentSync != null)
            return (parentAsync ?? parentSync)(path, options);
          return options.defaultResolver(path, options);
        };
      }
      return {
        sync(path, options) {
          if (path in mapped_modules_default)
            return mapped_modules_default[path];
          if (parentSync != null)
            return parentSync(path, options);
          return options.defaultResolver(path, options);
        },
        ...asyncResolve == null ? {} : { async: asyncResolve }
      };
    }
    var defaultResolver = createResolver();
    module2.exports = Object.assign(
      defaultResolver,
      {
        default: defaultResolver,
        createResolver,
        mappedModules: mapped_modules_default
      }
    );
  }
});

// src/setup/jest-environment.ts
var jest_environment_exports = {};
__export(jest_environment_exports, {
  default: () => ObsidianEnvironment
});
module.exports = __toCommonJS(jest_environment_exports);
var import_jest_environment_jsdom = require("jest-environment-jsdom");
init_constants();

// src/warning.ts
var import_node_process = require("process");
var import_path = require("path");
var import_jest_message_util = require("../../../node_modules/jest-message-util/build/index.js");
var ENABLE_COLOR = import_node_process.argv.includes("--color") ? true : !import_node_process.argv.includes("--no-color");
var REGEX_STACK_TRACE_WITHIN_THIS = /\s*at .*jest-environment-obsidian.*/;
var REGEX_STACK_TRACE_EXTRACT_FILE = /\s*at (?:.(?! \())+. \((.*?)(?::(\d+)(?::(\d+))?)?\)/;
function printWarnings(writer, warnings, options, config) {
  const seenWarnings = /* @__PURE__ */ new Set();
  for (const warning of warnings) {
    const warningInstanceId = `${warning.id}:${warning.caller}`;
    if (seenWarnings.has(warningInstanceId))
      continue;
    seenWarnings.add(warningInstanceId);
    printWarning(writer, warning, options, config);
  }
}
function printWarning(writer, warning, options, config) {
  if (options.ignoreWarnings.includes(warning.id))
    return;
  const message = ENABLE_COLOR ? formatWarningMessageWithColor(warning, config) : formatWarningMessage(warning, config);
  const traceAndFrame = (0, import_jest_message_util.formatStackTrace)(warning.stack, config.projectConfig, {
    noStackTrace: false
  });
  writer(`
${message}
${traceAndFrame}
`);
}
function formatWarningMessage(warning, config) {
  const badge = `WARN`;
  const suite = warning.suite === "(unknown)" ? "(unknown)" : (0, import_path.relative)(config.projectConfig.rootDir, warning.suite);
  const id = `Warning: ${warning.id}`;
  const message = (0, import_jest_message_util.indentAllLines)(warning.toString());
  return `${badge} ${suite}
${id}

${message}`;
}
function formatWarningMessageWithColor(warning, config) {
  const badge = `\x1B[1;43m WARN \x1B[m`;
  const suite = warning.suite === "(unknown)" ? "(unknown)" : (0, import_path.relative)(config.projectConfig.rootDir, warning.suite);
  const id = `\x1B[33mWarning: \x1B[1;33m${warning.id}\x1B[m`;
  const suiteDirname = `\x1B[2m${(0, import_path.dirname)(suite)}${import_path.sep}\x1B[m`;
  const suiteBasename = `\x1B[1m${(0, import_path.basename)(suite)}\x1B[m`;
  const message = (0, import_jest_message_util.indentAllLines)(warning.toString()).split("\n").map((line) => `\x1B[33m${line}\x1B[m`).join("\n");
  return `${badge} ${suiteDirname}${suiteBasename}
${id}

${message}`;
}
function filterStack(stack) {
  return stack.split("\n").slice(1).filter((line) => !REGEX_STACK_TRACE_WITHIN_THIS.test(line) || line.includes(".test.ts")).join("\n");
}
function filterSuite(stack) {
  const traceLine = stack.split("\n").slice(1).filter((line) => !REGEX_STACK_TRACE_WITHIN_THIS.test(line) || line.includes(".test.ts"))[0];
  return REGEX_STACK_TRACE_EXTRACT_FILE.exec(traceLine)?.[1] ?? "(unknown)";
}
var AbstractWarning = class {
  constructor(context, ..._rest) {
    const stack = new Error().stack;
    this.stack = filterStack(stack);
    this.suite = filterSuite(stack);
    this.caller = context;
    this.id = Object.getPrototypeOf(this).constructor.name.replace(/[A-Z]/g, (matches) => `-${matches[0].toLowerCase()}`).replace(/^-*/, "");
  }
};

// src/warning-types.ts
var warning_types_exports = {};
__export(warning_types_exports, {
  IllegalCssClassName: () => IllegalCssClassName,
  MissingExportStub: () => MissingExportStub,
  NodeMustBeWithinDocument: () => NodeMustBeWithinDocument,
  SetCssStylesDoesNotSetUnknownProperties: () => SetCssStylesDoesNotSetUnknownProperties,
  SetCssStylesDoesNotSetVariables: () => SetCssStylesDoesNotSetVariables
});
var NodeMustBeWithinDocument = class extends AbstractWarning {
  toString() {
    return [
      `${this.caller} will always return false unless the node is attached to the document.`,
      "In this test, the node was not attached to the document.",
      "",
      "To remove this behavior from unit tests, use the `@obsidian-api lax` test pragma."
    ].join("\n");
  }
};
var SetCssStylesDoesNotSetVariables = class extends AbstractWarning {
  constructor(context, property) {
    super(context);
    this.property = property;
  }
  toString() {
    return [
      `${this.caller} does not change CSS variables.`,
      `To actually set \`${this.property}\` within the DOM, use \`setCssProperty\` instead.`,
      "",
      `If this in intentional, use the \`@obsidian-jest-ignore ${this.id}\` test pragma.`
    ].join("\n");
  }
};
var SetCssStylesDoesNotSetUnknownProperties = class extends AbstractWarning {
  constructor(context, property) {
    super(context);
    this.property = property;
  }
  toString() {
    return [
      `${this.caller} does not set unknown style properties.`,
      `To actually set \`${this.property}\` within the DOM, use \`setCssProperty\` instead.`,
      "",
      `If this in intentional, use the \`@obsidian-jest-ignore ${this.id}\` test pragma.`
    ].join("\n");
  }
};
var IllegalCssClassName = class extends AbstractWarning {
  constructor(context, property, value) {
    super(context);
    this.property = property;
    this.value = value;
  }
  toString() {
    return [
      `Property \`${this.property}\` provided to ${this.caller} contains an invalid CSS class, "${this.value}".`,
      `This will throw an error both within tests and Obsidian.`
    ].join("\n");
  }
};
var MissingExportStub = class extends AbstractWarning {
  constructor(context, module2, prop) {
    super(context);
    this.module = module2;
    this.prop = prop;
  }
  toString() {
    return [
      "jest-environment-obsidian does not have a stub for",
      `'${this.prop}' in the '${this.module}' module.`,
      "",
      `Import for '${this.prop}' will return \`undefined\`,`,
      "which may cause unexpected behaviors in your tests.",
      "",
      "Please consider opening an issue or creating a pull request for this stub at",
      "",
      "https://github.com/obsidian-community/jest-environment-obsidian",
      "",
      "Alternatively, you can emit an undefined variable without this warning",
      "(or turn it into an error) by changing the `missingExports` environment",
      'option to either "undef" or "error"'
    ].join("\n");
  }
};

// src/warning-collection.ts
var REGEX_STACK_TRACE_AT_WARNING = /^\s*at __WARNING__/;
var REGEX_STACK_TRACE_EXTRACT_FUNCTION = /\s*at ((?:.(?! \())+.)/;
var WarningCollection = class {
  constructor() {
    this.warnings = /* @__PURE__ */ new Set();
  }
  /**
   * Adds a warning under the current test suite.
   *
   * @param state The environment context.
   * @param type The warning type.
   * @param caller The calling function.
   * @param params The warning parameters.
   */
  add(type, caller, ...params) {
    const warningClass = warning_types_exports[type];
    const warningCaller = caller ?? (() => {
      const stack = new Error().stack.split("\n");
      const lineOfCaller = stack.findIndex((line) => REGEX_STACK_TRACE_AT_WARNING.test(line)) + 2;
      const traceOfCaller = stack[lineOfCaller];
      return REGEX_STACK_TRACE_EXTRACT_FUNCTION.exec(traceOfCaller)[1];
    })();
    this.warnings.add(Reflect.construct(warningClass, [warningCaller, ...params]));
  }
  /**
   * The number of warnings accumulated during test execution.
   */
  get count() {
    return this.warnings.size;
  }
  /**
   * Clears all the warnings.
   */
  clear() {
    this.warnings.clear();
  }
  /**
   * Prints the accumulated warnings.
   *
   * @param writer Called to print the message somewhere.
   * @param options Environment options.
   * @param config Project config.
   *
   * @internal
   */
  print(writer, options, config) {
    printWarnings(writer, this.warnings, options, config);
  }
};

// src/gateway.ts
var RuntimeGateway = class {
  constructor(options) {
    this.options = options;
    this.warnings = new WarningCollection();
  }
};

// src/options.ts
init_constants();
function createDefault() {
  return {
    conformance: "lax",
    version: LATEST_OBSIDIAN_VERSION,
    missingExports: "warning",
    ignoreWarnings: []
  };
}
function applyJestConfig(target, config) {
  for (const [name, value] of Object.entries(config.projectConfig.testEnvironmentOptions)) {
    if (!(name in Appliers)) {
      if (IntrinsicOptions.has(name)) {
        continue;
      }
      throw new EnvironmentOptionError(name, false, "is not a known option");
    }
    try {
      const applier = Appliers[name];
      applier.assign(target, value);
    } catch (error) {
      if (error instanceof EnvironmentOptionError)
        throw error;
      throw new EnvironmentOptionError(name, false, error.message);
    }
  }
}
function applyJestPragmas(target, pragmas) {
  const byPragma = /* @__PURE__ */ new Map();
  for (const [_, applier] of Object.entries(Appliers)) {
    if ("pragma" in applier)
      byPragma.set(applier.pragma, applier);
  }
  for (const [name, value] of Object.entries(pragmas)) {
    const applier = byPragma.get(name);
    if (applier == null)
      continue;
    const translatedValue = applier.pragmaToConfig(value instanceof Array ? value : [value]);
    try {
      applier.assign(target, translatedValue);
    } catch (error) {
      if (error instanceof EnvironmentOptionError)
        throw error;
      throw new EnvironmentOptionError(`@${name}`, true, error.message);
    }
  }
}
var EnvironmentOptionError = class extends Error {
  constructor(option, optionIsPragma, message) {
    super(
      `Failed to set up jest-environment-obsidian.
${optionIsPragma ? "The docblock pragma" : "The environment option"} "${option}" ${message}`
    );
    this.option = option;
    this.stack = "";
  }
};
var IntrinsicOptions = /* @__PURE__ */ new Set(["customExportConditions"]);
var Appliers = {
  conformance: {
    assign(target, value) {
      if (typeof value !== "string")
        throw new Error(`must be either "strict" or "lax"`);
      if (value !== "lax" && value !== "strict")
        throw new Error(`must be either "strict" or "lax"`);
      target.conformance = value;
    },
    pragma: "obsidian-conformance",
    pragmaToConfig(value) {
      if (value.length > 1)
        throw new Error(`can only be specified once`);
      return value[0];
    }
  },
  version: {
    assign(target, value) {
      if (typeof value !== "string")
        throw new Error("must be a string");
      target.version = value;
    },
    pragma: "obsidian-version",
    pragmaToConfig(value) {
      if (value.length > 1)
        throw new Error(`can only be specified once`);
      return value[0];
    }
  },
  ignoreWarnings: {
    assign(target, value) {
      if (!(value instanceof Array))
        throw new Error(`must be an array`);
      for (const item in value)
        if (typeof item !== "string")
          throw new Error(`may only contain strings`);
      target.ignoreWarnings.push(...value);
    },
    pragma: "obsidian-jest-ignore",
    pragmaToConfig(value) {
      return value;
    }
  },
  missingExports: {
    assign(target, value) {
      if (typeof value !== "string")
        throw new Error(`must be either "error", "warning", or "undef"`);
      if (!["error", "warning", "undef"].includes(value)) {
        throw new Error(`must be either "error", "warning", or "undef"`);
      }
      target.missingExports = value;
    }
  },
  $$JEST_ENVIRONMENT_OBSIDIAN_NO_PATCH$$: {
    assign(target, value) {
      target["$$JEST_ENVIRONMENT_OBSIDIAN_NO_PATCH$$"] = value;
    }
  }
};

// src/setup/jest-patches.ts
init_constants();
var import_jest_resolver = __toESM(require_jest_resolver());

// src/setup/monkeypatch.ts
init_constants();
function monkeypatch(target, prop, replacement) {
  const original = target[prop];
  const name = `${prop.toString()} [${PACKAGE_NAME}]`;
  const hooked = {
    [name](...args) {
      return Reflect.apply(replacement, this, [original.bind(this), ...args]);
    }
  }[name];
  target[prop] = hooked;
}

// src/setup/jest-patches.ts
var mappedModules = import_jest_resolver.default.mappedModules;
var resolverHooked = false;
function injectRuntimeSetup(config) {
  const { projectConfig } = config;
  const setupScript = require.resolve(`${RUNTIME_PACKAGE}/setup`);
  projectConfig.setupFiles.unshift(setupScript);
}
function injectRuntimeModules() {
  if (resolverHooked)
    return;
  resolverHooked = true;
  const ResolverInstance = require.main.require("jest-resolve").default;
  monkeypatch(ResolverInstance, "findNodeModule", hookedResolverSync);
  monkeypatch(ResolverInstance, "findNodeModuleAsync", hookedResolverAsync);
}
function hookedResolverSync(original, path, options, ...args) {
  const result = original(path, options, ...args);
  if (result != null)
    return result;
  if (!options.conditions?.includes("jest-environment-obsidian"))
    return null;
  return path in mappedModules ? mappedModules[path] : null;
}
async function hookedResolverAsync(original, path, options, ...args) {
  const result = await original(path, options, ...args);
  if (result != null)
    return result;
  if (!options.conditions?.includes("jest-environment-obsidian"))
    return null;
  return path in mappedModules ? mappedModules[path] : null;
}

// src/setup/jest-environment.ts
var _envConfig, _envContext;
var ObsidianEnvironment = class extends import_jest_environment_jsdom.TestEnvironment {
  constructor(config, context) {
    super(config, context);
    __privateAdd(this, _envConfig, void 0);
    __privateAdd(this, _envContext, void 0);
    __privateSet(this, _envConfig, config);
    __privateSet(this, _envContext, context);
    this.customExportConditions.push("obsidian", "jest-environment-obsidian");
    this.options = createDefault();
    applyJestConfig(this.options, config);
    applyJestPragmas(this.options, context.docblockPragmas);
    this.runtimeState = new RuntimeGateway(this.options);
    this.global[RUNTIME_STATE_GLOBAL_NAME] = this.runtimeState;
    if (!this.options["$$JEST_ENVIRONMENT_OBSIDIAN_NO_PATCH$$"]) {
      injectRuntimeSetup(__privateGet(this, _envConfig));
      injectRuntimeModules();
    }
  }
  /** @override */
  async setup() {
    await super.setup();
  }
  /** @override */
  async teardown() {
    this.runtimeState.warnings.print((msg) => console.error(msg), this.options, __privateGet(this, _envConfig));
    await super.teardown();
  }
  /** @override */
  getVmContext() {
    return super.getVmContext();
  }
  // async handleTestEvent(event: Circus.AsyncEvent | Circus.SyncEvent, state: Circus.State) {
  // 	if (event.name === 'setup') {
  // 	}
  // }
};
_envConfig = new WeakMap();
_envContext = new WeakMap();
