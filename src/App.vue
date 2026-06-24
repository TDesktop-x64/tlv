<script lang="ts" setup>
import VueJsonPretty from 'vue-json-pretty'

import { computed, h, ref, watch, withDirectives } from 'vue'
import { useUrlSearchParams } from '@vueuse/core'

import { deserializeObject, toJSON, type deserializedObject, copyParsedJSON } from './helpers'
import type { NodeDataType } from 'vue-json-pretty/types/components/TreeNode'

import { ClipboardIcon } from '@heroicons/vue/24/outline'

import VWave from 'v-wave'
import { TlUnknownObjectError } from '@mtcute/tl-runtime'
const { vWave } = VWave.createLocalWaveDirective({})

const searchParam = useUrlSearchParams('hash-params')
const layer = computed(() => {
  return searchParam.l && !Array.isArray(searchParam.l) ? parseInt(searchParam.l) : null
})

const json = ref(null)

watch(
  searchParam,
  async (newSearchParam) => {
    if (newSearchParam.m) {
      const m = Array.isArray(newSearchParam.m) ? newSearchParam.m[0] : newSearchParam.m
      if (typeof m === 'string') {
        parseObject(m)
      }
    }
  },
  { immediate: true },
)

async function parseObject(object: string) {
  try {
    const obj = (await deserializeObject(object)) as deserializedObject
    const parsedJson = toJSON(
      obj._ == 'messages.messages' || obj._ == 'messages.channelMessages' ? obj.messages[0] : obj,
    )
    json.value = parsedJson
  } catch (e: unknown) {
    console.error(e)
    const message =
      e instanceof TlUnknownObjectError
        ? e.message + '\nAre you using the latest app version?'
        : e instanceof Error
          ? e.message
          : 'An error occurred while parsing the object.'
    alert(message)
  }
}

const renderNodeValue = ({ node, defaultValue }: { node: NodeDataType; defaultValue: string }) => {
  if (node.key == '_' && layer.value !== null) {
    return [
      `"`,
      withDirectives(
        h(
          'a',
          {
            class: 'hover:underline rounded-md px-1 py-0.5 -mx-1 -my-0.5',
            href: `https://schema.jppgr.am/layer/${layer.value}/${node.content}`,
            target: '_blank',
          },
          `${node.content}`,
        ),
        [[vWave]],
      ),
      `"`,
    ]
  }
  if (typeof node.content === 'string') {
    return `${JSON.stringify(node.content)}`
  }
  return defaultValue
}
</script>

<template>
  <div class="container mx-auto max-w-7xl px-3 py-2">
    <section class="overflow-clip rounded-2xl">
      <vue-json-pretty :renderNodeValue="renderNodeValue" :data="json" :showLength="true" />
    </section>
    <ClipboardIcon
      @click="copyParsedJSON(json)"
      class="fixed top-3 right-4 h-6 w-6 rounded-2xl p-1 backdrop-blur-sm transition hover:bg-black/10 active:scale-95"
    />
    <div class="mt-2 text-sm text-gray-500 select-none sm:text-center dark:text-gray-400">
      © {{ new Date().getFullYear() }} TLViewer by
      <a
        v-wave
        href="https://nekogram.app/"
        target="_blank"
        class="-mx-1 -my-0.5 rounded-md px-1 py-0.5 hover:underline"
        >Nekogram</a
      >. All Rights Reserved.
    </div>
  </div>
</template>

<style scoped></style>
