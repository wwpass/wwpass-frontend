class WWPassError extends Error {
  constructor(code, ...args) {
    super(args, WWPassError);
    Error.captureStackTrace(this, WWPassError);

    this.code = code;
  }

  toString() {
    return `${this.name}(${this.code}): ${this.message}`;
  }
}

export default WWPassError;
