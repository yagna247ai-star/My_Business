// render_text.swift — Core Text based PNG text renderer with correct Indic shaping.
//
// Outline method: Core Text's negative .strokeWidth draws the stroke CENTRED on the
// glyph contour, so a thick outline destroys the fill. Instead the glyph is drawn as
// a solid silhouette at N offsets around a circle (creating an outer outline) and then
// filled on top, so the fill survives at any outline weight.
//
// Usage:
//   render_text --out out.png [--font "Telugu MN"] [--fontfile /path/font.ttc] [--size 96]
//     [--maxwidth 1500] [--align center|left|right] [--fill #FFFFFF] [--stroke #101820]
//     [--strokew 6] [--lineheight 1.25] [--pad 24] [--box #000000] [--boxalpha 0.45]
//     [--boxpad 28] [--boxradius 24] [--shadow] [--accent #FFC42E]
//     [--text "...."] [--textfile file.txt]
// Text wrapped in [[...]] is drawn in the accent colour.

import Foundation
import AppKit
import CoreText
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

func fail(_ m: String) -> Never { FileHandle.standardError.write((m + "\n").data(using: .utf8)!); exit(1) }

func hexRGBA(_ s: String, alpha: CGFloat) -> CGColor {
    var h = s.trimmingCharacters(in: .whitespacesAndNewlines)
    if h.hasPrefix("#") { h.removeFirst() }
    var v: UInt64 = 0
    Scanner(string: h).scanHexInt64(&v)
    let r, g, b: CGFloat
    if h.count >= 8 {
        r = CGFloat((v >> 24) & 0xFF) / 255.0
        g = CGFloat((v >> 16) & 0xFF) / 255.0
        b = CGFloat((v >> 8) & 0xFF) / 255.0
    } else {
        r = CGFloat((v >> 16) & 0xFF) / 255.0
        g = CGFloat((v >> 8) & 0xFF) / 255.0
        b = CGFloat(v & 0xFF) / 255.0
    }
    return CGColor(red: r, green: g, blue: b, alpha: alpha)
}

var opts: [String: String] = [:]
let argv = CommandLine.arguments
var ai = 1
while ai < argv.count {
    let a = argv[ai]
    if a.hasPrefix("--") {
        let k = String(a.dropFirst(2))
        if ai + 1 < argv.count && !argv[ai + 1].hasPrefix("--") { opts[k] = argv[ai + 1]; ai += 2 }
        else { opts[k] = "1"; ai += 1 }
    } else { ai += 1 }
}

if let ff = opts["fontfile"] {
    var err: Unmanaged<CFError>?
    CTFontManagerRegisterFontsForURL(URL(fileURLWithPath: ff) as CFURL, .process, &err)
}

let text: String
if let tf = opts["textfile"] { text = (try? String(contentsOfFile: tf, encoding: .utf8))?.trimmingCharacters(in: .newlines) ?? "" }
else { text = opts["text"] ?? "" }
if text.isEmpty { fail("no text") }

let outPath = opts["out"] ?? "out.png"
let fontSize = CGFloat(Double(opts["size"] ?? "96") ?? 96)
let fontName = opts["font"] ?? "Helvetica"
let maxWidth = CGFloat(Double(opts["maxwidth"] ?? "1500") ?? 1500)
let pad = CGFloat(Double(opts["pad"] ?? "20") ?? 20)
let strokeW = CGFloat(Double(opts["strokew"] ?? "0") ?? 0)
let lineHeightMult = CGFloat(Double(opts["lineheight"] ?? "1.0") ?? 1.0)
let hasShadow = opts["shadow"] != nil
let alpha = Double(opts["alpha"] ?? "1") ?? 1
let strokeAlpha = Double(opts["strokealpha"] ?? "1") ?? 1
let accentAlpha = Double(opts["accentalpha"] ?? "1") ?? 1

let font = CTFontCreateWithName(fontName as CFString, fontSize, nil)
let para = NSMutableParagraphStyle()
switch (opts["align"] ?? "center") {
case "left": para.alignment = .left
case "right": para.alignment = .right
default: para.alignment = .center
}
if lineHeightMult > 0 {
    let lh = fontSize * lineHeightMult
    para.minimumLineHeight = lh
    para.maximumLineHeight = lh
}
para.lineBreakMode = .byWordWrapping

let fillColor = NSColor(cgColor: hexRGBA(opts["fill"] ?? "#FFFFFF", alpha: CGFloat(alpha)))!
let strokeColor = NSColor(cgColor: hexRGBA(opts["stroke"] ?? "#000000", alpha: CGFloat(strokeAlpha)))!
let accentColor = NSColor(cgColor: hexRGBA(opts["accent"] ?? "#FFC42E", alpha: CGFloat(accentAlpha)))!

var baseAttrs: [NSAttributedString.Key: Any] = [.font: font, .paragraphStyle: para]

