#!/usr/bin/env node
/**
 * og-image 生成器：public/og.svg → public/og-image.png (1200×630)
 * 用法：node scripts/og.mjs   （改完 og.svg 后重新执行并提交 PNG）
 */
import sharp from 'sharp';

await sharp('public/og.svg')
  .resize(1200, 630)
  .png()
  .toFile('public/og-image.png');
console.log('✓ public/og-image.png 已生成');
