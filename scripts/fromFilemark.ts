import {
  anyPass,
  equals,
  map,
  pipe,
  reject,
  split,
  startsWith,
  tap,
  trim,
} from 'ramda'
import { v4 } from 'uuid'
import path from 'path'
import fs from 'fs-extra'

const data = fs.readFileSync(path.join(__dirname, 'filemark.txt'), 'utf-8')

pipe(
  trim,
  split(/\r?\n/),
  reject(anyPass([startsWith('#'), equals('')])),
  map(pipe(split('|'), map(trim))),
  map(([title, keywords, url]) => ({
    id: v4(),
    title: title || '',
    url,
    keywords: keywords || '',
  })),
  tap(pipe(JSON.stringify, console.log)),
  // Copy out of console and into DB
)(data)
