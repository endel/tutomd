import type { PluginWithOptions } from "markdown-it";

const openRe = /^-{3}\s*$/
const closeRe = /^(?:\.{3}|-{3})\s*$/

interface MetadataOptions {
  parseMetadata: (src: string) => any,
  meta?: object
}

const metadata_block: PluginWithOptions<MetadataOptions> = (md, options) => {
  md.block.ruler.before('table', 'metadata_block', (state, startLine, endLine, silent) => {
    if (!state.env.meta) state.env.meta = options?.meta || {}
    const opener = state.getLines(startLine, startLine + 1, 0, false)
    if (openRe.test(opener) && (startLine == 0 || state.isEmpty(startLine - 1))) {
      const nextLines = state.getLines(startLine + 1, endLine, 0, false).split('\n')
      const end = nextLines.findIndex(x => closeRe.test(x))
      if (end >= 0) {
        try {
          const content = nextLines.slice(0, end).join('\n')
          const val = options?.parseMetadata(nextLines.slice(0, end).join('\n'))
          if (typeof val == 'object') {
            if (silent) return true
            Object.assign(state.env.meta, val)
            const token = state.push('metadata_block', '', 0)
            token.meta = val
            token.markup = "---"
            token.content = state.getLines(startLine + 1, startLine + 1 + end, 0, false)
            state.line = startLine + end + 2
            return true
          }
        } catch (e) { // invalid yaml is ignored
          return false
        }
      }
    }
    return false
  })

  // By default metadata_blocks are hidden
  md.renderer.rules['metadata_block'] = () => ''
}

export default metadata_block