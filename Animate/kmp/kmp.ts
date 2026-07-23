import type { AnimationFrame, JumpRange } from '../../src/animation/animationTypes'
import { AnimationTimeline } from '../../src/animation/animationTimeline'
import type { pointJumpType } from '../../src/lib/read_raw_code'

export type KMPPhase = 'prefix' | 'search' | 'complete' | 'not_found' | 'invalid'
export type KMPCompareResult = 'equal' | 'different' | 'fallback' | 'match'

export type KMPCompare = {
    textIndex: number
    patternIndex: number
    result: KMPCompareResult
}

export type KMPFrame = AnimationFrame<KMPPhase> & {
    text: string
    pattern: string
    lps: number[]
    phase: KMPPhase
    i: number
    j: number
    compare: KMPCompare | null
    matchStart: number | null
    log: string
}

export type KMPResult = {
    status: 'complete' | 'not_found' | 'invalid'
    matchStart: number | null
    lps: number[]
    error?: string
}

const emptyVisualState: Pick<AnimationFrame, 'nodes_state' | 'edges_state'> = {
    nodes_state: [],
    edges_state: [],
}

/**
 * Knuth-Morris-Pratt string matching with one animation frame per comparison
 * and one frame for every prefix-table fallback.
 */
export class KMP {
    private animation = new AnimationTimeline<KMPFrame>()
    private jumpInfo: pointJumpType = {}
    private text = ''
    private pattern = ''
    private lps: number[] = []
    private result: KMPResult | null = null

    clear(): void {
        this.animation.clear()
        this.jumpInfo = {}
        this.text = ''
        this.pattern = ''
        this.lps = []
        this.result = null
    }

    set_input(text: string, pattern: string): void {
        this.text = text
        this.pattern = pattern
        this.lps = Array.from({ length: pattern.length }, () => 0)
        this.result = null
        this.animation.clear()
    }

    set_pointJumpInfo(jumpInfo: pointJumpType): void {
        this.jumpInfo = jumpInfo
    }

    set_frames(frames: readonly KMPFrame[]): void {
        this.animation.replace(frames)
    }

    get_result(): KMPResult | null {
        return this.result
    }

    get_frame(index: number): KMPFrame {
        if (index <= 0) return this.emptyFrame()
        return this.animation.get(index - 1) || this.emptyFrame()
    }

    get frame_cnt(): number {
        return this.animation.length
    }

    run(): KMPResult {
        this.animation.clear()
        this.lps = Array.from({ length: this.pattern.length }, () => 0)
        this.result = null

        if (this.pattern.length === 0) {
            const error = '模式串不能为空'
            this.pushFrame({
                phase: 'invalid',
                i: 0,
                j: 0,
                compare: null,
                matchStart: null,
                log: error,
                status: 'invalid',
            })
            this.result = { status: 'invalid', matchStart: null, lps: [], error }
            return this.result
        }

        this.buildLps()
        const matchStart = this.search()
        if (matchStart === null) {
            this.result = { status: 'not_found', matchStart: null, lps: [...this.lps] }
            this.pushFrame({
                phase: 'not_found',
                i: this.text.length,
                j: 0,
                compare: null,
                matchStart: null,
                log: `未找到模式串「${this.pattern}」`,
                status: 'not_found',
            })
            return this.result
        }

        this.result = { status: 'complete', matchStart, lps: [...this.lps] }
        return this.result
    }

