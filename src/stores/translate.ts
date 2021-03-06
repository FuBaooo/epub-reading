import type { RemovableRef } from '@vueuse/core'
import { defineStore } from 'pinia'
import type { Ref } from 'vue'

export type TranslateEngine = 'baidu' | 'youdao'
export const TRANSLATE_ENGINE: TranslateEngine[] = ['youdao', 'baidu']

export interface EngineConfig {
  appid: string
  secret: string
  slot: string
  slotRegex: string
}

// 翻译
export const useTranslateStore = defineStore<'translate', {
  loading: Ref<string[]>
  use: RemovableRef<TranslateEngine>
} & Record<TranslateEngine, RemovableRef<EngineConfig>>>('translate', () => ({
  loading: ref<string[]>([]),
  use: useLocalStorage<TranslateEngine>('config-translate-use', 'youdao'),
  baidu: useLocalStorage<EngineConfig>('config-translate-baidu', { appid: '', secret: '', slot: '{<slot>}', slotRegex: '\{<slot>\}' }),
  youdao: useLocalStorage<EngineConfig>('config-translate-youdao', { appid: '', secret: '', slot: '@<slot>@', slotRegex: '(@? ?<slot> ?@)|(@ ?<slot> ?@?)' }),
}))
