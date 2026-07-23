<script lang="ts">
import { defineComponent} from 'vue'
import Splite_layout_unocss from "../../src/components/splite_layout_unocss.vue"
import {NButton,NButtonGroup,NProgress,NSelect,NFlex} from 'naive-ui'
import codeEditor from "@/components/code-editor.vue";

import { Icon } from '@iconify/vue';
import {read_raw_code} from '@/lib/read_raw_code'
import raw_code from './code.cpp?raw'
import default_graph_data from './input_data/data.json'
const default_graph_selector_options = default_graph_data.map((item,i) => ({label: item.name, value: i}))

import {Graph,GraphType} from '../../src/lib/graph_ts'
import {topsort} from './topsort'
import {initCytoscape} from './cyto'
import {Core,NodeDefinition,EdgeDefinition} from 'cytoscape'

const {code ,point_jump_info} = read_raw_code(raw_code)

var CY:Core = null as any

export default defineComponent({
    name:"topsortApp",
    components:{NButton,NButtonGroup,NProgress,NSelect,NFlex,Icon,Splite_layout_unocss,codeEditor},
    data() {
        return {
            default_graph_selector_value: 0 as number,
            // default_graph_selector_options: default_graph_selector_options as Readonly<typeof default_graph_selector_options>,  // 使用 TypeScript 类型
            default_graph_selector_options : default_graph_selector_options,
            code:code,
            now_frame: 0 as number,
            cy:null as HTMLElement | null,
            graph: new Graph(GraphType.digraph) as Graph,
            topSort: new topsort() as topsort,
            log:'',
            jump_line: [-1,-1]
        }
    },
    mounted() {
        this.cy = this.$refs.cy as HTMLElement
        console.log('mounted')
        this.init_graph(default_graph_data[this.default_graph_selector_value].nodes,default_graph_data[this.default_graph_selector_value].edges)
    },
    watch: {
        default_graph_selector_value(new_value,old_value) { // console.log(this.default_graph_selector_value)
          if( new_value != old_value) {

            this.init_graph(default_graph_data[new_value].nodes,default_graph_data[new_value].edges)
            this.now_frame = 0
          }
        },
        now_frame(new_value,old_value) {
          if( new_value != old_value) {
            this.remove_cy_all_class();
            let frame = this.topSort.get_frame(new_value)
            //设定所有的边
            for( let edge of frame.edges_state )
            {
              CY.edges(`[source = "${edge.source}"][target = "${edge.target}"]`).addClass(edge.class.join(' '))
            }

            //设定所有的点
            for( let node of frame.nodes_state ){
              CY.nodes(`[id = "${node.id}"]`).addClass(node.class.join(' '))
            }
            //设置跳转线
            this.jump_line = [...frame.jump]
            this.log = frame.log
          }
        }
    },
    methods: {

      remove_cy_all_class() {
        let allClasses: Set<string> = new Set();
        CY.elements().forEach(function (element) {
          element.classes().forEach(function (className) {
            allClasses.add(className);
          });
        });
        CY.elements().removeClass(Array.from(allClasses).join(' '));
        // 删除边上的dfn值
        CY.edges().removeData('dfn')
      },
        play_pre() {
          if(this.now_frame > 0) this.now_frame -= 1
        },
        play_next() {
          if( this.now_frame < this.frame_cnt) this.now_frame += 1
        },
        init_graph(nodes:NodeDefinition[],edges:EdgeDefinition[]) {
            if(CY) {
                CY.destroy()
            }
            CY = initCytoscape(this.cy as HTMLElement,nodes,edges)

            //创建图
            this.graph.readFromCytoscape(nodes,edges)

            this.topSort.clear();
            this.topSort.set_graph(this.graph as Graph)
            this.topSort.set_pointJumpInfo(point_jump_info)
            this.topSort.run_top_sort()
        },
        get_input_data() {
          alert('TODO')
        }
    },
    computed: {
        frame_cnt() {
            return this.topSort.frame_cnt
        },
        queue() {
            if( this.now_frame <=0 ) return []
            return this.topSort.get_frame(this.now_frame).que
        },
        top_list() {
            if( this.now_frame <=0 ) return []
            return this.topSort.get_frame(this.now_frame).top_sort
        }
    }
})
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
              <n-button @click="get_input_data">输入数据</n-button>
            </n-flex>
            <div class="mt-2">
              <span class="me-2">队列:</span>
              <span v-for="item in queue" :key="item" class="border-1 border-solid border-gray-500 rounded px-2 me-2">
                {{ item }}
              </span>
            </div>
            <div class="mt-1">
              <span class="me-2">topSort结果:</span>
              <span v-for="item in top_list" :key="item" class="border-1 border-solid border-gray-500 rounded px-2 me-2">
                {{ item }}
              </span>
            </div>
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