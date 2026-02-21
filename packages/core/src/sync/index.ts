export interface HLCTimestamp {
  wallTime: number
  counter: number
  nodeId: string
}

/**
 * Hybrid Logical Clock (HLC) implementation.
 * Formatted as: <wallTime_ms>_<counter>_<nodeId>
 * Example: 1740000000000_0001_node-1
 */
export class HLC {
  private lastWallTime: number = 0
  private lastCounter: number = 0
  private nodeId: string

  constructor(nodeId: string) {
    this.nodeId = nodeId
  }

  static fromString(s: string): HLCTimestamp {
    const parts = s.split('_')
    if (parts.length !== 3) {
      throw new Error(`Invalid HLC timestamp: ${s}`)
    }
    return {
      wallTime: parseInt(parts[0], 10),
      counter: parseInt(parts[1], 10),
      nodeId: parts[2],
    }
  }

  static toString(t: HLCTimestamp): string {
    return `${t.wallTime.toString().padStart(15, '0')}_${t.counter.toString().padStart(5, '0')}_${t.nodeId}`
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

    const nextWallTime = Math.max(this.lastWallTime, remote.wallTime, localNow)

    if (nextWallTime === this.lastWallTime && nextWallTime === remote.wallTime) {
      this.lastCounter = Math.max(this.lastCounter, remote.counter) + 1
    } else if (nextWallTime === this.lastWallTime) {
      this.lastCounter = this.lastCounter + 1
    } else if (nextWallTime === remote.wallTime) {
      this.lastCounter = remote.counter + 1
    } else {
      this.lastCounter = 0
    }

    this.lastWallTime = nextWallTime

    return HLC.toString({
      wallTime: this.lastWallTime,
      counter: this.lastCounter,
      nodeId: this.nodeId,
    })
  }

  static compare(t1: string, t2: string): number {
    if (t1 === t2) return 0
    return t1 < t2 ? -1 : 1
  }
}

