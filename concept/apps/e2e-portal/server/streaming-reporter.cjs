// Custom Playwright reporter that writes JSONL events to stderr in real-time.
// CommonJS format required because Playwright loads reporters via require().

class StreamingReporter {
  onBegin(_config, suite) {
    const total = suite.allTests().length;
    this._write({ event: "begin", total });
  }

  onTestBegin(test, result) {
    const suite = test.parent ? test.parent.title : "";
    this._write({
      event: "testBegin",
      title: test.title,
      suite,
      file: test.location ? test.location.file : "",
      retry: result.retry,
    });
  }

  onTestEnd(test, result) {
    const errors = (result.errors || []).map((e) => ({
      message: e.message || "",
      snippet: e.snippet || "",
      stack: e.stack || "",
    }));
    const suite = test.parent ? test.parent.title : "";
    this._write({
      event: "testEnd",
      title: test.title,
      suite,
      status: result.status,
      duration: result.duration,
      errors,
      retry: result.retry,
    });
  }

  onEnd(result) {
    this._write({
      event: "end",
      status: result.status,
      duration: result.duration,
    });
  }

  onError(error) {
    this._write({
      event: "error",
      message: error.message || String(error),
    });
  }

  _write(obj) {
    try {
      process.stderr.write(JSON.stringify(obj) + "\n");
    } catch {
      // Ignore write errors
    }
  }
}

module.exports = StreamingReporter;
