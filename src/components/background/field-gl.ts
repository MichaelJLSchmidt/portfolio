import { withBase } from '@/lib/site'
import { field as F } from '@/motion/tokens'
import { fragmentSource, vertexSource } from './shader'
import { terrain } from './terrain'

/** Everything the shader needs for one frame (colours in sRGB 0..1). */
export type FieldFrame = {
  time: number
  a: Float32Array // 9: field, mid, glow
  b: Float32Array
  intensity: [number, number]
  spread: number
  origin: [number, number]
  maxD: number
  pull: [number, number]
  pullAmt: number
  /** Each pool's drift offset (x already scaled by the aspect), 3 x vec2. */
  drift: Float32Array
  breath: [number, number]
  lum: number
  fade: number
  /** About: 0 the field, 1 the contour map (eased). */
  topo: number
  ground: [number, number, number]
  /** About's contour lines and lakes (contours.ts), drawn once the heightmap is loaded. */
  contours: {
    /** 0..1: the lines fade in when the heightmap arrives during a morph. */
    fade: number
    /** The canvas's CSS size. */
    view: [number, number]
    /** CSS px -> heightmap texels: x * map[0] + map[2], y * map[1] + map[3]. */
    map: [number, number, number, number]
    /** Interval and index interval (m). */
    levels: readonly [number, number]
    /** Line and index line width in CSS px (the layer's scale included). */
    widths: [number, number]
    /** Line, index line, lake, layer opacity. */
    alphas: [number, number, number, number]
    line: [number, number, number]
    lake: [number, number, number]
  }
  /** Where a played card met the table (viewport fractions, y down). */
  impact: [number, number]
  /** The impact's ring: radius 0..1, strength (0: none), soft width (viewport heights). */
  ring: [number, number, number]
  ringColour: [number, number, number]
  /** The waiting breath: luminance offset (0: none) and radius (viewport heights). */
  wait: [number, number]
}

const UNIFORMS = [
  'uRes',
  'uAspect',
  'uTime',
  'uA',
  'uB',
  'uI',
  'uSpread',
  'uOrigin',
  'uMaxD',
  'uPull',
  'uPullAmt',
  'uDrift',
  'uBreath',
  'uLum',
  'uFade',
  'uGrain',
  'uTopo',
  'uGround',
  'uContours',
  'uHeight',
  'uEnc',
  'uRange',
  'uView',
  'uMap',
  'uLevels',
  'uWidths',
  'uAlphas',
  'uLine',
  'uLake',
  'uImpact',
  'uRing',
  'uRingCol',
  'uWait',
] as const

type Probe = readonly (readonly number[])[]

/**
 * Reads the reference texels back from an uploaded texture: they must equal the packed bytes (a
 * browser that colour-manages the decode fails). The read goes into a pixel buffer collected once
 * a fence has passed, so it never stalls a frame.
 */
function probeOk(gl: WebGL2RenderingContext, tex: WebGLTexture, probe: Probe): Promise<boolean> {
  const fbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer)
  gl.bufferData(gl.PIXEL_PACK_BUFFER, probe.length * 4, gl.STREAM_READ)
  probe.forEach(([x, y], i) => gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, i * 4))
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.deleteFramebuffer(fbo)
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)
  if (!sync) {
    gl.deleteBuffer(buffer)
    return Promise.resolve(false)
  }
  gl.flush()
  return new Promise((done) => {
    const poll = () => {
      const state = gl.isContextLost() ? gl.WAIT_FAILED : gl.clientWaitSync(sync, 0, 0)
      if (state === gl.TIMEOUT_EXPIRED) return void setTimeout(poll, 8)
      gl.deleteSync(sync)
      let ok = state !== gl.WAIT_FAILED
      if (ok) {
        const px = new Uint8Array(probe.length * 4)
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer)
        gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, px)
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null)
        ok = probe.every(([, , r, g, b], i) => px[i * 4] === r && px[i * 4 + 1] === g && px[i * 4 + 2] === b)
      }
      gl.deleteBuffer(buffer)
      done(ok)
    }
    poll()
  })
}