    private buildLps(): void {
        this.pushFrame({
            phase: 'prefix',
            i: 0,
            j: 0,
            compare: null,
            matchStart: null,
            log: '开始构建 LPS 前缀表',
            status: 'prefix',
        })

        let prefixIndex = 1
        let prefixLength = 0
        while (prefixIndex < this.pattern.length) {
            const textIndex = this.displayIndex(prefixIndex)
            const compare: KMPCompare | null = this.text.length > 0
                ? {
                    textIndex,
                    patternIndex: prefixLength,
                    result: this.pattern[prefixIndex] === this.pattern[prefixLength] ? 'equal' : 'different',
                }
                : null

            if (this.pattern[prefixIndex] === this.pattern[prefixLength]) {
                this.lps[prefixIndex] = prefixLength + 1
                this.pushFrame({
                    phase: 'prefix',
                    i: textIndex,
                    j: prefixLength,
                    compare,
                    matchStart: null,
                    log: `前缀比较相等，lps[${prefixIndex}] = ${this.lps[prefixIndex]}`,
                    status: 'prefix',
                })
                prefixIndex += 1
                prefixLength += 1
                continue
            }

            this.pushFrame({
                phase: 'prefix',
                i: textIndex,
                j: prefixLength,
                compare,
                matchStart: null,
                log: `前缀比较失配：${this.pattern[prefixIndex]} ≠ ${this.pattern[prefixLength]}`,
                status: 'prefix',
            })

            if (prefixLength > 0) {
                const previousLength = prefixLength
                prefixLength = this.lps[prefixLength - 1]
                this.pushFrame({
                    phase: 'prefix',
                    i: textIndex,
                    j: prefixLength,
                    compare: this.text.length > 0
                        ? {
                            textIndex,
                            patternIndex: previousLength,
                            result: 'fallback',
                        }
                        : null,
                    matchStart: null,
                    log: `回退前缀长度：j = lps[${previousLength - 1}] = ${prefixLength}`,
                    status: 'prefix',
                })
            } else {
                this.lps[prefixIndex] = 0
                this.pushFrame({
                    phase: 'prefix',
                    i: textIndex,
                    j: 0,
                    compare,
                    matchStart: null,
                    log: `没有可回退的前缀，lps[${prefixIndex}] = 0`,
                    status: 'prefix',
                })
                prefixIndex += 1
            }
        }
    }

    private search(): number | null {
        let i = 0
        let j = 0

        while (i < this.text.length) {
            const equal = this.text[i] === this.pattern[j]
            const compare: KMPCompare = {
                textIndex: i,
                patternIndex: j,
                result: equal ? 'equal' : 'different',
            }
            this.pushFrame({
                phase: 'search',
                i,
                j,
                compare,
                matchStart: null,
                log: equal
                    ? `比较主串[${i}] 与模式串[${j}]：相等`
                    : `比较主串[${i}] 与模式串[${j}]：失配`,
                status: 'search',
            })

            if (equal) {
                if (j === this.pattern.length - 1) {
                    const matchStart = i - j
                    this.pushFrame({
                        phase: 'complete',
                        i: i + 1,
                        j: j + 1,
                        compare: { ...compare, result: 'match' },
                        matchStart,
                        log: `匹配成功，起点为 ${matchStart}`,
                        status: 'complete',
                    })
                    return matchStart
                }
                i += 1
                j += 1
                continue
            }

            if (j > 0) {
                const previousJ = j
                j = this.lps[j - 1]
                this.pushFrame({
                    phase: 'search',
                    i,
                    j,
                    compare: {
                        textIndex: i,
                        patternIndex: previousJ,
                        result: 'fallback',
                    },
                    matchStart: null,
                    log: `失配后回退：j = lps[${previousJ - 1}] = ${j}`,
                    status: 'search',
                })
            } else {
                i += 1
            }
        }

        return null
    }

    private pushFrame(frame: Omit<KMPFrame, 'text' | 'pattern' | 'lps' | 'nodes_state' | 'edges_state' | 'jump'>): void {
        this.animation.push({
            ...emptyVisualState,
            ...frame,
            text: this.text,
            pattern: this.pattern,
            lps: [...this.lps],
            jump: this.jump(this.jumpName(frame.phase, frame.compare?.result)),
        })
    }

    private emptyFrame(): KMPFrame {
        return {
            ...emptyVisualState,
            text: this.text,
            pattern: this.pattern,
            lps: [...this.lps],
            phase: this.pattern.length === 0 ? 'invalid' : 'prefix',
            i: 0,
            j: 0,
            compare: null,
            matchStart: null,
            jump: [-1, -1],
            log: this.pattern.length === 0 ? '请输入模式串' : '准备开始 KMP 匹配',
            status: this.pattern.length === 0 ? 'invalid' : 'prefix',
        }
    }

    private jump(name: string): JumpRange {
        return this.jumpInfo[name] || [-1, -1]
    }

    private jumpName(phase: KMPPhase, result?: KMPCompareResult): string {
        if (phase === 'prefix' && result === 'fallback') return 'fallback_prefix'
        if (phase === 'prefix' && result) return 'compare_prefix'
        if (phase === 'prefix') return 'build_lps'
        if (phase === 'search' && result === 'fallback') return 'fallback_text'
        if (phase === 'search' && result) return 'compare_text'
        if (phase === 'complete') return 'match_found'
        return phase === 'not_found' ? 'search' : phase
    }

    private displayIndex(index: number): number {
        if (this.text.length === 0) return 0
        return Math.min(index, this.text.length - 1)
    }
}
