'use strict';

import 'dotenv/config';
import fetch from 'node-fetch';
import * as helpers from "@figma-plugin/helpers";
import fs from 'fs';
import { promisify } from 'util';

const baseUrl = 'https://api.figma.com/v1/';
const fileKey = 'WWq2tHx7jLbKE3dlSkX7Wd';
const headers = { 'X-Figma-Token': process.env['X-Figma-Token'] }
const writeFileSync = promisify(fs.writeFile);

const fetchFigmaFile = async () => {
  const response = await fetch(`${baseUrl}files/${fileKey}`, { headers: headers });
  const data = await response.json();
  return Object.keys(data.styles);
}

const getColorContent = async (colorKeys) => {
  const response = await fetch(`${baseUrl}files/${fileKey}/nodes?ids=${colorKeys}`, { headers: headers });
  const data = await response.json();
  const colorNodes = Object.entries(data.nodes);
  let colorMap = new Map();

  colorNodes.forEach((value) => {
    const key = value[0];
    const name = value[1].document.name.replace(/\s+/g, '');
    const fill = value[1].document.fills[0].color;
    const rgbValue = { r: fill.r, g: fill.g, b: fill.b };
    const hexValue = helpers.figmaRGBToHex(rgbValue).toUpperCase();
    const formattedName = name.split('/').pop();
    colorMap.set(formattedName, hexValue);
  });

  return colorMap;
}

const createVariablesFile = (colorMap) => {
  let cssString = ':root {\n';

  colorMap.forEach((value, key) => {
    const variableKey = (key[0] === '@' ? key : `@${key}`).replace('%', '');
    cssString = cssString.concat(`  ${variableKey}: ${value};\n`);
  });

  cssString = cssString.concat('}');
  writeFileSync('./dist/variable.less', cssString);
}

const run = () => fetchFigmaFile()
  .then(getColorContent)
  .then(createVariablesFile)

run();
