<script lang="ts">
import { defineComponent } from 'vue'
import animate_list from './animate_list.json'

export default defineComponent({
  data() {
    return {
      //@ts-ignore
      baseUrl: __BASE_URL__,
      animate_list
    }
  }
})
</script>

<template>
  <div class="container mx-auto py-2 box-border h-full">
    <div class="">
      <div class="card-1" v-for="item in animate_list" :key="item.name">
        <a :href=" baseUrl + item.url">
          <div class="flex justify-between items-center">
            <div class="flex items-center">
              <img :src="item.logo" alt="" class="w-8 h-8">
              <div class="ml-2">
                <div class="text-lg font-semibold">
                  {{ item.name }}
                </div>
                <div class="text-gray-600">
                  {{ item.desc }}
                </div>
              </div>
            </div>
            <div class="text-gray-600">footer</div>
          </div>
        </a>
      </div>

    </div>
  </div>
</template>

<style scoped>
</style>
