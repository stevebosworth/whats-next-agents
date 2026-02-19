export interface HLCTimestamp {
  wallTime: number
  counter: number
  nodeId: string
}

export class HLC {
  private lastWallTime: number = 0
  private lastCounter: number = 0
  private nodeId: string

  constructor(nodeId: string) {
    this.nodeId = nodeId
  }

  static fromString(s: string): HLCTimestamp {
    const parts = s.split(':')
    if (parts.length !== 3) {
      throw new Error(`Invalid HLC timestamp: ${s}`)
    }
    return {
      wallTime: new Date(parts[0]).getTime(),
      counter: parseInt(parts[1], 10),
      nodeId: parts[2],
    }
  }

  static toString(t: HLCTimestamp): string {
    return `${new Date(t.wallTime).toISOString()}:${t.counter.toString().padStart(4, '0')}:${t.nodeId}`
  }

  tick(): string {
    const now = Date.now()
    if (now > this.lastWallTime) {
      this.lastWallTime = now
      this.lastCounter = 0
    } else {
      this.lastCounter += 1
    }

    return HLC.toString({
      wallTime: this.lastWallTime,
      counter: this.lastCounter,
      nodeId: this.nodeId,
    })
  }

  receive(remoteTimestamp: string): string {
    const remote = HLC.fromString(remoteTimestamp)
    const localNow = Date.now()

    this.lastWallTime = Math.max(this.lastWallTime, remote.wallTime, localNow)

    if (this.lastWallTime === remote.wallTime && this.lastWallTime === localNow) {
      this.lastCounter = Math.max(this.lastCounter, remote.counter) + 1
    } else if (this.lastWallTime === remote.wallTime) {
      this.lastCounter = remote.counter + 1
    } else if (this.lastWallTime === localNow) {
      this.lastCounter = this.lastCounter + 1
    } else {
      this.lastCounter = 0
    }

    return HLC.toString({
      wallTime: this.lastWallTime,
      counter: this.lastCounter,
      nodeId: this.nodeId,
    })
  }

  static compare(t1: string, t2: string): number {
    if (t1 === t2) return 0
    const [w1, c1, n1] = t1.split(':')
    const [w2, c2, n2] = t2.split(':')

    if (w1 !== w2) return w1 < w2 ? -1 : 1
    if (c1 !== c2) return c1 < c2 ? -1 : 1
    return n1 < n2 ? -1 : 1
  }
}
