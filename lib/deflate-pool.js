'use strict';

/**
 * A pool of reset deflate streams that a server shares between its
 * connections. When context takeover is disabled, a deflate stream carries
 * nothing over from one message to the next, so a connection can return its
 * stream after each message instead of keeping it, and the memory it holds,
 * for its whole lifetime.
 */
class DeflatePool {
  /**
   * Creates a new `DeflatePool`.
   *
   * @param {Number} size The maximum number of idle streams to keep for each
   *     window size
   */
  constructor(size) {
    this.closed = false;
    this.size = size;
    this.streams = new Map();
  }

  /**
   * Removes an idle stream from the pool.
   *
   * @param {Number} windowBits The window size of the stream
   * @return {(zlib.DeflateRaw|undefined)} The stream, or `undefined` if there
   *     is none
   * @public
   */
  take(windowBits) {
    const streams = this.streams.get(windowBits);

    return streams === undefined ? undefined : streams.pop();
  }

  /**
   * Adds a stream that has just been reset to the pool. The stream is closed
   * instead if the pool is full or closed.
   *
   * @param {Number} windowBits The window size of the stream
   * @param {zlib.DeflateRaw} stream The stream
   * @public
   */
  add(windowBits, stream) {
    if (this.closed) {
      stream.close();
      return;
    }

    let streams = this.streams.get(windowBits);

    if (streams === undefined) {
      streams = [];
      this.streams.set(windowBits, streams);
    }

    if (streams.length < this.size) streams.push(stream);
    else stream.close();
  }

  /**
   * Closes the idle streams. Streams added afterwards are closed immediately.
   *
   * @public
   */
  close() {
    this.closed = true;

    for (const streams of this.streams.values()) {
      for (const stream of streams) stream.close();
    }

    this.streams.clear();
  }
}

module.exports = DeflatePool;
