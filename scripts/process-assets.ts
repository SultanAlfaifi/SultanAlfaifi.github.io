import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { portfolioAssets, type PortfolioAsset } from "../data/portfolio";

const sourceRoot =
  process.env.ASSET_SOURCE_DIR ?? path.join(homedir(), "Downloads", "logos");
const publicRoot = path.resolve("public");
const manifest: Record<
  string,
  {
    sourceFile: string;
    color: { path: string; width: number; height: number };
    monochrome: { path: string; width: number; height: number } | null;
    processing: {
      trim: PortfolioAsset["trim"];
      safePadding: number;
      backgroundDetected: string;
      visualScale: number;
      objectPosition: string;
      monochromeEnabled: boolean;
    };
  }
> = {};

type RawImage = {
  data: Buffer;
  info: {
    width: number;
    height: number;
    channels: 1 | 2 | 3 | 4;
  };
};

function outputPath(publicPath: string) {
  return path.join(publicRoot, publicPath.replace(/^\//, ""));
}

async function ensureParent(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

function sampleCornerBackground(image: RawImage) {
  const { data, info } = image;
  const { width, height, channels } = info;
  const samples: number[][] = [];
  const points = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1]
  ];

  for (const [x, y] of points) {
    const offset = (y * width + x) * channels;
    samples.push([
      data[offset],
      data[offset + 1],
      data[offset + 2],
      channels === 4 ? data[offset + 3] : 255
    ]);
  }

  return samples
    .reduce(
      (sum, sample) => sum.map((value, index) => value + sample[index]),
      [0, 0, 0, 0]
    )
    .map((value) => Math.round(value / samples.length));
}

function removeUniformOuterBackground(image: RawImage) {
  const { data, info } = image;
  const background = sampleCornerBackground(image);
  const normalized = Buffer.from(data);
  const backgroundIsTransparent = background[3] < 32;
  const backgroundIsNearNeutral =
    Math.max(background[0], background[1], background[2]) -
      Math.min(background[0], background[1], background[2]) <
    14;
  const backgroundIsLight =
    (background[0] + background[1] + background[2]) / 3 > 238;

  if (!backgroundIsTransparent && backgroundIsNearNeutral && backgroundIsLight) {
    for (let offset = 0; offset < normalized.length; offset += info.channels) {
      const distance = Math.sqrt(
        (normalized[offset] - background[0]) ** 2 +
          (normalized[offset + 1] - background[1]) ** 2 +
          (normalized[offset + 2] - background[2]) ** 2
      );

      if (distance < 24) {
        normalized[offset + 3] = 0;
      }
    }
  }

  return {
    data: normalized,
    info,
    detected: backgroundIsTransparent
      ? "transparent"
      : backgroundIsNearNeutral && backgroundIsLight
        ? "light-neutral-removed"
        : `rgba(${background.join(",")})`
  };
}

async function renderSource(asset: PortfolioAsset): Promise<RawImage> {
  const sourcePath = path.join(sourceRoot, asset.sourceFile);
  const rendered = await sharp(sourcePath, { density: 300 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data: rendered.data,
    info: {
      width: rendered.info.width,
      height: rendered.info.height,
      channels: rendered.info.channels
    }
  };
}

async function normalizeLogo(asset: PortfolioAsset) {
  const raw = await renderSource(asset);
  const cleaned = removeUniformOuterBackground(raw);
  let pipeline = sharp(cleaned.data, { raw: cleaned.info });

  if (asset.trim === "auto") {
    pipeline = pipeline.trim({
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      threshold: 8
    });
  }

  const trimmed = await pipeline
    .extend({
      top: asset.safePadding,
      right: asset.safePadding,
      bottom: asset.safePadding,
      left: asset.safePadding,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const maxWidth = asset.id === "masari" ? trimmed.info.width : 1400;
  const maxHeight = asset.id === "masari" ? trimmed.info.height : 480;
  const colorPath = outputPath(asset.derived.color);
  await ensureParent(colorPath);

  const colorInfo = await sharp(trimmed.data, { raw: trimmed.info })
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality: 90, alphaQuality: 100, smartSubsample: true })
    .toFile(colorPath);

  let monochromeInfo: { width: number; height: number } | null = null;
  if (asset.monochromeEnabled && asset.derived.monochrome) {
    const monoData = Buffer.from(trimmed.data);
    for (let offset = 0; offset < monoData.length; offset += 4) {
      monoData[offset] = 244;
      monoData[offset + 1] = 243;
      monoData[offset + 2] = 236;
    }

    const monochromePath = outputPath(asset.derived.monochrome);
    await ensureParent(monochromePath);
    monochromeInfo = await sharp(monoData, { raw: trimmed.info })
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ lossless: true, alphaQuality: 100 })
      .toFile(monochromePath);
  }

  manifest[asset.id] = {
    sourceFile: asset.sourceFile,
    color: {
      path: asset.derived.color,
      width: colorInfo.width,
      height: colorInfo.height
    },
    monochrome:
      monochromeInfo && asset.derived.monochrome
        ? {
            path: asset.derived.monochrome,
            width: monochromeInfo.width,
            height: monochromeInfo.height
          }
        : null,
    processing: {
      trim: asset.trim,
      safePadding: asset.safePadding,
      backgroundDetected: cleaned.detected,
      visualScale: asset.visualScale,
      objectPosition: asset.objectPosition,
      monochromeEnabled: asset.monochromeEnabled
    }
  };
}

async function processPortrait(asset: PortfolioAsset) {
  const sourcePath = path.join(sourceRoot, asset.sourceFile);
  const colorPath = outputPath(asset.derived.color);
  await ensureParent(colorPath);
  const colorInfo = await sharp(sourcePath)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100, smartSubsample: true })
    .toFile(colorPath);

  manifest[asset.id] = {
    sourceFile: asset.sourceFile,
    color: {
      path: asset.derived.color,
      width: colorInfo.width,
      height: colorInfo.height
    },
    monochrome: null,
    processing: {
      trim: asset.trim,
      safePadding: asset.safePadding,
      backgroundDetected: "portrait-transparent-preserved",
      visualScale: asset.visualScale,
      objectPosition: asset.objectPosition,
      monochromeEnabled: false
    }
  };
}

async function main() {
  for (const asset of portfolioAssets) {
    if (!asset.publicApproved) continue;
    if (asset.kind === "portrait") {
      await processPortrait(asset);
    } else {
      await normalizeLogo(asset);
    }
  }

  const manifestPath = path.join(publicRoot, "assets", "asset-manifest.json");
  await ensureParent(manifestPath);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  process.stdout.write(
    `Processed ${Object.keys(manifest).length} approved assets from ${sourceRoot}\n`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
