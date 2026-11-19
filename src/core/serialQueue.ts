// Runs async jobs one at a time, in the order they were added.
// A failing job rejects its own promise but never blocks the jobs after it.

export interface SerialQueue {
  run<T>(job: () => Promise<T>): Promise<T>;
  /** Number of jobs waiting or running. */
  readonly size: number;
}

export function createSerialQueue(): SerialQueue {
  let tail: Promise<unknown> = Promise.resolve();
  let size = 0;
  return {
    run<T>(job: () => Promise<T>): Promise<T> {
      size += 1;
      // `tail` never rejects (see below), so the job always runs after the previous one.
      const result = tail.then(() => job());
      tail = result.then(
        () => {
          size -= 1;
        },
        () => {
          size -= 1;
        },
      );
      return result;
    },
    get size() {
      return size;
    },
  };
}
