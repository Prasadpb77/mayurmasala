/** @type {import('next').NextConfig} */
const repo = "mayurmasala";
module.exports = {
  output: "export",
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,
  images: { unoptimized: true },
};