// Accent runs: text wrapped in [[...]] drawn in accent colour.
var segments: [(String, Bool)] = []
do {
    var buf = ""; var isAcc = false; var idx = text.startIndex
    while idx < text.endIndex {
        if text[idx...].hasPrefix("[[") {
            if !buf.isEmpty { segments.append((buf, isAcc)); buf = "" }
            isAcc = true; idx = text.index(idx, offsetBy: 2)
        } else if text[idx...].hasPrefix("]]") {
            if !buf.isEmpty { segments.append((buf, isAcc)); buf = "" }
            isAcc = false; idx = text.index(idx, offsetBy: 2)
        } else { buf.append(text[idx]); idx = text.index(after: idx) }
    }
    if !buf.isEmpty { segments.append((buf, isAcc)) }
}

func build(_ color: NSColor) -> NSAttributedString {
    let out = NSMutableAttributedString()
    for (seg, isAcc) in segments {
        var a = baseAttrs
        a[.foregroundColor] = isAcc ? accentColor : color
        out.append(NSAttributedString(string: seg, attributes: a))
    }
    return out
}

// silhouette (outline pass) uses the outline colour for everything, including accents
let outlineString = build(strokeColor)
let fillString = build(fillColor)

let fillFS = CTFramesetterCreateWithAttributedString(fillString as CFAttributedString)
let outlineFS = CTFramesetterCreateWithAttributedString(outlineString as CFAttributedString)

var fitRange = CFRange()
var boxW = maxWidth
let measured = CTFramesetterSuggestFrameSizeWithConstraints(
    fillFS, CFRange(location: 0, length: 0), nil,
    CGSize(width: maxWidth, height: .greatestFiniteMagnitude), &fitRange)

if measured.width < maxWidth { boxW = ceil(measured.width) }
let boxH = ceil(measured.height)

let boxPad = CGFloat(Double(opts["boxpad"] ?? "26") ?? 26)
let boxRadius = CGFloat(Double(opts["boxradius"] ?? "22") ?? 22)
let hasBox = opts["box"] != nil
let marginal = (strokeW > 0 ? strokeW : 0) + (hasShadow ? CGFloat(20) : 0)
let outerPad = (hasBox ? boxPad : pad) + marginal

let canvasW = Int(ceil(boxW + outerPad * 2))
let canvasH = Int(ceil(boxH + outerPad * 2))

let cs = CGColorSpaceCreateDeviceRGB()
guard let ctx = CGContext(data: nil, width: canvasW, height: canvasH, bitsPerComponent: 8,
                          bytesPerRow: 0, space: cs,
                          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { fail("ctx") }
ctx.setAllowsAntialiasing(true)
ctx.setShouldAntialias(true)
ctx.setShouldSmoothFonts(true)
ctx.setAllowsFontSmoothing(true)
ctx.interpolationQuality = .high
ctx.clear(CGRect(x: 0, y: 0, width: canvasW, height: canvasH))

let textRect = CGRect(x: outerPad, y: outerPad, width: boxW, height: boxH)

if hasBox {
    let boxRect = CGRect(x: outerPad - boxPad, y: outerPad - boxPad,
                         width: boxW + boxPad * 2, height: boxH + boxPad * 2)
    ctx.addPath(CGPath(roundedRect: boxRect, cornerWidth: boxRadius, cornerHeight: boxRadius, transform: nil))
    ctx.setFillColor(hexRGBA(opts["box"] ?? "#000000", alpha: Double(opts["boxalpha"] ?? "0.45") ?? 0.45))
    ctx.fillPath()
}

let path = CGPath(rect: textRect, transform: nil)
let fillFrame = CTFramesetterCreateFrame(fillFS, CFRange(location: 0, length: 0), path, nil)
let outlineFrame = CTFramesetterCreateFrame(outlineFS, CFRange(location: 0, length: 0), path, nil)

if hasShadow {
    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 0, height: -8), blur: 16,
                  color: hexRGBA("#000000", alpha: 0.55))
    CTFrameDraw(outlineFrame, ctx)
    ctx.restoreGState()
}

if strokeW > 0 {
    let n = 16
    for k in 0..<n {
        let th = 2.0 * Double.pi * Double(k) / Double(n)
        ctx.saveGState()
        ctx.translateBy(x: CGFloat(cos(th) * Double(strokeW)), y: CGFloat(sin(th) * Double(strokeW)))
        CTFrameDraw(outlineFrame, ctx)
        ctx.restoreGState()
    }
}

CTFrameDraw(fillFrame, ctx)

guard let img = ctx.makeImage() else { fail("image") }
guard let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: outPath) as CFURL,
                                                 UTType.png.identifier as CFString, 1, nil) else { fail("dest") }
CGImageDestinationAddImage(dest, img, nil)
guard CGImageDestinationFinalize(dest) else { fail("finalize") }
print("OK \(canvasW)x\(canvasH) -> \(outPath)")
