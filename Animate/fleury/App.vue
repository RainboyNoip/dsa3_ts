<script setup lang="ts">
import {ref, onMounted, watch, computed} from 'vue'
import {Core} from 'cytoscape'

import Splite_layout_unocss from "../../src/components/splite_layout_unocss.vue"
import codeEditor from "@/components/code-editor.vue";
import raw_code from './code.cpp?raw'
import {read_raw_code} from '../../src/lib/read_raw_code'
import {Graph,GraphType} from '../../src/lib/graph_ts'
// import default_graph from './default_graph'
// import { initCytoscape, re_graph_cyto } from './cyto.js'
import {NodeDefinition,EdgeDefinition} from 'cytoscape'

import { Icon } from '@iconify/vue';
import {NButton,NButtonGroup,NProgress,NSelect,NFlex} from 'naive-ui'

import {fleury} from './fleury'

import {initCytoscape} from './cyto'

const MyGraphType =  GraphType.undigraph
// const cy_dom = useTemplateRef('cy')
const cy = ref<HTMLElement | null>(null)
const graph = ref(new Graph(MyGraphType))
const Fleury = ref(new fleury())
// const code = ref('')
var CY:Core = null as any

let now_frame = ref(0); //当前帧


import default_graph_data  from './input_data/data.json'
// import cytoscape from 'cytoscape';
const default_graph = default_graph_data[0]
const default_graph_selector_value = ref(0)
const default_graph_selector_options = default_graph_data.map((item,i) => ({label: item.name, value: i}))

const jump_line = ref<[number,number]>([0,0])
const log = ref('')

//代码信息
const {code, point_jump_info} = read_raw_code(raw_code)

const init_graph = (nodes : NodeDefinition[],edges : EdgeDefinition[]) => {
    if( CY ) { //CY存在
      CY.destroy()
    }
    CY = initCytoscape(cy.value as HTMLElement ,nodes,edges)
    //运行fleury算法
    graph.value.readFromCytoscape(nodes,edges)
    Fleury.value.clear()
    Fleury.value.set_graph(graph.value as Graph)
    Fleury.value.set_pointJumpInfo(point_jump_info)
    Fleury.value.run()
}

// 切换图
watch(default_graph_selector_value, (new_value, old_value) => {
  if (new_value != old_value) {
    now_frame.value = 0
    init_graph(default_graph_data[new_value].nodes,default_graph_data[new_value].edges)
  }
})

onMounted(() => {
  init_graph(default_graph.nodes,default_graph.edges)
})

const frame_cnt = computed(() => Fleury.value.frame_cnt )

const play_next = ()=>{
  if( now_frame.value < frame_cnt.value)
    now_frame.value += 1
}
const play_pre = () =>{
  if( now_frame.value > 0)
    now_frame.value -= 1
}

const remove_cy_all_class = () => {
  let allClasses :Set<string> = new Set();
  CY.elements().forEach(function (element) {
    element.classes().forEach(function (className) {
      allClasses.add(className);
    });
  });
  CY.elements().removeClass( Array.from(allClasses).join(' '));
  // 删除边上的dfn值
  CY.edges().removeData('dfn')
}

//播放帧
const paly_frame = (frame_idx: number) => {
  //删除所有的类
  remove_cy_all_class();

  // //设置所有的边
  let frame =  Fleury.value.get_frame(frame_idx)
  // console.log(frame)
  for( let edge of frame.edges_state )
  {
    CY.edges(`[source = "${edge.source}"][target = "${edge.target}"]`).addClass(edge.class.join(' '))
    CY.edges(`[source = "${edge.target}"][target = "${edge.source}"]`).addClass(edge.class.join(' '))
    if( edge.dfn ){
      CY.edges(`[source = "${edge.source}"][target = "${edge.target}"]`).data('dfn',edge.dfn)
      CY.edges(`[source = "${edge.target}"][target = "${edge.source}"]`).data('dfn',edge.dfn)
    }
  }

  for( let node of frame.nodes_state ){
    CY.nodes(`[id = "${node.id}"]`).addClass(node.class.join(' '))
  }

  // jump
  jump_line.value = frame.jump
  log.value = frame.log || ''
  
}

watch(now_frame, (new_value, old_value) => {
  if( new_value != old_value)
  {
    if( new_value <= 0)  {
      remove_cy_all_class();
      return 
    }
    paly_frame(new_value-1)
  }
})


//

</script>
<template>
  <div class="container mx-auto py-2 box-border h-full">
    <Splite_layout_unocss>
      <template v-slot:top>

        <div class="flex justify-center items-center gap-3">
          <n-button-group>
            <n-button @click="play_pre">
              <Icon icon="fluent:previous-16-regular" width="15" height="15" />
            </n-button>
            <n-button ghost @click="play_next">
              <Icon icon="fluent:next-16-regular" width="15" height="15" />
            </n-button>
          </n-button-group>
          <n-progress type="line" :percentage="now_frame/(frame_cnt || 1) * 100" >
            {{ now_frame}}/ {{ frame_cnt }}
          </n-progress>
        </div>
      </template>

      <template v-slot:left>
        <div class="flex flex-col h-full">
          <div class="card-1 p-2 grow-0">
            <n-flex>
              <n-select v-model:value="default_graph_selector_value" :options="default_graph_selector_options" style="width: 200px;"></n-select>
              <n-button>输入数据</n-button>
            </n-flex>
            <div class="m-1 mt-3">
              {{ log }}
            </div>
          </div>
          <div id="cy" class="grow" style="" ref="cy"></div>
        </div>
      </template>

      <template v-slot:right>
        <code-editor :code="code" :hline_start="jump_line[0]" :hline_end="jump_line[1]"></code-editor>
      </template>
    </Splite_layout_unocss>
  </div>
</template>

<style>
html,body {
  padding: 0;
  margin: 0;
  height: 100vh;
  width: 100vw;
  /* overflow: hidden; */
}
</style>
