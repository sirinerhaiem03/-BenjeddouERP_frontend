/*
 * QR Code generator library (TypeScript)
 * Nayuki — https://www.nayuki.io/page/qr-code-generator-library
 * License: MIT — Adapté pour BENJEDDOU ERP
 *
 * Ce fichier est une version simplifiée mais conforme du générateur QR de Nayuki.
 * Il génère des QR codes version 1-10, niveau de correction M, scannables.
 */

export namespace QrCodeGen {

  export class QrCode {
    public readonly version: number;
    public readonly size: number;
    public readonly errorCorrectionLevel: Ecc;
    public readonly mask: number;

    private readonly modules: boolean[][];
    private readonly isFunction: boolean[][];

    // ── Construction ─────────────────────────────────────────────
    public static encodeText(text: string, ecl: Ecc): QrCode {
      const segs = QrSegment.makeSegments(text);
      return QrCode.encodeSegments(segs, ecl);
    }

    public static encodeBinary(data: Uint8Array, ecl: Ecc): QrCode {
      const seg = QrSegment.makeBytes(data);
      return QrCode.encodeSegments([seg], ecl);
    }

    public static encodeSegments(
      segs: QrSegment[], ecl: Ecc,
      minVersion: number = 1, maxVersion: number = 40,
      mask: number = -1, boostEcl: boolean = true
    ): QrCode {
      if (!(1 <= minVersion && minVersion <= maxVersion && maxVersion <= 40) || mask < -1 || mask > 7)
        throw new RangeError("Invalid value");

      let version: number, dataUsedBits: number;
      for (version = minVersion; ; version++) {
        const dataCapacityBits = QrCode.getNumDataCodewords(version, ecl) * 8;
        dataUsedBits = QrSegment.getTotalBits(segs, version);
        if (dataUsedBits <= dataCapacityBits) break;
        if (version >= maxVersion) {
          const msg: string = dataUsedBits == Infinity ? "Segment too long" : "Data too long";
          throw new RangeError(msg);
        }
      }

      for (const newEcl of [Ecc.MEDIUM, Ecc.QUARTILE, Ecc.HIGH]) {
        if (boostEcl && dataUsedBits <= QrCode.getNumDataCodewords(version, newEcl) * 8)
          ecl = newEcl;
      }

      let bb: number[] = [];
      for (const seg of segs) {
        appendBits(seg.mode.modeBits, 4, bb);
        appendBits(seg.numChars, seg.mode.numCharCountBits(version), bb);
        for (const b of seg.getData()) bb.push(b);
      }

      const dataCapacityBits = QrCode.getNumDataCodewords(version, ecl) * 8;
      appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
      appendBits(0, (8 - bb.length % 8) % 8, bb);
      for (let padByte = 0xEC; bb.length < dataCapacityBits; padByte ^= 0xEC ^ 0x11)
        appendBits(padByte, 8, bb);

      let dataCodewords: Uint8Array = new Uint8Array(bb.length / 8);
      for (let i = 0; i < bb.length; i++)
        dataCodewords[i >>> 3] |= bb[i] << (7 - (i & 7));

      return new QrCode(version, ecl, dataCodewords, mask);
    }

    public constructor(version: number, errorCorrectionLevel: Ecc, dataCodewords: Uint8Array, msk: number) {
      this.version = version;
      this.errorCorrectionLevel = errorCorrectionLevel;
      this.size = version * 4 + 17;

      this.modules = [];
      this.isFunction = [];
      for (let i = 0; i < this.size; i++) {
        this.modules.push(new Array<boolean>(this.size).fill(false));
        this.isFunction.push(new Array<boolean>(this.size).fill(false));
      }

      this.drawFunctionPatterns();

      const allCodewords: Uint8Array = this.addEccAndInterleave(dataCodewords);
      this.drawCodewords(allCodewords);

      if (msk == -1) {
        let minPenalty: number = Infinity;
        for (let i = 0; i < 8; i++) {
          this.applyMask(i);
          this.drawFormatBits(i);
          const penalty = this.getPenaltyScore();
          if (penalty < minPenalty) {
            msk = i;
            minPenalty = penalty;
          }
          this.applyMask(i);
        }
      }

      this.mask = msk;
      this.applyMask(msk);
      this.drawFormatBits(msk);

      this.isFunction = [];
    }

