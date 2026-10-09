'use strict';

const assert = require('assert');
const zlib = require('zlib');

const DeflatePool = require('../lib/deflate-pool');

describe('DeflatePool', () => {
  describe('#take', () => {
    it('returns `undefined` if there is no idle stream', () => {
      const pool = new DeflatePool(1);

      assert.strictEqual(pool.take(15), undefined);
    });

    it('returns a stream added with the same window size', () => {
      const pool = new DeflatePool(1);
      const stream = zlib.createDeflateRaw({ windowBits: 15 });

      pool.add(15, stream);

      assert.strictEqual(pool.take(10), undefined);
      assert.strictEqual(pool.take(15), stream);
      assert.strictEqual(pool.take(15), undefined);

      stream.close();
    });
  });

  describe('#add', () => {
    it('closes the stream if the pool is full', () => {
      const pool = new DeflatePool(1);
      const kept = zlib.createDeflateRaw();
      const extra = zlib.createDeflateRaw();

      pool.add(15, kept);
      pool.add(15, extra);

      assert.strictEqual(kept.destroyed, false);
      assert.strictEqual(extra.destroyed, true);

      pool.close();
    });

    it('closes the stream if the pool is closed', () => {
      const pool = new DeflatePool(1);
      const stream = zlib.createDeflateRaw();

      pool.close();
      pool.add(15, stream);

      assert.strictEqual(stream.destroyed, true);
      assert.strictEqual(pool.take(15), undefined);
    });
  });

  describe('#close', () => {
    it('closes the idle streams', () => {
      const pool = new DeflatePool(2);
      const a = zlib.createDeflateRaw({ windowBits: 15 });
      const b = zlib.createDeflateRaw({ windowBits: 10 });

      pool.add(15, a);
      pool.add(10, b);
      pool.close();

      assert.strictEqual(a.destroyed, true);
      assert.strictEqual(b.destroyed, true);
      assert.strictEqual(pool.take(15), undefined);
      assert.strictEqual(pool.take(10), undefined);
    });
  });
});
