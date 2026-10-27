import sys
import time


class Progress:
    """Progress of reading the entries, printed every interval seconds: on the network storage, it takes long"""

    def __init__(self, label: str, total: int, interval: float = 30):
        self.label = label
        self.total = total
        self.interval = interval
        self.done = 0
        self.read = 0
        self.start = self.last = time.monotonic()

    def update(self, size: int) -> None:
        """One more entry read, of size bytes"""
        self.done += 1
        self.read += size
        now = time.monotonic()
        if now - self.last >= self.interval or self.done == self.total:
            self.last = now
            elapsed = now - self.start
            line = f'{self.label}: {self.done}/{self.total} entries, {self.read / elapsed / 2 ** 20:.1f} MiB/s'
            if self.done < self.total:
                line += f', about {elapsed / self.done * (self.total - self.done) / 60:.0f} min left'
            else:
                line += f', {elapsed / 60:.1f} min'
            print(line, file=sys.stderr, flush=True)
