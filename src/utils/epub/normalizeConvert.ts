import type { Book } from 'epubjs'
import MD5 from 'crypto-js/md5'
import { pipeline } from '../pipeline'
import { extractResource } from './extractResource'
import type { TranslateEngine } from '~/stores'
import { useHistoryStore } from '~/stores'

// 规范化文本中的所有图片标签
export async function normalizePicture(book: Book, doc: Document): Promise<[Book, Document]> {
  const svgList = Array.from(doc.body.querySelectorAll('svg'))
  for (const el of svgList) {
    const svgImage = el.querySelector('image')
    if (svgImage) {
      const img = document.createElement('img')
      const base64 = await extractResource(book, svgImage.getAttribute('xlink:href')!.substring(3), 'base64')
      img.setAttribute('src', `data:image/png;base64,${base64}`)
      el.replaceWith(img)
    }
  }
  return [
    book,
    doc,
  ]
}

export interface NormalizeStringify {
  origin: string
  translate?: string // 翻译过后的文本
  hash: string // 哈希值用来对应历史缓存
  date?: string // 翻译时间戳，超过时间的文本会被清除
  engine?: TranslateEngine // 翻译引擎
}

// 规范转化段落标签
export async function normalizeStringify(_: Book, doc: Document): Promise<NormalizeStringify[]> {
  const stringify: NormalizeStringify[] = []

  let children = Array.from(doc.querySelectorAll('.main'))
  if (children.length > 0)
    children = Array.from(children[0].children)

  else
    children = Array.from(doc.body.children)

  for (const el of children) {
    // 跳过 h* 标签
    if (el.tagName.startsWith('h'))
      continue
    // 如果是图片标签则直接添加到文本中
    if (el.tagName === 'img') {
      stringify.push({ origin: el.outerHTML, hash: MD5(el.outerHTML).toString().substring(0, 20) })
      continue
    }
    const text = el.innerHTML.replace(/ xmlns="[^"]+"/g, '')
    stringify.push({ origin: text, hash: MD5(text).toString().substring(0, 20) })
  }

  return stringify.filter(i => i.origin !== '<br />')
}

// 把标准化字符串和翻译历史记录合并
export async function merageNormalizeStringify(stringify: NormalizeStringify[]): Promise<NormalizeStringify[]> {
  const history = useHistoryStore()
  return stringify.map(item => ({ ...item, ...history.record[item.hash] }))
}

// 处理结果
export interface NormalizeResult {
  content: NormalizeStringify[]
}

export async function normalizeConvert(book: Book, doc: Document): Promise<NormalizeResult> {
  const res = await pipeline(
    [book, doc],
    normalizePicture,
    normalizeStringify,
  )

  return {
    content: await merageNormalizeStringify(res),
  }
}