    // ── Accès à la matrice ───────────────────────────────────────
    public getModule(x: number, y: number): boolean {
      return 0 <= x && x < this.size && 0 <= y && y < this.size && this.modules[y][x];
    }

    // ── Génération SVG ──────────────────────────────────────────
    public toSvgString(border: number): string {
      if (border < 0) throw new RangeError("Border must be non-negative");
      const parts: string[] = [];
      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          if (this.getModule(x, y))
            parts.push(`M${x + border},${y + border}h1v1h-1z`);
        }
      }
      const sz = this.size + border * 2;
      return `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${sz} ${sz}" stroke="none">
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  <path d="${parts.join(" ")}" fill="#000000"/>
</svg>`;
    }

    // ── Patterns de structure ────────────────────────────────────
    private drawFunctionPatterns(): void {
      for (let i = 0; i < this.size; i++) {
        this.setFunctionModule(6, i, i % 2 == 0);
        this.setFunctionModule(i, 6, i % 2 == 0);
      }
      this.drawFinderPattern(3, 3);
      this.drawFinderPattern(this.size - 4, 3);
      this.drawFinderPattern(3, this.size - 4);

      const alignPatPos = this.getAlignmentPatternPositions();
      const numAlign = alignPatPos.length;
      for (let i = 0; i < numAlign; i++) {
        for (let j = 0; j < numAlign; j++) {
          if (!((i == 0 && j == 0) || (i == 0 && j == numAlign - 1) || (i == numAlign - 1 && j == 0)))
            this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
        }
      }

      this.drawFormatBits(0);
      this.drawVersion();
    }

    private drawFormatBits(msk: number): void {
      const data: number = this.errorCorrectionLevel.formatBits << 3 | msk;
      let rem: number = data;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const bits = (data << 10 | rem) ^ 0x5412;

      for (let i = 0; i <= 5; i++) this.setFunctionModule(8, i, getBit(bits, i));
      this.setFunctionModule(8, 7, getBit(bits, 6));
      this.setFunctionModule(8, 8, getBit(bits, 7));
      this.setFunctionModule(7, 8, getBit(bits, 8));
      for (let i = 9; i < 15; i++) this.setFunctionModule(14 - i, 8, getBit(bits, i));

      for (let i = 0; i < 8; i++) this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
      for (let i = 8; i < 15; i++) this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
      this.setFunctionModule(8, this.size - 8, true);
    }

    private drawVersion(): void {
      if (this.version < 7) return;
      let rem: number = this.version;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      const bits: number = this.version << 12 | rem;

      for (let i = 0; i < 18; i++) {
        const color: boolean = getBit(bits, i);
        const a: number = this.size - 11 + i % 3;
        const b: number = Math.floor(i / 3);
        this.setFunctionModule(a, b, color);
        this.setFunctionModule(b, a, color);
      }
    }

    private drawFinderPattern(x: number, y: number): void {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const dist: number = Math.max(Math.abs(dx), Math.abs(dy));
          const xx: number = x + dx, yy: number = y + dy;
          if (0 <= xx && xx < this.size && 0 <= yy && yy < this.size)
            this.setFunctionModule(xx, yy, dist != 2 && dist != 4);
        }
      }
    }

    private drawAlignmentPattern(x: number, y: number): void {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++)
          this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) != 1);
      }
    }

    private setFunctionModule(x: number, y: number, isDark: boolean): void {
      this.modules[y][x] = isDark;
      this.isFunction[y][x] = true;
    }

    // ── Reed-Solomon ─────────────────────────────────────────────
    private addEccAndInterleave(data: Uint8Array): Uint8Array {
      const ver = this.version;
      const ecl = this.errorCorrectionLevel;
      const numBlocks = QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
      const blockEccLen = QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver];
      const rawCodewords = Math.floor(QrCode.getNumRawDataModules(ver) / 8);
      const numShortBlocks = numBlocks - rawCodewords % numBlocks;
      const shortBlockLen = Math.floor(rawCodewords / numBlocks);

      const blocks: Uint8Array[] = [];
      const rsDiv = QrCode.reedSolomonComputeDivisor(blockEccLen);
      for (let i = 0, k = 0; i < numBlocks; i++) {
        const dat = data.subarray(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
        k += dat.length;
        const block = new Uint8Array(shortBlockLen + 1);
        block.set(dat);
        const ecc = QrCode.reedSolomonComputeRemainder(dat, rsDiv);
        block.set(ecc, block.length - blockEccLen);
        blocks.push(block);
      }

      const result = new Uint8Array(rawCodewords);
      let k = 0;
      for (let i = 0; i < blocks[0].length; i++) {
        blocks.forEach((block, j) => {
          if (i != shortBlockLen - blockEccLen || j >= numShortBlocks)
            result[k++] = block[i];
        });
      }
      return result;
    }

    private drawCodewords(data: Uint8Array): void {
      let i: number = 0;
      for (let right = this.size - 1; right >= 1; right -= 2) {
        if (right == 6) right = 5;
        for (let vert = 0; vert < this.size; vert++) {
          for (let j = 0; j < 2; j++) {
            const x: number = right - j;
            const upward: boolean = ((right + 1) & 2) == 0;
            const y: number = upward ? this.size - 1 - vert : vert;
            if (!this.isFunction[y][x] && i < data.length * 8) {
              this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
              i++;
            }
          }
        }
      }
    }

    private applyMask(msk: number): void {
      if (msk < 0 || msk > 7) throw new RangeError("Mask value out of range");
      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          let invert: boolean;
          switch (msk) {
            case 0: invert = (x + y) % 2 == 0; break;
            case 1: invert = y % 2 == 0; break;
            case 2: invert = x % 3 == 0; break;
            case 3: invert = (x + y) % 3 == 0; break;
            case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 == 0; break;
            case 5: invert = x * y % 2 + x * y % 3 == 0; break;
            case 6: invert = (x * y % 2 + x * y % 3) % 2 == 0; break;
            case 7: invert = ((x + y) % 2 + x * y % 3) % 2 == 0; break;
            default: throw new RangeError("Unreachable");
          }
          if (!this.isFunction[y][x] && invert) this.modules[y][x] = !this.modules[y][x];
        }
      }
    }

    private getPenaltyScore(): number {
      let result: number = 0;
      for (let y = 0; y < this.size; y++) {
        let runColor = false;
        let runX = 0;
        const runHistory = [0, 0, 0, 0, 0, 0, 0];
        for (let x = 0; x < this.size; x++) {
          if (this.modules[y][x] == runColor) {
            runX++;
            if (runX == 5) result += QrCode.PENALTY_N1;
            else if (runX > 5) result++;
          } else {
            this.finderPenaltyAddHistory(runX, runHistory);
            if (!runColor) result += this.finderPenaltyCountPatterns(runHistory) * QrCode.PENALTY_N3;
            runColor = this.modules[y][x];
            runX = 1;
          }
        }
        result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * QrCode.PENALTY_N3;
      }
      for (let x = 0; x < this.size; x++) {
        let runColor = false;
        let runY = 0;
        const runHistory = [0, 0, 0, 0, 0, 0, 0];
        for (let y = 0; y < this.size; y++) {
          if (this.modules[y][x] == runColor) {
            runY++;
            if (runY == 5) result += QrCode.PENALTY_N1;
            else if (runY > 5) result++;
          } else {
            this.finderPenaltyAddHistory(runY, runHistory);
            if (!runColor) result += this.finderPenaltyCountPatterns(runHistory) * QrCode.PENALTY_N3;
            runColor = this.modules[y][x];
            runY = 1;
          }
        }
        result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * QrCode.PENALTY_N3;
      }
      for (let y = 0; y < this.size - 1; y++) {
        for (let x = 0; x < this.size - 1; x++) {
          const color = this.modules[y][x];
          if (color == this.modules[y][x + 1] && color == this.modules[y + 1][x] && color == this.modules[y + 1][x + 1])
            result += QrCode.PENALTY_N2;
        }
      }
      let dark: number = 0;
      for (const row of this.modules) row.forEach(color => { if (color) dark++; });
      const total: number = this.size * this.size;
      const k: number = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
      result += k * QrCode.PENALTY_N4;
      return result;
    }

    private getAlignmentPatternPositions(): number[] {
      const ver = this.version;
      if (ver == 1) return [];
      const numAlign = Math.floor(ver / 7) + 2;
      const step = (ver == 32) ? 26 : Math.ceil((ver * 4 + 4) / (numAlign * 2 - 2)) * 2;
      const result: number[] = [6];
      for (let pos = this.size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
      return result;
    }

    private static getNumRawDataModules(ver: number): number {
      let result = (16 * ver + 128) * ver + 64;
      if (ver >= 2) {
        const numAlign = Math.floor(ver / 7) + 2;
        result -= (25 * numAlign - 10) * numAlign - 55;
        if (ver >= 7) result -= 36;
      }
      return result;
    }

    private static getNumDataCodewords(ver: number, ecl: Ecc): number {
      return Math.floor(QrCode.getNumRawDataModules(ver) / 8) -
        QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver] * QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
    }

    private static reedSolomonComputeDivisor(degree: number): Uint8Array {
      if (degree < 1 || degree > 255) throw new RangeError("Degree out of range");
      const result = new Uint8Array(degree);
      result[degree - 1] = 1;
      let root = 1;
      for (let i = 0; i < degree; i++) {
        for (let j = 0; j < result.length; j++) {
          result[j] = QrCode.reedSolomonMultiply(result[j], root);
          if (j + 1 < result.length) result[j] ^= result[j + 1];
        }
        root = QrCode.reedSolomonMultiply(root, 0x02);
      }
      return result;
    }

    private static reedSolomonComputeRemainder(data: Uint8Array, divisor: Uint8Array): Uint8Array {
      const result = new Uint8Array(divisor.length);
      for (const b of data) {
        const factor = b ^ result[0];
        result.copyWithin(0, 1);
        result[result.length - 1] = 0;
        divisor.forEach((coef, i) => result[i] ^= QrCode.reedSolomonMultiply(coef, factor));
      }
      return result;
    }

    private static reedSolomonMultiply(x: number, y: number): number {
      let z = 0;
      for (let i = 7; i >= 0; i--) {
        z = (z << 1) ^ ((z >>> 7) * 0x11D);
        z ^= ((y >>> i) & 1) * x;
      }
      return z;
    }

    private finderPenaltyCountPatterns(runHistory: number[]): number {
      const n = runHistory[1];
      const core = n > 0 && runHistory[2] == n && runHistory[3] == n * 3 && runHistory[4] == n && runHistory[5] == n;
      return (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) +
             (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0);
    }

    private finderPenaltyTerminateAndCount(currentRunColor: boolean, currentRunLength: number, runHistory: number[]): number {
      if (currentRunColor) {
        this.finderPenaltyAddHistory(currentRunLength, runHistory);
        currentRunLength = 0;
      }
      currentRunLength += this.size;
      this.finderPenaltyAddHistory(currentRunLength, runHistory);
      return this.finderPenaltyCountPatterns(runHistory);
    }

    private finderPenaltyAddHistory(currentRunLength: number, runHistory: number[]): void {
      if (runHistory[0] == 0) currentRunLength += this.size;
      runHistory.copyWithin(1, 0, runHistory.length - 1);
      runHistory[0] = currentRunLength;
    }

    private static readonly PENALTY_N1 = 3;
    private static readonly PENALTY_N2 = 3;
    private static readonly PENALTY_N3 = 40;
    private static readonly PENALTY_N4 = 10;

    private static readonly ECC_CODEWORDS_PER_BLOCK: number[][] = [
      [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
      [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
      [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
      [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    ];

    private static readonly NUM_ERROR_CORRECTION_BLOCKS: number[][] = [
      [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
      [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
      [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
      [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
    ];
  }

  // ── Mode ──────────────────────────────────────────────────────
  export class Mode {
    public static readonly NUMERIC = new Mode(0x1, [10, 12, 14]);
    public static readonly ALPHANUMERIC = new Mode(0x2, [9, 11, 13]);
    public static readonly BYTE = new Mode(0x4, [8, 16, 16]);
    public static readonly KANJI = new Mode(0x8, [8, 10, 12]);
    public static readonly ECI = new Mode(0x7, [0, 0, 0]);

    private constructor(readonly modeBits: number, private readonly numBitsCharCount: number[]) {}

    public numCharCountBits(ver: number): number {
      return this.numBitsCharCount[Math.floor((ver + 7) / 17)];
    }
  }

  // ── Ecc ───────────────────────────────────────────────────────
  export class Ecc {
    public static readonly LOW = new Ecc(0, 1);
    public static readonly MEDIUM = new Ecc(1, 0);
    public static readonly QUARTILE = new Ecc(2, 3);
    public static readonly HIGH = new Ecc(3, 2);

    private constructor(readonly ordinal: number, readonly formatBits: number) {}
  }

  // ── QrSegment ─────────────────────────────────────────────────
  export class QrSegment {
    public static makeBytes(data: Uint8Array): QrSegment {
      const bb: number[] = [];
      for (const b of data) appendBits(b, 8, bb);
      return new QrSegment(Mode.BYTE, data.length, bb);
    }

    public static makeNumeric(digits: string): QrSegment {
      if (!QrSegment.isNumeric(digits)) throw new RangeError("String contains non-numeric characters");
      const bb: number[] = [];
      for (let i = 0; i < digits.length; ) {
        const n = Math.min(digits.length - i, 3);
        appendBits(parseInt(digits.substring(i, i + n), 10), n * 3 + 1, bb);
        i += n;
      }
      return new QrSegment(Mode.NUMERIC, digits.length, bb);
    }

    public static makeAlphanumeric(text: string): QrSegment {
      if (!QrSegment.isAlphanumeric(text)) throw new RangeError("String contains unencodable characters in alphanumeric mode");
      let bb: number[] = [];
      let i: number;
      for (i = 0; i + 2 <= text.length; i += 2) {
        let temp: number = QrSegment.ALPHANUMERIC_CHARSET.indexOf(text[i]) * 45;
        temp += QrSegment.ALPHANUMERIC_CHARSET.indexOf(text[i + 1]);
        appendBits(temp, 11, bb);
      }
      if (i < text.length) appendBits(QrSegment.ALPHANUMERIC_CHARSET.indexOf(text[i]), 6, bb);
      return new QrSegment(Mode.ALPHANUMERIC, text.length, bb);
    }

    public static makeSegments(text: string): QrSegment[] {
      if (text == "") return [];
      else if (QrSegment.isNumeric(text)) return [QrSegment.makeNumeric(text)];
      else if (QrSegment.isAlphanumeric(text)) return [QrSegment.makeAlphanumeric(text)];
      else {
        const bytes = [];
        for (let i = 0; i < text.length; i++) {
          const cc = text.charCodeAt(i);
          if (cc < 0x80) {
            bytes.push(cc);
          } else if (cc < 0x800) {
            bytes.push(0xC0 | (cc >> 6));
            bytes.push(0x80 | (cc & 0x3F));
          } else if (cc >= 0xD800 && cc < 0xDC00 && i + 1 < text.length) {
            const nc = text.charCodeAt(i + 1);
            if (nc >= 0xDC00 && nc < 0xE000) {
              const cp = 0x10000 + ((cc - 0xD800) << 10) + (nc - 0xDC00);
              bytes.push(0xF0 | (cp >> 18));
              bytes.push(0x80 | ((cp >> 12) & 0x3F));
              bytes.push(0x80 | ((cp >> 6) & 0x3F));
              bytes.push(0x80 | (cp & 0x3F));
              i++;
            }
          } else {
            bytes.push(0xE0 | (cc >> 12));
            bytes.push(0x80 | ((cc >> 6) & 0x3F));
            bytes.push(0x80 | (cc & 0x3F));
          }
        }
        return [QrSegment.makeBytes(new Uint8Array(bytes))];
      }
    }

    public static isNumeric(text: string): boolean {
      return /^[0-9]*$/.test(text);
    }

    public static isAlphanumeric(text: string): boolean {
      return /^[A-Z0-9 $%*+.\/:-]*$/.test(text);
    }

    private readonly bitData: number[];

    public constructor(public readonly mode: Mode, public readonly numChars: number, bitData: number[]) {
      this.bitData = bitData.slice();
    }

    public getData(): number[] {
      return this.bitData.slice();
    }

    public static getTotalBits(segs: QrSegment[], version: number): number {
      let result = 0;
      for (const seg of segs) {
        const ccbits = seg.mode.numCharCountBits(version);
        if (seg.numChars >= (1 << ccbits)) return Infinity;
        result += 4 + ccbits + seg.getData().length;
      }
      return result;
    }

    private static readonly ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
  }

  // ── Utilitaire ────────────────────────────────────────────────
  function appendBits(val: number, len: number, bb: number[]): void {
    if (len < 0 || len > 31 || val >>> len != 0) throw new RangeError("Value out of range");
    for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1);
  }

  function getBit(x: number, i: number): boolean {
    return ((x >>> i) & 1) != 0;
  }
}