/** A decode that passed its check this session (checked once, not on every page). */
function checked(ok?: boolean) {
  const key = `table:terrain-ok:${terrain.sha.slice(0, 16)}`
  try {
    if (ok) sessionStorage.setItem(key, '1')
    return sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

/*
 * One WebGL2 context on one canvas. The field engine sets the drawing buffer's size: half the CSS
 * size with devicePixelRatio capped at 1 at rest (CSS scales it up), the device's resolution
 * (capped at 2, at 1.5 while a card is played) while About's morph runs. Throws when WebGL2 or the shader is unavailable, so the
 * caller can keep the CSS fallback. About's heightmap (terrain.ts) is loaded on demand into
 * texture unit 0.
 */
export class GlField {
  private gl: WebGL2RenderingContext
  private u: Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>
  private program: WebGLProgram
  private width = 0
  private height = 0
  private terrainTex: WebGLTexture | null = null
  private terrainLoad: Promise<boolean> | null = null

  constructor(
    private canvas: HTMLCanvasElement,
    onLost: () => void,
  ) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    })
    if (!gl) throw new Error('WebGL2 unavailable')
    this.gl = gl
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      onLost()
    })

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader')
      return shader
    }
    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource))
    gl.bindAttribLocation(program, 0, 'aPos')
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link')
    this.program = program
    gl.useProgram(program)
    this.u = Object.fromEntries(UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)])) as never

    // One triangle covering the screen.
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    gl.uniform1f(this.u.uGrain, F.grain)
    gl.uniform1i(this.u.uHeight, 0)
    gl.uniform2f(this.u.uEnc, terrain.offset, terrain.scale)
    gl.uniform2f(this.u.uRange, terrain.range[0], terrain.range[1])
  }

  /** The drawing buffer's size in device pixels. */
  get size() {
    return { w: this.width, h: this.height }
  }

  /**
   * Sets the drawing buffer to `w` × `h` pixels. Resizing clears the buffer, so a caller that
   * changes the size draws in the same frame (the field engine does: from its ResizeObserver
   * callback, or at the start of an animation frame). Returns whether the size changed.
   */
  setSize(w: number, h: number) {
    w = Math.max(1, Math.round(w))
    h = Math.max(1, Math.round(h))
    if (w === this.width && h === this.height) return false
    this.width = this.canvas.width = w
    this.height = this.canvas.height = h
    this.gl.viewport(0, 0, w, h)
    return true
  }

  /** True once the heightmap is uploaded and checked. */
  get hasTerrain() {
    return this.terrainTex !== null
  }

  /**
   * Loads About's heightmap (once): the lossless WebP uploaded without colour conversion, nearest
   * filtering (the shader interpolates exact texels), its reference texels checked once a session.
   * Resolves false when it cannot load or decodes differently (the morph then runs without lines).
   */
  loadTerrain(): Promise<boolean> {
    this.terrainLoad ??= (async () => {
      try {
        const res = await fetch(withBase(terrain.src), { priority: 'low' } as RequestInit)
        if (!res.ok) return false
        const bitmap = await createImageBitmap(await res.blob(), {
          premultiplyAlpha: 'none',
          colorSpaceConversion: 'none',
        })
        const { gl } = this
        if (gl.isContextLost()) return false
        const tex = gl.createTexture()!
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, bitmap)
        bitmap.close?.()
        for (const p of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, p, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        if (!checked() && !((await probeOk(gl, tex, terrain.probe)) && checked(true))) {
          gl.deleteTexture(tex)
          return false
        }
        this.terrainTex = tex
        return true
      } catch {
        return false
      }
    })()
    return this.terrainLoad
  }

  draw(f: FieldFrame) {
    const { gl, u } = this
    const aspect = this.width / this.height
    gl.uniform2f(u.uRes, this.width, this.height)
    gl.uniform1f(u.uAspect, aspect)
    gl.uniform1f(u.uTime, f.time)
    gl.uniform3fv(u.uA, f.a)
    gl.uniform3fv(u.uB, f.b)
    gl.uniform2f(u.uI, f.intensity[0], f.intensity[1])
    gl.uniform1f(u.uSpread, f.spread)
    gl.uniform2f(u.uOrigin, f.origin[0], f.origin[1])
    gl.uniform1f(u.uMaxD, f.maxD)
    gl.uniform2f(u.uPull, f.pull[0], f.pull[1])
    gl.uniform1f(u.uPullAmt, f.pullAmt)
    gl.uniform2fv(u.uDrift, f.drift)
    gl.uniform2f(u.uBreath, f.breath[0], f.breath[1])
    gl.uniform1f(u.uLum, f.lum)
    gl.uniform1f(u.uFade, f.fade)
    gl.uniform1f(u.uTopo, f.topo)
    gl.uniform3f(u.uGround, ...f.ground)
    gl.uniform2f(u.uImpact, f.impact[0], f.impact[1])
    gl.uniform3f(u.uRing, ...f.ring)
    gl.uniform3f(u.uRingCol, ...f.ringColour)
    gl.uniform2f(u.uWait, f.wait[0], f.wait[1])
    const c = f.contours
    const lines = c.fade > 0 && this.terrainTex !== null && f.topo > 0
    gl.uniform1f(u.uContours, lines ? c.fade : 0)
    if (lines) {
      const px = this.width / Math.max(1, c.view[0])
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, this.terrainTex)
      gl.uniform2f(u.uView, c.view[0], c.view[1])
      gl.uniform4f(u.uMap, ...c.map)
      gl.uniform2f(u.uLevels, c.levels[0], c.levels[1])
      gl.uniform2f(u.uWidths, c.widths[0] * px, c.widths[1] * px)
      gl.uniform4f(u.uAlphas, ...c.alphas)
      gl.uniform3f(u.uLine, ...c.line)
      gl.uniform3f(u.uLake, ...c.lake)
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  destroy() {
    if (this.terrainTex) this.gl.deleteTexture(this.terrainTex)
    this.gl.deleteProgram(this.program)
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}
