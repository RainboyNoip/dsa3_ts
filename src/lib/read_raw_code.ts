export type pointJumpType = {
    [key: string]: [number, number]
}

export type RawCodeDiagnostic = {
    type: 'duplicate' | 'orphan_end' | 'missing_end' | 'invalid'
    name: string
    line: number
}

export type RawCodeResult = {
    point_jump_info: pointJumpType
    code: string
    diagnostics: RawCodeDiagnostic[]
}

const markerPattern = /\/\/\s*\[(start\s+end|start|end)\]\s*(.*)$/

// Remove editor-only markers while keeping their original zero-based line ranges.
export function read_raw_code(code: string): RawCodeResult {
    const lines = code.split(/\r?\n/)
    const cleanedLines: string[] = []
    const pointJumpInfo: pointJumpType = {}
    const openMarkers = new Map<string, number>()
    const completedMarkers = new Set<string>()
    const diagnostics: RawCodeDiagnostic[] = []

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index].trimEnd()
        const match = markerPattern.exec(line)
        if (!match) {
            cleanedLines.push(lines[index])
            continue
        }

        const kind = match[1]
        const name = match[2].trim()
        cleanedLines.push(line.replace(markerPattern, ''))
        if (!name) {
            diagnostics.push({ type: 'invalid', name: '', line: index })
            continue
        }

        if (kind === 'start end') {
            if (openMarkers.has(name) || completedMarkers.has(name)) {
                diagnostics.push({ type: 'duplicate', name, line: index })
            } else {
                pointJumpInfo[name] = [index, index]
                completedMarkers.add(name)
            }
            continue
        }

        if (kind === 'start') {
            if (openMarkers.has(name) || completedMarkers.has(name)) {
                diagnostics.push({ type: 'duplicate', name, line: index })
            } else {
                openMarkers.set(name, index)
            }
            continue
        }

        const startLine = openMarkers.get(name)
        if (startLine === undefined) {
            diagnostics.push({ type: 'orphan_end', name, line: index })
            continue
        }

        pointJumpInfo[name] = [startLine, index]
        openMarkers.delete(name)
        completedMarkers.add(name)
    }

    for (const [name, line] of openMarkers) {
        diagnostics.push({ type: 'missing_end', name, line })
    }

    return {
        point_jump_info: pointJumpInfo,
        code: cleanedLines.join('\n'),
        diagnostics,
    }
}
